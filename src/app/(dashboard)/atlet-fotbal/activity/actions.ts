"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateTRIMP, recalculateDailyLoads } from "@/lib/trimp"
import { logAudit } from "@/lib/audit"

export type ActivityFormResult =
  | { success: true; activityId: number; trimp: number | null }
  | { success: false; error: string }

export type ActivityImportInput = {
  date: string
  durationMin: string
  sport?: string | null
  avgHeartRate?: string | null
  notes?: string | null
}

export type ActivityImportResult = {
  row: number
  success: boolean
  id?: number
  trimp?: number | null
  date: string
  activityDate?: string
  sport: string
  durationMin: number | null
  avgHeartRate: number | null
  notes: string | null
  error?: string
}
function parseActivityImportDate(value: string) {
  const dateValue = value.trim()
  let year: number
  let month: number
  let day: number

  const isoMatch = dateValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  const europeanMatch = dateValue.match(/^(\d{1,2})-(\d{1,2})-(\d{2}|\d{4})$/)

  if (isoMatch) {
    year = Number(isoMatch[1])
    month = Number(isoMatch[2])
    day = Number(isoMatch[3])
  } else if (europeanMatch) {
    day = Number(europeanMatch[1])
    month = Number(europeanMatch[2])
    year = Number(europeanMatch[3])
    if (year < 100) year += 2000
  } else {
    throw new Error("Data trebuie sa aiba formatul DD-MM-YY, DD-MM-YYYY sau YYYY-MM-DD.")
  }

  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error("Data nu este valida.")
  }

  return date
}


export async function importActivities(rows: ActivityImportInput[]) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !["atlet_fotbal", "atlet_tenis"].includes(session.user.role)) throw new Error("Acces interzis")
  if (!Array.isArray(rows) || rows.length === 0) return { results: [] as ActivityImportResult[] }
  if (rows.length > 310) throw new Error("Un import poate contine maximum 310 activitati.")

  const profile = await prisma.profile.findUnique({
    where: { userId: Number(session.user.id) },
    select: { id: true, restingHeartRate: true, maxHeartRate: true, gender: true },
  })
  if (!profile) throw new Error("Profil de atlet negasit")

  const defaultSport = session.user.role === "atlet_tenis" ? "tenis" : "fotbal"
  const results: ActivityImportResult[] = []
  for (const [index, row] of rows.entries()) {
    const resultBase = {
      row: index + 2,
      date: row.date?.trim() || "",
      sport: row.sport?.trim() || defaultSport,
      durationMin: null,
      avgHeartRate: null,
      notes: row.notes?.trim() || null,
    }

    try {
      const durationMin = Number(row.durationMin)
      const avgHeartRate = row.avgHeartRate?.trim() ? Number(row.avgHeartRate) : null
      const activityDate = parseActivityImportDate(row.date)

      if (!row.date?.trim()) throw new Error("Data este obligatorie.")
      if (!Number.isFinite(durationMin) || durationMin <= 0 || durationMin > 600) throw new Error("Durata trebuie sa fie intre 1 si 600 minute.")
      if (avgHeartRate !== null && (!Number.isFinite(avgHeartRate) || avgHeartRate < 30 || avgHeartRate > 250)) throw new Error("Frecventa cardiaca trebuie sa fie intre 30 si 250 bpm.")
      if ((resultBase.notes?.length ?? 0) > 500) throw new Error("Notele pot contine maximum 500 de caractere.")

      const trimp = calculateTRIMP(durationMin, avgHeartRate, profile.restingHeartRate, profile.maxHeartRate, profile.gender)
      const activity = await prisma.activity.create({
        data: { athleteId: profile.id, date: activityDate, durationMin, avgHeartRate, sport: resultBase.sport, notes: resultBase.notes, trimp },
        select: { id: true },
      })
      await recalculateDailyLoads(prisma, profile.id, activityDate)
      await logAudit({ userId: session.user.id, action: "create", tableAffected: "activities", recordId: activity.id, details: { date: activityDate.toISOString(), durationMin, sport: resultBase.sport, trimp, source: "activity_csv_import" } })
      results.push({ ...resultBase, success: true, id: activity.id, trimp, durationMin, avgHeartRate, activityDate: activityDate.toISOString() })
    } catch (error) {
      results.push({ ...resultBase, success: false, error: error instanceof Error ? error.message : "Randul nu a putut fi importat." })
    }
  }

  return { results }
}

export async function addActivity(formData: FormData): Promise<ActivityFormResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Neautorizat" }
  }

  const allowedRoles = ["atlet_fotbal", "atlet_tenis", "antrenor_fitness", "antrenor_fotbal", "admin_global"]
  if (!allowedRoles.includes(session.user.role)) {
    return { success: false, error: "Acces interzis" }
  }

  const dateStr = formData.get("date") as string
  const durationStr = formData.get("durationMin") as string
  const avgHRStr = formData.get("avgHeartRate") as string
  const sport = (formData.get("sport") as string) || null
  const notes = (formData.get("notes") as string) || null

  if (!dateStr || !durationStr) {
    return { success: false, error: "Data si durata sunt obligatorii" }
  }

  const durationMin = parseFloat(durationStr)
  if (isNaN(durationMin) || durationMin <= 0) {
    return { success: false, error: "Durata trebuie sa fie un numar pozitiv" }
  }

  const avgHeartRate = avgHRStr ? parseFloat(avgHRStr) : null
  if (avgHRStr && (isNaN(avgHeartRate!) || avgHeartRate! < 30 || avgHeartRate! > 250)) {
    return { success: false, error: "Frecventa cardiaca trebuie sa fie intre 30 si 250 bpm" }
  }

  const userId = Number(session.user.id)
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true, restingHeartRate: true, maxHeartRate: true, gender: true },
  })

  if (!profile) {
    return { success: false, error: "Profil de atlet negasit" }
  }

  const activityDate = new Date(dateStr)

  const trimp = calculateTRIMP(
    durationMin,
    avgHeartRate,
    profile.restingHeartRate,
    profile.maxHeartRate,
    profile.gender
  )

  const activity = await prisma.activity.create({
    data: {
      athleteId: profile.id,
      date: activityDate,
      durationMin,
      avgHeartRate,
      sport,
      notes,
      trimp,
    },
  })

  await recalculateDailyLoads(prisma, profile.id, activityDate)

  await logAudit({ userId: session.user.id, action: "create", tableAffected: "activities", recordId: activity.id, details: { date: activity.date.toISOString(), durationMin, sport, trimp } })

  return { success: true, activityId: activity.id, trimp }
}


export type TrainingResultFormResult =
  | { success: true; activityId: number; trimp: number | null }
  | { success: false; error: string }

type TrainingResultType = "fitness" | "fotbal"

const TRAINING_RESULT_TYPE_LABELS: Record<TrainingResultType, string> = {
  fitness: "Fitness",
  fotbal: "Fotbal",
}

const TRAINING_TYPE_LABELS: Record<string, string> = {
  tehnic: "Tehnic",
  fizic: "Fizic",
  tactic: "Tactic",
}

const FITNESS_TYPE_LABELS: Record<string, string> = {
  forta: "Forta",
  rezistenta: "Rezistenta",
  vitezare: "Viteza",
  flexibilitate: "Flexibilitate",
  coordonare: "Coordonare",
}

function isTrainingResultType(value: FormDataEntryValue | null): value is TrainingResultType {
  return value === "fitness" || value === "fotbal"
}

export async function addTrainingResult(formData: FormData): Promise<TrainingResultFormResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Neautorizat" }
  }

  if (session.user.role !== "atlet_fotbal") {
    return { success: false, error: "Acces interzis" }
  }

  const trainingType = formData.get("trainingType")
  const planIdStr = formData.get("planId") as string
  const durationStr = formData.get("durationMin") as string
  const avgHRStr = formData.get("avgHeartRate") as string
  const userNotes = ((formData.get("notes") as string) || "").trim()

  if (!isTrainingResultType(trainingType)) {
    return { success: false, error: "Tipul antrenamentului este obligatoriu" }
  }

  const planId = Number(planIdStr)
  if (!Number.isInteger(planId) || planId <= 0) {
    return { success: false, error: "Selecteaza un antrenament planificat" }
  }

  const durationMin = parseFloat(durationStr)
  if (isNaN(durationMin) || durationMin <= 0) {
    return { success: false, error: "Durata trebuie sa fie un numar pozitiv" }
  }

  const avgHeartRate = parseFloat(avgHRStr)
  if (!avgHRStr || isNaN(avgHeartRate) || avgHeartRate < 30 || avgHeartRate > 250) {
    return { success: false, error: "Frecventa cardiaca trebuie sa fie intre 30 si 250 bpm" }
  }

  const userId = Number(session.user.id)
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true, teamId: true, restingHeartRate: true, maxHeartRate: true, gender: true },
  })

  if (!profile) {
    return { success: false, error: "Profil de atlet negasit" }
  }

  if (!profile.teamId) {
    return { success: false, error: "Atletul nu este alocat unei echipe" }
  }

  let plan: {
    id: number
    title: string
    date: Date
    type: string
    creator: { email: string; profile: { firstName: string; lastName: string } | null }
  } | null = null

  if (trainingType === "fotbal") {
    const footballPlan = await prisma.trainingPlan.findFirst({
      where: {
        id: planId,
        creator: {
          role: "antrenor_fotbal",
          profile: { is: { teamId: profile.teamId } },
        },
      },
      select: {
        id: true,
        title: true,
        date: true,
        type: true,
        creator: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
      },
    })

    plan = footballPlan ? { ...footballPlan, type: String(footballPlan.type) } : null
  } else {
    const fitnessPlan = await prisma.fitnessPlan.findFirst({
      where: {
        id: planId,
        creator: {
          role: "antrenor_fitness",
          profile: { is: { teamId: profile.teamId } },
        },
      },
      select: {
        id: true,
        title: true,
        date: true,
        type: true,
        creator: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
      },
    })

    plan = fitnessPlan ? { ...fitnessPlan, type: String(fitnessPlan.type) } : null
  }

  if (!plan) {
    return { success: false, error: "Antrenamentul selectat nu a fost gasit pentru echipa ta" }
  }

  const coachName = plan.creator.profile
    ? `${plan.creator.profile.firstName} ${plan.creator.profile.lastName}`.trim()
    : plan.creator.email
  const typeLabel = trainingType === "fotbal"
    ? TRAINING_TYPE_LABELS[plan.type] ?? plan.type
    : FITNESS_TYPE_LABELS[plan.type] ?? plan.type
  const notes = [
    `Rezultat antrenament ${TRAINING_RESULT_TYPE_LABELS[trainingType]}: ${plan.title}`,
    `Tip plan: ${typeLabel}`,
    `Antrenor: ${coachName || "Nespecificat"}`,
    userNotes ? `Note: ${userNotes}` : null,
  ].filter(Boolean).join(" | ")

  const trimp = calculateTRIMP(
    durationMin,
    avgHeartRate,
    profile.restingHeartRate,
    profile.maxHeartRate,
    profile.gender
  )

  const activity = await prisma.activity.create({
    data: {
      athleteId: profile.id,
      date: plan.date,
      durationMin,
      avgHeartRate,
      sport: trainingType,
      notes,
      trimp,
    },
  })

  await recalculateDailyLoads(prisma, profile.id, plan.date)

  await logAudit({
    userId: session.user.id,
    action: "create",
    tableAffected: "activities",
    recordId: activity.id,
    details: {
      source: "training_result",
      trainingType,
      planId: plan.id,
      title: plan.title,
      date: activity.date.toISOString(),
      durationMin,
      avgHeartRate,
      trimp,
    },
  })

  return { success: true, activityId: activity.id, trimp }
}
export async function deleteActivity(activityId: number): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false, error: "Neautorizat" }

  const userId = Number(session.user.id)
  const profile = await prisma.profile.findUnique({ where: { userId }, select: { id: true } })
  if (!profile) return { success: false, error: "Profil negasit" }

  const activity = await prisma.activity.findFirst({
    where: { id: activityId, athleteId: profile.id },
    select: { id: true, date: true },
  })

  if (!activity) return { success: false, error: "Activitate negasita sau nu ai permisiune" }

  await prisma.activity.delete({ where: { id: activityId } })
  await recalculateDailyLoads(prisma, profile.id, activity.date)

  await logAudit({ userId: session.user.id, action: "delete", tableAffected: "activities", recordId: activity.id, details: { date: activity.date.toISOString() } })

  return { success: true }
}

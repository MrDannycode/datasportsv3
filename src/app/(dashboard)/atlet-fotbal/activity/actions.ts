"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateTRIMP, recalculateDailyLoads } from "@/lib/trimp"
import { logAudit } from "@/lib/audit"

export type ActivityFormResult =
  | { success: true; activityId: number; trimp: number | null }
  | { success: false; error: string }

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

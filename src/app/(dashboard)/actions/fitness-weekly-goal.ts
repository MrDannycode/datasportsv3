"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

const allowedRoles = new Set(["antrenor_fitness"])

function hasPostgresCode(error: unknown, code: string) {
    if (typeof error !== "object" || error === null) return false

    const directCode = "code" in error ? error.code : null
    const meta = "meta" in error ? error.meta : null
    const metaCode = typeof meta === "object" && meta !== null && "code" in meta ? meta.code : null

    return directCode === code || metaCode === code
}

function startOfUtcDay(value: Date) {
    const date = new Date(value)
    date.setUTCHours(0, 0, 0, 0)
    return date
}

function startOfUtcWeek(value: Date) {
    const date = startOfUtcDay(value)
    const day = date.getUTCDay()
    date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1))
    return date
}

export async function setFitnessWeeklyGoal(payload: { weekStart?: string; targetTrimp: number }) {
    const session = await getServerSession(authOptions)

    if (!session || !allowedRoles.has(session.user.role)) {
        redirect("/login")
    }

    const targetTrimp = Number(payload.targetTrimp)
    if (!Number.isFinite(targetTrimp) || targetTrimp <= 0) {
        return { error: "Targetul TRIMP trebuie sa fie mai mare decat 0." }
    }

    const parsedWeekStart = payload.weekStart ? new Date(payload.weekStart) : new Date()
    if (Number.isNaN(parsedWeekStart.getTime())) {
        return { error: "Saptamana selectata nu este valida." }
    }

    const weekStart = startOfUtcWeek(parsedWeekStart)
    const userId = Number(session.user.id)
    const profile = await prisma.profile.findUnique({
        where: { userId },
        select: { teamId: true },
    })

    if (!profile?.teamId) {
        return { error: "Contul nu este asociat unei echipe." }
    }

    let goals: { id: number }[] = []

    try {
        goals = await prisma.$queryRaw<{ id: number }[]>`
            INSERT INTO fitness_weekly_goals (team_id, week_start, target_trimp, updated_at)
            VALUES (${profile.teamId}, ${weekStart}::date, ${targetTrimp}, NOW())
            ON CONFLICT (team_id, week_start)
            DO UPDATE SET target_trimp = EXCLUDED.target_trimp, updated_at = NOW()
            RETURNING id
        `
    } catch (error) {
        if (hasPostgresCode(error, "42P01")) {
            return { error: "Tabela pentru Fitness Weekly Goal lipseste. Ruleaza: npx prisma migrate dev" }
        }

        throw error
    }

    await logAudit({
        userId: session.user.id,
        action: "update",
        tableAffected: "fitness_weekly_goals",
        recordId: goals[0]?.id,
        details: { teamId: profile.teamId, weekStart: weekStart.toISOString(), targetTrimp },
    })

    revalidatePath("/")
    revalidatePath("/antrenor-fitness")
    revalidatePath("/antrenor-fotbal")

    return { success: true }
}

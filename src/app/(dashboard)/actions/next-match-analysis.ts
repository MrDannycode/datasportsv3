"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

const MATCH_DIFFICULTIES = new Set(["usor", "mediu", "greu"])
const TEAM_FORMATIONS = new Set(["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "3-4-3", "5-3-2"])

function hasPostgresCode(error: unknown, code: string) {
    if (typeof error !== "object" || error === null) return false

    const directCode = "code" in error ? error.code : null
    const meta = "meta" in error ? error.meta : null
    const metaCode = typeof meta === "object" && meta !== null && "code" in meta ? meta.code : null

    return directCode === code || metaCode === code
}

export async function setNextMatchAnalysis(payload: {
    matchId: number | null
    matchDifficulty: string
    teamFormation: string
}) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "antrenor_fotbal") {
        redirect("/login")
    }

    const matchId = Number(payload.matchId)
    if (!Number.isInteger(matchId) || matchId <= 0) {
        return { error: "Nu exista un meci urmator valid pentru echipa." }
    }

    if (!MATCH_DIFFICULTIES.has(payload.matchDifficulty)) {
        return { error: "Dificultatea selectata nu este valida." }
    }

    if (!TEAM_FORMATIONS.has(payload.teamFormation)) {
        return { error: "Formatia selectata nu este valida." }
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: Number(session.user.id) },
        select: { teamId: true },
    })

    if (!profile?.teamId) {
        return { error: "Contul nu este asociat unei echipe." }
    }

    const match = await prisma.footballMatch.findFirst({
        where: {
            id: matchId,
            OR: [
                { teamHomeId: profile.teamId },
                { teamAwayId: profile.teamId },
            ],
        },
        select: { id: true },
    })

    if (!match) {
        return { error: "Meciul selectat nu apartine echipei tale." }
    }

    try {
        await prisma.$executeRaw`
            UPDATE football_matches
            SET match_difficulty = ${payload.matchDifficulty},
                team_formation = ${payload.teamFormation}
            WHERE id = ${match.id}
        `
    } catch (error) {
        if (hasPostgresCode(error, "42703")) {
            return { error: "Coloanele pentru Next Match Analysis lipsesc. Ruleaza migrarea add_next_match_analysis." }
        }

        throw error
    }

    await logAudit({
        userId: session.user.id,
        action: "update",
        tableAffected: "football_matches",
        recordId: match.id,
        details: {
            matchDifficulty: payload.matchDifficulty,
            teamFormation: payload.teamFormation,
        },
    })

    revalidatePath("/")
    revalidatePath("/antrenor-fotbal")
    revalidatePath("/atlet-fotbal")

    return { success: true }
}

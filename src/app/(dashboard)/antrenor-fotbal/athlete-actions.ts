"use server"

import type { Position } from "@prisma/client"
import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { prisma } from "@/lib/prisma"

const POSITIONS = new Set<Position>(["portar", "fundas", "mijlocas", "atacant"])

export type CoachAthleteUpdateInput = {
    athleteId: number | string
    position: string
    jerseyNumber: number | string | null
}

export type CoachAthleteUpdateResult = {
    success: boolean
    error?: string
    athlete?: {
        id: number
        position: Position
        jerseyNumber: number | null
    }
}

function normalizeUpdate(data: CoachAthleteUpdateInput) {
    const athleteId = Number(data.athleteId)
    const position = data.position.trim().toLowerCase() as Position
    const jerseyNumber = data.jerseyNumber === "" || data.jerseyNumber == null ? null : Number(data.jerseyNumber)

    if (!Number.isInteger(athleteId) || athleteId <= 0) throw new Error("Atletul selectat nu este valid.")
    if (!POSITIONS.has(position)) throw new Error("Pozitia nu este valida.")
    if (jerseyNumber !== null && (!Number.isInteger(jerseyNumber) || jerseyNumber < 1 || jerseyNumber > 99)) {
        throw new Error("Numarul de tricou trebuie sa fie intre 1 si 99.")
    }

    return { athleteId, position, jerseyNumber }
}

export async function updateCoachAthlete(data: CoachAthleteUpdateInput): Promise<CoachAthleteUpdateResult> {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "antrenor_fotbal") {
        redirect("/login")
    }

    try {
        const update = normalizeUpdate(data)
        const coachProfile = await prisma.profile.findUnique({
            where: { userId: Number(session.user.id) },
            select: { teamId: true },
        })

        if (!coachProfile?.teamId) {
            return { success: false, error: "Contul tau nu este asociat unei echipe." }
        }

        const existingAthlete = await prisma.footballAthlete.findFirst({
            where: {
                id: update.athleteId,
                user: { profile: { teamId: coachProfile.teamId } },
            },
            select: { id: true, position: true, jerseyNumber: true },
        })

        if (!existingAthlete) {
            return { success: false, error: "Atletul nu apartine echipei tale." }
        }

        const athlete = await prisma.footballAthlete.update({
            where: { id: update.athleteId },
            data: {
                position: update.position,
                jerseyNumber: update.jerseyNumber,
            },
            select: { id: true, position: true, jerseyNumber: true },
        })

        await logAudit({
            userId: session.user.id,
            action: "update",
            tableAffected: "football_athletes",
            recordId: athlete.id,
            details: {
                before: existingAthlete,
                after: athlete,
                source: "coach_athlete_management",
            },
        })

        revalidatePath("/antrenor-fotbal")
        return { success: true, athlete }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Atletul nu a putut fi actualizat.",
        }
    }
}

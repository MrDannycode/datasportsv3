import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateDifficulty, type Difficulty } from "@/lib/tournament-difficulty"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export type TournamentWithDifficulty = {
    id: number
    name: string
    location: string | null
    surface: string | null
    startDate: string
    endDate: string | null
    difficulty: Difficulty | null
    avgRanking: number | null
    playerCount: number
    lastSyncAt: string | null
    players: {
        id: number
        playerName: string
        atpWtaRanking: number | null
        nationality: string | null
    }[]
}

export async function GET() {
    const session = await getServerSession(authOptions)
    if (
        !session ||
        !["atlet_tenis", "manager_tenis", "admin_global"].includes(session.user.role)
    ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()

    const tournaments = await prisma.tournament.findMany({
        where: {
            startDate: { gte: now },
        },
        include: {
            players: {
                orderBy: { atpWtaRanking: "asc" },
            },
        },
        orderBy: { startDate: "asc" },
    })

    const result: TournamentWithDifficulty[] = tournaments.map((t) => {
        const rankings = t.players.map((p) => p.atpWtaRanking)
        const difficulty = calculateDifficulty(rankings, t.name)
        const validRankings = rankings.filter((r): r is number => r !== null && r > 0)
        const avgRanking =
            validRankings.length > 0
                ? Math.round(validRankings.reduce((s, r) => s + r, 0) / validRankings.length)
                : null

        return {
            id: t.id,
            name: t.name,
            location: t.location,
            surface: t.surface,
            startDate: t.startDate.toISOString(),
            endDate: t.endDate?.toISOString() ?? null,
            difficulty,
            avgRanking,
            playerCount: t.players.length,
            lastSyncAt: t.lastSyncAt?.toISOString() ?? null,
            players: t.players.map((p) => ({
                id: p.id,
                playerName: p.playerName,
                atpWtaRanking: p.atpWtaRanking,
                nationality: p.nationality,
            })),
        }
    })

    return NextResponse.json(result)
}

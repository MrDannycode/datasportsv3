import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { calculateDifficulty } from "@/lib/tournament-difficulty"
import TournamentCard from "@/components/tournament/TournamentCard"
import type { TournamentWithDifficulty } from "@/app/api/tournaments/route"

async function getUpcomingTournaments(): Promise<TournamentWithDifficulty[]> {
    const now = new Date()
    const tournaments = await prisma.tournament.findMany({
        where: { startDate: { gte: now } },
        include: {
            players: { orderBy: { atpWtaRanking: "asc" } },
        },
        orderBy: { startDate: "asc" },
    })

    return tournaments.map((t) => {
        const rankings = t.players.map((p) => p.atpWtaRanking)
        const difficulty = calculateDifficulty(rankings)
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
}

export default async function AtletTenisTurneePage() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "atlet_tenis") {
        redirect("/login")
    }

    const tournaments = await getUpcomingTournaments()

    return (
        <main>
            <div className="sd-page-title">
                <h1>Turnee Viitoare</h1>
            </div>

            {/* Legendă dificultate */}
            <div className="sd-box" style={{ marginBottom: 16 }}>
                <div className="sd-box-header">
                    <h2>Cum se calculează dificultatea?</h2>
                </div>
                <div className="sd-box-content" style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                    <div>
                        <span className="sd-difficulty-badge sd-difficulty-greu">🔴 Greu</span>
                        <span style={{ marginLeft: 8, fontSize: 13, color: "#555" }}>
                            Media ranking înscriși ≤ 50 (jucători de elită mondială)
                        </span>
                    </div>
                    <div>
                        <span className="sd-difficulty-badge sd-difficulty-mediu">🟡 Mediu</span>
                        <span style={{ marginLeft: 8, fontSize: 13, color: "#555" }}>
                            Media ranking 51–150 (jucători profesioniști)
                        </span>
                    </div>
                    <div>
                        <span className="sd-difficulty-badge sd-difficulty-usor">🟢 Ușor</span>
                        <span style={{ marginLeft: 8, fontSize: 13, color: "#555" }}>
                            Media ranking &gt; 150 (turnee Challenger / Futures)
                        </span>
                    </div>
                </div>
            </div>

            {tournaments.length === 0 ? (
                <div className="sd-box sd-empty-state">
                    <p>Nu există turnee viitoare înregistrate momentan.</p>
                    <p style={{ fontSize: 12, color: "#999" }}>
                        Contactează managerul de tenis pentru actualizarea datelor.
                    </p>
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: 12, fontSize: 13, color: "#666" }}>
                        {tournaments.length} turneu{tournaments.length !== 1 ? "e" : ""} viitoare găsite
                    </div>
                    <div className="sd-tournament-grid">
                        {tournaments.map((t) => (
                            <TournamentCard key={t.id} tournament={t} />
                        ))}
                    </div>
                </>
            )}
        </main>
    )
}

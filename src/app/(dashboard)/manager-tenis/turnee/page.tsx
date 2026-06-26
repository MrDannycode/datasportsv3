import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { calculateDifficulty } from "@/lib/tournament-difficulty"
import { matchesTournamentSource } from "@/lib/tournament-gender"
import TournamentCard from "@/components/tournament/TournamentCard"
import TournamentSyncButton from "@/components/tournament/TournamentSyncButton"
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

    return tournaments
        .filter((t) => matchesTournamentSource(t))
        .map((t) => {
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
}

async function getTournamentStats() {
    const now = new Date()
    const [total] = await Promise.all([
        prisma.tournament.count({ where: { startDate: { gte: now } } }),
    ])
    return { total }
}

export default async function ManagerTenisTurneePage() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "manager_tenis") {
        redirect("/login")
    }

    const [tournaments, stats] = await Promise.all([
        getUpcomingTournaments(),
        getTournamentStats(),
    ])

    const countByDifficulty = {
        greu: tournaments.filter((t) => t.difficulty === "greu").length,
        mediu: tournaments.filter((t) => t.difficulty === "mediu").length,
        usor: tournaments.filter((t) => t.difficulty === "usor").length,
        necunoscut: tournaments.filter((t) => t.difficulty === null).length,
    }

    return (
        <main>
            <div className="sd-page-title">
                <h1>Managament Turnee Tenis</h1>
            </div>

            <div className="sd-metrics">
                <div className="sd-box sd-metric-box">
                    <div className="sd-metric-title">Total Turnee Viitoare</div>
                    <div className="sd-metric-value">{tournaments.length}</div>
                </div>
                <div className="sd-box sd-metric-box">
                    <div className="sd-metric-title">?? Turnee Grele</div>
                    <div className="sd-metric-value" style={{ color: "#991b1b" }}>
                        {countByDifficulty.greu}
                    </div>
                </div>
                <div className="sd-box sd-metric-box">
                    <div className="sd-metric-title">?? Turnee Medii</div>
                    <div className="sd-metric-value" style={{ color: "#92400e" }}>
                        {countByDifficulty.mediu}
                    </div>
                </div>
                <div className="sd-box sd-metric-box">
                    <div className="sd-metric-title">?? Turnee U?oare</div>
                    <div className="sd-metric-value" style={{ color: "#166534" }}>
                        {countByDifficulty.usor}
                    </div>
                </div>
            </div>

            <TournamentSyncButton />

            <div className="sd-box" style={{ marginBottom: 16 }}>
                <div className="sd-box-header">
                    <h2>Algoritm de calcul al dificulta?ii</h2>
                </div>
                <div className="sd-box-content">
                    <p style={{ fontSize: 13, color: "#555", marginBottom: 10 }}>
                        Dificultatea fiecarui turneu este calculata <strong>dinamic</strong> la
                        momentul citirii, pe baza mediei rankingului ATP/WTA al jucatorilor înscri?i
                        la acea ora. Daca ITF nu ofera rankinguri suficiente, sistemul folose?te categoria
                        turneului ca estimare de rezerva.
                    </p>
                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                        <div>
                            <span className="sd-difficulty-badge sd-difficulty-greu">?? Greu</span>
                            <span style={{ marginLeft: 8, fontSize: 12, color: "#555" }}>
                                Media ranking = 50 sau categorie mare (ex: W60/M60+)
                            </span>
                        </div>
                        <div>
                            <span className="sd-difficulty-badge sd-difficulty-mediu">?? Mediu</span>
                            <span style={{ marginLeft: 8, fontSize: 12, color: "#555" }}>
                                Media ranking 51–150 sau categorie intermediara (ex: M25/W35)
                            </span>
                        </div>
                        <div>
                            <span className="sd-difficulty-badge sd-difficulty-usor">?? U?or</span>
                            <span style={{ marginLeft: 8, fontSize: 12, color: "#555" }}>
                                Media ranking &gt; 150 sau categorie entry-level (ex: M15/W15)
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {tournaments.length === 0 ? (
                <div className="sd-box sd-empty-state">
                    <p>Nu exista turnee viitoare. Apasa &ldquo;Actualizare date turnee&rdquo; pentru a importa datele.</p>
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: 12, fontSize: 13, color: "#666" }}>
                        {tournaments.length} turneu{tournaments.length !== 1 ? "e" : ""} viitoare —
                        jucatorii sunt afi?a?i în ordinea rankingului
                    </div>
                    <div className="sd-tournament-grid">
                        {tournaments.map((t) => (
                            <TournamentCard key={t.id} tournament={t} showPlayersDefault={false} />
                        ))}
                    </div>
                </>
            )}
        </main>
    )
}

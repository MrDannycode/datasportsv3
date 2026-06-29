import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import TournamentCard from "@/components/tournament/TournamentCard"
import { calculateDifficulty } from "@/lib/tournament-difficulty"
import { withdrawFromTournament } from "../actions"
import type { TournamentWithDifficulty } from "@/app/api/tournaments/route"

function formatShortDate(iso: string | null) {
    if (!iso) return "-"
    return new Date(iso).toLocaleDateString("ro-RO", {
        day: "numeric",
        month: "short",
        year: "numeric",
    })
}

export default async function AtletTenisInscrieriPage() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "atlet_tenis") {
        redirect("/login")
    }

    const athlete = await prisma.tennisAthlete.findUnique({
        where: { userId: Number(session.user.id) },
        select: { id: true, atpWtaRanking: true },
    })

    if (!athlete) {
        return (
            <main>
                <div className="sd-page-title">
                    <h1>Turneele mele</h1>
                </div>
                <div className="sd-box sd-empty-state">
                    <p>Completeaza mai intai Profilul meu pentru tenis.</p>
                </div>
            </main>
        )
    }

    const registrations = await prisma.tournamentRegistration.findMany({
        where: { athleteId: athlete.id, status: "inscris" },
        include: {
            tournament: {
                include: {
                    players: { orderBy: { atpWtaRanking: "asc" } },
                },
            },
        },
        orderBy: { tournament: { startDate: "asc" } },
    })

    const tournaments: TournamentWithDifficulty[] = registrations.map((registration) => {
        const tournament = registration.tournament
        const rankings = tournament.players.map((player) => player.atpWtaRanking)
        const validRankings = rankings.filter((ranking): ranking is number => ranking !== null && ranking > 0)
        const avgRanking = validRankings.length > 0
            ? Math.round(validRankings.reduce((sum, ranking) => sum + ranking, 0) / validRankings.length)
            : null

        return {
            id: tournament.id,
            name: tournament.name,
            location: tournament.location,
            surface: tournament.surface,
            startDate: tournament.startDate.toISOString(),
            endDate: tournament.endDate?.toISOString() ?? null,
            difficulty: calculateDifficulty(rankings, tournament.name, athlete.atpWtaRanking),
            avgRanking,
            playerCount: tournament.players.length,
            lastSyncAt: tournament.lastSyncAt?.toISOString() ?? null,
            isRegistered: true,
            players: tournament.players.map((player) => ({
                id: player.id,
                playerName: player.playerName,
                atpWtaRanking: player.atpWtaRanking,
                nationality: player.nationality,
            })),
        }
    })

    const nextTournament = tournaments[0] ?? null
    const countByDifficulty = {
        greu: tournaments.filter((tournament) => tournament.difficulty === "greu").length,
        mediu: tournaments.filter((tournament) => tournament.difficulty === "mediu").length,
        usor: tournaments.filter((tournament) => tournament.difficulty === "usor").length,
    }

    return (
        <main>
            <div className="sd-box">
                <div className="sd-box-header">
                    <Link href="/atlet-tenis" className="sd-btn-secondary">Inapoi</Link>
                    <h2 className="flex-1 text-center">Turneele Mele</h2>
                    <div className="sd-btn-secondary invisible">Inapoi</div>
                </div>
                <div className="sd-box-content">

                    <div className="sd-metrics">
                        <div className="sd-box sd-metric-box">
                            <div className="sd-metric-title">Inscrieri active</div>
                            <div className="sd-metric-value">{tournaments.length}</div>
                        </div>
                        <div className="sd-box sd-metric-box">
                            <div className="sd-metric-title">Urmatorul turneu</div>
                            <div className="sd-metric-value" style={{ fontSize: 24 }}>{formatShortDate(nextTournament?.startDate ?? null)}</div>
                        </div>
                        <div className="sd-box sd-metric-box">
                            <div className="sd-metric-title">Turnee Grele</div>
                            <div className="sd-metric-value" style={{ color: "#991b1b" }}>{countByDifficulty.greu}</div>
                        </div>
                        <div className="sd-box sd-metric-box">
                            <div className="sd-metric-title">Turnee Medii / Usoare</div>
                            <div className="sd-metric-value" style={{ color: "#166534" }}>{countByDifficulty.mediu + countByDifficulty.usor}</div>
                        </div>
                    </div>

                    {tournaments.length === 0 ? (
                        <div className="sd-box sd-empty-state">
                            <p>Nu esti inscris la niciun turneu momentan.</p>
                            <Link href="/atlet-tenis/turnee" className="sd-players-toggle" style={{ display: "inline-block", marginTop: 12 }}>
                                Vezi turnee disponibile
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div style={{ marginBottom: 12, fontSize: 13, color: "#666" }}>
                                {tournaments.length} turneu{tournaments.length !== 1 ? "e" : ""} in lista ta.
                            </div>
                            <div className="sd-tournament-grid">
                                {tournaments.map((tournament) => (
                                    <TournamentCard
                                        key={tournament.id}
                                        tournament={tournament}
                                        showPlayersDefault={false}
                                        onWithdraw={withdrawFromTournament}
                                        showAllPlayers={true}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </main>
    )
}

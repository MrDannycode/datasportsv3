import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { calculateDifficulty } from "@/lib/tournament-difficulty"
import { matchesTournamentGender, matchesTournamentSource } from "@/lib/tournament-gender"
import { matchesTournamentDate, matchesTournamentRegion, normalizeTournamentFilters } from "@/lib/tournament-filters"
import { getItfCalendarOptions } from "@/lib/itf-tournaments"
import TournamentCard from "@/components/tournament/TournamentCard"
import TournamentSyncButton from "@/components/tournament/TournamentSyncButton"
import { registerForTournament } from "./actions"
import type { TournamentWithDifficulty } from "@/app/api/tournaments/route"

interface AtletTenisTurneePageProps {
    searchParams?: Promise<{ country?: string; continent?: string; dateFrom?: string }>
}

async function getUpcomingTournaments(
    gender: "MALE" | "FEMALE" | null,
    filters: { country?: string; continent?: string; dateFrom?: string },
    userRanking?: number | null,
    athleteId?: number | null
): Promise<TournamentWithDifficulty[]> {
    const normalizedFilters = normalizeTournamentFilters(filters)
    const minDate = normalizedFilters.dateFrom ? new Date(`${normalizedFilters.dateFrom}T00:00:00`) : new Date()
    const tournaments = await prisma.tournament.findMany({
        where: { startDate: { gte: minDate } },
        include: {
            players: { orderBy: { atpWtaRanking: "asc" } },
            registrations: {
                where: { athleteId: athleteId ?? -1 },
                select: { id: true, status: true },
            },
        },
        orderBy: { startDate: "asc" },
    })

    return tournaments
        .filter((t) =>
            matchesTournamentSource(t) &&
            matchesTournamentGender(t, gender) &&
            matchesTournamentRegion(t, normalizedFilters) &&
            matchesTournamentDate(t, normalizedFilters.dateFrom)
        )
        .map((t) => {
            const rankings = t.players.map((p) => p.atpWtaRanking)
            const difficulty = calculateDifficulty(rankings, t.name, userRanking)
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
                isRegistered: t.registrations.some((registration) => registration.status === "inscris"),
                players: t.players.map((p) => ({
                    id: p.id,
                    playerName: p.playerName,
                    atpWtaRanking: p.atpWtaRanking,
                    nationality: p.nationality,
                })),
            }
        })
}

export default async function AtletTenisTurneePage({ searchParams }: AtletTenisTurneePageProps) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "atlet_tenis") {
        redirect("/login")
    }

    const resolvedSearchParams = searchParams ? await searchParams : undefined
    const filters = normalizeTournamentFilters({
        country: resolvedSearchParams?.country,
        continent: resolvedSearchParams?.continent,
        dateFrom: resolvedSearchParams?.dateFrom,
    })

    const profile = await prisma.profile.findUnique({
        where: { userId: Number(session.user.id) },
        select: { gender: true },
    })

    const athlete = await prisma.tennisAthlete.findUnique({
        where: { userId: Number(session.user.id) },
        select: { id: true, atpWtaRanking: true },
    })

    const [tournaments, liveOptions] = await Promise.all([
        getUpcomingTournaments(profile?.gender ?? null, filters, athlete?.atpWtaRanking ?? null, athlete?.id ?? null),
        getItfCalendarOptions(profile?.gender ?? null, filters.dateFrom).catch(() => ({ countries: [], continents: [] })),
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
                <h1>Turnee Viitoare</h1>
            </div>

            <div className="sd-metrics">
                <div className="sd-box sd-metric-box">
                    <div className="sd-metric-title">Total Turnee Viitoare</div>
                    <div className="sd-metric-value">{tournaments.length}</div>
                </div>
                <div className="sd-box sd-metric-box">
                    <div className="sd-metric-title">Turnee Grele</div>
                    <div className="sd-metric-value" style={{ color: "#991b1b" }}>
                        {countByDifficulty.greu}
                    </div>
                </div>
                <div className="sd-box sd-metric-box">
                    <div className="sd-metric-title">Turnee Medii</div>
                    <div className="sd-metric-value" style={{ color: "#92400e" }}>
                        {countByDifficulty.mediu}
                    </div>
                </div>
                <div className="sd-box sd-metric-box">
                    <div className="sd-metric-title">Turnee Usoare</div>
                    <div className="sd-metric-value" style={{ color: "#166534" }}>
                        {countByDifficulty.usor}
                    </div>
                </div>
            </div>

            <TournamentSyncButton
                redirectPath="/atlet-tenis/turnee"
                enableFilters={true}
                initialCountry={filters.country}
                initialContinent={filters.continent}
                initialDateFrom={filters.dateFrom}
                countryOptions={liveOptions.countries}
                continentOptions={liveOptions.continents}
            />

            <div className="sd-box" style={{ marginBottom: 16 }}>
                <div className="sd-box-header">
                    <h2>Algoritm de calcul al dificultatii</h2>
                </div>
                <div className="sd-box-content">
                    <p style={{ fontSize: 13, color: "#555", marginBottom: 10 }}>
                        Dificultatea fiecarui turneu este calculata dinamic la momentul citirii,
                        pe baza mediei rankingului ATP/WTA al jucatorilor inscrisi in comparatie cu clasamentul tau actual.
                    </p>
                </div>
            </div>

            {tournaments.length === 0 ? (
                <div className="sd-box sd-empty-state">
                    <p>Nu exista turnee pentru filtrele selectate. Ajusteaza formularul si sincronizeaza din nou.</p>
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: 12, fontSize: 13, color: "#666" }}>
                        {tournaments.length} turneu{tournaments.length !== 1 ? "e" : ""} viitoare.
                    </div>
                    <div className="sd-tournament-grid">
                        {tournaments.map((t) => (
                            <TournamentCard
                                key={t.id}
                                tournament={t}
                                showPlayersDefault={false}
                                onRegister={registerForTournament}
                            />
                        ))}
                    </div>
                </>
            )}
        </main>
    )
}

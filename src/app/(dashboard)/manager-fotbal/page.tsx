import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { normalizeFootballLeagueName } from "@/lib/football-league"

type FootballTeamSummary = {
    id: number
    name: string
    country: string
    continent: string
}

type FootballMatchSummary = {
    teamHomeId: number
    teamAwayId: number
    scoreHome: number | null
    scoreAway: number | null
    competition: { name: string } | null
}

type LeagueStanding = {
    pos: number
    team: string
    played: number
    won: number
    drawn: number
    lost: number
    goalsFor: number
    goalsAgainst: number
    goalDifference: number
    pts: number
}

type ManagerFotbalSearchParams = {
    liga?: string | string[]
}

function resolveSelectedLeague(value: ManagerFotbalSearchParams["liga"]) {
    const selectedValue = Array.isArray(value) ? value[0] : value

    return selectedValue === "2" ? "Liga 2" : "Liga 1"
}

function buildLeagueStandings(teams: FootballTeamSummary[], matches: FootballMatchSummary[], leagueName: string): LeagueStanding[] {
    const normalizedLeagueName = normalizeFootballLeagueName(leagueName)
    const standings = new Map<number, Omit<LeagueStanding, "pos"> & { goalsFor: number }>()

    for (const team of teams) {
        if (normalizeFootballLeagueName(team.continent) !== normalizedLeagueName) continue

        standings.set(team.id, {
            team: team.name,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            pts: 0,
        })
    }

    for (const match of matches) {
        if (
            match.scoreHome === null ||
            match.scoreAway === null ||
            !match.competition ||
            normalizeFootballLeagueName(match.competition.name) !== normalizedLeagueName
        ) {
            continue
        }

        const home = standings.get(match.teamHomeId)
        const away = standings.get(match.teamAwayId)
        if (!home || !away) continue

        home.played += 1
        away.played += 1
        home.goalsFor += match.scoreHome
        away.goalsFor += match.scoreAway
        home.goalsAgainst += match.scoreAway
        away.goalsAgainst += match.scoreHome
        home.goalDifference += match.scoreHome - match.scoreAway
        away.goalDifference += match.scoreAway - match.scoreHome

        if (match.scoreHome > match.scoreAway) {
            home.won += 1
            away.lost += 1
            home.pts += 3
        } else if (match.scoreHome < match.scoreAway) {
            away.won += 1
            home.lost += 1
            away.pts += 3
        } else {
            home.drawn += 1
            away.drawn += 1
            home.pts += 1
            away.pts += 1
        }
    }

    return Array.from(standings.values())
        .sort((a, b) =>
            b.pts - a.pts ||
            b.goalDifference - a.goalDifference ||
            b.goalsFor - a.goalsFor ||
            a.team.localeCompare(b.team)
        )
        .map((standing, index) => ({
            pos: index + 1,
            team: standing.team,
            played: standing.played,
            won: standing.won,
            drawn: standing.drawn,
            lost: standing.lost,
            goalsFor: standing.goalsFor,
            goalsAgainst: standing.goalsAgainst,
            goalDifference: standing.goalDifference,
            pts: standing.pts,
        }))
}

function LeagueStandingsTable({ leagueName, standings }: { leagueName: string; standings: LeagueStanding[] }) {
    const relegationStartPosition = standings.length - 1
    const playoffStartPosition = standings.length - 3

    function getRowClassName(position: number) {
        if (leagueName === "Liga 2") {
            if (position <= 2) return "dsb-row-promotion"
            if (position <= 4) return "dsb-row-playoff"
        } else {
            if (position <= 4) return "dsb-row-ucl"
            if (position <= 6) return "dsb-row-uel"
        }

        if (position >= relegationStartPosition) return "dsb-row-relegation"
        if (position >= playoffStartPosition) return "dsb-row-playoff"

        return ""
    }

    return (
        <div className="sd-box sd-league-standings-card">
            <div className="sd-box-header">
                <h2>Clasament {leagueName}</h2>
                <div className="sd-league-toggle" aria-label="Schimba liga">
                    <Link href="/manager-fotbal?liga=1" className={leagueName === "Liga 1" ? "active" : ""}>Liga 1</Link>
                    <Link href="/manager-fotbal?liga=2" className={leagueName === "Liga 2" ? "active" : ""}>Liga 2</Link>
                </div>
            </div>
            <div className="sd-box-content" style={{ padding: 0 }}>
                <table className="sd-table sd-league-standings-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Echipa</th>
                            <th>MJ</th>
                            <th>V</th>
                            <th>E</th>
                            <th>I</th>
                            <th>GM</th>
                            <th>GP</th>
                            <th>G</th>
                            <th>Pct</th>
                        </tr>
                    </thead>
                    <tbody>
                        {standings.length === 0 ? (
                            <tr>
                                <td colSpan={10}>Nu exista date pentru {leagueName}.</td>
                            </tr>
                        ) : (
                            standings.map((row) => (
                                <tr
                                    key={row.team}
                                    className={getRowClassName(row.pos)}
                                >
                                    <td className="dsb-pos">{row.pos}</td>
                                    <td className="dsb-team-name">{row.team}</td>
                                    <td>{row.played}</td>
                                    <td>{row.won}</td>
                                    <td>{row.drawn}</td>
                                    <td>{row.lost}</td>
                                    <td>{row.goalsFor}</td>
                                    <td>{row.goalsAgainst}</td>
                                    <td>{row.goalDifference > 0 ? "+" : ""}{row.goalDifference}</td>
                                    <td className="dsb-pts">{row.pts}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <div className="dsb-legend">
                    {leagueName === "Liga 2" ? (
                        <>
                            <span className="dsb-legend-dot dsb-legend-promotion" /> Promovare
                            <span className="dsb-legend-dot dsb-legend-playoff" style={{ marginLeft: 12 }} /> Baraj
                        </>
                    ) : (
                        <>
                            <span className="dsb-legend-dot dsb-legend-ucl" /> UCL
                            <span className="dsb-legend-dot dsb-legend-uel" style={{ marginLeft: 12 }} /> UEL
                            <span className="dsb-legend-dot dsb-legend-playoff" style={{ marginLeft: 12 }} /> Baraj
                        </>
                    )}
                    <span className="dsb-legend-dot dsb-legend-relegation" style={{ marginLeft: 12 }} /> Retrogradare
                </div>
            </div>
        </div>
    )
}

export default async function ManagerFotbalPage({
    searchParams,
}: {
    searchParams?: Promise<ManagerFotbalSearchParams>
}) {
    const resolvedSearchParams = searchParams ? await searchParams : {}
    const selectedLeague = resolveSelectedLeague(resolvedSearchParams.liga)
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "manager_fotbal") {
        redirect("/login")
    }

    const managerAssignment = await prisma.managerAssignment.findUnique({
        where: { userId: Number(session.user.id) },
        select: { id: true, country: true, continent: true },
    })

    const assignedCountry = managerAssignment?.country ?? null
    const footballTeamWhere = assignedCountry
        ? { sport: "fotbal" as const, country: assignedCountry }
        : { sport: "fotbal" as const, id: -1 }
    const footballMatchWhere = assignedCountry
        ? {
            OR: [
                { teamHome: { country: assignedCountry } },
                { teamAway: { country: assignedCountry } },
                { competition: { country: assignedCountry } },
            ],
        }
        : { id: -1 }
    const footballAthleteWhere = assignedCountry && managerAssignment
        ? {
            role: "atlet_fotbal" as const,
            OR: [
                { profile: { team: { country: assignedCountry } } },
                { footballAthlete: { managerAssignmentId: managerAssignment.id } },
            ],
        }
        : { role: "atlet_fotbal" as const, id: -1 }
    const footballStaffWhere = assignedCountry
        ? { role: "antrenor_fotbal" as const, profile: { team: { country: assignedCountry } } }
        : { role: "antrenor_fotbal" as const, id: -1 }

    const [teams, upcomingMatches, leagueMatches, totalMatches, footballAthletes, footballCoaches, playedMatches] = await Promise.all([
        prisma.team.findMany({
            where: footballTeamWhere,
            select: { id: true, name: true, country: true, continent: true },
            orderBy: { name: "asc" },
        }),
        prisma.footballMatch.findMany({
            where: {
                ...footballMatchWhere,
                matchDate: { gte: new Date() },
            },
            include: {
                teamHome: { select: { id: true, name: true } },
                teamAway: { select: { id: true, name: true } },
                competition: { select: { id: true, name: true } },
            },
            orderBy: { matchDate: "asc" },
            take: 6,
        }),
        prisma.footballMatch.findMany({
            where: {
                ...footballMatchWhere,
                scoreHome: { not: null },
                scoreAway: { not: null },
            },
            select: {
                teamHomeId: true,
                teamAwayId: true,
                scoreHome: true,
                scoreAway: true,
                competition: { select: { name: true } },
            },
        }),
        prisma.footballMatch.count({ where: footballMatchWhere }),
        prisma.user.count({ where: footballAthleteWhere }),
        prisma.user.count({ where: footballStaffWhere }),
        prisma.footballMatch.findMany({
            where: {
                ...footballMatchWhere,
                matchDate: { lt: new Date() },
                scoreHome: { not: null },
                scoreAway: { not: null },
            },
            include: {
                teamHome: { select: { id: true, name: true } },
                teamAway: { select: { id: true, name: true } },
            },
            orderBy: { matchDate: "desc" },
            take: 3,
        }),
    ])


    const selectedLeagueStandings = buildLeagueStandings(teams, leagueMatches, selectedLeague)

    return (
        <main>
            <div className="sd-with-sidebar">
                <div className="sd-main-content">
                    <div className="sd-box">
                        <div className="sd-box-header">
                            <h2>Dashboard overview</h2>
                        </div>
                        <div className="sd-box-content">
                            <div className="sd-league-standings-grid sd-league-standings-grid-single">
                                <LeagueStandingsTable leagueName={selectedLeague} standings={selectedLeagueStandings} />
                            </div>

                            <div className="sd-panels">
                                <div className="sd-box sd-activities">
                                    <div className="sd-box-header">
                                        <h2>Urmatoarele Meciuri</h2>
                                        <Link href="/manager-fotbal/meciuri">Vezi toate</Link>
                                    </div>
                                    <div className="sd-box-content" style={{ padding: 0 }}>
                                        {upcomingMatches.length === 0 ? (
                                            <div className="sd-empty-state">
                                                <p>Nu exista meciuri programate.</p>
                                                <Link href="/manager-fotbal/meciuri?open=match" className="sd-btn-primary">
                                                    Adauga primul meci
                                                </Link>
                                            </div>
                                        ) : (
                                            <table className="sd-table">
                                                <thead>
                                                    <tr>
                                                        <th>Data</th>
                                                        <th>Meci</th>
                                                        <th>Competitie</th>
                                                        <th>Locatie</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {upcomingMatches.map((match) => (
                                                        <tr key={match.id}>
                                                            <td>{new Date(match.matchDate).toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                                                            <td>{match.teamHome.name} vs {match.teamAway.name}</td>
                                                            <td>{match.competition?.name ?? "-"}</td>
                                                            <td>{match.location}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <aside className="dsb-sidebar">
                    <div className="sd-box">
                        <div className="sd-box-header">
                            <h2>Gestionare Avansata</h2>
                        </div>
                        <div className="sd-box-content">
                            <div className="sd-sidebar-metric-grid">
                                <Link href="/manager-fotbal/echipe" className="sd-sidebar-metric-card">
                                    <span className="sd-metric-title">Echipe fotbal</span>
                                    <strong className="sd-metric-value">{teams.length}</strong>
                                </Link>
                                <Link href="/manager-fotbal/antrenori" className="sd-sidebar-metric-card">
                                    <span className="sd-metric-title">Staff Fotbal</span>
                                    <strong className="sd-metric-value">{footballCoaches}</strong>
                                </Link>
                                <Link href="/manager-fotbal/invitatii" className="sd-sidebar-metric-card">
                                    <span className="sd-metric-title">Atleti fotbal</span>
                                    <strong className="sd-metric-value">{footballAthletes}</strong>
                                </Link>
                                <Link href="/manager-fotbal/meciuri" className="sd-sidebar-metric-card">
                                    <span className="sd-metric-title">Meciuri totale</span>
                                    <strong className="sd-metric-value">{totalMatches}</strong>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="sd-box">
                        <div className="sd-box-header">
                            <h2>Meciuri Recente</h2>
                        </div>
                        <div className="sd-box-content">
                            {playedMatches.length > 0 ? (
                                <ul className="sd-list">
                                    {playedMatches.map((match) => (
                                        <li key={match.id}>
                                            <strong>
                                                {match.teamHome.name} {match.scoreHome ?? "-"} - {match.scoreAway ?? "-"} {match.teamAway.name}
                                            </strong>
                                            <br />
                                            Data: {new Date(match.matchDate).toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                            <br />
                                            Locatie: {match.location}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>Nu exista meciuri jucate recent.</p>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </main>
    )
}

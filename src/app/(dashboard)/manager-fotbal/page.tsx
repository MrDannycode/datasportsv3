import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function ManagerFotbalPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "manager_fotbal") {
        redirect("/login")
    }

    const managerAssignment = await prisma.managerAssignment.findUnique({
        where: { userId: Number(session.user.id) },
        select: { country: true, continent: true },
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
    const footballAthleteWhere = assignedCountry
        ? { role: "atlet_fotbal" as const, profile: { team: { country: assignedCountry } } }
        : { role: "atlet_fotbal" as const, id: -1 }
    const footballStaffWhere = assignedCountry
        ? { role: "antrenor_fotbal" as const, profile: { team: { country: assignedCountry } } }
        : { role: "antrenor_fotbal" as const, id: -1 }

    const [teams, recentMatches, totalMatches, footballAthletes, footballCoaches] = await Promise.all([
        prisma.team.findMany({
            where: footballTeamWhere,
            select: { id: true, name: true, country: true, continent: true },
            orderBy: { name: "asc" },
        }),
        prisma.footballMatch.findMany({
            where: footballMatchWhere,
            include: {
                teamHome: { select: { id: true, name: true } },
                teamAway: { select: { id: true, name: true } },
                competition: { select: { id: true, name: true } },
            },
            orderBy: { matchDate: "desc" },
            take: 6,
        }),
        prisma.footballMatch.count({ where: footballMatchWhere }),
        prisma.user.count({ where: footballAthleteWhere }),
        prisma.user.count({ where: footballStaffWhere }),
    ])

    const nextMatches = recentMatches
        .filter((match) => new Date(match.matchDate) >= new Date())
        .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())
        .slice(0, 3)

    return (
        <main>
            <div className="sd-with-sidebar">
                <div className="sd-main-content">
                    <div className="sd-box">
                        <div className="sd-box-header">
                            <h2>Dashboard overview</h2>
                        </div>
                        <div className="sd-box-content">
                            <div className="sd-metrics">
                                <Link href="/manager-fotbal/meciuri" style={{ flex: 1, textDecoration: "none" }}>
                                    <div className="sd-box sd-metric-box" style={{ cursor: "pointer" }}>
                                        <div className="sd-metric-title">Meciuri totale</div>
                                        <div className="sd-metric-value">{totalMatches}</div>
                                    </div>
                                </Link>
                                <Link href="/manager-fotbal/echipe" style={{ flex: 1, textDecoration: "none" }}>
                                    <div className="sd-box sd-metric-box" style={{ cursor: "pointer" }}>
                                        <div className="sd-metric-title">Echipe fotbal</div>
                                        <div className="sd-metric-value">{teams.length}</div>
                                    </div>
                                </Link>
                                <Link href="/manager-fotbal/invitatii" style={{ flex: 1, textDecoration: "none" }}>
                                    <div className="sd-box sd-metric-box" style={{ cursor: "pointer" }}>
                                        <div className="sd-metric-title">Atleti fotbal</div>
                                        <div className="sd-metric-value">{footballAthletes}</div>
                                    </div>
                                </Link>
                                <Link href="/manager-fotbal/antrenori" style={{ flex: 1, textDecoration: "none" }}>
                                    <div className="sd-box sd-metric-box" style={{ cursor: "pointer" }}>
                                        <div className="sd-metric-title">Staff Fotbal</div>
                                        <div className="sd-metric-value">{footballCoaches}</div>
                                    </div>
                                </Link>
                            </div>

                            <div className="sd-panels">
                                <div className="sd-box sd-activities">
                                    <div className="sd-box-header">
                                        <h2>Meciuri recente</h2>
                                        <Link href="/manager-fotbal/meciuri">Vezi toate</Link>
                                    </div>
                                    <div className="sd-box-content" style={{ padding: 0 }}>
                                        {recentMatches.length === 0 ? (
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
                                                        <th>Scor</th>
                                                        <th>Competitie</th>
                                                        <th>Locatie</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recentMatches.map((match) => (
                                                        <tr key={match.id}>
                                                            <td>{new Date(match.matchDate).toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                                                            <td>{match.teamHome.name} vs {match.teamAway.name}</td>
                                                            <td>{match.scoreHome !== null && match.scoreAway !== null ? match.scoreHome + " - " + match.scoreAway : "-"}</td>
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
                            <ul className="sd-list">
                                <li><Link href="/manager-fotbal/invitatii">Invita si importa atleti</Link></li>
                                <li><Link href="/manager-fotbal/meciuri">Gestioneaza meciuri</Link></li>
                                <li><Link href="/manager-fotbal/echipe">Gestioneaza echipe</Link></li>
                                <li><Link href="/manager-fotbal/antrenori">Gestioneaza antrenori</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="sd-box">
                        <div className="sd-box-header">
                            <h2>Urmatoarele Meciuri</h2>
                        </div>
                        <div className="sd-box-content">
                            {nextMatches.length > 0 ? (
                                <ul className="sd-list">
                                    {nextMatches.map((match) => (
                                        <li key={match.id}>
                                            <strong>{match.teamHome.name} vs {match.teamAway.name}</strong>
                                            <br />
                                            Data: {new Date(match.matchDate).toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                            <br />
                                            Locatie: {match.location}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>Nu exista meciuri viitoare.</p>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </main>
    )
}

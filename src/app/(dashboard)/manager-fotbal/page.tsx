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

    const [teams, recentMatches, totalMatches, footballAthletes, footballCoaches] = await Promise.all([
        prisma.team.findMany({
            where: { sport: "fotbal" },
            select: { id: true, name: true, country: true, continent: true },
            orderBy: { name: "asc" },
        }),
        prisma.footballMatch.findMany({
            include: {
                teamHome: { select: { id: true, name: true } },
                teamAway: { select: { id: true, name: true } },
                competition: { select: { id: true, name: true } },
            },
            orderBy: { matchDate: "desc" },
            take: 6,
        }),
        prisma.footballMatch.count(),
        prisma.user.count({ where: { role: "atlet_fotbal" } }),
        prisma.user.count({ where: { role: "antrenor_fotbal" } }),
    ])

    const nextMatch = recentMatches
        .filter((match) => new Date(match.matchDate) >= new Date())
        .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())[0]

    return (
        <main>
            <div className="sd-page-title">
                <h1>Dashboard Manager Fotbal</h1>
            </div>
            <p style={{ color: "#666", marginBottom: "20px", fontSize: "13px" }}>
                Bun venit, <strong>{session.user.email}</strong>
            </p>

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
                        <div className="sd-metric-title">Antrenori</div>
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

                <div className="sd-sidebar">
                    <div className="sd-box">
                        <div className="sd-box-header">
                            <h2>Navigare rapida</h2>
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
                            <h2>Urmatorul meci</h2>
                        </div>
                        <div className="sd-box-content">
                            {nextMatch ? (
                                <>
                                    <p>Adversare: {nextMatch.teamHome.name} vs {nextMatch.teamAway.name}</p>
                                    <p>Data: {new Date(nextMatch.matchDate).toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                                    <p>Locatie: {nextMatch.location}</p>
                                </>
                            ) : (
                                <p>Nu exista meciuri viitoare.</p>
                            )}
                        </div>
                    </div>

                    <div className="sd-box">
                        <div className="sd-box-header">
                            <h2>Management</h2>
                        </div>
                        <div className="sd-box-content">
                            <ul className="sd-list">
                                <li>Loturi si alocari pe echipa</li>
                                <li>Calendar competitii</li>
                                <li>Invitatii pentru atleti</li>
                                <li>Staff tehnic</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

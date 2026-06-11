import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function AtletFotbalPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "atlet_fotbal") {
        redirect("/login")
    }

    const userId = Number(session.user.id);

    const profile = await prisma.profile.findUnique({
        where: { userId }
    });

    let upcomingMatches: any[] = [];
    if (profile?.teamId) {
        upcomingMatches = await prisma.footballMatch.findMany({
            where: {
                OR: [
                    { teamHomeId: profile.teamId },
                    { teamAwayId: profile.teamId }
                ],
                matchDate: {
                    gte: new Date()
                }
            },
            include: {
                teamHome: true,
                teamAway: true
            },
            orderBy: {
                matchDate: 'asc'
            },
            take: 5
        });
    }

    return (
        <main>
            <div className="sd-page-title">
                <h1>Dashboard overview</h1>
            </div>

            <div className="sd-metrics">
                <div className="sd-box sd-metric-box" style={{ height: "auto", minHeight: "150px" }}>
                    <div className="sd-metric-title">Match calendar</div>
                    <div style={{ marginTop: "15px", textAlign: "left" }}>
                        {upcomingMatches.length === 0 ? (
                            <p style={{ fontSize: "14px", color: "#666" }}>Nu există meciuri viitoare programate.</p>
                        ) : (
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "14px" }}>
                                {upcomingMatches.map((match) => (
                                    <li key={match.id} style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #eee" }}>
                                        <div style={{ fontWeight: "bold" }}>
                                            {match.teamHome.name} vs {match.teamAway.name}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                                            {new Date(match.matchDate).toLocaleDateString('ro-RO', { 
                                                weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#666" }}>
                                            {match.location} | {match.competition}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
                <div className="sd-box sd-metric-box">
                    <div className="sd-metric-title">Fitness calendar</div>
                </div>
            </div>

            <div className="sd-panels">
                <div className="sd-box sd-activities">
                    <div className="sd-box-header">
                        <h2>Recent Activities</h2>
                        <a href="#">View All</a>
                    </div>
                    <div className="sd-box-content">
                        <table className="sd-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Title</th>
                                    <th>Distance</th>
                                    <th>Duration</th>
                                    <th>Pace / Speed</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Today</td>
                                    <td>Run</td>
                                    <td>Morning Tempo Run</td>
                                    <td>10.0 km</td>
                                    <td>45:00</td>
                                    <td>4:30 /km</td>
                                </tr>
                                <tr>
                                    <td>Yesterday</td>
                                    <td>Bike</td>
                                    <td>Recovery Ride</td>
                                    <td>25.4 km</td>
                                    <td>1:08:52</td>
                                    <td>22.1 km/h</td>
                                </tr>
                                <tr>
                                    <td>Wed</td>
                                    <td>Run</td>
                                    <td>Long Interval Session</td>
                                    <td>15.2 km</td>
                                    <td>1:12:15</td>
                                    <td>4:45 /km</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="sd-sidebar">
                    <div className="sd-box">
                        <div className="sd-box-header">
                            <h2>Next Match Analysis</h2>
                        </div>
                        <div className="sd-box-content">
                            <p>Next match: Liverpool</p>
                            <p>Difficulty: —</p>
                            <p>Weather: —</p>
                        </div>
                    </div>

                    <div className="sd-box">
                        <div className="sd-box-header">
                            <h2>Data Science</h2>
                        </div>
                        <div className="sd-box-content">
                            <ul className="sd-list">
                                <li>VO2Max</li>
                                <li>Fitness level</li>
                                <li>Fatigue</li>
                                <li>Stress Balance</li>
                                <li>Workload ratio</li>
                                <li>Monotony</li>
                                <li>Recovery</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

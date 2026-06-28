import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import SportScienceMetrics, { type SportScienceLoad } from "@/components/sport-science/SportScienceMetrics"
import Link from "next/link"

export default async function AtletTenisPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "atlet_tenis") {
        redirect("/login")
    }

    const userId = Number(session.user.id)
    const profile = await prisma.profile.findUnique({
        where: { userId },
        select: { id: true },
    })

    let latestLoad: SportScienceLoad | null = null

    if (profile) {
        latestLoad = await prisma.dailyLoad.findFirst({
            where: { athleteId: profile.id },
            orderBy: { date: "desc" },
            select: {
                date: true,
                trimp: true,
                atl: true,
                ctl: true,
                tsb: true,
                acRatio: true,
                monotony: true,
                strain: true,
            },
        })
    }

    return (
        <main>
            <div className="sd-box">
                <div className="sd-box-header">
                    <h2>Dashboard overview</h2>
                </div>
                <div className="sd-box-content">
                    <div className="sd-metrics">
                        <div className="sd-box sd-metric-box">
                            <div className="sd-metric-title">Match calendar</div>
                        </div>
                        <div className="sd-box sd-metric-box">
                            <div className="sd-metric-title">Fitness calendar</div>
                        </div>
                    </div>

                    <div className="sd-panels">
                        <div className="sd-box sd-activities">
                            <div className="sd-box-header">
                                <h2>Recent Activities</h2>
                                <Link href="/atlet-tenis/activity">View All</Link>
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
                                            <td>Tennis</td>
                                            <td>Serve Practice</td>
                                            <td>—</td>
                                            <td>1:30:00</td>
                                            <td>—</td>
                                        </tr>
                                        <tr>
                                            <td>Yesterday</td>
                                            <td>Run</td>
                                            <td>Aerobic Base Run</td>
                                            <td>8.0 km</td>
                                            <td>40:00</td>
                                            <td>5:00 /km</td>
                                        </tr>
                                        <tr>
                                            <td>Wed</td>
                                            <td>Tennis</td>
                                            <td>Match Simulation</td>
                                            <td>—</td>
                                            <td>2:00:00</td>
                                            <td>—</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="sd-sidebar">
                            <div className="sd-box">
                                <div className="sd-box-header">
                                    <h2>Weekly Goal</h2>
                                </div>
                                <div className="sd-box-content">
                                    <p>Next match: —</p>
                                    <p>Surface: Clay</p>
                                    <p>Weather: —</p>
                                </div>
                            </div>

                            <div className="sd-box">
                                <div className="sd-box-header">
                                    <h2>Sport Science</h2>
                                </div>
                                <div className="sd-box-content">
                                    <SportScienceMetrics latestLoad={latestLoad} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

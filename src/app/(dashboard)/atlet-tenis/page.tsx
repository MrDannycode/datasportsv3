import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AtletTenisPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "atlet_tenis") {
        redirect("/login")
    }

    return (
        <main>
            <div className="sd-page-title">
                <h1>Dashboard overview</h1>
            </div>

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

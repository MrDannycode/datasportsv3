import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ManagerPage() {
    const session = await getServerSession(authOptions)

    const allowedRoles = ["manager_fotbal", "manager_tenis"]
    if (!session || !allowedRoles.includes(session.user.role)) {
        redirect("/login")
    }

    return (
        <main>
            <div className="sd-page-title">
                <h1>Dashboard overview</h1>
            </div>

            {/* Key Metrics */}
            <div className="sd-metrics">
                <div className="sd-box sd-metric-box">
                    <div className="sd-metric-title">Match calendar</div>
                </div>
                <div className="sd-box sd-metric-box">
                    <div className="sd-metric-title">Team Schedule</div>
                </div>
            </div>

            {/* Main Panels */}
            <div className="sd-panels">
                {/* Recent Activities */}
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

                {/* Sidebar panels */}
                <div className="sd-sidebar">
                    <div className="sd-box">
                        <div className="sd-box-header">
                            <h2>Next Match</h2>
                        </div>
                        <div className="sd-box-content">
                            <p>Opponent: Liverpool</p>
                            <p>Difficulty: —</p>
                            <p>Weather: —</p>
                        </div>
                    </div>

                    <div className="sd-box">
                        <div className="sd-box-header">
                            <h2>Team Stats</h2>
                        </div>
                        <div className="sd-box-content">
                            <ul className="sd-list">
                                <li>Squad fitness</li>
                                <li>Injury list</li>
                                <li>Training load</li>
                                <li>Workload ratio</li>
                                <li>Fatigue index</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

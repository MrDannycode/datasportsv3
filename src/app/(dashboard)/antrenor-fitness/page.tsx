import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function AntrenorFitnessPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "antrenor_fitness") {
        redirect("/login")
    }

    return (
        <main>
            <div className="sd-page-title">
                <h1>Dashboard overview</h1>
            </div>

            <div className="sd-metrics">
                <div className="sd-box sd-metric-box">
                    <div className="sd-metric-title">Fitness calendar</div>
                </div>
                <div className="sd-box sd-metric-box">
                    <div className="sd-metric-title">Recovery calendar</div>
                </div>
                <Link href="/antrenor-fitness/trainfit" style={{ flex: 1, textDecoration: "none" }}>
                    <div className="sd-box sd-metric-box" style={{ cursor: "pointer" }}>
                        <div className="sd-metric-title">Plan fitness</div>
                        <div className="sd-metric-value" style={{ fontSize: "14px", marginTop: "8px", color: "#0056b3" }}>
                            Gestionează →
                        </div>
                    </div>
                </Link>
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
                                    <td>Gym</td>
                                    <td>Strength Session</td>
                                    <td>—</td>
                                    <td>1:00:00</td>
                                    <td>—</td>
                                </tr>
                                <tr>
                                    <td>Yesterday</td>
                                    <td>Run</td>
                                    <td>Aerobic Base Run</td>
                                    <td>12.0 km</td>
                                    <td>58:00</td>
                                    <td>4:50 /km</td>
                                </tr>
                                <tr>
                                    <td>Wed</td>
                                    <td>Bike</td>
                                    <td>Recovery Ride</td>
                                    <td>25.4 km</td>
                                    <td>1:08:52</td>
                                    <td>22.1 km/h</td>
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
                            <p>Focus: Endurance</p>
                            <p>Load target: —</p>
                            <p>Recovery day: —</p>
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

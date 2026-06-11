import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ManagerTenisPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "manager_tenis") {
        redirect("/login")
    }

    return (
        <main>
            <div className="sd-page-title">
                <h1>Dashboard Manager Tenis</h1>
            </div>

            {/* Key Metrics */}
            <div className="sd-metrics">
                <div className="sd-box sd-metric-box">
                    <div className="sd-metric-title">Tournament calendar</div>
                </div>
                <div className="sd-box sd-metric-box">
                    <div className="sd-metric-title">Player Schedule</div>
                </div>
            </div>

            {/* Main Panels */}
            <div className="sd-panels">
                {/* Recent Activities */}
                <div className="sd-box sd-activities">
                    <div className="sd-box-header">
                        <h2>Recent Matches</h2>
                        <a href="#">View All</a>
                    </div>
                    <div className="sd-box-content">
                        <table className="sd-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Opponent</th>
                                    <th>Tournament</th>
                                    <th>Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Yesterday</td>
                                    <td>N. Djokovic</td>
                                    <td>Wimbledon</td>
                                    <td>Win (3-2)</td>
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
                            <p>Opponent: C. Alcaraz</p>
                            <p>Surface: Grass</p>
                        </div>
                    </div>

                    <div className="sd-box">
                        <div className="sd-box-header">
                            <h2>Player Stats</h2>
                        </div>
                        <div className="sd-box-content">
                            <ul className="sd-list">
                                <li>Fitness level</li>
                                <li>Injury list</li>
                                <li>Serve speed</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

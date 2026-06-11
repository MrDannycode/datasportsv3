import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function MedicPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "medic") {
        redirect("/login")
    }

    return (
        <main>
            <div className="sd-page-title">
                <h1>Dashboard overview</h1>
            </div>

            <div className="sd-metrics">
                <div className="sd-box sd-metric-box">
                    <div className="sd-metric-title">Health calendar</div>
                </div>
                <div className="sd-box sd-metric-box">
                    <div className="sd-metric-title">Recovery calendar</div>
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
                                    <th>Athlete</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Duration</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Today</td>
                                    <td>Player A</td>
                                    <td>Physiotherapy</td>
                                    <td>Active</td>
                                    <td>45:00</td>
                                    <td>Hamstring recovery</td>
                                </tr>
                                <tr>
                                    <td>Yesterday</td>
                                    <td>Player B</td>
                                    <td>Assessment</td>
                                    <td>Cleared</td>
                                    <td>30:00</td>
                                    <td>Full clearance</td>
                                </tr>
                                <tr>
                                    <td>Wed</td>
                                    <td>Player C</td>
                                    <td>Massage</td>
                                    <td>Ongoing</td>
                                    <td>1:00:00</td>
                                    <td>Quad tension</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="sd-sidebar">
                    <div className="sd-box">
                        <div className="sd-box-header">
                            <h2>Injury Report</h2>
                        </div>
                        <div className="sd-box-content">
                            <p>Active injuries: —</p>
                            <p>Returning this week: —</p>
                            <p>Next assessment: —</p>
                        </div>
                    </div>

                    <div className="sd-box">
                        <div className="sd-box-header">
                            <h2>Health Metrics</h2>
                        </div>
                        <div className="sd-box-content">
                            <ul className="sd-list">
                                <li>Heart rate variability</li>
                                <li>Sleep quality</li>
                                <li>Muscle soreness</li>
                                <li>Fatigue index</li>
                                <li>Recovery score</li>
                                <li>Hydration level</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

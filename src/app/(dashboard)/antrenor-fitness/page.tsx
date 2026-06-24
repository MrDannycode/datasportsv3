import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

const FITNESS_TYPE_LABELS: Record<string, string> = {
    forta: "Forta",
    rezistenta: "Rezistenta",
    vitezare: "Viteza",
    flexibilitate: "Flexibilitate",
    coordonare: "Coordonare",
}
export default async function AntrenorFitnessPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "antrenor_fitness") {
        redirect("/login")
    }

    const fitnessPlans = await prisma.fitnessPlan.findMany({
        where: { createdBy: Number(session.user.id) },
        orderBy: { date: "asc" },
        take: 5,
    })

    return (
        <main>
            <div className="sd-page-title">
                <h1>Dashboard overview</h1>
            </div>

            <div className="sd-metrics">
                <div className="sd-box sd-metric-box" style={{ height: "auto", minHeight: "150px" }}>
                    <div className="sd-metric-title">Fitness calendar</div>
                    <div style={{ marginTop: "15px", textAlign: "left" }}>
                        {fitnessPlans.length === 0 ? (
                            <p style={{ fontSize: "14px", color: "#666" }}>Nu ai adaugat activitati de fitness.</p>
                        ) : (
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "14px" }}>
                                {fitnessPlans.map((plan) => (
                                    <li key={plan.id} style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #eee" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center" }}>
                                            <span style={{ fontWeight: "bold" }}>{plan.title}</span>
                                            <span style={{ backgroundColor: "#eef7ed", color: "#2a7a2a", padding: "2px 8px", fontSize: "11px", fontWeight: "bold", borderRadius: "2px", whiteSpace: "nowrap" }}>
                                                {FITNESS_TYPE_LABELS[plan.type]}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                                            {new Date(plan.date).toLocaleDateString("ro-RO", {
                                                weekday: "short", day: "numeric", month: "short",
                                            })}
                                        </div>
                                        {plan.description && (
                                            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                                                {plan.description}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <Link href="/antrenor-fitness/fitness-calendar" style={{ display: "inline-block", marginTop: "8px", fontSize: "13px", color: "#0056b3", textDecoration: "none" }}>
                        Vezi toate activitatile
                    </Link>
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





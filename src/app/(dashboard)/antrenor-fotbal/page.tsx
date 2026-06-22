import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function AntrenorFotbalPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "antrenor_fotbal") {
        redirect("/login")
    }

    // Statistici sumare
    const totalPlans = await prisma.trainingPlan.count({
        where: { createdBy: Number(session.user.id) },
    })

    const recentPlans = await prisma.trainingPlan.findMany({
        where: { createdBy: Number(session.user.id) },
        orderBy: { date: "desc" },
        take: 5,
    })

    return (
        <main>
            <div className="sd-page-title">
                <h1>Dashboard — Antrenor Fotbal</h1>
            </div>

            <div className="sd-metrics">
            <div className="sd-box sd-metric-box" style={{ flex: 1 }}>
                <div className="sd-metric-title">Accidentari Recente</div>
                    <div className="sd-metric-value">—</div>
                </div>
                <div className="sd-box sd-metric-box">
                    <div className="sd-metric-title">Planuri de antrenament</div>
                    <div className="sd-metric-value">{totalPlans}</div>
                </div>
                <Link href="/antrenor-fotbal/antrenamente" style={{ flex: 1, textDecoration: "none" }}>
                    <div className="sd-box sd-metric-box" style={{ cursor: "pointer" }}>
                        <div className="sd-metric-title">Antrenamente</div>
                        <div className="sd-metric-value" style={{ fontSize: "14px", marginTop: "8px", color: "#0056b3" }}>
                            Gestionează →
                        </div>
                    </div>
                </Link>
            </div>

            <div className="sd-panels">
                <div className="sd-box sd-activities">
                    <div className="sd-box-header">
                        <h2>Planuri recente</h2>
                        <Link href="/antrenor-fotbal/antrenamente">Vezi toate</Link>
                    </div>
                    <div className="sd-box-content" style={{ padding: 0 }}>
                        {recentPlans.length === 0 ? (
                            <div className="sd-empty-state">
                                <p>Nu ai creat niciun plan de antrenament.</p>
                                <Link href="/antrenor-fotbal/antrenamente/nou" className="sd-btn-primary">
                                    Creează primul plan
                                </Link>
                            </div>
                        ) : (
                            <table className="sd-table">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Titlu</th>
                                        <th>Tip</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentPlans.map((plan) => (
                                        <tr key={plan.id}>
                                            <td>
                                                {new Date(plan.date).toLocaleDateString("ro-RO", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                })}
                                            </td>
                                            <td>
                                                <Link href={`/antrenor-fotbal/antrenamente/${plan.id}/edit`}>
                                                    {plan.title}
                                                </Link>
                                            </td>
                                            <td>
                                                <span className={`sd-badge sd-badge-${plan.type}`}>
                                                    {plan.type.charAt(0).toUpperCase() + plan.type.slice(1)}
                                                </span>
                                            </td>
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
                            <h2>Navigare rapidă</h2>
                        </div>
                        <div className="sd-box-content">
                            <ul className="sd-list">
                                <li>
                                    <Link href="/antrenor-fotbal/antrenamente">
                                        📋 Toate antrenamentele
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/antrenor-fotbal/antrenamente/nou">
                                        ➕ Plan nou de antrenament
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="sd-box">
                        <div className="sd-box-header">
                            <h2>Tipuri antrenament</h2>
                        </div>
                        <div className="sd-box-content">
                            <ul className="sd-list">
                                <li>
                                    <span className="sd-badge sd-badge-tehnic">Tehnic</span>
                                    {" — lucru cu mingea, dribling, pase"}
                                </li>
                                <li>
                                    <span className="sd-badge sd-badge-fizic">Fizic</span>
                                    {" — rezistență, viteză, forță"}
                                </li>
                                <li>
                                    <span className="sd-badge sd-badge-tactic">Tactic</span>
                                    {" — scheme, poziționare, faze fixe"}
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="sd-box">
                        <div className="sd-box-header">
                            <h2>Bara verde ca la fifa</h2>
                        </div>
                    </div>
                        
                </div>
            </div>
        </main>
    )
}

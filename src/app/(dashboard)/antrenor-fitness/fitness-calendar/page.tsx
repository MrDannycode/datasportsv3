import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"

const TYPE_LABELS: Record<string, string> = {
    forta: "Forta",
    rezistenta: "Rezistenta",
    vitezare: "Viteza",
    flexibilitate: "Flexibilitate",
    coordonare: "Coordonare",
}

function formatDate(date: Date) {
    return date.toLocaleDateString("ro-RO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
}

export default async function FitnessCalendarPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "antrenor_fitness") {
        redirect("/login")
    }

    const plans = await prisma.fitnessPlan.findMany({
        where: { createdBy: Number(session.user.id) },
        orderBy: [{ date: "asc" }, { createdAt: "desc" }],
    })

    return (
        <main>
            <div className="sd-page-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                <div>
                    <h1>Fitness Calendar</h1>
                    <p style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
                        Activitatile de fitness adaugate de tine
                    </p>
                </div>
                <Link
                    href="/antrenor-fitness/trainfit?open=new"
                    style={{
                        fontSize: "13px",
                        color: "#0056b3",
                        textDecoration: "none",
                        border: "1px solid #0056b3",
                        padding: "6px 14px",
                        whiteSpace: "nowrap",
                    }}
                >
                    Adauga activitate
                </Link>
            </div>

            <div className="sd-box">
                <div className="sd-box-header">
                    <h2>Activitati in calendar ({plans.length})</h2>
                </div>
                <div className="sd-box-content" style={{ padding: 0 }}>
                    <table className="sd-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Tip</th>
                                <th>Titlu</th>
                                <th>Descriere</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plans.map((plan) => (
                                <tr key={plan.id}>
                                    <td style={{ fontSize: "13px", color: "#555" }}>{formatDate(plan.date)}</td>
                                    <td>
                                        <span style={{ backgroundColor: "#e8f0fb", color: "#0056b3", padding: "2px 8px", fontSize: "11px", fontWeight: "bold" }}>
                                            {TYPE_LABELS[plan.type] ?? plan.type}
                                        </span>
                                    </td>
                                    <td>{plan.title}</td>
                                    <td style={{ color: "#666", fontSize: "12px" }}>{plan.description ?? "-"}</td>
                                </tr>
                            ))}
                            {plans.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: "center", color: "#999", padding: "24px" }}>
                                        Nu ai adaugat inca activitati de fitness.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    )
}

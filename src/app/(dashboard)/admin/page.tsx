import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function AdminPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin_global") {
        redirect("/login")
    }

    return (
        <main>
            <div className="sd-page-title">
                <h1>Dashboard Admin Global</h1>
            </div>
            <p style={{ color: "#666", marginBottom: "20px", fontSize: "13px" }}>
                Bun venit, <strong>{session.user.email}</strong>
            </p>

            <div className="sd-metrics">
                <Link href="/admin/users" style={{ flex: 1, textDecoration: "none" }}>
                    <div className="sd-box sd-metric-box" style={{ cursor: "pointer" }}>
                        <div className="sd-metric-title">Utilizatori</div>
                        <div className="sd-metric-value" style={{ fontSize: "14px", marginTop: "8px", color: "#0056b3" }}>
                            Gestionează →
                        </div>
                    </div>
                </Link>
                <Link href="/admin/competitions" style={{ flex: 1, textDecoration: "none" }}>
                    <div className="sd-box sd-metric-box" style={{ cursor: "pointer" }}>
                        <div className="sd-metric-title">Competiții</div>
                        <div className="sd-metric-value" style={{ fontSize: "14px", marginTop: "8px", color: "#0056b3" }}>
                            Gestionează →
                        </div>
                    </div>
                </Link>
                <div className="sd-box sd-metric-box" style={{ flex: 1 }}>
                    <div className="sd-metric-title">Echipe</div>
                    <div className="sd-metric-value">—</div>
                </div>
                <div className="sd-box sd-metric-box" style={{ flex: 1 }}>
                    <div className="sd-metric-title">Audituri</div>
                    <div className="sd-metric-value">—</div>
                </div>
            </div>
        </main>
    )
}
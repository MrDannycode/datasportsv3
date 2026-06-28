import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

const ROLE_LABELS = [
    { value: "admin_global", label: "Admin Global" },
    { value: "manager_fotbal", label: "Manager Fotbal" },
    { value: "manager_tenis", label: "Manager Tenis" },
    { value: "antrenor_fotbal", label: "Antrenor Fotbal" },
    { value: "antrenor_fitness", label: "Antrenor Fitness" },
    { value: "medic", label: "Medic" },
    { value: "atlet_fotbal", label: "Atlet Fotbal" },
    { value: "atlet_tenis", label: "Atlet Tenis" },
]

export default async function AdminPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin_global") {
        redirect("/login")
    }

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const [auditLogsCount, auditLogsTodayCount, latestAuditLog, topAuditUsers, activeAuditUsersCount, userRoleCounts, competitionCounts] = await Promise.all([
        prisma.auditLog.count(),
        prisma.auditLog.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.auditLog.findFirst({
            orderBy: { createdAt: "desc" },
            include: { user: { select: { email: true } } },
        }),
        prisma.auditLog.groupBy({
            by: ["userId"],
            _count: { _all: true },
            orderBy: { _count: { userId: "desc" } },
            take: 1,
        }),
        prisma.auditLog.groupBy({
            by: ["userId"],
            where: { createdAt: { gte: startOfToday } },
        }),
        prisma.user.groupBy({
            by: ["role"],
            _count: { _all: true },
        }),
        prisma.competition.groupBy({
            by: ["sport", "continent"],
            _count: { _all: true },
            orderBy: [{ sport: "asc" }, { continent: "asc" }],
        }),
    ])

    const countByRole = new Map<string, number>(userRoleCounts.map((item) => [item.role, item._count._all]))
    const topAuditUser = topAuditUsers[0]
        ? await prisma.user.findUnique({ where: { id: topAuditUsers[0].userId }, select: { email: true } })
        : null
    const latestAuditLabel = latestAuditLog
        ? `${latestAuditLog.user.email} - ${latestAuditLog.action.toLowerCase()} - ${latestAuditLog.createdAt.toLocaleDateString("ro-RO")}`
        : "Nicio actiune"

    return (
        <main>
            <div className="sd-box">
                <div className="sd-box-header">
                    <h2>Dashboard overview</h2>
                </div>
                <div className="sd-box-content">
                    <div className="sd-metrics">
                        <div className="sd-box sd-metric-box" style={{ flex: 1 }}>
                            <div className="sd-metric-title">Utilizatori</div>
                            <div className="sd-metric-value" style={{ fontSize: "14px", marginTop: "8px", color: "#0056b3" }}>
                                <Link href="/admin/users" style={{ color: "inherit", textDecoration: "none" }}>Gestioneaza &gt;</Link>
                                <span style={{ color: "#999", margin: "0 6px" }}>|</span>
                                <Link href="/admin/manageri" style={{ color: "inherit", textDecoration: "none" }}>Gestiune Manageri &gt;</Link>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "14px" }}>
                                {ROLE_LABELS.map((role) => (
                                    <div key={role.value} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", borderTop: "1px solid #eee", paddingTop: "8px" }}>
                                        <span style={{ color: "#333", fontSize: "12px", fontWeight: 600 }}>{role.label}</span>
                                        <span style={{ color: "#666", fontSize: "12px" }}>{countByRole.get(role.value) ?? 0}</span>
                                        <Link
                                            href={`/admin/users?role=${role.value}`}
                                            style={{ border: "1px solid #0056b3", color: "#0056b3", backgroundColor: "transparent", padding: "2px 8px", fontSize: "11px", textDecoration: "none" }}
                                        >
                                            Vezi
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="sd-box sd-metric-box" style={{ flex: 1 }}>
                            <div className="sd-metric-title">Competitii</div>
                            <div className="sd-metric-value" style={{ fontSize: "14px", marginTop: "8px", color: "#0056b3" }}>
                                <Link href="/admin/competitions" style={{ color: "inherit", textDecoration: "none" }}>Gestioneaza &gt;</Link>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: "8px", alignItems: "center", marginTop: "14px" }}>
                                <span style={{ color: "#666", fontSize: "11px", fontWeight: 700 }}>Sport</span>
                                <span style={{ color: "#666", fontSize: "11px", fontWeight: 700 }}>Continent</span>
                                <span style={{ color: "#666", fontSize: "11px", fontWeight: 700 }}>Nr competitii</span>
                                <span style={{ color: "#666", fontSize: "11px", fontWeight: 700 }}>Vezi</span>
                                {competitionCounts.map((item) => (
                                    <div key={`${item.sport}-${item.continent}`} style={{ display: "contents" }}>
                                        <span style={{ borderTop: "1px solid #eee", paddingTop: "8px", color: "#333", fontSize: "12px", fontWeight: 600 }}>{item.sport === "fotbal" ? "Fotbal" : "Tenis"}</span>
                                        <span style={{ borderTop: "1px solid #eee", paddingTop: "8px", color: "#333", fontSize: "12px" }}>{item.continent}</span>
                                        <span style={{ borderTop: "1px solid #eee", paddingTop: "8px", color: "#666", fontSize: "12px" }}>{item._count._all}</span>
                                        <Link
                                            href={`/admin/competitions?sport=${item.sport}&continent=${encodeURIComponent(item.continent)}`}
                                            style={{ border: "1px solid #0056b3", color: "#0056b3", backgroundColor: "transparent", padding: "2px 8px", fontSize: "11px", textDecoration: "none" }}
                                        >
                                            Vezi
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="sd-box sd-metric-box" style={{ flex: 1 }}>
                            <div className="sd-metric-title">Audituri</div>
                            <div className="sd-metric-value" style={{ fontSize: "14px", marginTop: "8px", color: "#0056b3" }}>
                                <Link href="/admin/audituri" style={{ color: "inherit", textDecoration: "none" }}>Vezi audituri &gt;</Link>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "14px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", borderTop: "1px solid #eee", paddingTop: "8px" }}>
                                    <span style={{ color: "#333", fontSize: "12px", fontWeight: 600 }}>Total inregistrari</span>
                                    <span style={{ color: "#666", fontSize: "12px" }}>{auditLogsCount}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", borderTop: "1px solid #eee", paddingTop: "8px" }}>
                                    <span style={{ color: "#333", fontSize: "12px", fontWeight: 600 }}>Actiuni azi</span>
                                    <span style={{ color: "#666", fontSize: "12px" }}>{auditLogsTodayCount}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", borderTop: "1px solid #eee", paddingTop: "8px" }}>
                                    <span style={{ color: "#333", fontSize: "12px", fontWeight: 600 }}>Ultima actiune</span>
                                    <span style={{ color: "#666", fontSize: "12px", textAlign: "right" }}>{latestAuditLabel}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", borderTop: "1px solid #eee", paddingTop: "8px" }}>
                                    <span style={{ color: "#333", fontSize: "12px", fontWeight: 600 }}>Top utilizator</span>
                                    <span style={{ color: "#666", fontSize: "12px", textAlign: "right" }}>{topAuditUser ? `${topAuditUser.email} (${topAuditUsers[0]._count._all})` : "-"}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", borderTop: "1px solid #eee", paddingTop: "8px" }}>
                                    <span style={{ color: "#333", fontSize: "12px", fontWeight: 600 }}>Utilizatori activi azi</span>
                                    <span style={{ color: "#666", fontSize: "12px" }}>{activeAuditUsersCount.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

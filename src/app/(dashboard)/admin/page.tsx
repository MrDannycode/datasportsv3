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
                    <div className="sd-admin-tables-grid">
                        <div className="sd-box sd-hover-box">
                            <div className="sd-box-header">
                                <h2>Utilizatori</h2>
                                <Link href="/admin/users">Gestioneaza</Link>
                            </div>
                            <div className="sd-box-content" style={{ padding: 0 }}>
                                <table className="sd-table">
                                    <thead>
                                        <tr>
                                            <th>Rol</th>
                                            <th>Total</th>
                                            <th>Actiune</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ROLE_LABELS.map((role) => (
                                            <tr key={role.value}>
                                                <td>{role.label}</td>
                                                <td>{countByRole.get(role.value) ?? 0}</td>
                                                <td>
                                                    <Link href={`/admin/users?role=${role.value}`} style={{ color: "#0056b3", textDecoration: "none", fontWeight: 700 }}>
                                                        Vezi
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="sd-box sd-hover-box">
                            <div className="sd-box-header">
                                <h2>Competitii</h2>
                                <Link href="/admin/competitions">Gestioneaza</Link>
                            </div>
                            <div className="sd-box-content" style={{ padding: 0 }}>
                                <table className="sd-table">
                                    <thead>
                                        <tr>
                                            <th>Sport</th>
                                            <th>Continent</th>
                                            <th>Nr</th>
                                            <th>Actiune</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {competitionCounts.map((item) => (
                                            <tr key={`${item.sport}-${item.continent}`}>
                                                <td>{item.sport === "fotbal" ? "Fotbal" : "Tenis"}</td>
                                                <td>{item.continent}</td>
                                                <td>{item._count._all}</td>
                                                <td>
                                                    <Link
                                                        href={`/admin/competitions?sport=${item.sport}&continent=${encodeURIComponent(item.continent)}`}
                                                        style={{ color: "#0056b3", textDecoration: "none", fontWeight: 700 }}
                                                    >
                                                        Vezi
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="sd-box sd-hover-box">
                            <div className="sd-box-header">
                                <h2>Audituri</h2>
                                <Link href="/admin/audituri">Vezi toate</Link>
                            </div>
                            <div className="sd-box-content" style={{ padding: 0 }}>
                                <table className="sd-table">
                                    <thead>
                                        <tr>
                                            <th>Indicator</th>
                                            <th>Valoare</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Total inregistrari</td>
                                            <td>{auditLogsCount}</td>
                                        </tr>
                                        <tr>
                                            <td>Actiuni azi</td>
                                            <td>{auditLogsTodayCount}</td>
                                        </tr>
                                        <tr>
                                            <td>Ultima actiune</td>
                                            <td>{latestAuditLabel}</td>
                                        </tr>
                                        <tr>
                                            <td>Utilizatori activi</td>
                                            <td>{topAuditUser ? `${topAuditUser.email} (${topAuditUsers[0]._count._all})` : "-"}</td>
                                        </tr>
                                        <tr>
                                            <td>Utilizatori activi azi</td>
                                            <td>{activeAuditUsersCount.length}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

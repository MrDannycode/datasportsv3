import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { AuditAction, Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

const PAGE_SIZE = 20
const EXPORT_LIMIT = 10000

type AuditSearchParams = {
    action?: string | string[]
    table?: string | string[]
    userId?: string | string[]
    page?: string | string[]
}

interface AdminAuditPageProps {
    searchParams?: Promise<AuditSearchParams>
}

function firstValue(value?: string | string[]) {
    return Array.isArray(value) ? value[0] : value
}

function buildQuery(params: Record<string, string | number | undefined>) {
    const query = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
            query.set(key, String(value))
        }
    })

    return query.toString()
}

function buildHref(params: Record<string, string | number | undefined>) {
    const queryString = buildQuery(params)
    return queryString ? `/admin/audituri?${queryString}` : "/admin/audituri"
}

function buildExportHref(params: Record<string, string | number | undefined>) {
    const queryString = buildQuery(params)
    return queryString ? `/api/admin/audituri/export?${queryString}` : "/api/admin/audituri/export"
}

function formatDetails(details: Prisma.JsonValue | null) {
    if (!details) {
        return "-"
    }

    if (typeof details === "string") {
        return details
    }

    return JSON.stringify(details)
}

function actionLabel(action: AuditAction) {
    const labels: Record<AuditAction, string> = {
        create: "Creare",
        update: "Actualizare",
        delete: "Stergere",
        login: "Login",
        logout: "Logout",
    }

    return labels[action]
}

export default async function AdminAuditPage({ searchParams }: AdminAuditPageProps) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin_global") {
        redirect("/login")
    }

    const resolvedSearchParams = searchParams ? await searchParams : {}
    const selectedAction = firstValue(resolvedSearchParams.action)
    const selectedTable = firstValue(resolvedSearchParams.table)
    const selectedUserId = firstValue(resolvedSearchParams.userId)
    const currentPage = Math.max(1, Number(firstValue(resolvedSearchParams.page) ?? "1") || 1)

    const validAction = Object.values(AuditAction).includes(selectedAction as AuditAction)
        ? selectedAction as AuditAction
        : undefined
    const userId = selectedUserId ? Number(selectedUserId) : undefined

    const where: Prisma.AuditLogWhereInput = {
        ...(validAction ? { action: validAction } : {}),
        ...(selectedTable ? { tableAffected: selectedTable } : {}),
        ...(userId ? { userId } : {}),
    }

    const [auditLogs, totalLogs, users, tables] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip: (currentPage - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
        prisma.auditLog.count({ where }),
        prisma.user.findMany({
            select: {
                id: true,
                email: true,
            },
            orderBy: { email: "asc" },
        }),
        prisma.auditLog.findMany({
            distinct: ["tableAffected"],
            select: { tableAffected: true },
            orderBy: { tableAffected: "asc" },
        }),
    ])

    const totalPages = Math.max(1, Math.ceil(totalLogs / PAGE_SIZE))
    const filtersForLinks = {
        action: validAction,
        table: selectedTable,
        userId,
    }

    return (
        <main>
            <div className="sd-box">
                <div className="sd-box-header">
                    <Link href="/admin" className="sd-btn-secondary">Inapoi</Link>
                    <h2 className="flex-1 text-center">Gestionare Audituri</h2>
                    <div className="sd-btn-secondary invisible">Inapoi</div>
                </div>

                <div className="sd-box-content">
                    <div className="sd-box-header">
                        <h2>Inregistrari audit ({totalLogs})</h2>
                        <a href={buildExportHref(filtersForLinks)} download className="sd-btn-secondary">
                            Export XLSX
                        </a>
                    </div>
                    <div className="sd-box-content" style={{ padding: 0, overflowX: "auto" }}>
                        <form action="/admin/audituri" method="get" className="sd-table-toolbar">
                            <label className="sd-table-toolbar-label" htmlFor="audit-action">Actiune</label>
                            <select id="audit-action" name="action" className="sd-input" defaultValue={validAction ?? ""}>
                                <option value="">Toate</option>
                                {Object.values(AuditAction).map(action => (
                                    <option key={action} value={action}>{actionLabel(action)}</option>
                                ))}
                            </select>

                            <label className="sd-table-toolbar-label" htmlFor="audit-table">Tabel</label>
                            <select id="audit-table" name="table" className="sd-input" defaultValue={selectedTable ?? ""}>
                                <option value="">Toate</option>
                                {tables.map(table => (
                                    <option key={table.tableAffected} value={table.tableAffected}>{table.tableAffected}</option>
                                ))}
                            </select>

                            <label className="sd-table-toolbar-label" htmlFor="audit-user">Utilizator</label>
                            <select id="audit-user" name="userId" className="sd-input" defaultValue={userId ?? ""}>
                                <option value="">Toti</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.email}</option>
                                ))}
                            </select>

                            <div className="sd-table-toolbar-actions">
                                <button type="submit" className="sd-btn-primary">Filtreaza</button>
                                <Link href="/admin/audituri" className="sd-btn-secondary">Reseteaza</Link>
                            </div>
                        </form>

                        {auditLogs.length === 0 ? (
                            <div className="sd-empty-state">
                                <p>Nu exista audituri pentru filtrele selectate.</p>
                                <p className="sd-hint">Exportul XLSX include toate rezultatele filtrate, maxim {EXPORT_LIMIT} inregistrari.</p>
                            </div>
                        ) : (
                            <>
                                <table className="sd-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Data</th>
                                            <th>Utilizator</th>
                                            <th>Actiune</th>
                                            <th>Tabel</th>
                                            <th>Record</th>
                                            <th>Detalii</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {auditLogs.map(log => (
                                            <tr key={log.id}>
                                                <td style={{ color: "#999" }}>{log.id}</td>
                                                <td style={{ color: "#666", fontSize: "12px", whiteSpace: "nowrap" }}>
                                                    {new Date(log.createdAt).toLocaleString("ro-RO")}
                                                </td>
                                                <td>{log.user.email}</td>
                                                <td>
                                                    <span className="sd-badge sd-badge-tehnic">{actionLabel(log.action)}</span>
                                                </td>
                                                <td>{log.tableAffected}</td>
                                                <td>{log.recordId ?? "-"}</td>
                                                <td className="sd-description-cell" title={formatDetails(log.details)}>
                                                    {formatDetails(log.details)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div style={{ padding: "12px 16px", color: "#666", fontSize: "13px" }}>
                                    Exportul XLSX include toate rezultatele filtrate, maxim {EXPORT_LIMIT} inregistrari.
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <span style={{ color: "#666", fontSize: "13px" }}>
                    Pagina {currentPage} din {totalPages}
                </span>
                <div className="sd-action-group">
                    {currentPage > 1 && (
                        <Link href={buildHref({ ...filtersForLinks, page: currentPage - 1 })} className="sd-btn-secondary">
                            Inapoi
                        </Link>
                    )}
                    {currentPage < totalPages && (
                        <Link href={buildHref({ ...filtersForLinks, page: currentPage + 1 })} className="sd-btn-secondary">
                            Inainte
                        </Link>
                    )}
                </div>
            </div>
        </main>
    )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Team {
    id: number
    name: string
}

interface TrainingPlan {
    id: number
    teamId: number
    createdBy: number
    title: string
    description: string | null
    type: "tehnic" | "fizic" | "tactic"
    date: string
    createdAt: string
    team: Team
}

interface Props {
    initialPlans: TrainingPlan[]
}

const TYPE_LABELS: Record<string, string> = {
    tehnic: "Tehnic",
    fizic: "Fizic",
    tactic: "Tactic",
}

const TYPE_BADGE: Record<string, string> = {
    tehnic: "sd-badge-tehnic",
    fizic: "sd-badge-fizic",
    tactic: "sd-badge-tactic",
}

export default function AntrenamenteClient({ initialPlans }: Props) {
    const router = useRouter()
    const [plans, setPlans] = useState<TrainingPlan[]>(initialPlans)
    const [filter, setFilter] = useState<"toate" | "tehnic" | "fizic" | "tactic">("toate")
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const filtered =
        filter === "toate" ? plans : plans.filter((p) => p.type === filter)

    function formatDate(iso: string) {
        return new Date(iso).toLocaleDateString("ro-RO", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        })
    }

    async function handleDelete(id: number) {
        setDeleting(true)
        setError(null)
        try {
            const res = await fetch(`/api/antrenor-fotbal/antrenamente/${id}`, {
                method: "DELETE",
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error ?? "Eroare la ștergere")
            }
            setPlans((prev) => prev.filter((p) => p.id !== id))
            setDeleteId(null)
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Eroare necunoscută")
        } finally {
            setDeleting(false)
        }
    }

    return (
        <>
            {/* Toolbar */}
            <div className="sd-toolbar">
                <div className="sd-filter-group">
                    {(["toate", "tehnic", "fizic", "tactic"] as const).map((f) => (
                        <button
                            key={f}
                            className={`sd-filter-btn${filter === f ? " active" : ""}`}
                            onClick={() => setFilter(f)}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                <Link href="/antrenor-fotbal/antrenamente/nou" className="sd-btn-primary">
                    + Adaugă antrenament
                </Link>
            </div>

            {error && <div className="sd-error-banner">{error}</div>}

            {/* Tabel */}
            <div className="sd-box">
                <div className="sd-box-header">
                    <h2>Planuri de antrenament ({filtered.length})</h2>
                </div>
                <div className="sd-box-content" style={{ padding: 0 }}>
                    {filtered.length === 0 ? (
                        <div className="sd-empty-state">
                            <p>Nu există planuri de antrenament{filter !== "toate" ? ` de tip „${filter}"` : ""}.</p>
                            <Link href="/antrenor-fotbal/antrenamente/nou" className="sd-btn-primary">
                                Creează primul plan
                            </Link>
                        </div>
                    ) : (
                        <table className="sd-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Titlu</th>
                                    <th>Tip</th>
                                    <th>Echipă</th>
                                    <th>Data</th>
                                    <th>Descriere</th>
                                    <th>Acțiuni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((plan, idx) => (
                                    <tr key={plan.id}>
                                        <td>{idx + 1}</td>
                                        <td>
                                            <strong>{plan.title}</strong>
                                        </td>
                                        <td>
                                            <span className={`sd-badge ${TYPE_BADGE[plan.type]}`}>
                                                {TYPE_LABELS[plan.type]}
                                            </span>
                                        </td>
                                        <td>{plan.team.name}</td>
                                        <td>{formatDate(plan.date)}</td>
                                        <td className="sd-description-cell">
                                            {plan.description ?? <em style={{ color: "#999" }}>—</em>}
                                        </td>
                                        <td>
                                            <div className="sd-action-group">
                                                <Link
                                                    href={`/antrenor-fotbal/antrenamente/${plan.id}/edit`}
                                                    className="sd-btn-sm sd-btn-edit"
                                                >
                                                    Editează
                                                </Link>
                                                <button
                                                    className="sd-btn-sm sd-btn-delete"
                                                    onClick={() => setDeleteId(plan.id)}
                                                >
                                                    Șterge
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal confirmare ștergere */}
            {deleteId !== null && (
                <div className="sd-modal-overlay">
                    <div className="sd-modal">
                        <h3>Confirmare ștergere</h3>
                        <p>
                            Ești sigur că vrei să ștergi planul{" "}
                            <strong>
                                &quot;{plans.find((p) => p.id === deleteId)?.title}&quot;
                            </strong>
                            ? Această acțiune este ireversibilă.
                        </p>
                        <div className="sd-modal-actions">
                            <button
                                className="sd-btn-primary"
                                onClick={() => setDeleteId(null)}
                                disabled={deleting}
                            >
                                Anulează
                            </button>
                            <button
                                className="sd-btn-danger"
                                onClick={() => handleDelete(deleteId)}
                                disabled={deleting}
                            >
                                {deleting ? "Se șterge..." : "Șterge"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

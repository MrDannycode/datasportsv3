"use client"

import { useState } from "react"
import { createPlan, updatePlan, deletePlan } from "./actions"

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
    teams: Team[]
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

export default function AntrenamenteManager({ initialPlans, teams }: Props) {
    const [plans, setPlans] = useState<TrainingPlan[]>(initialPlans)
    const [filter, setFilter] = useState<"toate" | "tehnic" | "fizic" | "tactic">("toate")

    // State for delete
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [listError, setListError] = useState<string | null>(null)

    // State for create/edit form
    const [showForm, setShowForm] = useState(false)
    const [editMode, setEditMode] = useState<boolean>(false)
    const [editId, setEditId] = useState<number | null>(null)

    const [teamId, setTeamId] = useState<string>(teams[0] ? String(teams[0].id) : "")
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [type, setType] = useState<"tehnic" | "fizic" | "tactic">("tehnic")
    const [date, setDate] = useState(new Date().toISOString().split("T")[0])

    const [formLoading, setFormLoading] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [formSuccess, setFormSuccess] = useState<string | null>(null)

    const filtered = filter === "toate" ? plans : plans.filter((p) => p.type === filter)

    function formatDate(iso: string) {
        return new Date(iso).toLocaleDateString("ro-RO", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        })
    }

    function openCreateForm() {
        setEditMode(false)
        setEditId(null)
        setTeamId(teams[0] ? String(teams[0].id) : "")
        setTitle("")
        setDescription("")
        setType("tehnic")
        setDate(new Date().toISOString().split("T")[0])
        setFormError(null)
        setFormSuccess(null)
        setShowForm(true)
    }

    function openEditForm(plan: TrainingPlan) {
        setEditMode(true)
        setEditId(plan.id)
        setTeamId(String(plan.teamId))
        setTitle(plan.title)
        setDescription(plan.description ?? "")
        setType(plan.type)
        setDate(plan.date.split("T")[0])
        setFormError(null)
        setFormSuccess(null)
        setShowForm(true)
    }

    function closeForm() {
        setShowForm(false)
    }

    async function handleFormSubmit(e: React.FormEvent) {
        e.preventDefault()
        setFormLoading(true)
        setFormError(null)
        setFormSuccess(null)

        const payload = { teamId: Number(teamId), title, description, type, date }

        try {
            if (editMode && editId !== null) {
                const result = await updatePlan(editId, payload)
                if (result?.error) throw new Error(result.error)
                
                // Update local state by merging the team data
                if (result?.plan) {
                    const selectedTeam = teams.find(t => t.id === Number(teamId))
                    setPlans(plans.map(p => p.id === editId ? { ...result.plan, team: selectedTeam as Team, date: result.plan.date.toISOString(), createdAt: result.plan.createdAt.toISOString() } as TrainingPlan : p))
                    setFormSuccess("Planul a fost actualizat cu succes.")
                }
            } else {
                const result = await createPlan(payload)
                if (result?.error) throw new Error(result.error)

                if (result?.plan) {
                    const selectedTeam = teams.find(t => t.id === Number(teamId))
                    const newPlan = { ...result.plan, team: selectedTeam as Team, date: result.plan.date.toISOString(), createdAt: result.plan.createdAt.toISOString() } as TrainingPlan
                    setPlans([newPlan, ...plans])
                    setFormSuccess("Planul a fost creat cu succes.")
                    
                    // Reset fields for consecutive creations
                    setTitle("")
                    setDescription("")
                }
            }
            
            // Optionally close form after a delay or just leave it open with success message
            setTimeout(() => {
                closeForm()
            }, 1500)
            
        } catch (e: unknown) {
            setFormError(e instanceof Error ? e.message : "Eroare necunoscută")
        } finally {
            setFormLoading(false)
        }
    }

    async function handleDelete(id: number) {
        setDeleting(true)
        setListError(null)
        try {
            const result = await deletePlan(id)
            if (result?.error) {
                throw new Error(result.error)
            }
            setPlans((prev) => prev.filter((p) => p.id !== id))
            setDeleteId(null)
        } catch (e: unknown) {
            setListError(e instanceof Error ? e.message : "Eroare necunoscută")
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

                {!showForm && (
                    <button onClick={openCreateForm} className="sd-btn-primary">
                        + Adaugă antrenament
                    </button>
                )}
            </div>

            {listError && <div className="sd-error-banner">{listError}</div>}

            {/* Create / Edit Form Area */}
            {showForm && (
                <div className="sd-box" style={{ marginBottom: "24px" }}>
                    <div className="sd-box-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2>{editMode ? "Editează plan" : "Adaugă plan nou"}</h2>
                        <button onClick={closeForm} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>×</button>
                    </div>
                    <div className="sd-box-content">
                        {formError && <div className="sd-error-banner">{formError}</div>}
                        {formSuccess && <div style={{ color: "green", padding: "10px", background: "#efe", borderRadius: "5px", marginBottom: "15px" }}>{formSuccess}</div>}

                        <form onSubmit={handleFormSubmit} className="sd-form" style={{ display: "flex", flexWrap: "wrap", gap: "15px", alignItems: "flex-start" }}>
                            
                            <div className="sd-form-group" style={{ flex: "1 1 200px" }}>
                                <label htmlFor="plan-title" className="sd-label">Titlu <span className="sd-required">*</span></label>
                                <input id="plan-title" type="text" className="sd-input" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} placeholder="ex. Antrenament tactic ofensiv" />
                            </div>

                            <div className="sd-form-group" style={{ flex: "1 1 150px" }}>
                                <label htmlFor="plan-type" className="sd-label">Tip antrenament <span className="sd-required">*</span></label>
                                <select id="plan-type" className="sd-input" value={type} onChange={(e) => setType(e.target.value as "tehnic" | "fizic" | "tactic")} required>
                                    <option value="tehnic">Tehnic</option>
                                    <option value="fizic">Fizic</option>
                                    <option value="tactic">Tactic</option>
                                </select>
                            </div>

                            <div className="sd-form-group" style={{ flex: "1 1 200px" }}>
                                <label htmlFor="plan-team" className="sd-label">Echipă <span className="sd-required">*</span></label>
                                {teams.length === 0 ? (
                                    <p className="sd-hint" style={{ color: "#c00" }}>Nu există echipe de fotbal în sistem.</p>
                                ) : (
                                    <select id="plan-team" className="sd-input" value={teamId} onChange={(e) => setTeamId(e.target.value)} required>
                                        {teams.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="sd-form-group" style={{ flex: "1 1 150px" }}>
                                <label htmlFor="plan-date" className="sd-label">Data <span className="sd-required">*</span></label>
                                <input id="plan-date" type="date" className="sd-input" value={date} onChange={(e) => setDate(e.target.value)} required />
                            </div>

                            <div className="sd-form-group" style={{ width: "100%" }}>
                                <label htmlFor="plan-description" className="sd-label">Descriere</label>
                                <textarea id="plan-description" className="sd-input sd-textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={1000} placeholder="Detalii despre antrenament (opțional)" />
                            </div>

                            <div className="sd-form-actions" style={{ width: "100%", justifyContent: "flex-end" }}>
                                <button type="button" onClick={closeForm} className="sd-btn-secondary">Anulează</button>
                                <button type="submit" className="sd-btn-primary" disabled={formLoading || teams.length === 0}>
                                    {formLoading ? "Se salvează..." : (editMode ? "Salvează modificările" : "Creează plan")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Tabel */}
            <div className="sd-box">
                <div className="sd-box-header">
                    <h2>Planuri de antrenament ({filtered.length})</h2>
                </div>
                <div className="sd-box-content" style={{ padding: 0 }}>
                    {filtered.length === 0 ? (
                        <div className="sd-empty-state">
                            <p>Nu există planuri de antrenament{filter !== "toate" ? ` de tip „${filter}"` : ""}.</p>
                            {!showForm && (
                                <button onClick={openCreateForm} className="sd-btn-primary" style={{ marginTop: "10px" }}>
                                    Creează primul plan
                                </button>
                            )}
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
                                        <td><strong>{plan.title}</strong></td>
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
                                                <button
                                                    onClick={() => openEditForm(plan)}
                                                    className="sd-btn-sm sd-btn-edit"
                                                >
                                                    Editează
                                                </button>
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

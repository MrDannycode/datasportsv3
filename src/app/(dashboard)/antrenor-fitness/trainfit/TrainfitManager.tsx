"use client"

import { useEffect, useRef, useState } from "react"
import FitnessPlanModal from "./FitnessPlanModal"
import { createPlan, updatePlan, deletePlan } from "./actions"

interface FitnessPlan {
    id: number
    createdBy: number
    title: string
    description: string | null
    type: "forta" | "rezistenta" | "vitezare" | "flexibilitate" | "coordonare"
    date: string
    createdAt: string
}

interface Props {
    initialPlans: FitnessPlan[]
    shouldOpenNewPlanModal?: boolean
}

const TYPE_LABELS: Record<string, string> = {
    forta: "Forta",
    rezistenta: "Rezistenta",
    vitezare: "Viteza",
    flexibilitate: "Flexibilitate",
    coordonare: "Coordonare",
}

const INPUT_STYLE = { border: "1px solid #ccc", padding: "6px 10px", fontSize: "13px" } as const
const LABEL_STYLE = { fontSize: "12px", fontWeight: "bold" } as const
const FIELD_STYLE = { display: "flex", flexDirection: "column" as const, gap: "4px" }

export default function TrainfitManager({ initialPlans, shouldOpenNewPlanModal = false }: Props) {
    const [plans, setPlans] = useState<FitnessPlan[]>(initialPlans)
    const [filter, setFilter] = useState<"toate" | "forta" | "rezistenta" | "vitezare" | "flexibilitate" | "coordonare">("toate")
    const [editMode, setEditMode] = useState(false)
    const [editId, setEditId] = useState<number | null>(null)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [type, setType] = useState<"forta" | "rezistenta" | "vitezare" | "flexibilitate" | "coordonare">("forta")
    const [date, setDate] = useState(new Date().toISOString().split("T")[0])
    const [formLoading, setFormLoading] = useState(false)
    const [formError, setFormError] = useState("")
    const [formSuccess, setFormSuccess] = useState("")
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
    const hasOpenedFromQueryRef = useRef(false)

    useEffect(() => {
        if (!shouldOpenNewPlanModal || hasOpenedFromQueryRef.current) {
            return
        }

        hasOpenedFromQueryRef.current = true
        setIsPlanModalOpen(true)
    }, [shouldOpenNewPlanModal])

    const filtered = filter === "toate" ? plans : plans.filter((plan) => plan.type === filter)

    function formatDate(iso: string) {
        return new Date(iso).toLocaleDateString("ro-RO")
    }

    function clearFormFields() {
        setEditMode(false)
        setEditId(null)
        setTitle("")
        setDescription("")
        setType("forta")
        setDate(new Date().toISOString().split("T")[0])
    }

    function resetForm() {
        clearFormFields()
        setFormError("")
        setFormSuccess("")
    }

    function closePlanModal() {
        setIsPlanModalOpen(false)
        resetForm()
    }

    function openEditForm(plan: FitnessPlan) {
        setEditMode(true)
        setEditId(plan.id)
        setTitle(plan.title)
        setDescription(plan.description ?? "")
        setType(plan.type)
        setDate(plan.date.split("T")[0])
        setFormError("")
        setFormSuccess("")
        setIsPlanModalOpen(true)
    }

    async function handleFormSubmit(e: React.FormEvent) {
        e.preventDefault()
        setFormLoading(true)
        setFormError("")
        setFormSuccess("")

        const payload = { title, description, type, date }

        try {
            if (editMode && editId !== null) {
                const result = await updatePlan(editId, payload)
                if (result?.error) throw new Error(result.error)

                if (result?.plan) {
                    setPlans((currentPlans) => currentPlans.map((plan) =>
                        plan.id === editId
                            ? {
                                ...result.plan,
                                date: result.plan.date.toISOString(),
                                createdAt: result.plan.createdAt.toISOString(),
                            } as FitnessPlan
                            : plan,
                    ))
                    clearFormFields()
                    setFormSuccess("Planul a fost actualizat cu succes.")
                    setIsPlanModalOpen(false)
                }
            } else {
                const result = await createPlan(payload)
                if (result?.error) throw new Error(result.error)

                if (result?.plan) {
                    const newPlan = {
                        ...result.plan,
                        date: result.plan.date.toISOString(),
                        createdAt: result.plan.createdAt.toISOString(),
                    } as FitnessPlan

                    setPlans((currentPlans) => [newPlan, ...currentPlans])
                    clearFormFields()
                    setFormSuccess("Planul a fost creat cu succes.")
                    setIsPlanModalOpen(false)
                }
            }
        } catch (error: unknown) {
            setFormError(error instanceof Error ? error.message : "Eroare necunoscuta")
        } finally {
            setFormLoading(false)
        }
    }

    async function handleDelete(id: number, planTitle: string) {
        if (!confirm(`Stergi planul "${planTitle}"?`)) return

        const result = await deletePlan(id)
        if (result.success) {
            setPlans((prev) => prev.filter((plan) => plan.id !== id))
        } else {
            alert(result.error ?? "Eroare la stergere")
        }
    }

    return (
        <>
            <div className="sd-box" style={{ marginBottom: "24px" }}>
                <div className="sd-box-header">
                    <h2>{editMode ? "Editeaza plan" : "Adauga plan nou"}</h2>
                </div>
                <div className="sd-box-content">
                    <form onSubmit={handleFormSubmit} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
                        <div style={{ ...FIELD_STYLE, flex: "1 1 180px" }}>
                            <label htmlFor="plan-title" style={LABEL_STYLE}>Titlu</label>
                            <input
                                id="plan-title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                maxLength={200}
                                placeholder="ex. Circuit forta tren inferior"
                                style={INPUT_STYLE}
                            />
                        </div>

                        <div style={{ ...FIELD_STYLE, flex: "1 1 160px" }}>
                            <label htmlFor="plan-type" style={LABEL_STYLE}>Tip</label>
                            <select
                                id="plan-type"
                                value={type}
                                onChange={(e) => setType(e.target.value as "forta" | "rezistenta" | "vitezare" | "flexibilitate" | "coordonare")}
                                required
                                style={{ ...INPUT_STYLE, backgroundColor: "#fff" }}
                            >
                                <option value="forta">Forta</option>
                                <option value="rezistenta">Rezistenta</option>
                                <option value="vitezare">Viteza</option>
                                <option value="flexibilitate">Flexibilitate</option>
                                <option value="coordonare">Coordonare</option>
                            </select>
                        </div>

                        <div style={{ ...FIELD_STYLE, flex: "1 1 140px" }}>
                            <label htmlFor="plan-date" style={LABEL_STYLE}>Data</label>
                            <input
                                id="plan-date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                style={INPUT_STYLE}
                            />
                        </div>

                        <div style={{ ...FIELD_STYLE, flex: "1 1 100%", width: "100%" }}>
                            <label htmlFor="plan-description" style={LABEL_STYLE}>Descriere</label>
                            <textarea
                                id="plan-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                maxLength={1000}
                                placeholder="Detalii despre planul de fitness (optional)"
                                style={{ ...INPUT_STYLE, width: "100%", resize: "vertical" }}
                            />
                        </div>

                        {editMode && (
                            <button
                                type="button"
                                onClick={resetForm}
                                style={{
                                    fontSize: "13px",
                                    border: "1px solid #ccc",
                                    color: "#333",
                                    backgroundColor: "#fff",
                                    padding: "7px 20px",
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                    alignSelf: "flex-end",
                                }}
                            >
                                Anuleaza
                            </button>
                        )}

                        <button
                            id="plan-submit"
                            type="submit"
                            disabled={formLoading}
                            style={{
                                backgroundColor: formLoading ? "#aaa" : "#0056b3",
                                color: "#fff",
                                border: "none",
                                padding: "7px 20px",
                                fontSize: "13px",
                                fontWeight: "bold",
                                cursor: formLoading ? "not-allowed" : "pointer",
                                alignSelf: "flex-end",
                            }}
                        >
                            {formLoading ? "Se salveaza..." : editMode ? "Salveaza modificarile" : "Creeaza plan"}
                        </button>
                    </form>

                    {formError && <p style={{ color: "#c00", fontSize: "12px", marginTop: "10px" }}>{formError}</p>}
                    {formSuccess && <p style={{ color: "#2a7a2a", fontSize: "12px", marginTop: "10px" }}>{formSuccess}</p>}
                </div>
            </div>

            <div className="sd-box">
                <div className="sd-box-header">
                    <h2>Planuri de fitness ({filtered.length})</h2>
                </div>
                <div className="sd-box-content" style={{ padding: 0 }}>
                    <table className="sd-table">
                        <thead>
                            <tr>
                                <th colSpan={6} style={{ padding: "7px 10px", textAlign: "left" }}>
                                    <div className="sd-toolbar" style={{ marginBottom: 0, flexWrap: "nowrap", gap: "8px" }}>
                                        {/* <span style={{ fontSize: "11px", fontWeight: "bold", color: "#555", whiteSpace: "nowrap" }}>
                                            Filtreaza dupa tip:
                                        </span> */}
                                        <div className="sd-filter-group" style={{ flexWrap: "nowrap", gap: "4px" }}>
                                            {(["toate", "forta", "rezistenta", "vitezare", "flexibilitate", "coordonare"] as const).map((currentFilter) => (
                                                <button
                                                    key={currentFilter}
                                                    type="button"
                                                    className={`sd-filter-btn${filter === currentFilter ? " active" : ""}`}
                                                    style={{ padding: "3px 8px", fontSize: "11px", whiteSpace: "nowrap" }}
                                                    aria-pressed={filter === currentFilter}
                                                    onClick={() => setFilter(currentFilter)}
                                                >
                                                    {currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </th>
                            </tr>
                            <tr>
                                <th>#</th>
                                <th>Titlu</th>
                                <th>Tip</th>
                                <th>Data</th>
                                <th>Descriere</th>
                                <th>Actiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((plan) => (
                                <tr key={plan.id}>
                                    <td style={{ color: "#999" }}>{plan.id}</td>
                                    <td>{plan.title}</td>
                                    <td>
                                        <span style={{ backgroundColor: "#e8f0fb", color: "#0056b3", padding: "2px 8px", fontSize: "11px", fontWeight: "bold", borderRadius: "2px" }}>
                                            {TYPE_LABELS[plan.type]}
                                        </span>
                                    </td>
                                    <td style={{ color: "#666", fontSize: "12px" }}>{formatDate(plan.date)}</td>
                                    <td style={{ color: "#666", fontSize: "12px" }}>{plan.description ?? "-"}</td>
                                    <td>
                                        <button
                                            onClick={() => openEditForm(plan)}
                                            style={{
                                                fontSize: "11px",
                                                border: "1px solid #0056b3",
                                                color: "#0056b3",
                                                backgroundColor: "transparent",
                                                padding: "2px 8px",
                                                cursor: "pointer",
                                                marginRight: "6px",
                                            }}
                                        >
                                            Editeaza
                                        </button>
                                        <button
                                            onClick={() => handleDelete(plan.id, plan.title)}
                                            style={{
                                                fontSize: "11px",
                                                border: "1px solid #c00",
                                                color: "#c00",
                                                backgroundColor: "transparent",
                                                padding: "2px 8px",
                                                cursor: "pointer",
                                            }}
                                        >
                                            Sterge
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center", color: "#999", padding: "20px" }}>
                                        Nu exista planuri de fitness.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isPlanModalOpen && (
                <FitnessPlanModal
                    editMode={editMode}
                    title={title}
                    description={description}
                    type={type}
                    date={date}
                    formLoading={formLoading}
                    formError={formError}
                    formSuccess={formSuccess}
                    onTitleChange={setTitle}
                    onDescriptionChange={setDescription}
                    onTypeChange={setType}
                    onDateChange={setDate}
                    onCancelEdit={resetForm}
                    onClose={closePlanModal}
                    onSubmit={handleFormSubmit}
                />
            )}
        </>
    )
}
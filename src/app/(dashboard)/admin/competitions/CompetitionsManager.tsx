"use client"

import { useEffect, useRef, useState } from "react"
import CompetitionCreateModal from "./CompetitionCreateModal"
import CompetitionEditModal from "./CompetitionEditModal"
import { createCompetition, deleteCompetition, updateCompetition } from "./actions"

type Competition = {
    id: number
    name: string
    sport: "fotbal" | "tenis"
    createdAt: Date
}

interface Props {
    initialCompetitions: Competition[]
    shouldOpenNewCompetitionModal?: boolean
}

export default function CompetitionsManager({ initialCompetitions, shouldOpenNewCompetitionModal = false }: Props) {
    const [competitions, setCompetitions] = useState<Competition[]>(initialCompetitions)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null)
    const [editError, setEditError] = useState("")
    const hasOpenedFromQueryRef = useRef(false)
    const [formData, setFormData] = useState<{ name: string, sport: "fotbal" | "tenis" }>({
        name: "",
        sport: "fotbal"
    })
    const [editFormData, setEditFormData] = useState<{ name: string, sport: "fotbal" | "tenis" }>({
        name: "",
        sport: "fotbal"
    })

    useEffect(() => {
        if (!shouldOpenNewCompetitionModal || hasOpenedFromQueryRef.current) {
            return
        }

        hasOpenedFromQueryRef.current = true
        setIsCreateModalOpen(true)
    }, [shouldOpenNewCompetitionModal])

    const resetForm = () => {
        setFormData({ name: "", sport: "fotbal" })
        setError("")
        setSuccess("")
    }

    const closeCreateModal = () => {
        setIsCreateModalOpen(false)
        setError("")
        setSuccess("")
    }

    const openEditModal = (competition: Competition) => {
        setEditingCompetition(competition)
        setEditFormData({ name: competition.name, sport: competition.sport })
        setEditError("")
        setError("")
        setSuccess("")
    }

    const closeEditModal = () => {
        setEditingCompetition(null)
        setEditFormData({ name: "", sport: "fotbal" })
        setEditError("")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        setSuccess("")

        try {
            const result = await createCompetition(formData)
            if (result?.competition) {
                setCompetitions(currentCompetitions => [result.competition, ...currentCompetitions])
            }
            setSuccess("Competitia a fost adaugata cu succes!")
            resetForm()
            setIsCreateModalOpen(false)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "A aparut o eroare.")
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingCompetition) return

        setLoading(true)
        setEditError("")
        setError("")
        setSuccess("")

        try {
            const result = await updateCompetition(editingCompetition.id, editFormData)
            if (result?.competition) {
                setCompetitions(currentCompetitions => currentCompetitions.map(competition => (
                    competition.id === result.competition.id ? result.competition : competition
                )))
            }
            setSuccess("Competitia a fost actualizata.")
            closeEditModal()
        } catch (err: unknown) {
            setEditError(err instanceof Error ? err.message : "A aparut o eroare la editare.")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Sigur doriti sa stergeti aceasta competitie?")) return
        setLoading(true)
        setError("")
        setSuccess("")
        try {
            await deleteCompetition(id)
            setCompetitions(currentCompetitions => currentCompetitions.filter(competition => competition.id !== id))
            setSuccess("Competitia a fost stearsa.")
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "A aparut o eroare la stergere.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="sd-box">
            <div className="sd-box-header">
                <h2>Adaugare Competitie Noua</h2>
            </div>
            <div className="sd-box-content">
                {error && <div style={{ color: "red", marginBottom: "10px", padding: "10px", background: "#fee", borderRadius: "5px" }}>{error}</div>}
                {success && <div style={{ color: "green", marginBottom: "10px", padding: "10px", background: "#efe", borderRadius: "5px" }}>{success}</div>}

                <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", alignItems: "flex-end", marginBottom: "30px", padding: "15px", border: "1px solid #ddd", borderRadius: "5px", background: "#f9f9f9" }}>
                    <div style={{ flex: 2 }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Nume Competitie</label>
                        <input
                            required
                            type="text"
                            placeholder="ex: Liga 1"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Sport</label>
                        <select
                            required
                            value={formData.sport}
                            onChange={e => setFormData({ ...formData, sport: e.target.value as "fotbal" | "tenis" })}
                            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                        >
                            <option value="fotbal">Fotbal</option>
                            <option value="tenis">Tenis</option>
                        </select>
                    </div>
                    <div>
                        <button disabled={loading} type="submit" style={{ padding: "9px 20px", background: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                            {loading ? "Se salveaza..." : "Adauga"}
                        </button>
                    </div>
                </form>

                <h3 style={{ marginBottom: "15px", fontSize: "16px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>Competitii Existente</h3>

                <div style={{ overflowX: "auto" }}>
                    <table className="sd-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nume Competitie</th>
                                <th>Sport</th>
                                <th>Data Crearii</th>
                                <th style={{ textAlign: "right" }}>Actiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {competitions.map(comp => (
                                <tr key={comp.id}>
                                    <td>#{comp.id}</td>
                                    <td style={{ fontWeight: "bold" }}>{comp.name}</td>
                                    <td>
                                        <span style={{
                                            padding: "3px 8px",
                                            borderRadius: "12px",
                                            fontSize: "12px",
                                            background: comp.sport === "fotbal" ? "#e6f7ff" : "#f6ffed",
                                            color: comp.sport === "fotbal" ? "#0050b3" : "#389e0d",
                                            border: `1px solid ${comp.sport === "fotbal" ? "#91d5ff" : "#b7eb8f"}`
                                        }}>
                                            {comp.sport === "fotbal" ? "Fotbal" : "Tenis"}
                                        </span>
                                    </td>
                                    <td>{new Date(comp.createdAt).toLocaleDateString("ro-RO")}</td>
                                    <td style={{ textAlign: "right" }}>
                                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                                            <button disabled={loading} type="button" onClick={() => openEditModal(comp)} style={{ padding: "4px 10px", cursor: "pointer", background: "#f0f7ff", color: "#0050b3", border: "1px solid #91d5ff", borderRadius: "3px" }}>Edit</button>
                                            <button disabled={loading} type="button" onClick={() => handleDelete(comp.id)} style={{ padding: "4px 10px", cursor: "pointer", background: "#fff0f0", color: "red", border: "1px solid #ffcccc", borderRadius: "3px" }}>Sterge</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {competitions.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", padding: "20px", color: "#666" }}>Nu exista nicio competitie adaugata.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingCompetition && (
                <CompetitionEditModal
                    name={editFormData.name}
                    sport={editFormData.sport}
                    loading={loading}
                    error={editError}
                    onNameChange={(value) => setEditFormData({ ...editFormData, name: value })}
                    onSportChange={(value) => setEditFormData({ ...editFormData, sport: value })}
                    onClose={closeEditModal}
                    onSubmit={handleEdit}
                />
            )}

            {isCreateModalOpen && (
                <CompetitionCreateModal
                    name={formData.name}
                    sport={formData.sport}
                    loading={loading}
                    error={error}
                    success={success}
                    onNameChange={(value) => setFormData({ ...formData, name: value })}
                    onSportChange={(value) => setFormData({ ...formData, sport: value })}
                    onClose={closeCreateModal}
                    onSubmit={handleSubmit}
                />
            )}
        </div>
    )
}
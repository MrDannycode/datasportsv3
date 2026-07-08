"use client"

import { useState } from "react"
import { createTeam, updateTeam, deleteTeam } from "./actions"

type Team = {
    id: number
    name: string
    stadium: string | null
    county: string | null
    country: string
    continent: string
}

type League = {
    id: number
    name: string
}

export default function TeamManager({
    initialTeams,
    leagues,
    assignedCountry,
    assignedContinent,
}: {
    initialTeams: Team[]
    leagues: League[]
    assignedCountry: string | null
    assignedContinent: string | null
}) {
    const [isEditing, setIsEditing] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const [formData, setFormData] = useState({
        name: "",
        stadium: "",
        county: "",
        country: assignedCountry ?? "",
        continent: assignedContinent ?? "",
    })

    const resetForm = () => {
        setFormData({
            name: "",
            stadium: "",
            county: "",
            country: assignedCountry ?? "",
            continent: assignedContinent ?? "",
        })
        setIsEditing(null)
        setError("")
    }

    const handleEdit = (team: Team) => {
        setIsEditing(team.id)
        setFormData({
            name: team.name,
            stadium: team.stadium ?? "",
            county: team.county ?? "",
            country: assignedCountry ?? team.country,
            continent: assignedContinent ?? team.continent,
        })
        setError("")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            if (isEditing) {
                await updateTeam(isEditing, formData)
            } else {
                await createTeam(formData)
            }
            resetForm()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "A aparut o eroare.")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Sigur doriti sa stergeti aceasta echipa? (Daca are meciuri asociate, stergerea poate esua.)")) return
        setLoading(true)
        try {
            await deleteTeam(id)
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "A aparut o eroare la stergere. Posibil ca echipa sa fie asociata cu alte inregistrari (meciuri, etc).")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="sd-box">
            <div className="sd-box-header">
                <h2>Gestionare Echipe Fotbal</h2>
            </div>
            <div className="sd-box-content">
                {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px", marginBottom: "20px", padding: "15px", border: "1px solid #ddd", borderRadius: "5px", background: "#f9f9f9" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Nume Echipa</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Stadion</label>
                        <input
                            type="text"
                            value={formData.stadium}
                            onChange={e => setFormData({ ...formData, stadium: e.target.value })}
                            style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Judet</label>
                        <input
                            type="text"
                            value={formData.county}
                            onChange={e => setFormData({ ...formData, county: e.target.value })}
                            style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Liga</label>
                        <select
                            required
                            value={formData.continent}
                            onChange={e => setFormData({ ...formData, continent: e.target.value })}
                            style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }}
                        >
                            <option value="">Selecteaza liga</option>
                            {assignedContinent && !leagues.some(league => league.name === assignedContinent) && (
                                <option value={assignedContinent}>{assignedContinent}</option>
                            )}
                            {leagues.map(league => (
                                <option key={league.id} value={league.name}>{league.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px", marginTop: "10px" }}>
                        <button disabled={loading} type="submit" style={{ padding: "8px 15px", background: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                            {isEditing ? "Salveaza Modificarile" : "Adauga Echipa"}
                        </button>
                        {isEditing && (
                            <button disabled={loading} type="button" onClick={resetForm} style={{ padding: "8px 15px", background: "#ccc", color: "#333", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                                Anuleaza
                            </button>
                        )}
                    </div>
                </form>

                <div style={{ overflowX: "auto" }}>
                    <table className="sd-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nume</th>
                                <th>Stadion</th>
                                <th>Judet</th>
                                <th>Liga</th>
                                <th>Actiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {initialTeams.map(team => (
                                <tr key={team.id}>
                                    <td>{team.id}</td>
                                    <td>{team.name}</td>
                                    <td>{team.stadium || "-"}</td>
                                    <td>{team.county || "-"}</td>
                                    <td>{team.continent}</td>
                                    <td>
                                        <button disabled={loading} onClick={() => handleEdit(team)} style={{ marginRight: "10px", padding: "4px 10px", cursor: "pointer", background: "#f0f0f0", border: "1px solid #ccc", borderRadius: "3px" }}>Editeaza</button>
                                        <button disabled={loading} onClick={() => handleDelete(team.id)} style={{ padding: "4px 10px", cursor: "pointer", background: "#fff0f0", color: "red", border: "1px solid #ffcccc", borderRadius: "3px" }}>Sterge</button>
                                    </td>
                                </tr>
                            ))}
                            {initialTeams.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center", padding: "15px", color: "#666" }}>Nu exista echipe adaugate.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

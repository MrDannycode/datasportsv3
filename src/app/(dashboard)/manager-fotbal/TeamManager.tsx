"use client"

import { useState } from "react"
import { createTeam, updateTeam, deleteTeam } from "./actions"

type Team = {
    id: number
    name: string
    country: string
    continent: string
}

export default function TeamManager({ 
    initialTeams 
}: { 
    initialTeams: Team[]
}) {
    const [isEditing, setIsEditing] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const [formData, setFormData] = useState({
        name: "",
        country: "",
        continent: ""
    })

    const resetForm = () => {
        setFormData({
            name: "",
            country: "",
            continent: ""
        })
        setIsEditing(null)
        setError("")
    }

    const handleEdit = (team: Team) => {
        setIsEditing(team.id)
        setFormData({
            name: team.name,
            country: team.country,
            continent: team.continent
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
        } catch (err: any) {
            setError(err.message || "A apărut o eroare.")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Sigur doriți să ștergeți această echipă? (Dacă are meciuri asociate, ștergerea poate eșua.)")) return
        setLoading(true)
        try {
            await deleteTeam(id)
        } catch (err: any) {
            alert(err.message || "A apărut o eroare la ștergere. Posibil ca echipa să fie asociată cu alte înregistrări (meciuri, etc).")
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
                
                <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px", padding: "15px", border: "1px solid #ddd", borderRadius: "5px", background: "#f9f9f9" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Nume Echipă</label>
                        <input 
                            required 
                            type="text" 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Țară</label>
                        <input 
                            required 
                            type="text" 
                            value={formData.country} 
                            onChange={e => setFormData({...formData, country: e.target.value})}
                            style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Continent</label>
                        <input 
                            required 
                            type="text" 
                            value={formData.continent} 
                            onChange={e => setFormData({...formData, continent: e.target.value})}
                            style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }}
                        />
                    </div>
                    
                    <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px", marginTop: "10px" }}>
                        <button disabled={loading} type="submit" style={{ padding: "8px 15px", background: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                            {isEditing ? "Salvează Modificările" : "Adaugă Echipă"}
                        </button>
                        {isEditing && (
                            <button disabled={loading} type="button" onClick={resetForm} style={{ padding: "8px 15px", background: "#ccc", color: "#333", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                                Anulează
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
                                <th>Țară</th>
                                <th>Continent</th>
                                <th>Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {initialTeams.map(team => (
                                <tr key={team.id}>
                                    <td>{team.id}</td>
                                    <td>{team.name}</td>
                                    <td>{team.country}</td>
                                    <td>{team.continent}</td>
                                    <td>
                                        <button disabled={loading} onClick={() => handleEdit(team)} style={{ marginRight: "10px", padding: "4px 10px", cursor: "pointer", background: "#f0f0f0", border: "1px solid #ccc", borderRadius: "3px" }}>Editează</button>
                                        <button disabled={loading} onClick={() => handleDelete(team.id)} style={{ padding: "4px 10px", cursor: "pointer", background: "#fff0f0", color: "red", border: "1px solid #ffcccc", borderRadius: "3px" }}>Șterge</button>
                                    </td>
                                </tr>
                            ))}
                            {initialTeams.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", padding: "15px", color: "#666" }}>Nu există echipe adăugate.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

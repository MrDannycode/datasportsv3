"use client"

import { useState } from "react"
import { createMatch, updateMatch, deleteMatch } from "./actions"

type Team = {
    id: number
    name: string
}

type Match = {
    id: number
    teamHomeId: number
    teamAwayId: number
    teamHome: Team
    teamAway: Team
    matchDate: Date
    location: string
    competitionId: number
    competition: { id: number, name: string }
    scoreHome: number | null
    scoreAway: number | null
}

export default function MatchManager({ 
    initialMatches, 
    teams,
    competitions
}: { 
    initialMatches: Match[], 
    teams: Team[],
    competitions: { id: number, name: string }[]
}) {
    const [isEditing, setIsEditing] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const [formData, setFormData] = useState({
        teamHomeId: "",
        teamAwayId: "",
        matchDate: "",
        location: "",
        competitionId: "",
        scoreHome: "",
        scoreAway: ""
    })

    const resetForm = () => {
        setFormData({
            teamHomeId: "",
            teamAwayId: "",
            matchDate: "",
            location: "",
            competitionId: "",
            scoreHome: "",
            scoreAway: ""
        })
        setIsEditing(null)
        setError("")
    }

    const handleEdit = (match: Match) => {
        setIsEditing(match.id)
        
        // Next.js passes dates from server components as string sometimes, let's make sure it's parsed
        const dateObj = new Date(match.matchDate)
        
        // Format to YYYY-MM-DDThh:mm for datetime-local input
        const year = dateObj.getFullYear()
        const month = String(dateObj.getMonth() + 1).padStart(2, '0')
        const day = String(dateObj.getDate()).padStart(2, '0')
        const hours = String(dateObj.getHours()).padStart(2, '0')
        const minutes = String(dateObj.getMinutes()).padStart(2, '0')
        
        setFormData({
            teamHomeId: match.teamHomeId.toString(),
            teamAwayId: match.teamAwayId.toString(),
            matchDate: `${year}-${month}-${day}T${hours}:${minutes}`,
            location: match.location,
            competitionId: match.competitionId.toString(),
            scoreHome: match.scoreHome?.toString() || "",
            scoreAway: match.scoreAway?.toString() || ""
        })
        setError("")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        if (formData.teamHomeId === formData.teamAwayId) {
            setError("Echipa gazdă și echipa oaspete trebuie să fie diferite.")
            setLoading(false)
            return
        }

        try {
            if (isEditing) {
                await updateMatch(isEditing, formData)
            } else {
                await createMatch(formData)
            }
            resetForm()
        } catch (err: any) {
            setError(err.message || "A apărut o eroare.")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Sigur doriți să ștergeți acest meci?")) return
        setLoading(true)
        try {
            await deleteMatch(id)
        } catch (err: any) {
            alert(err.message || "A apărut o eroare.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="sd-box">
            <div className="sd-box-header">
                <h2>Gestionare Meciuri Fotbal</h2>
            </div>
            <div className="sd-box-content">
                
                {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
                
                <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px", padding: "15px", border: "1px solid #ddd", borderRadius: "5px", background: "#f9f9f9" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Echipă Gazdă</label>
                        <select 
                            required 
                            value={formData.teamHomeId} 
                            onChange={e => setFormData({...formData, teamHomeId: e.target.value})}
                            style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }}
                        >
                            <option value="">-- Selectează --</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Echipă Oaspete</label>
                        <select 
                            required 
                            value={formData.teamAwayId} 
                            onChange={e => setFormData({...formData, teamAwayId: e.target.value})}
                            style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }}
                        >
                            <option value="">-- Selectează --</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Data și Ora</label>
                        <input 
                            required 
                            type="datetime-local" 
                            value={formData.matchDate} 
                            onChange={e => setFormData({...formData, matchDate: e.target.value})}
                            style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Locație</label>
                        <input 
                            required 
                            type="text" 
                            value={formData.location} 
                            onChange={e => setFormData({...formData, location: e.target.value})}
                            style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Competiție</label>
                        <select 
                            required 
                            value={formData.competitionId} 
                            onChange={e => setFormData({...formData, competitionId: e.target.value})}
                            style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }}
                        >
                            <option value="">-- Selectează --</option>
                            {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "5px" }}>Scor Gazdă</label>
                            <input 
                                type="number" 
                                value={formData.scoreHome} 
                                onChange={e => setFormData({...formData, scoreHome: e.target.value})}
                                style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "5px" }}>Scor Oaspete</label>
                            <input 
                                type="number" 
                                value={formData.scoreAway} 
                                onChange={e => setFormData({...formData, scoreAway: e.target.value})}
                                style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }}
                            />
                        </div>
                    </div>
                    
                    <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px", marginTop: "10px" }}>
                        <button disabled={loading} type="submit" style={{ padding: "8px 15px", background: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                            {isEditing ? "Salvează Modificările" : "Adaugă Meci"}
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
                                <th>Dată</th>
                                <th>Meci</th>
                                <th>Scor</th>
                                <th>Competiție</th>
                                <th>Locație</th>
                                <th>Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {initialMatches.map(match => (
                                <tr key={match.id}>
                                    <td>{new Date(match.matchDate).toLocaleDateString("ro-RO", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                    <td>{match.teamHome.name} vs {match.teamAway.name}</td>
                                    <td>{match.scoreHome !== null && match.scoreAway !== null ? `${match.scoreHome} - ${match.scoreAway}` : "-"}</td>
                                    <td>{match.competition?.name}</td>
                                    <td>{match.location}</td>
                                    <td>
                                        <button disabled={loading} onClick={() => handleEdit(match)} style={{ marginRight: "10px", padding: "4px 10px", cursor: "pointer", background: "#f0f0f0", border: "1px solid #ccc", borderRadius: "3px" }}>Editează</button>
                                        <button disabled={loading} onClick={() => handleDelete(match.id)} style={{ padding: "4px 10px", cursor: "pointer", background: "#fff0f0", color: "red", border: "1px solid #ffcccc", borderRadius: "3px" }}>Șterge</button>
                                    </td>
                                </tr>
                            ))}
                            {initialMatches.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center", padding: "15px", color: "#666" }}>Nu există meciuri programate.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

"use client"

import { useEffect, useRef, useState } from "react"
import MatchCreateModal from "./MatchCreateModal"
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

type MatchFormData = {
    teamHomeId: string
    teamAwayId: string
    matchDate: string
    location: string
    competitionId: string
    scoreHome: string
    scoreAway: string
}

interface Props {
    initialMatches: Match[]
    teams: Team[]
    competitions: { id: number, name: string }[]
    shouldOpenMatchModal?: boolean
}

export default function MatchManager({
    initialMatches,
    teams,
    competitions,
    shouldOpenMatchModal = false,
}: Props) {
    const [matches, setMatches] = useState<Match[]>(initialMatches)
    const [isEditing, setIsEditing] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [isMatchModalOpen, setIsMatchModalOpen] = useState(false)
    const hasOpenedFromQueryRef = useRef(false)
    const [formData, setFormData] = useState<MatchFormData>({
        teamHomeId: "",
        teamAwayId: "",
        matchDate: "",
        location: "",
        competitionId: "",
        scoreHome: "",
        scoreAway: ""
    })

    useEffect(() => {
        if (!shouldOpenMatchModal || hasOpenedFromQueryRef.current) {
            return
        }

        hasOpenedFromQueryRef.current = true
        setIsMatchModalOpen(true)
    }, [shouldOpenMatchModal])

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
        const dateObj = new Date(match.matchDate)
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
        setIsMatchModalOpen(true)
    }

    const updateField = (field: keyof MatchFormData, value: string) => {
        setFormData(current => ({ ...current, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        if (formData.teamHomeId === formData.teamAwayId) {
            setError("Echipa gazda si echipa oaspete trebuie sa fie diferite.")
            setLoading(false)
            return
        }

        try {
            if (isEditing) {
                await updateMatch(isEditing, formData)
                setMatches(currentMatches => currentMatches.map(match => match.id === isEditing ? {
                    ...match,
                    teamHomeId: Number(formData.teamHomeId),
                    teamAwayId: Number(formData.teamAwayId),
                    teamHome: teams.find(team => team.id === Number(formData.teamHomeId)) ?? match.teamHome,
                    teamAway: teams.find(team => team.id === Number(formData.teamAwayId)) ?? match.teamAway,
                    matchDate: new Date(formData.matchDate),
                    location: formData.location,
                    competitionId: Number(formData.competitionId),
                    competition: competitions.find(competition => competition.id === Number(formData.competitionId)) ?? match.competition,
                    scoreHome: formData.scoreHome === "" ? null : Number(formData.scoreHome),
                    scoreAway: formData.scoreAway === "" ? null : Number(formData.scoreAway),
                } : match))
            } else {
                await createMatch(formData)
                window.location.reload()
                return
            }
            resetForm()
            setIsMatchModalOpen(false)
        } catch (err: any) {
            setError(err.message || "A aparut o eroare.")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Sigur doriti sa stergeti acest meci?")) return
        setLoading(true)
        try {
            await deleteMatch(id)
            setMatches(currentMatches => currentMatches.filter(match => match.id !== id))
        } catch (err: any) {
            alert(err.message || "A aparut o eroare.")
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
                        <label style={{ display: "block", marginBottom: "5px" }}>Echipa Gazda</label>
                        <select required value={formData.teamHomeId} onChange={e => updateField("teamHomeId", e.target.value)} style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }}>
                            <option value="">-- Selecteaza --</option>
                            {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Echipa Oaspete</label>
                        <select required value={formData.teamAwayId} onChange={e => updateField("teamAwayId", e.target.value)} style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }}>
                            <option value="">-- Selecteaza --</option>
                            {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Data si Ora</label>
                        <input required type="datetime-local" value={formData.matchDate} onChange={e => updateField("matchDate", e.target.value)} style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }} />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Locatie</label>
                        <input required type="text" value={formData.location} onChange={e => updateField("location", e.target.value)} style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }} />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Competitie</label>
                        <select required value={formData.competitionId} onChange={e => updateField("competitionId", e.target.value)} style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }}>
                            <option value="">-- Selecteaza --</option>
                            {competitions.map(competition => <option key={competition.id} value={competition.id}>{competition.name}</option>)}
                        </select>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "5px" }}>Scor Gazda</label>
                            <input type="number" value={formData.scoreHome} onChange={e => updateField("scoreHome", e.target.value)} style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", marginBottom: "5px" }}>Scor Oaspete</label>
                            <input type="number" value={formData.scoreAway} onChange={e => updateField("scoreAway", e.target.value)} style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }} />
                        </div>
                    </div>

                    <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px", marginTop: "10px" }}>
                        <button disabled={loading} type="submit" style={{ padding: "8px 15px", background: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                            {isEditing ? "Salveaza modificarile" : "Adauga meci"}
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
                                <th>Data</th>
                                <th>Meci</th>
                                <th>Scor</th>
                                <th>Competitie</th>
                                <th>Locatie</th>
                                <th>Actiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matches.map(match => (
                                <tr key={match.id}>
                                    <td>{new Date(match.matchDate).toLocaleDateString("ro-RO", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                    <td>{match.teamHome.name} vs {match.teamAway.name}</td>
                                    <td>{match.scoreHome !== null && match.scoreAway !== null ? `${match.scoreHome} - ${match.scoreAway}` : "-"}</td>
                                    <td>{match.competition?.name}</td>
                                    <td>{match.location}</td>
                                    <td>
                                        <button disabled={loading} onClick={() => handleEdit(match)} style={{ marginRight: "10px", padding: "4px 10px", cursor: "pointer", background: "#f0f0f0", border: "1px solid #ccc", borderRadius: "3px" }}>Editeaza</button>
                                        <button disabled={loading} onClick={() => handleDelete(match.id)} style={{ padding: "4px 10px", cursor: "pointer", background: "#fff0f0", color: "red", border: "1px solid #ffcccc", borderRadius: "3px" }}>Sterge</button>
                                    </td>
                                </tr>
                            ))}
                            {matches.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center", padding: "15px", color: "#666" }}>Nu exista meciuri programate.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isMatchModalOpen && (
                <MatchCreateModal
                    formData={formData}
                    teams={teams}
                    competitions={competitions}
                    loading={loading}
                    error={error}
                    isEditing={isEditing !== null}
                    onChange={updateField}
                    onClose={() => { setIsMatchModalOpen(false); resetForm() }}
                    onSubmit={handleSubmit}
                />
            )}
        </div>
    )
}
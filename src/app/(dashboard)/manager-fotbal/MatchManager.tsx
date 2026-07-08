"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import MatchCreateModal from "./MatchCreateModal"
import MatchResultModal from "./MatchResultModal"
import { createMatch, updateMatch, deleteMatch, updateMatchResult } from "./actions"

type Team = {
    id: number
    name: string
    stadium: string | null
    country: string
    continent: string
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
    stage: string | null
    scoreHome: number | null
    scoreAway: number | null
}

type MatchFormData = {
    teamHomeId: string
    teamAwayId: string
    matchDate: string
    location: string
    competitionId: string
    stage: string
}

type MatchResultFormData = {
    stage: string
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
    const [resultMatch, setResultMatch] = useState<Match | null>(null)
    const [resultFormData, setResultFormData] = useState<MatchResultFormData>({ stage: "", scoreHome: "", scoreAway: "" })
    const hasOpenedFromQueryRef = useRef(false)
    const [formData, setFormData] = useState<MatchFormData>({
        teamHomeId: "",
        teamAwayId: "",
        matchDate: "",
        location: "",
        competitionId: "",
        stage: ""
    })

    const selectedCompetition = competitions.find(competition => competition.id === Number(formData.competitionId))
    const filteredTeams = selectedCompetition
        ? teams.filter(team => team.continent === selectedCompetition.name)
        : []

    const resultStageOptions = useMemo(() => {
        if (!resultMatch) return []

        const values = new Set<string>()
        for (const match of matches) {
            if (match.competitionId !== resultMatch.competitionId) continue
            const stage = match.stage?.trim()
            if (stage) values.add(stage)
        }

        return Array.from(values).sort((a, b) => a.localeCompare(b, "ro"))
    }, [matches, resultMatch])

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
            stage: ""
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
            stage: match.stage ?? ""
        })
        setError("")
        setIsMatchModalOpen(true)
    }

    const updateField = (field: keyof MatchFormData, value: string) => {
        setFormData(current => {
            if (field === "competitionId") {
                return { ...current, competitionId: value, teamHomeId: "", teamAwayId: "", location: "" }
            }

            if (field !== "teamHomeId") {
                return { ...current, [field]: value }
            }

            const homeTeam = teams.find(team => team.id === Number(value))
            return { ...current, teamHomeId: value, location: homeTeam?.stadium ?? "" }
        })
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
                    stage: formData.stage.trim() || null,
                } : match))
            } else {
                await createMatch(formData)
                window.location.reload()
                return
            }
            resetForm()
            setIsMatchModalOpen(false)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "A aparut o eroare.")
        } finally {
            setLoading(false)
        }
    }

    const openResultModal = (match: Match) => {
        setResultMatch(match)
        setResultFormData({
            stage: match.stage ?? "",
            scoreHome: match.scoreHome?.toString() ?? "",
            scoreAway: match.scoreAway?.toString() ?? "",
        })
        setError("")
    }

    const closeResultModal = () => {
        setResultMatch(null)
        setResultFormData({ stage: "", scoreHome: "", scoreAway: "" })
        setError("")
    }

    const updateResultField = (field: keyof MatchResultFormData, value: string) => {
        setResultFormData(current => ({ ...current, [field]: value }))
    }

    const handleResultSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!resultMatch) return

        setLoading(true)
        setError("")

        try {
            await updateMatchResult(resultMatch.id, resultFormData)
            setMatches(currentMatches => currentMatches.map(match => match.id === resultMatch.id ? {
                ...match,
                stage: resultFormData.stage.trim() || null,
                scoreHome: Number(resultFormData.scoreHome),
                scoreAway: Number(resultFormData.scoreAway),
            } : match))
            closeResultModal()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "A aparut o eroare.")
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
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "A aparut o eroare.")
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
                        <label style={{ display: "block", marginBottom: "5px" }}>Competitie</label>
                        <select required value={formData.competitionId} onChange={e => updateField("competitionId", e.target.value)} style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }}>
                            <option value="">-- Selecteaza --</option>
                            {competitions.map(competition => <option key={competition.id} value={competition.id}>{competition.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Etapa</label>
                        <input type="text" value={formData.stage} onChange={e => updateField("stage", e.target.value)} style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }} />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Echipa Gazda</label>
                        <select required value={formData.teamHomeId} onChange={e => updateField("teamHomeId", e.target.value)} disabled={!selectedCompetition} style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }}>
                            <option value="">{selectedCompetition ? "-- Selecteaza --" : "-- Selecteaza competitia --"}</option>
                            {filteredTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Echipa Oaspete</label>
                        <select required value={formData.teamAwayId} onChange={e => updateField("teamAwayId", e.target.value)} disabled={!selectedCompetition} style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }}>
                            <option value="">{selectedCompetition ? "-- Selecteaza --" : "-- Selecteaza competitia --"}</option>
                            {filteredTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Data si Ora</label>
                        <input required type="datetime-local" value={formData.matchDate} onChange={e => updateField("matchDate", e.target.value)} style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }} />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Stadion</label>
                        <input required type="text" value={formData.location} onChange={e => updateField("location", e.target.value)} style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }} />
                    </div>


                    <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px", marginTop: "10px" }}>
                        <button disabled={loading} type="submit" style={{ padding: "8px 15px", background: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                            {loading ? "Se salveaza..." : isEditing ? "Actualizeaza Meci" : "Adauga Meci"}
                        </button>
                        {isEditing && (
                            <button type="button" onClick={resetForm} style={{ padding: "8px 15px", background: "#666", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                                Anuleaza Editarea
                            </button>
                        )}
                    </div>
                </form>

                <table className="sd-table">
                    <thead>
                        <tr>
                            <th>Echipa Gazda</th>
                            <th>Echipa Oaspete</th>
                            <th>Data si Ora</th>
                            <th>Stadion</th>
                            <th>Competitie</th>
                            <th>Etapa</th>
                            <th>Scor</th>
                            <th>Actiuni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {matches.length > 0 ? matches.map((match) => (
                            <tr key={match.id}>
                                <td>{match.teamHome.name}</td>
                                <td>{match.teamAway.name}</td>
                                <td>{new Date(match.matchDate).toLocaleString()}</td>
                                <td>{match.location}</td>
                                <td>{match.competition.name}</td>
                                <td>{match.stage || '-'}</td>
                                <td>{match.scoreHome !== null && match.scoreAway !== null ? `${match.scoreHome} - ${match.scoreAway}` : '-'}</td>
                                <td style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    <button style={{ padding: "4px 8px" }} type="button" onClick={() => handleEdit(match)} disabled={loading}>Editeaza</button>
                                    <button style={{ padding: "4px 8px" }} type="button" onClick={() => openResultModal(match)} disabled={loading}>Adauga rezultat</button>
                                    <button style={{ padding: "4px 8px", backgroundColor: "red", color: "white" }} type="button" onClick={() => handleDelete(match.id)} disabled={loading}>Sterge</button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={8}>Nu exista meciuri adaugate.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
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
                    onClose={() => {
                        setIsMatchModalOpen(false)
                        resetForm()
                    }}
                    onSubmit={handleSubmit}
                />
            )}

            {resultMatch && (
                <MatchResultModal
                    matchLabel={`${resultMatch.teamHome.name} vs ${resultMatch.teamAway.name}`}
                    stageOptions={resultStageOptions}
                    formData={resultFormData}
                    loading={loading}
                    error={error}
                    onChange={updateResultField}
                    onClose={closeResultModal}
                    onSubmit={handleResultSubmit}
                />
            )}
        </div>
    )
}

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import MatchCreateModal from "./MatchCreateModal"
import MatchResultModal from "./MatchResultModal"
import { createMatch, updateMatch, deleteMatch, importMatches, updateMatchResult, type MatchImportResult } from "./actions"
import { normalizeFootballLeagueName } from "@/lib/football-league"
import { parseCsv } from "@/lib/csv"

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

type SortField = "teamHome" | "teamAway" | "matchDate" | "location" | "competition" | "stage" | "score"
type SortDirection = "asc" | "desc"
type MatchScoreFilter = "all" | "played" | "unplayed"

interface Props {
    initialMatches: Match[]
    teams: Team[]
    competitions: { id: number, name: string }[]
    shouldOpenMatchModal?: boolean
}

const sortButtonStyle = { background: "none", border: 0, padding: 0, color: "inherit", font: "inherit", fontWeight: 700, cursor: "pointer" } as const
const fieldStyle = { border: "1px solid #cbd5e1", borderRadius: "4px", padding: "8px 10px", fontSize: "13px", background: "#fff", minWidth: 0 }

export default function MatchManager({
    initialMatches,
    teams,
    competitions,
    shouldOpenMatchModal = false,
}: Props) {
    const [matches, setMatches] = useState<Match[]>(initialMatches)
    const [isEditing, setIsEditing] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [importLoading, setImportLoading] = useState(false)
    const [error, setError] = useState("")
    const [importError, setImportError] = useState("")
    const [importResults, setImportResults] = useState<MatchImportResult[]>([])
    const [isMatchModalOpen, setIsMatchModalOpen] = useState(false)
    const [resultMatch, setResultMatch] = useState<Match | null>(null)
    const [resultFormData, setResultFormData] = useState<MatchResultFormData>({ stage: "", scoreHome: "", scoreAway: "" })
    const [competitionFilter, setCompetitionFilter] = useState("all")
    const [stageFilter, setStageFilter] = useState("all")
    const [scoreFilter, setScoreFilter] = useState<MatchScoreFilter>("all")
    const [sortConfig, setSortConfig] = useState<{ field: SortField, direction: SortDirection }>({
        field: "matchDate",
        direction: "desc",
    })
    const hasOpenedFromQueryRef = useRef(false)
    const fileRef = useRef<HTMLInputElement>(null)
    const [formData, setFormData] = useState<MatchFormData>({
        teamHomeId: "",
        teamAwayId: "",
        matchDate: "",
        location: "",
        competitionId: "",
        stage: ""
    })

    const selectedCompetition = competitions.find(competition => competition.id === Number(formData.competitionId))
    const selectedLeague = selectedCompetition ? normalizeFootballLeagueName(selectedCompetition.name) : ""
    const filteredTeams = selectedCompetition
        ? teams.filter(team => normalizeFootballLeagueName(team.continent) === selectedLeague)
        : []

    const stageFilterOptions = useMemo(() => {
        const values = new Set<string>()

        for (const match of matches) {
            if (competitionFilter !== "all" && match.competitionId !== Number(competitionFilter)) continue
            const stage = match.stage?.trim()
            if (stage) values.add(stage)
        }

        return Array.from(values).sort((a, b) => a.localeCompare(b, "ro"))
    }, [competitionFilter, matches])

    const filteredMatches = useMemo(() => {
        return matches.filter(match => {
            const matchesCompetition = competitionFilter === "all" || match.competitionId === Number(competitionFilter)
            const normalizedStage = match.stage?.trim() || "-"
            const matchesStage = stageFilter === "all" || normalizedStage === stageFilter
            const isPlayed = match.scoreHome !== null && match.scoreAway !== null
            const matchesScore = scoreFilter === "all" || (scoreFilter === "played" ? isPlayed : !isPlayed)

            return matchesCompetition && matchesStage && matchesScore
        })
    }, [competitionFilter, matches, scoreFilter, stageFilter])

    const sortedMatches = useMemo(() => {
        const scoreValue = (match: Match) => {
            if (match.scoreHome === null || match.scoreAway === null) return Number.NEGATIVE_INFINITY
            return match.scoreHome * 1000 + match.scoreAway
        }

        return [...filteredMatches].sort((a, b) => {
            let result = 0

            switch (sortConfig.field) {
                case "teamHome":
                    result = a.teamHome.name.localeCompare(b.teamHome.name, "ro", { sensitivity: "base" })
                    break
                case "teamAway":
                    result = a.teamAway.name.localeCompare(b.teamAway.name, "ro", { sensitivity: "base" })
                    break
                case "matchDate":
                    result = new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
                    break
                case "location":
                    result = a.location.localeCompare(b.location, "ro", { sensitivity: "base" })
                    break
                case "competition":
                    result = a.competition.name.localeCompare(b.competition.name, "ro", { sensitivity: "base" })
                    break
                case "stage":
                    result = (a.stage || "-").localeCompare(b.stage || "-", "ro", { sensitivity: "base" })
                    break
                case "score":
                    result = scoreValue(a) - scoreValue(b)
                    break
            }

            if (result !== 0) {
                return sortConfig.direction === "asc" ? result : -result
            }

            return new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
        })
    }, [filteredMatches, sortConfig])

    const handleSort = (field: SortField) => {
        setSortConfig(current => ({
            field,
            direction: current.field === field && current.direction === "asc" ? "desc" : "asc",
        }))
    }

    const renderSortIndicator = (field: SortField) => {
        if (sortConfig.field !== field) {
            return "Sort"
        }

        if (field === "matchDate") {
            return sortConfig.direction === "asc" ? "Veche-Noua" : "Noua-Veche"
        }

        if (field === "score") {
            return sortConfig.direction === "asc" ? "Mic-Mare" : "Mare-Mic"
        }

        return sortConfig.direction === "asc" ? "A-Z" : "Z-A"
    }

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
        const month = String(dateObj.getMonth() + 1).padStart(2, "0")
        const day = String(dateObj.getDate()).padStart(2, "0")
        const hours = String(dateObj.getHours()).padStart(2, "0")
        const minutes = String(dateObj.getMinutes()).padStart(2, "0")

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

    async function submitCsv(file: File) {
        setImportLoading(true)
        setImportError("")
        setImportResults([])

        try {
            const records = parseCsv((await file.text()).replace(/^\uFEFF/, ""))
            const headers = records.shift()?.map(value => value.toLowerCase().trim()) ?? []
            const required = ["league", "teamhome", "teamaway", "matchdate", "location"]
            const missing = required.filter(name => !headers.includes(name))
            if (missing.length) throw new Error(`Lipsesc coloanele obligatorii: ${missing.join(", ")}.`)

            const value = (row: string[], name: string) => row[headers.indexOf(name)] ?? ""
            const rows = records.map(row => ({
                league: value(row, "league"),
                teamHome: value(row, "teamhome"),
                teamAway: value(row, "teamaway"),
                matchDate: value(row, "matchdate"),
                location: value(row, "location"),
                stage: value(row, "stage"),
                score: value(row, "scor"),
            }))
            if (!rows.length) throw new Error("Fisierul CSV nu contine meciuri.")

            setImportResults((await importMatches(rows)).results)
        } catch (reason) {
            setImportError(reason instanceof Error ? reason.message : "Importul a esuat.")
        } finally {
            setImportLoading(false)
            if (fileRef.current) fileRef.current.value = ""
        }
    }

    function downloadTemplate() {
        const csv = "League,teamHome,teamAway,matchDate,location,stage,Scor\nLiga 1,Echipa Gazda,Echipa Oaspete,2026-08-15T20:30,Stadion,Etapa 1,2-1"
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
        const link = document.createElement("a")
        link.href = url
        link.download = "model-import-meciuri.csv"
        link.click()
        URL.revokeObjectURL(url)
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
                <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ddd", borderRadius: "5px", background: "#f9f9f9" }}>
                    <h3 style={{ marginTop: 0, marginBottom: "8px" }}>Importa meciuri din CSV</h3>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button type="button" onClick={downloadTemplate} style={{ ...fieldStyle, cursor: "pointer" }}>Descarca model CSV</button>
                        <label style={{ ...fieldStyle, background: "#0056b3", color: "#fff", cursor: "pointer", fontWeight: 700 }}>
                            {importLoading ? "Se importa..." : "Alege fisier CSV"}
                            <input ref={fileRef} type="file" accept=".csv,text/csv" disabled={importLoading || loading} onChange={e => { const file = e.target.files?.[0]; if (file) void submitCsv(file) }} style={{ display: "none" }} />
                        </label>
                    </div>
                    {importError && <p style={{ color: "#b91c1c", fontSize: 13 }}>{importError}</p>}
                    {importResults.length > 0 && <div style={{ marginTop: 14, overflowX: "auto" }}><p style={{ fontSize: 13, fontWeight: 700 }}>Import finalizat: {importResults.filter(result => result.success).length} create, {importResults.filter(result => !result.success).length} respinse.</p><table className="sd-table"><thead><tr><th>Rand</th><th>Meci</th><th>Rezultat</th><th>ID / eroare</th></tr></thead><tbody>{importResults.map(result => <tr key={`${result.row}-${result.match}`}><td>{result.row}</td><td>{result.match}</td><td style={{ color: result.success ? "#166534" : "#b91c1c", fontWeight: 700 }}>{result.success ? "Creat" : "Respins"}</td><td>{result.id ?? result.error}</td></tr>)}</tbody></table></div>}
                </div>


                <div className="sd-table-toolbar">
                    <label htmlFor="match-competition-filter" className="sd-table-toolbar-label">Competitie</label>
                    <select
                        id="match-competition-filter"
                        value={competitionFilter}
                        onChange={e => {
                            setCompetitionFilter(e.target.value)
                            setStageFilter("all")
                        }}
                        className="sd-input"
                        style={{ minWidth: "180px" }}
                    >
                        <option value="all">Toate competitiile</option>
                        {competitions.map(competition => (
                            <option key={competition.id} value={competition.id.toString()}>{competition.name}</option>
                        ))}
                    </select>

                    <label htmlFor="match-stage-filter" className="sd-table-toolbar-label">Etapa</label>
                    <select
                        id="match-stage-filter"
                        value={stageFilter}
                        onChange={e => setStageFilter(e.target.value)}
                        className="sd-input"
                        style={{ minWidth: "150px" }}
                    >
                        <option value="all">Toate etapele</option>
                        <option value="-">Fara etapa</option>
                        {stageFilterOptions.map(stage => (
                            <option key={stage} value={stage}>{stage}</option>
                        ))}
                    </select>

                    <label htmlFor="match-score-filter" className="sd-table-toolbar-label">Scor</label>
                    <select
                        id="match-score-filter"
                        value={scoreFilter}
                        onChange={e => setScoreFilter(e.target.value as MatchScoreFilter)}
                        className="sd-input"
                        style={{ minWidth: "150px" }}
                    >
                        <option value="all">Toate</option>
                        <option value="played">Cu rezultat</option>
                        <option value="unplayed">Fara rezultat</option>
                    </select>
                </div>

                <table className="sd-table">
                    <thead>
                        <tr>
                            <th>
                                <button type="button" onClick={() => handleSort("teamHome")} aria-label="Sorteaza dupa echipa gazda" style={sortButtonStyle}>
                                    Echipa Gazda {renderSortIndicator("teamHome")}
                                </button>
                            </th>
                            <th>
                                <button type="button" onClick={() => handleSort("teamAway")} aria-label="Sorteaza dupa echipa oaspete" style={sortButtonStyle}>
                                    Echipa Oaspete {renderSortIndicator("teamAway")}
                                </button>
                            </th>
                            <th>
                                <button type="button" onClick={() => handleSort("matchDate")} aria-label="Sorteaza dupa data si ora" style={sortButtonStyle}>
                                    Data si Ora {renderSortIndicator("matchDate")}
                                </button>
                            </th>
                            <th>
                                <button type="button" onClick={() => handleSort("location")} aria-label="Sorteaza dupa stadion" style={sortButtonStyle}>
                                    Stadion {renderSortIndicator("location")}
                                </button>
                            </th>
                            <th>
                                <button type="button" onClick={() => handleSort("competition")} aria-label="Sorteaza dupa competitie" style={sortButtonStyle}>
                                    Competitie {renderSortIndicator("competition")}
                                </button>
                            </th>
                            <th>
                                <button type="button" onClick={() => handleSort("stage")} aria-label="Sorteaza dupa etapa" style={sortButtonStyle}>
                                    Etapa {renderSortIndicator("stage")}
                                </button>
                            </th>
                            <th>
                                <button type="button" onClick={() => handleSort("score")} aria-label="Sorteaza dupa scor" style={sortButtonStyle}>
                                    Scor {renderSortIndicator("score")}
                                </button>
                            </th>
                            <th>Actiuni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedMatches.length > 0 ? sortedMatches.map((match) => (
                            <tr key={match.id}>
                                <td>{match.teamHome.name}</td>
                                <td>{match.teamAway.name}</td>
                                <td>{new Date(match.matchDate).toLocaleString()}</td>
                                <td>{match.location}</td>
                                <td>{match.competition.name}</td>
                                <td>{match.stage || "-"}</td>
                                <td>{match.scoreHome !== null && match.scoreAway !== null ? `${match.scoreHome} - ${match.scoreAway}` : "-"}</td>
                                <td style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    <button style={{ padding: "4px 8px" }} type="button" onClick={() => handleEdit(match)} disabled={loading}>Editeaza</button>
                                    <button style={{ padding: "4px 8px" }} type="button" onClick={() => openResultModal(match)} disabled={loading}>Adauga rezultat</button>
                                    <button style={{ padding: "4px 8px", backgroundColor: "red", color: "white" }} type="button" onClick={() => handleDelete(match.id)} disabled={loading}>Sterge</button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={8}>Nu exista meciuri pentru filtrele selectate.</td>
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
                    homeTeamName={resultMatch.teamHome.name}
                    awayTeamName={resultMatch.teamAway.name}
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

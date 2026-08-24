"use client"

import { useMemo, useState } from "react"
import { deleteFootballPlayer, updateFootballPlayer } from "./athlete-actions"

type Team = {
    id: number
    name: string
}

type Player = {
    id: number
    firstName: string
    lastName: string
    position: string
    teamId: number | null
    team: Team | null
}

type SortField = "player" | "team" | "position"
type SortDirection = "asc" | "desc"

type EditForm = {
    firstName: string
    lastName: string
    position: string
    teamId: string
}

const positionOptions = ["portar", "fundas", "mijlocas", "atacant"]
const inputStyle = { padding: "5px", borderRadius: "3px", border: "1px solid #ccc", background: "#fff", minWidth: 0 }

export default function PlayerManager({
    players,
    teams
}: {
    players: Player[]
    teams: Team[]
}) {
    const [playerList, setPlayerList] = useState(players)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [successMsg, setSuccessMsg] = useState("")
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editForm, setEditForm] = useState<EditForm>({ firstName: "", lastName: "", position: "mijlocas", teamId: "" })
    const [positionFilter, setPositionFilter] = useState("")
    const [teamFilter, setTeamFilter] = useState("")
    const [sortConfig, setSortConfig] = useState<{ field: SortField, direction: SortDirection }>({
        field: "player",
        direction: "asc",
    })

    const filteredPlayers = useMemo(() => {
        return playerList.filter((player) => {
            const matchesPosition = !positionFilter || player.position === positionFilter
            const matchesTeam = !teamFilter || player.teamId?.toString() === teamFilter
            return matchesPosition && matchesTeam
        })
    }, [playerList, positionFilter, teamFilter])

    const sortedPlayers = useMemo(() => {
        return [...filteredPlayers].sort((a, b) => {
            const aValue = sortConfig.field === "player"
                ? `${a.firstName} ${a.lastName}`.trim()
                : sortConfig.field === "position"
                    ? a.position
                    : a.team?.name || "Nicio echipa"
            const bValue = sortConfig.field === "player"
                ? `${b.firstName} ${b.lastName}`.trim()
                : sortConfig.field === "position"
                    ? b.position
                    : b.team?.name || "Nicio echipa"
            const result = aValue.localeCompare(bValue, "ro", { sensitivity: "base" })

            if (result !== 0) {
                return sortConfig.direction === "asc" ? result : -result
            }

            const aName = `${a.firstName} ${a.lastName}`.trim()
            const bName = `${b.firstName} ${b.lastName}`.trim()

            return aName.localeCompare(bName, "ro", { sensitivity: "base" })
        })
    }, [filteredPlayers, sortConfig])

    const setTimedSuccess = (message: string) => {
        setSuccessMsg(message)
        setTimeout(() => setSuccessMsg(""), 3000)
    }

    const handleSort = (field: SortField) => {
        setSortConfig((current) => ({
            field,
            direction: current.field === field && current.direction === "asc" ? "desc" : "asc",
        }))
    }

    const renderSortIndicator = (field: SortField) => {
        if (sortConfig.field !== field) {
            return "Sort"
        }

        return sortConfig.direction === "asc" ? "A-Z" : "Z-A"
    }

    const updateLocalPlayer = (playerId: number, values: EditForm) => {
        const resolvedTeamId = values.teamId ? Number(values.teamId) : null
        const team = resolvedTeamId ? teams.find(item => item.id === resolvedTeamId) ?? null : null

        setPlayerList(current => current.map(player => player.id === playerId
            ? { ...player, firstName: values.firstName.trim(), lastName: values.lastName.trim(), position: values.position, teamId: resolvedTeamId, team }
            : player
        ))
    }

    const handleAssign = async (player: Player, teamId: string) => {
        setLoading(true)
        setError("")
        setSuccessMsg("")
        const values = { firstName: player.firstName, lastName: player.lastName, position: player.position, teamId }

        try {
            await updateFootballPlayer(player.id, values)
            updateLocalPlayer(player.id, values)
            setTimedSuccess("Jucatorul a fost actualizat cu succes.")
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "A aparut o eroare la salvare.")
        } finally {
            setLoading(false)
        }
    }

    const startEdit = (player: Player) => {
        setEditingId(player.id)
        setEditForm({
            firstName: player.firstName,
            lastName: player.lastName,
            position: player.position || "mijlocas",
            teamId: player.teamId ? player.teamId.toString() : "",
        })
        setError("")
        setSuccessMsg("")
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditForm({ firstName: "", lastName: "", position: "mijlocas", teamId: "" })
    }

    const saveEdit = async (playerId: number) => {
        setLoading(true)
        setError("")
        setSuccessMsg("")

        try {
            await updateFootballPlayer(playerId, editForm)
            updateLocalPlayer(playerId, editForm)
            cancelEdit()
            setTimedSuccess("Jucatorul a fost editat cu succes.")
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "A aparut o eroare la editare.")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (player: Player) => {
        if (!confirm(`Sigur vrei sa stergi jucatorul ${player.firstName} ${player.lastName}?`)) return

        setLoading(true)
        setError("")
        setSuccessMsg("")

        try {
            await deleteFootballPlayer(player.id)
            setPlayerList(current => current.filter(item => item.id !== player.id))
            setTimedSuccess("Jucatorul a fost sters cu succes.")
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "A aparut o eroare la stergere.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="sd-box">
            <div className="sd-box-header">
                <h2>Alocare Jucatori</h2>
            </div>
            <div className="sd-box-content">
                {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
                {successMsg && <div style={{ color: "green", marginBottom: "10px" }}>{successMsg}</div>}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 220px))", gap: "10px", marginBottom: "14px" }}>
                    <select value={positionFilter} onChange={(event) => setPositionFilter(event.target.value)} style={inputStyle}>
                        <option value="">Toate pozitiile</option>
                        {positionOptions.map(position => <option key={position} value={position}>{position}</option>)}
                    </select>
                    <select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)} style={inputStyle}>
                        <option value="">Toate echipele</option>
                        {teams.map(team => <option key={team.id} value={team.id.toString()}>{team.name}</option>)}
                    </select>
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table className="sd-table">
                        <thead>
                            <tr>
                                <th>
                                    <button type="button" onClick={() => handleSort("player")} aria-label="Sorteaza dupa numele jucatorului" style={{ background: "none", border: 0, padding: 0, color: "inherit", font: "inherit", fontWeight: 700, cursor: "pointer" }}>
                                        Nume Jucator {renderSortIndicator("player")}
                                    </button>
                                </th>
                                <th>
                                    <button type="button" onClick={() => handleSort("position")} aria-label="Sorteaza dupa pozitie" style={{ background: "none", border: 0, padding: 0, color: "inherit", font: "inherit", fontWeight: 700, cursor: "pointer" }}>
                                        Pozitie {renderSortIndicator("position")}
                                    </button>
                                </th>
                                <th>
                                    <button type="button" onClick={() => handleSort("team")} aria-label="Sorteaza dupa echipa curenta" style={{ background: "none", border: 0, padding: 0, color: "inherit", font: "inherit", fontWeight: 700, cursor: "pointer" }}>
                                        Echipa Curenta {renderSortIndicator("team")}
                                    </button>
                                </th>
                                <th>Alocare</th>
                                <th>Actiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedPlayers.map(player => {
                                const isEditing = editingId === player.id

                                return (
                                    <tr key={player.id}>
                                        <td>
                                            {isEditing ? (
                                                <div style={{ display: "grid", gridTemplateColumns: "minmax(120px, 1fr) minmax(120px, 1fr)", gap: "6px" }}>
                                                    <input disabled={loading} value={editForm.firstName} onChange={event => setEditForm(current => ({ ...current, firstName: event.target.value }))} style={inputStyle} />
                                                    <input disabled={loading} value={editForm.lastName} onChange={event => setEditForm(current => ({ ...current, lastName: event.target.value }))} style={inputStyle} />
                                                </div>
                                            ) : `${player.firstName} ${player.lastName}`}
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <select disabled={loading} value={editForm.position} onChange={event => setEditForm(current => ({ ...current, position: event.target.value }))} style={inputStyle}>
                                                    {positionOptions.map(position => <option key={position} value={position}>{position}</option>)}
                                                </select>
                                            ) : player.position}
                                        </td>
                                        <td>{player.team?.name || "Nicio echipa"}</td>
                                        <td>
                                            <select
                                                disabled={loading || isEditing}
                                                value={player.teamId ? player.teamId.toString() : ""}
                                                onChange={(event) => handleAssign(player, event.target.value)}
                                                style={{ ...inputStyle, cursor: "pointer" }}
                                            >
                                                <option value="">-- Fara echipa --</option>
                                                {teams.map(team => <option key={team.id} value={team.id.toString()}>{team.name}</option>)}
                                            </select>
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                                    <select disabled={loading} value={editForm.teamId} onChange={event => setEditForm(current => ({ ...current, teamId: event.target.value }))} style={inputStyle}>
                                                        <option value="">-- Fara echipa --</option>
                                                        {teams.map(team => <option key={team.id} value={team.id.toString()}>{team.name}</option>)}
                                                    </select>
                                                    <button disabled={loading} type="button" onClick={() => saveEdit(player.id)} style={{ padding: "4px 10px", cursor: "pointer", background: "#ecfdf5", color: "#166534", border: "1px solid #bbf7d0", borderRadius: "3px" }}>Salveaza</button>
                                                    <button disabled={loading} type="button" onClick={cancelEdit} style={{ padding: "4px 10px", cursor: "pointer", background: "#f0f0f0", border: "1px solid #ccc", borderRadius: "3px" }}>Anuleaza</button>
                                                </div>
                                            ) : (
                                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                                    <button disabled={loading} type="button" onClick={() => startEdit(player)} className="sd-btn-edit">Editeaza</button>
                                                    <button disabled={loading} type="button" onClick={() => handleDelete(player)} className="sd-btn-delete">Sterge</button>                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                            {sortedPlayers.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", padding: "15px", color: "#666" }}>
                                        {playerList.length === 0 ? "Nu exista jucatori inregistrati pentru tara ta." : "Nu exista jucatori care corespund filtrelor selectate."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
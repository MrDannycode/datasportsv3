"use client"

import { useMemo, useState } from "react"
import { assignPlayerToTeam } from "./actions"

type Team = {
    id: number
    name: string
}

type Player = {
    id: number
    firstName: string
    lastName: string
    teamId: number | null
    team: Team | null
}

type SortField = "player" | "team"
type SortDirection = "asc" | "desc"

export default function PlayerManager({ 
    players,
    teams
}: { 
    players: Player[]
    teams: Team[]
}) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [successMsg, setSuccessMsg] = useState("")
    const [sortConfig, setSortConfig] = useState<{ field: SortField, direction: SortDirection }>({
        field: "player",
        direction: "asc",
    })

    const sortedPlayers = useMemo(() => {
        return [...players].sort((a, b) => {
            const aValue = sortConfig.field === "player"
                ? `${a.firstName} ${a.lastName}`.trim()
                : a.team?.name || "Nicio echipă"
            const bValue = sortConfig.field === "player"
                ? `${b.firstName} ${b.lastName}`.trim()
                : b.team?.name || "Nicio echipă"
            const result = aValue.localeCompare(bValue, "ro", { sensitivity: "base" })

            if (result !== 0) {
                return sortConfig.direction === "asc" ? result : -result
            }

            const aName = `${a.firstName} ${a.lastName}`.trim()
            const bName = `${b.firstName} ${b.lastName}`.trim()

            return aName.localeCompare(bName, "ro", { sensitivity: "base" })
        })
    }, [players, sortConfig])

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

    const handleAssign = async (profileId: number, teamId: string) => {
        setLoading(true)
        setError("")
        setSuccessMsg("")
        try {
            await assignPlayerToTeam(profileId, teamId === "" ? null : teamId)
            setSuccessMsg("Jucătorul a fost actualizat cu succes.")
            // Clear message after 3 seconds
            setTimeout(() => setSuccessMsg(""), 3000)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "A apărut o eroare la salvare.")
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

                <div style={{ overflowX: "auto" }}>
                    <table className="sd-table">
                        <thead>
                            <tr>
                                <th>
                                    <button
                                        type="button"
                                        onClick={() => handleSort("player")}
                                        aria-label="Sorteaza dupa numele jucatorului"
                                        style={{ background: "none", border: 0, padding: 0, color: "inherit", font: "inherit", fontWeight: 700, cursor: "pointer" }}
                                    >
                                        Nume Jucator {renderSortIndicator("player")}
                                    </button>
                                </th>
                                <th>
                                    <button
                                        type="button"
                                        onClick={() => handleSort("team")}
                                        aria-label="Sorteaza dupa echipa curenta"
                                        style={{ background: "none", border: 0, padding: 0, color: "inherit", font: "inherit", fontWeight: 700, cursor: "pointer" }}
                                    >
                                        Echipa Curenta {renderSortIndicator("team")}
                                    </button>
                                </th>
                                <th>Actiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedPlayers.map(player => (
                                <tr key={player.id}>
                                    <td>{player.firstName} {player.lastName}</td>
                                    <td>{player.team?.name || "Nicio echipă"}</td>
                                    <td>
                                        <select 
                                            disabled={loading}
                                            value={player.teamId ? player.teamId.toString() : ""}
                                            onChange={(e) => handleAssign(player.id, e.target.value)}
                                            style={{ padding: "4px", borderRadius: "3px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
                                        >
                                            <option value="">-- Fără Echipă --</option>
                                            {teams.map(team => (
                                                <option key={team.id} value={team.id.toString()}>{team.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                            {players.length === 0 && (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: "center", padding: "15px", color: "#666" }}>Nu există jucători înregistrați.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

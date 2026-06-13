"use client"

import { useState } from "react"
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

    const handleAssign = async (profileId: number, teamId: string) => {
        setLoading(true)
        setError("")
        setSuccessMsg("")
        try {
            await assignPlayerToTeam(profileId, teamId === "" ? null : teamId)
            setSuccessMsg("Jucătorul a fost actualizat cu succes.")
            // Clear message after 3 seconds
            setTimeout(() => setSuccessMsg(""), 3000)
        } catch (err: any) {
            setError(err.message || "A apărut o eroare la salvare.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="sd-box">
            <div className="sd-box-header">
                <h2>Alocare Jucători</h2>
            </div>
            <div className="sd-box-content">
                
                {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
                {successMsg && <div style={{ color: "green", marginBottom: "10px" }}>{successMsg}</div>}

                <div style={{ overflowX: "auto" }}>
                    <table className="sd-table">
                        <thead>
                            <tr>
                                <th>Nume Jucător</th>
                                <th>Echipa Curentă</th>
                                <th>Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {players.map(player => (
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

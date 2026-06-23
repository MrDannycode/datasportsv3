"use client"

import { useEffect, useRef, useState } from "react"
import CoachAssignmentModal from "./CoachAssignmentModal"
import { assignAntrenorToTeam } from "./actions"

type Team = {
    id: number
    name: string
}

type Antrenor = {
    id: number
    firstName: string
    lastName: string
    teamId: number | null
    team: Team | null
}

interface Props {
    antrenori: Antrenor[]
    teams: Team[]
    shouldOpenCoachModal?: boolean
}

export default function AntrenorManager({
    antrenori,
    teams,
    shouldOpenCoachModal = false,
}: Props) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [successMsg, setSuccessMsg] = useState("")
    const [isCoachModalOpen, setIsCoachModalOpen] = useState(false)
    const hasOpenedFromQueryRef = useRef(false)

    useEffect(() => {
        if (!shouldOpenCoachModal || hasOpenedFromQueryRef.current) {
            return
        }

        hasOpenedFromQueryRef.current = true
        setIsCoachModalOpen(true)
    }, [shouldOpenCoachModal])

    const handleAssign = async (profileId: number, teamId: string) => {
        setLoading(true)
        setError("")
        setSuccessMsg("")
        try {
            await assignAntrenorToTeam(profileId, teamId === "" ? null : teamId)
            setSuccessMsg("Antrenorul a fost actualizat cu succes.")
            setTimeout(() => setSuccessMsg(""), 3000)
        } catch (err) {
            setError(err instanceof Error ? err.message : "A aparut o eroare la salvare.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="sd-box">
            <div className="sd-box-header">
                <h2>Alocare Antrenori</h2>
            </div>
            <div className="sd-box-content">
                {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
                {successMsg && <div style={{ color: "green", marginBottom: "10px" }}>{successMsg}</div>}

                <div style={{ overflowX: "auto" }}>
                    <table className="sd-table">
                        <thead>
                            <tr>
                                <th>Nume Antrenor</th>
                                <th>Echipa Curenta</th>
                                <th>Actiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {antrenori.map(antrenor => (
                                <tr key={antrenor.id}>
                                    <td>{antrenor.firstName} {antrenor.lastName}</td>
                                    <td>{antrenor.team?.name || "Nicio echipa"}</td>
                                    <td>
                                        <select
                                            disabled={loading}
                                            value={antrenor.teamId ? antrenor.teamId.toString() : ""}
                                            onChange={(e) => void handleAssign(antrenor.id, e.target.value)}
                                            style={{ padding: "4px", borderRadius: "3px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
                                        >
                                            <option value="">-- Fara Echipa --</option>
                                            {teams.map(team => (
                                                <option key={team.id} value={team.id.toString()}>{team.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                            {antrenori.length === 0 && (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: "center", padding: "15px", color: "#666" }}>Nu exista antrenori inregistrati.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isCoachModalOpen && (
                <CoachAssignmentModal
                    antrenori={antrenori}
                    teams={teams}
                    loading={loading}
                    error={error}
                    successMsg={successMsg}
                    onAssign={handleAssign}
                    onClose={() => setIsCoachModalOpen(false)}
                />
            )}
        </div>
    )
}
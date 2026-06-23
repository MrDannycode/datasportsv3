"use client"

import { useState } from "react"
import CoachAssignmentModal from "@/app/(dashboard)/manager-fotbal/CoachAssignmentModal"
import { assignAntrenorToTeam } from "@/app/(dashboard)/manager-fotbal/actions"

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
    label: string
    antrenori: Antrenor[]
    teams: Team[]
    isActive?: boolean
}

export default function CoachManagementNavButton({ label, antrenori, teams, isActive = false }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [successMsg, setSuccessMsg] = useState("")

    const closeModal = () => {
        setIsOpen(false)
        setError("")
        setSuccessMsg("")
    }

    const handleAssign = async (profileId: number, teamId: string) => {
        setLoading(true)
        setError("")
        setSuccessMsg("")
        try {
            await assignAntrenorToTeam(profileId, teamId === "" ? null : teamId)
            setSuccessMsg("Antrenorul a fost actualizat cu succes.")
            window.location.reload()
        } catch (err) {
            setError(err instanceof Error ? err.message : "A aparut o eroare la salvare.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={isActive ? "active" : ""}
                style={{
                    margin: "0 10px",
                    fontWeight: "bold",
                    color: "#555",
                    fontSize: "14px",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                }}
            >
                {label}
            </button>

            {isOpen && (
                <CoachAssignmentModal
                    antrenori={antrenori}
                    teams={teams}
                    loading={loading}
                    error={error}
                    successMsg={successMsg}
                    onAssign={handleAssign}
                    onClose={closeModal}
                />
            )}
        </>
    )
}
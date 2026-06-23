"use client"

import { useState } from "react"
import MatchCreateModal from "@/app/(dashboard)/manager-fotbal/MatchCreateModal"
import { createMatch } from "@/app/(dashboard)/manager-fotbal/actions"

type Team = { id: number; name: string }
type MatchFormData = {
    teamHomeId: string
    teamAwayId: string
    matchDate: string
    location: string
    competitionId: string
    scoreHome: string
    scoreAway: string
}

const emptyForm: MatchFormData = {
    teamHomeId: "",
    teamAwayId: "",
    matchDate: "",
    location: "",
    competitionId: "",
    scoreHome: "",
    scoreAway: "",
}

interface Props {
    label: string
    teams: Team[]
    competitions: { id: number, name: string }[]
    isActive?: boolean
}

export default function AddMatchNavButton({ label, teams, competitions, isActive = false }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [formData, setFormData] = useState<MatchFormData>(emptyForm)

    const updateField = (field: keyof MatchFormData, value: string) => {
        setFormData(current => ({ ...current, [field]: value }))
    }

    const closeModal = () => {
        setIsOpen(false)
        setError("")
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")

        if (formData.teamHomeId === formData.teamAwayId) {
            setError("Echipa gazda si echipa oaspete trebuie sa fie diferite.")
            setLoading(false)
            return
        }

        try {
            await createMatch(formData)
            setFormData(emptyForm)
            setIsOpen(false)
            window.location.reload()
        } catch (err: any) {
            setError(err.message || "A aparut o eroare.")
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
                <MatchCreateModal
                    formData={formData}
                    teams={teams}
                    competitions={competitions}
                    loading={loading}
                    error={error}
                    isEditing={false}
                    onChange={updateField}
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                />
            )}
        </>
    )
}
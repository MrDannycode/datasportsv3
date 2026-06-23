"use client"

import { useState } from "react"
import { createCompetition } from "@/app/(dashboard)/admin/competitions/actions"
import CompetitionCreateModal from "@/app/(dashboard)/admin/competitions/CompetitionCreateModal"

interface Props {
    label: string
    isActive?: boolean
}

export default function AddCompetitionNavButton({ label, isActive = false }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [name, setName] = useState("")
    const [sport, setSport] = useState<"fotbal" | "tenis">("fotbal")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const closeModal = () => {
        setIsOpen(false)
        setError("")
        setSuccess("")
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")
        setSuccess("")

        try {
            const result = await createCompetition({ name, sport })
            if (result?.competition) {
                setName("")
                setSport("fotbal")
                setIsOpen(false)
                window.location.reload()
            }
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
                <CompetitionCreateModal
                    name={name}
                    sport={sport}
                    loading={loading}
                    error={error}
                    success={success}
                    onNameChange={setName}
                    onSportChange={setSport}
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                />
            )}
        </>
    )
}
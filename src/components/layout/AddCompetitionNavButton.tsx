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
    const [country, setCountry] = useState("")
    const [continent, setContinent] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
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
            const result = await createCompetition({ name, sport, country, continent, startDate, endDate })
            if (result?.competition) {
                setName("")
                setSport("fotbal")
                setCountry("")
                setContinent("")
                setStartDate("")
                setEndDate("")
                setIsOpen(false)
                window.location.reload()
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "A aparut o eroare.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={`sd-nav-button${isActive ? " active" : ""}`}
            >
                {label}
            </button>

            {isOpen && (
                <CompetitionCreateModal
                    name={name}
                    sport={sport}
                    country={country}
                    continent={continent}
                    startDate={startDate}
                    endDate={endDate}
                    loading={loading}
                    error={error}
                    success={success}
                    onNameChange={setName}
                    onSportChange={setSport}
                    onCountryChange={setCountry}
                    onContinentChange={setContinent}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                />
            )}
        </>
    )
}

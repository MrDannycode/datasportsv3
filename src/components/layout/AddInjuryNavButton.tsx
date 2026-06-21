"use client"

import { useState } from "react"
import InjuryModal from "@/app/(dashboard)/medic/dosar-medical/InjuryModal"
import type { Athlete } from "@/app/(dashboard)/medic/dosar-medical/DosarManager"
import { getFootballAthletes } from "@/app/(dashboard)/medic/dosar-medical/actions"

interface Props {
    label: string
    isActive?: boolean
}

export default function AddInjuryNavButton({ label, isActive = false }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [athletes, setAthletes] = useState<Athlete[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const handleOpenClick = async () => {
        if (athletes.length > 0) {
            setIsOpen(true)
            return
        }

        setIsLoading(true)
        try {
            const data = await getFootballAthletes()
            setAthletes(data)
            setIsOpen(true)
        } catch (error) {
            console.error("Eroare la încărcarea atleților:", error)
            alert("Nu am putut încărca lista de atleți.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={handleOpenClick}
                className={isActive ? "active" : ""}
                disabled={isLoading}
                style={{
                    margin: "0 10px",
                    fontWeight: "bold",
                    color: "#555",
                    fontSize: "14px",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: isLoading ? "wait" : "pointer",
                    opacity: isLoading ? 0.7 : 1,
                }}
            >
                {isLoading ? "Se încarcă..." : label}
            </button>

            {isOpen && (
                <InjuryModal
                    athletes={athletes}
                    onClose={() => setIsOpen(false)}
                    onSuccess={() => {
                        setIsOpen(false)
                        window.location.reload()
                    }}
                />
            )}
        </>
    )
}

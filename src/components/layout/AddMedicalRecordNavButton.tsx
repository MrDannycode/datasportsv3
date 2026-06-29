"use client"

import { useState } from "react"
import DosarMedicalModal from "@/app/(dashboard)/medic/dosar-medical/DosarMedicalModal"
import type { Athlete } from "@/app/(dashboard)/medic/dosar-medical/DosarManager"
import { getFootballAthletes } from "@/app/(dashboard)/medic/dosar-medical/actions"

interface Props {
    label: string
    isActive?: boolean
}

export default function AddMedicalRecordNavButton({ label, isActive = false }: Props) {
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
                className={`sd-nav-button${isActive ? " active" : ""}`}
                disabled={isLoading}
            >
                {isLoading ? "Se încarcă..." : label}
            </button>

            {isOpen && (
                <DosarMedicalModal
                    editingRecord={null}
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

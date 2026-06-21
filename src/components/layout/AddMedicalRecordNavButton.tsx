"use client"

import { useState } from "react"
import DosarMedicalModal from "@/app/(dashboard)/medic/dosar-medical/DosarMedicalModal"
import type { Athlete } from "@/app/(dashboard)/medic/dosar-medical/DosarManager"

interface Props {
    athletes: Athlete[]
    isActive?: boolean
}

export default function AddMedicalRecordNavButton({ athletes, isActive = false }: Props) {
    const [isOpen, setIsOpen] = useState(false)

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
                Adauga Dosar
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

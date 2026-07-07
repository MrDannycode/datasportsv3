"use client"

import { useEffect, useMemo, useState } from "react"

export interface MedicInjuryHistoryItem {
    id: number
    athleteName: string
    diagnosis: string
    startDate: string
    endDate: string | null
    isAvailable: boolean
    injuryType: string
    bodyPart: string
    severity: string
    recoveryDays: number
    notes: string | null
}

interface Props {
    label: string
    records: MedicInjuryHistoryItem[]
}

const SEVERITY_LABELS: Record<string, string> = {
    usoara: "Usoara",
    medie: "Medie",
    grava: "Grava",
}

function formatDate(value: string | null) {
    if (!value) return "-"

    return new Date(value).toLocaleDateString("ro-RO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
}

export default function InjuryHistoryNavButton({ label, records }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const sortedRecords = useMemo(
        () => [...records].sort((first, second) => new Date(second.startDate).getTime() - new Date(first.startDate).getTime()),
        [records]
    )

    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpen(false)
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isOpen])

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="sd-nav-button"
            >
                {label}
            </button>

            {isOpen && (
                <div
                    className="sd-modal-overlay"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setIsOpen(false)
                    }}
                >
                    <section
                        className="sd-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="medic-injury-history-title"
                        style={{ maxWidth: 920, maxHeight: "82vh", overflowY: "auto" }}
                    >
                        <h3 id="medic-injury-history-title">Istoric Accidentari</h3>

                        {sortedRecords.length === 0 ? (
                            <p>Nu exista accidentari inregistrate pentru echipa ta.</p>
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <table className="sd-table" style={{ width: "100%" }}>
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Atlet</th>
                                            <th>Accidentare</th>
                                            <th>Zona</th>
                                            <th>Severitate</th>
                                            <th>Recuperare</th>
                                            <th>Status</th>
                                            <th>Note</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedRecords.map((record) => (
                                            <tr key={record.id}>
                                                <td>{formatDate(record.startDate)}</td>
                                                <td>{record.athleteName}</td>
                                                <td>
                                                    <strong style={{ display: "block" }}>{record.injuryType}</strong>
                                                    <span style={{ color: "#666", fontSize: 12 }}>{record.diagnosis}</span>
                                                </td>
                                                <td>{record.bodyPart}</td>
                                                <td>{SEVERITY_LABELS[record.severity] ?? record.severity}</td>
                                                <td>{record.recoveryDays} zile</td>
                                                <td>{record.isAvailable ? "Disponibil" : `Indisponibil pana la ${formatDate(record.endDate)}`}</td>
                                                <td>{record.notes ?? "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="sd-modal-actions" style={{ marginTop: 20 }}>
                            <button type="button" className="sd-btn-secondary" onClick={() => setIsOpen(false)}>
                                Inchide
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </>
    )
}

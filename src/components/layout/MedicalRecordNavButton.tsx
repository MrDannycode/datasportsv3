"use client"

import { useEffect, useState } from "react"

export interface AthleteMedicalInjury {
    id: number
    injuryType: string
    bodyPart: string
    severity: string
    recoveryDays: number
    notes: string | null
}

export interface AthleteMedicalRecord {
    id: number
    diagnosis: string
    treatment: string
    startDate: string
    endDate: string | null
    isAvailable: boolean
    medicName: string
    injuries: AthleteMedicalInjury[]
}

interface Props {
    label: string
    records: AthleteMedicalRecord[]
}

function formatDate(value: string | null) {
    if (!value) return "-"

    return new Date(value).toLocaleDateString("ro-RO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
}

function formatSeverity(value: string) {
    const labels: Record<string, string> = {
        usoara: "Usoara",
        medie: "Medie",
        grava: "Grava",
    }

    return labels[value] ?? value
}

export default function MedicalRecordNavButton({ label, records }: Props) {
    const [isOpen, setIsOpen] = useState(false)

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
                        aria-labelledby="athlete-medical-record-title"
                        style={{ maxWidth: 780, maxHeight: "82vh", overflowY: "auto" }}
                    >
                        <h3 id="athlete-medical-record-title">Dosar Medical</h3>

                        {records.length === 0 ? (
                            <p>Nu exista un dosar medical atribuit contului tau.</p>
                        ) : (
                            <div style={{ display: "grid", gap: 16 }}>
                                {records.map((record) => (
                                    <article
                                        key={record.id}
                                        style={{
                                            border: "1px solid #ccc",
                                            borderRadius: 4,
                                            padding: 14,
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
                                            <div>
                                                <strong style={{ display: "block", fontSize: 15 }}>{record.diagnosis}</strong>
                                                <span style={{ color: "#666", fontSize: 12 }}>Medic: {record.medicName}</span>
                                            </div>
                                            <span
                                                style={{
                                                    padding: "4px 8px",
                                                    borderRadius: 12,
                                                    fontSize: 12,
                                                    background: record.isAvailable ? "#e6f4ea" : "#fce8e6",
                                                    color: record.isAvailable ? "#1e8e3e" : "#d93025",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {record.isAvailable ? "Disponibil" : "Indisponibil"}
                                            </span>
                                        </div>

                                        <dl style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "8px 12px", margin: "0 0 12px" }}>
                                            <dt style={{ fontWeight: "bold" }}>Tratament</dt>
                                            <dd style={{ margin: 0 }}>{record.treatment}</dd>
                                            <dt style={{ fontWeight: "bold" }}>Perioada</dt>
                                            <dd style={{ margin: 0 }}>{formatDate(record.startDate)} - {formatDate(record.endDate)}</dd>
                                        </dl>

                                        {record.injuries.length > 0 && (
                                            <div style={{ overflowX: "auto" }}>
                                                <table className="sd-table" style={{ width: "100%" }}>
                                                    <thead>
                                                        <tr>
                                                            <th>Accidentare</th>
                                                            <th>Zona</th>
                                                            <th>Severitate</th>
                                                            <th>Recuperare</th>
                                                            <th>Note</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {record.injuries.map((injury) => (
                                                            <tr key={injury.id}>
                                                                <td>{injury.injuryType}</td>
                                                                <td>{injury.bodyPart}</td>
                                                                <td>{formatSeverity(injury.severity)}</td>
                                                                <td>{injury.recoveryDays} zile</td>
                                                                <td>{injury.notes ?? "-"}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </article>
                                ))}
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

"use client"

import { useEffect, useState } from "react"

export interface TeamAthlete {
    id: number
    firstName: string
    lastName: string
    email: string
    position: string
    jerseyNumber: number | null
    isAvailable: boolean
}

interface Props {
    label: string
    teamName: string | null
    athletes: TeamAthlete[]
}

export default function TeamAthletesNavButton({ label, teamName, athletes }: Props) {
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
                        aria-labelledby="team-athletes-title"
                        style={{ maxWidth: 680, maxHeight: "80vh", overflowY: "auto" }}
                    >
                        <h3 id="team-athletes-title">Toti Atletii</h3>

                        {!teamName ? (
                            <p>Contul tau nu este asociat unei echipe.</p>
                        ) : (
                            <>
                                <p>
                                    Echipa: <strong>{teamName}</strong> ({athletes.length} atleti)
                                </p>

                                {athletes.length === 0 ? (
                                    <p>Nu exista atleti asociati acestei echipe.</p>
                                ) : (
                                    <div style={{ overflowX: "auto", marginBottom: 20 }}>
                                        <table className="sd-table" style={{ width: "100%" }}>
                                            <thead>
                                                <tr>
                                                    <th>Atlet</th>
                                                    <th>Pozitie</th>
                                                    <th>Nr.</th>
                                                    <th>Disponibilitate</th>
                                                    <th>Email</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {athletes.map((athlete) => (
                                                    <tr key={athlete.id}>
                                                        <td>{athlete.firstName} {athlete.lastName}</td>
                                                        <td>{athlete.position}</td>
                                                        <td>{athlete.jerseyNumber ?? "-"}</td>
                                                        <td aria-label={athlete.isAvailable ? "Disponibil" : "Indisponibil"}>
                                                            {athlete.isAvailable ? "✓" : "x"}
                                                        </td>
                                                        <td>{athlete.email}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="sd-modal-actions">
                            <button type="button" className="sd-btn" onClick={() => setIsOpen(false)}>
                                Inchide
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </>
    )
}

"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { updateCoachAthlete, type CoachAthleteUpdateResult } from "@/app/(dashboard)/antrenor-fotbal/athlete-actions"
import type { TeamAthlete } from "@/components/layout/TeamAthletesNavButton"

type PositionValue = "portar" | "fundas" | "mijlocas" | "atacant"

const POSITION_LABELS: Record<PositionValue, string> = {
    portar: "Portar",
    fundas: "Fundas",
    mijlocas: "Mijlocas",
    atacant: "Atacant",
}

interface Props {
    label: string
    teamName: string | null
    athletes: TeamAthlete[]
}

export default function CoachAthleteManagementNavButton({ label, teamName, athletes }: Props) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [selectedAthleteId, setSelectedAthleteId] = useState<number | "">(athletes[0]?.id ?? "")
    const [position, setPosition] = useState<PositionValue>((athletes[0]?.position as PositionValue | undefined) ?? "mijlocas")
    const [jerseyNumber, setJerseyNumber] = useState<string>(athletes[0]?.jerseyNumber?.toString() ?? "")
    const [result, setResult] = useState<CoachAthleteUpdateResult | null>(null)
    const [busy, setBusy] = useState(false)


    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpen(false)
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isOpen])


    function selectAthlete(athleteId: number) {
        const athlete = athletes.find((item) => item.id === athleteId)
        setSelectedAthleteId(athleteId)
        if (!athlete) return

        setPosition(athlete.position as PositionValue)
        setJerseyNumber(athlete.jerseyNumber?.toString() ?? "")
        setResult(null)
    }
    async function submitUpdate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (selectedAthleteId === "") return

        setBusy(true)
        setResult(null)
        try {
            const updateResult = await updateCoachAthlete({
                athleteId: selectedAthleteId,
                position,
                jerseyNumber,
            })
            setResult(updateResult)
            if (updateResult.success) router.refresh()
        } finally {
            setBusy(false)
        }
    }

    return (
        <>
            <button type="button" onClick={() => setIsOpen(true)} className="sd-nav-button">
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
                        className="sd-modal coach-athlete-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="coach-athletes-title"
                        style={{ maxWidth: 560 }}
                    >
                        <h3 id="coach-athletes-title">Gestioneaza Atletii</h3>

                        {!teamName ? (
                            <p>Contul tau nu este asociat unei echipe.</p>
                        ) : athletes.length === 0 ? (
                            <p>Nu exista atleti asociati echipei {teamName}.</p>
                        ) : (
                            <form className="sd-form" onSubmit={submitUpdate}>
                                <div className="sd-form-group">
                                    <label className="sd-label" htmlFor="coach-athlete-select">Atlet</label>
                                    <select
                                        className="sd-input"
                                        id="coach-athlete-select"
                                        value={selectedAthleteId}
                                        onChange={(event) => selectAthlete(Number(event.target.value))}
                                        required
                                    >
                                        {athletes.map((athlete) => (
                                            <option key={athlete.id} value={athlete.id}>
                                                {athlete.firstName} {athlete.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="sd-form-group">
                                    <label className="sd-label" htmlFor="coach-athlete-position">Pozitie</label>
                                    <select
                                        className="sd-input"
                                        id="coach-athlete-position"
                                        value={position}
                                        onChange={(event) => setPosition(event.target.value as PositionValue)}
                                        required
                                    >
                                        {Object.entries(POSITION_LABELS).map(([value, text]) => (
                                            <option key={value} value={value}>
                                                {text}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="sd-form-group">
                                    <label className="sd-label" htmlFor="coach-athlete-jersey">Numar Tricou</label>
                                    <input
                                        className="sd-input"
                                        id="coach-athlete-jersey"
                                        type="number"
                                        min="1"
                                        max="99"
                                        value={jerseyNumber}
                                        onChange={(event) => setJerseyNumber(event.target.value)}
                                        placeholder="1-99"
                                    />
                                </div>

                                {result && (
                                    <p style={{ color: result.success ? "#166534" : "#991b1b" }}>
                                        {result.success ? "Atletul a fost actualizat." : result.error}
                                    </p>
                                )}

                                <div className="sd-form-actions">
                                    <button type="button" className="sd-btn-secondary" onClick={() => setIsOpen(false)}>
                                        Inchide
                                    </button>
                                    <button type="submit" className="sd-btn-primary" disabled={busy}>
                                        {busy ? "Se salveaza..." : "Salveaza"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </section>
                </div>
            )}
        </>
    )
}



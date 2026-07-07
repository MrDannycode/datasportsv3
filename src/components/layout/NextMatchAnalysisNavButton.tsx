"use client"

import { useState } from "react"
import { setNextMatchAnalysis } from "@/app/(dashboard)/actions/next-match-analysis"

type MatchDifficulty = "usor" | "mediu" | "greu"
type TeamFormation = "4-3-3" | "4-4-2" | "4-2-3-1" | "3-5-2" | "3-4-3" | "5-3-2"

const MATCH_DIFFICULTY_OPTIONS: { value: MatchDifficulty; label: string }[] = [
    { value: "usor", label: "Usor" },
    { value: "mediu", label: "Mediu" },
    { value: "greu", label: "Greu" },
]

const TEAM_FORMATION_OPTIONS: { value: TeamFormation; label: string }[] = [
    { value: "4-3-3", label: "4-3-3" },
    { value: "4-4-2", label: "4-4-2" },
    { value: "4-2-3-1", label: "4-2-3-1" },
    { value: "3-5-2", label: "3-5-2" },
    { value: "3-4-3", label: "3-4-3" },
    { value: "5-3-2", label: "5-3-2" },
]

const INPUT_STYLE = {
    border: "1px solid var(--sd-border)",
    backgroundColor: "var(--sd-box-bg)",
    color: "var(--sd-text)",
    padding: "8px 10px",
    fontSize: "13px",
} as const

export default function NextMatchAnalysisNavButton({
    label,
    isActive = false,
    nextMatch = "Nu exista meci programat",
    nextMatchId = null,
    initialMatchDifficulty = "mediu",
    initialTeamFormation = "4-3-3",
}: {
    label: string
    isActive?: boolean
    nextMatch?: string
    nextMatchId?: number | null
    initialMatchDifficulty?: MatchDifficulty
    initialTeamFormation?: TeamFormation
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [matchDifficulty, setMatchDifficulty] = useState<MatchDifficulty>(initialMatchDifficulty)
    const [teamFormation, setTeamFormation] = useState<TeamFormation>(initialTeamFormation)
    const [draftDifficulty, setDraftDifficulty] = useState<MatchDifficulty>(initialMatchDifficulty)
    const [draftFormation, setDraftFormation] = useState<TeamFormation>(initialTeamFormation)
    const [formLoading, setFormLoading] = useState(false)
    const [formError, setFormError] = useState("")

    function openModal() {
        setDraftDifficulty(matchDifficulty)
        setDraftFormation(teamFormation)
        setFormError("")
        setIsOpen(true)
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault()
        setFormLoading(true)
        setFormError("")

        try {
            const result = await setNextMatchAnalysis({
                matchId: nextMatchId,
                matchDifficulty: draftDifficulty,
                teamFormation: draftFormation,
            })

            if (result?.error) throw new Error(result.error)

            setMatchDifficulty(draftDifficulty)
            setTeamFormation(draftFormation)
            setIsOpen(false)
            window.location.reload()
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Eroare necunoscuta.")
        } finally {
            setFormLoading(false)
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={openModal}
                className={`sd-nav-button${isActive ? " active" : ""}`}
            >
                {label}
            </button>

            {isOpen ? (
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
                        aria-labelledby="next-match-analysis-modal-title"
                        style={{ maxWidth: 480 }}
                    >
                        <h3 id="next-match-analysis-modal-title">Next Match Analysis</h3>
                        <p>Selecteaza analiza pentru urmatorul meci.</p>

                        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }}>
                            <div style={{ display: "grid", gap: "6px" }}>
                                <div className="sd-metric-title">Next Match</div>
                                <strong>{nextMatch}</strong>
                            </div>

                            <label style={{ display: "grid", gap: "6px", fontSize: "12px", fontWeight: "bold" }}>
                                Match Difficulty
                                <select
                                    value={draftDifficulty}
                                    onChange={(event) => setDraftDifficulty(event.target.value as MatchDifficulty)}
                                    style={INPUT_STYLE}
                                >
                                    {MATCH_DIFFICULTY_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label style={{ display: "grid", gap: "6px", fontSize: "12px", fontWeight: "bold" }}>
                                Team Formation
                                <select
                                    value={draftFormation}
                                    onChange={(event) => setDraftFormation(event.target.value as TeamFormation)}
                                    style={INPUT_STYLE}
                                >
                                    {TEAM_FORMATION_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <div style={{ display: "grid", gap: "6px", color: "#64748b", fontSize: "12px" }}>
                                <span>Dificultate selectata: <strong>{matchDifficulty}</strong></span>
                                <span>Formatie selectata: <strong>{teamFormation}</strong></span>
                            </div>

                            {formError ? <p style={{ margin: 0, color: "#f87171" }}>{formError}</p> : null}

                            <div className="sd-modal-actions">
                                <button type="button" className="sd-btn-secondary" onClick={() => setIsOpen(false)}>
                                    Inchide
                                </button>
                                <button type="submit" className="sd-btn" disabled={formLoading}>
                                    {formLoading ? "Se salveaza..." : "Salveaza"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            ) : null}
        </>
    )
}

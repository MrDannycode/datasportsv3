"use client"

import { useMemo, useState } from "react"
import { updateMatchResult } from "@/app/(dashboard)/manager-fotbal/actions"
import BaseModal, { ModalActions, modalInputStyle } from "@/components/base-modal"


type MatchOption = {
    id: number
    competitionId: number
    competition: { name: string }
    stage: string | null
    scoreHome: number | null
    scoreAway: number | null
    teamHome: { name: string }
    teamAway: { name: string }
}

type ResultFormData = {
    competitionId: string
    matchId: string
    stage: string
    scoreHome: string
    scoreAway: string
}

const emptyForm: ResultFormData = {
    competitionId: "",
    matchId: "",
    stage: "",
    scoreHome: "",
    scoreAway: "",
}

const fieldStyle = {
    ...modalInputStyle,
    width: "100%",
    padding: "8px",
}

interface Props {
    label: string
    matches: MatchOption[]
    isActive?: boolean
}

export default function AddMatchResultNavButton({ label, matches, isActive = false }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [formData, setFormData] = useState<ResultFormData>(emptyForm)

    const selectedMatch = useMemo(
        () => matches.find(match => match.id === Number(formData.matchId)) ?? null,
        [formData.matchId, matches]
    )

    const competitions = useMemo(() => {
        const seen = new Map<number, string>()

        for (const match of matches) {
            seen.set(match.competitionId, match.competition.name)
        }

        return Array.from(seen.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [matches])

    const competitionMatches = useMemo(
        () => matches.filter(match => match.competitionId === Number(formData.competitionId)),
        [formData.competitionId, matches]
    )

    const stageOptions = useMemo(() => {
        const values = new Set<string>()

        for (const match of competitionMatches) {
            const stage = match.stage?.trim()
            if (stage) values.add(stage)
        }

        return Array.from(values).sort((a, b) => a.localeCompare(b, "ro"))
    }, [competitionMatches])

    const filteredMatches = useMemo(
        () => competitionMatches.filter(match => (match.stage?.trim() ?? "") === formData.stage),
        [competitionMatches, formData.stage]
    )

    const updateField = (field: keyof ResultFormData, value: string) => {
        if (field === "competitionId") {
            setFormData(current => ({
                ...current,
                competitionId: value,
                matchId: "",
                stage: "",
                scoreHome: "",
                scoreAway: "",
            }))
            return
        }

        if (field === "stage") {
            setFormData(current => ({
                ...current,
                stage: value,
                matchId: "",
                scoreHome: "",
                scoreAway: "",
            }))
            return
        }

        if (field === "matchId") {
            const match = matches.find(item => item.id === Number(value))
            setFormData({
                competitionId: match?.competitionId.toString() ?? formData.competitionId,
                matchId: value,
                stage: match?.stage ?? formData.stage,
                scoreHome: match?.scoreHome?.toString() ?? "",
                scoreAway: match?.scoreAway?.toString() ?? "",
            })
            return
        }

        setFormData(current => ({ ...current, [field]: value }))
    }

    const closeModal = () => {
        setIsOpen(false)
        setError("")
        setFormData(emptyForm)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            await updateMatchResult(Number(formData.matchId), {
                stage: formData.stage,
                scoreHome: formData.scoreHome,
                scoreAway: formData.scoreAway,
            })
            closeModal()
            window.location.reload()
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
                <BaseModal
                    modalId="match-result-nav-modal-title"
                    title="Adauga rezultat Meci"
                    subtitle={selectedMatch ? `${selectedMatch.teamHome.name} vs ${selectedMatch.teamAway.name}` : "Selecteaza competitia, apoi etapa si meciul pentru care adaugi rezultatul."}
                    maxWidth="680px"
                    onClose={closeModal}
                >
                    {error && <div style={{ color: "#f87171", marginBottom: "10px" }}>{error}</div>}

                    <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={{ display: "block", marginBottom: "5px" }}>Competitie</label>
                            <select
                                required
                                value={formData.competitionId}
                                onChange={event => updateField("competitionId", event.target.value)}
                                style={fieldStyle}
                            >
                                <option value="">-- Selecteaza --</option>
                                {competitions.map(competition => (
                                    <option key={competition.id} value={competition.id}>{competition.name}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={{ display: "block", marginBottom: "5px" }}>Etapa</label>
                            <select
                                required
                                value={formData.stage}
                                onChange={event => updateField("stage", event.target.value)}
                                disabled={!formData.competitionId}
                                style={fieldStyle}
                            >
                                <option value="">{formData.competitionId ? "-- Selecteaza --" : "-- Selecteaza competitia --"}</option>
                                {stageOptions.map(stage => (
                                    <option key={stage} value={stage}>{stage}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={{ display: "block", marginBottom: "5px" }}>Meci</label>
                            <select
                                required
                                value={formData.matchId}
                                onChange={event => updateField("matchId", event.target.value)}
                                disabled={!formData.stage}
                                style={fieldStyle}
                            >
                                <option value="">{formData.stage ? "-- Selecteaza --" : "-- Selecteaza etapa --"}</option>
                                {filteredMatches.map(match => (
                                    <option key={match.id} value={match.id}>{match.teamHome.name} vs {match.teamAway.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px" }}>Scor Gazda</label>
                            <input
                                required
                                min="0"
                                type="number"
                                value={formData.scoreHome}
                                onChange={event => updateField("scoreHome", event.target.value)}
                                style={fieldStyle}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px" }}>Scor Oaspete</label>
                            <input
                                required
                                min="0"
                                type="number"
                                value={formData.scoreAway}
                                onChange={event => updateField("scoreAway", event.target.value)}
                                style={fieldStyle}
                            />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <ModalActions
                                onClose={closeModal}
                                loading={loading}
                                submitLabel="Adaugă rezultat meci"
                                loadingLabel="Se salvează..."
                                cancelLabel="Închide"
                            />
                        </div>
                    </form>
                </BaseModal>
            )}
        </>
    )
}

"use client"

import BaseModal, { modalInputStyle } from "@/components/base-modal"

type MatchResultFormData = {
    stage: string
    scoreHome: string
    scoreAway: string
}

const fieldStyle = {
    ...modalInputStyle,
    width: "100%",
    padding: "8px",
}

interface Props {
    matchLabel: string
    homeTeamName: string
    awayTeamName: string
    formData: MatchResultFormData
    loading: boolean
    error: string
    onChange: (field: keyof MatchResultFormData, value: string) => void
    onClose: () => void
    onSubmit: (e: React.FormEvent) => Promise<void>
}

export default function MatchResultModal({ matchLabel, homeTeamName, awayTeamName, formData, loading, error, onChange, onClose, onSubmit }: Props) {
    return (
        <BaseModal
            modalId="match-result-modal-title"
            title="Adauga rezultat Meci"
            subtitle={matchLabel}
            maxWidth="620px"
            onClose={onClose}
        >
            {error && <div style={{ color: "#f87171", marginBottom: "10px" }}>{error}</div>}

            <form onSubmit={onSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                    <label style={{ display: "block", marginBottom: "5px" }}>{homeTeamName}</label>
                    <input
                        required
                        min="0"
                        type="number"
                        value={formData.scoreHome}
                        onChange={e => onChange("scoreHome", e.target.value)}
                        style={fieldStyle}
                    />
                </div>
                <div>
                    <label style={{ display: "block", marginBottom: "5px" }}>{awayTeamName}</label>
                    <input
                        required
                        min="0"
                        type="number"
                        value={formData.scoreAway}
                        onChange={e => onChange("scoreAway", e.target.value)}
                        style={fieldStyle}
                    />
                </div>

                <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                    <button type="button" onClick={onClose} style={{ padding: "8px 15px", background: "var(--sd-box-bg)", color: "var(--sd-text)", border: "1px solid var(--sd-border)", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                        Inchide
                    </button>
                    <button disabled={loading} type="submit" style={{ padding: "8px 15px", background: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                        {loading ? "Se salveaza..." : "Salveaza rezultat"}
                    </button>
                </div>
            </form>
        </BaseModal>
    )
}

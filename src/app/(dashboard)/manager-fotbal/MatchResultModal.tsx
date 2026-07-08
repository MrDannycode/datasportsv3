"use client"

type MatchResultFormData = {
    stage: string
    scoreHome: string
    scoreAway: string
}

const fieldStyle = {
    width: "100%",
    padding: "8px",
    borderRadius: "3px",
    border: "1px solid var(--sd-border)",
    background: "var(--sd-box-bg)",
    color: "var(--sd-text)",
}

interface Props {
    matchLabel: string
    stageOptions: string[]
    formData: MatchResultFormData
    loading: boolean
    error: string
    onChange: (field: keyof MatchResultFormData, value: string) => void
    onClose: () => void
    onSubmit: (e: React.FormEvent) => Promise<void>
}

export default function MatchResultModal({ matchLabel, stageOptions, formData, loading, error, onChange, onClose, onSubmit }: Props) {
    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="match-result-modal-title"
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                zIndex: 1000,
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: "100%",
                    maxWidth: "620px",
                    backgroundColor: "var(--sd-box-bg)",
                    color: "var(--sd-text)",
                    border: "1px solid var(--sd-border)",
                    borderRadius: "8px",
                    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.18)",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "18px 22px",
                        borderBottom: "1px solid var(--sd-border)",
                    }}
                >
                    <div>
                        <h2 id="match-result-modal-title" style={{ margin: 0 }}>Adauga rezultat Meci</h2>
                        <p style={{ margin: "6px 0 0", color: "color-mix(in srgb, var(--sd-text) 68%, transparent)", fontSize: "13px" }}>
                            {matchLabel}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ border: "none", background: "transparent", fontSize: "24px", lineHeight: 1, cursor: "pointer", color: "var(--sd-text)" }}
                        aria-label="Inchide"
                    >
                        x
                    </button>
                </div>

                <div style={{ padding: "22px" }}>
                    {error && <div style={{ color: "#f87171", marginBottom: "10px" }}>{error}</div>}

                    <form onSubmit={onSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={{ display: "block", marginBottom: "5px" }}>Etapa</label>
                            <select
                                required
                                value={formData.stage}
                                onChange={e => onChange("stage", e.target.value)}
                                style={fieldStyle}
                            >
                                <option value="">-- Selecteaza --</option>
                                {stageOptions.map(stage => (
                                    <option key={stage} value={stage}>{stage}</option>
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
                                onChange={e => onChange("scoreHome", e.target.value)}
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
                </div>
            </div>
        </div>
    )
}

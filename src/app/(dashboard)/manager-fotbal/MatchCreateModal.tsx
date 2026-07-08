"use client"

type Team = {
    id: number
    name: string
    country: string
    continent: string
}

type MatchFormData = {
    teamHomeId: string
    teamAwayId: string
    matchDate: string
    location: string
    competitionId: string
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
    formData: MatchFormData
    teams: Team[]
    competitions: { id: number, name: string }[]
    loading: boolean
    error: string
    isEditing: boolean
    onChange: (field: keyof MatchFormData, value: string) => void
    onClose: () => void
    onSubmit: (e: React.FormEvent) => Promise<void>
}

export default function MatchCreateModal({ formData, teams, competitions, loading, error, isEditing, onChange, onClose, onSubmit }: Props) {
    const selectedCompetition = competitions.find(competition => competition.id === Number(formData.competitionId))
    const filteredTeams = selectedCompetition
        ? teams.filter(team => team.continent === selectedCompetition.name)
        : []

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="match-modal-title"
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
                    maxWidth: "960px",
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
                        <h2 id="match-modal-title" style={{ margin: 0 }}>{isEditing ? "Editeaza meci" : "Adauga meci"}</h2>
                        <p style={{ margin: "6px 0 0", color: "color-mix(in srgb, var(--sd-text) 68%, transparent)", fontSize: "13px" }}>
                            Configureaza rapid un meci nou pentru calendarul echipei.
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
                        <div>
                            <label style={{ display: "block", marginBottom: "5px" }}>Competitie</label>
                            <select
                                required
                                value={formData.competitionId}
                                onChange={e => onChange("competitionId", e.target.value)}
                                style={fieldStyle}
                            >
                                <option value="">-- Selecteaza --</option>
                                {competitions.map(competition => <option key={competition.id} value={competition.id}>{competition.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px" }}>Etapa</label>
                            <input
                                type="text"
                                value={formData.stage}
                                onChange={e => onChange("stage", e.target.value)}
                                style={fieldStyle}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px" }}>Echipa Gazda</label>
                            <select
                                required
                                value={formData.teamHomeId}
                                onChange={e => onChange("teamHomeId", e.target.value)}
                                disabled={!selectedCompetition}
                                style={fieldStyle}
                            >
                                <option value="">{selectedCompetition ? "-- Selecteaza --" : "-- Selecteaza competitia --"}</option>
                                {filteredTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px" }}>Echipa Oaspete</label>
                            <select
                                required
                                value={formData.teamAwayId}
                                onChange={e => onChange("teamAwayId", e.target.value)}
                                disabled={!selectedCompetition}
                                style={fieldStyle}
                            >
                                <option value="">{selectedCompetition ? "-- Selecteaza --" : "-- Selecteaza competitia --"}</option>
                                {filteredTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px" }}>Data si Ora</label>
                            <input
                                required
                                type="datetime-local"
                                value={formData.matchDate}
                                onChange={e => onChange("matchDate", e.target.value)}
                                style={fieldStyle}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px" }}>Stadion</label>
                            <input
                                required
                                type="text"
                                value={formData.location}
                                onChange={e => onChange("location", e.target.value)}
                                style={fieldStyle}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "10px" }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: "block", marginBottom: "5px" }}>Scor Gazda</label>
                                <input
                                    type="number"
                                    value={formData.scoreHome}
                                    onChange={e => onChange("scoreHome", e.target.value)}
                                    style={fieldStyle}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: "block", marginBottom: "5px" }}>Scor Oaspete</label>
                                <input
                                    type="number"
                                    value={formData.scoreAway}
                                    onChange={e => onChange("scoreAway", e.target.value)}
                                    style={fieldStyle}
                                />
                            </div>
                        </div>

                        <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                            <button type="button" onClick={onClose} style={{ padding: "8px 15px", background: "var(--sd-box-bg)", color: "var(--sd-text)", border: "1px solid var(--sd-border)", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                                Inchide
                            </button>
                            <button disabled={loading} type="submit" style={{ padding: "8px 15px", background: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                                {loading ? "Se salveaza..." : isEditing ? "Salveaza modificarile" : "Adauga meci"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

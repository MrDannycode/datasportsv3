"use client"

import BaseModal, { ModalActions, modalInputStyle } from "@/components/base-modal"
import { normalizeFootballLeagueName } from "@/lib/football-league"

type Team = {
    id: number
    name: string
    stadium: string | null
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
}

const fieldStyle = {
    ...modalInputStyle,
    width: "100%",
    padding: "8px",
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
    const selectedLeague = selectedCompetition ? normalizeFootballLeagueName(selectedCompetition.name) : ""
    const filteredTeams = selectedCompetition
        ? teams.filter(team => normalizeFootballLeagueName(team.continent) === selectedLeague)
        : []

    return (
        <BaseModal
            modalId="match-modal-title"
            title={isEditing ? "Editeaza meci" : "Adauga meci"}
            subtitle="Configureaza rapid un meci nou pentru calendarul echipei."
            maxWidth="960px"
            onClose={onClose}
        >
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

                <div style={{ gridColumn: "1 / -1" }}>
                    <ModalActions
                        onClose={onClose}
                        loading={loading} // sau variabila ta care indică stadiul de încărcare, ex: isPending
                        submitLabel="Adaugă meci" // Textul normal al butonului
                        loadingLabel="Se salvează..." // Textul când formularul este în curs de trimitere
                        cancelLabel="Închide" // (Opțional) implicit este "Anuleaza", dar îl poți suprascrie așa
                    />
                </div>
            </form>
        </BaseModal>
    )
}

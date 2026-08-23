"use client"

import BaseModal from "@/components/base-modal"

type Team = {
    id: number
    name: string
}

type StaffMember = {
    id: number
    firstName: string
    lastName: string
    role: string
    teamId: number | null
    team: Team | null
}

interface Props {
    antrenori: StaffMember[]
    teams: Team[]
    loading: boolean
    error: string
    successMsg: string
    onAssign: (profileId: number, teamId: string) => Promise<void>
    onClose: () => void
}

const STAFF_ROLE_LABELS: Record<string, string> = {
    antrenor_fotbal: "Antrenor Fotbal",
    antrenor_fitness: "Antrenor Fitness",
    medic: "Medic",
}

export default function CoachAssignmentModal({ antrenori, teams, loading, error, successMsg, onAssign, onClose }: Props) {
    const roleLabel = (role: string) => STAFF_ROLE_LABELS[role] ?? role

    return (
        <BaseModal
            modalId="coach-assignment-modal-title"
            title="Alocare Staff"
            subtitle="Administreaza rapid alocarea staffului pe echipele de fotbal."
            maxWidth="900px"
            onClose={onClose}
        >
            {error && <div style={{ color: "#f87171", marginBottom: "10px" }}>{error}</div>}
            {successMsg && <div style={{ color: "#22c55e", marginBottom: "10px" }}>{successMsg}</div>}

            <div style={{ overflowX: "auto" }}>
                <table className="sd-table">
                    <thead>
                        <tr>
                            <th>Nume</th>
                            <th>Rol</th>
                            <th>Echipa Curenta</th>
                            <th>Actiuni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {antrenori.map(antrenor => (
                            <tr key={antrenor.id}>
                                <td>{antrenor.firstName} {antrenor.lastName}</td>
                                <td>{roleLabel(antrenor.role)}</td>
                                <td>{antrenor.team?.name || "Nicio echipa"}</td>
                                <td>
                                    <select
                                        disabled={loading}
                                        value={antrenor.teamId ? antrenor.teamId.toString() : ""}
                                        onChange={(e) => void onAssign(antrenor.id, e.target.value)}
                                        style={{ padding: "4px", borderRadius: "var(--sd-modal-radius, 4px)", border: "1px solid var(--sd-border)", background: "var(--sd-box-bg)", color: "var(--sd-text)", cursor: "pointer" }}
                                    >
                                        <option value="">-- Fara Echipa --</option>
                                        {teams.map(team => (
                                            <option key={team.id} value={team.id.toString()}>{team.name}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                        {antrenori.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: "center", padding: "15px", color: "var(--sd-text)" }}>Nu exista conturi de staff inregistrate.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </BaseModal>
    )
}

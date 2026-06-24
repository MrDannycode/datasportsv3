"use client"

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
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="coach-assignment-modal-title"
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
                    maxWidth: "900px",
                    backgroundColor: "#fff",
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
                        borderBottom: "1px solid #e5e7eb",
                    }}
                >
                    <div>
                        <h2 id="coach-assignment-modal-title" style={{ margin: 0 }}>Alocare Staff</h2>
                        <p style={{ margin: "6px 0 0", color: "#666", fontSize: "13px" }}>
                            Administreaza rapid alocarea staffului pe echipele de fotbal.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ border: "none", background: "transparent", fontSize: "24px", lineHeight: 1, cursor: "pointer", color: "#666" }}
                        aria-label="Inchide"
                    >
                        x
                    </button>
                </div>

                <div style={{ padding: "22px" }}>
                    {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
                    {successMsg && <div style={{ color: "green", marginBottom: "10px" }}>{successMsg}</div>}

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
                                                style={{ padding: "4px", borderRadius: "3px", border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
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
                                        <td colSpan={4} style={{ textAlign: "center", padding: "15px", color: "#666" }}>Nu exista conturi de staff inregistrate.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

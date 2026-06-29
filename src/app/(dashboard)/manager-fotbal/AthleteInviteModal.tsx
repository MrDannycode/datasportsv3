"use client"

import type { AthleteInviteInput, AthleteInviteResult } from "./athlete-actions"

const fieldStyle = { border: "1px solid #cbd5e1", borderRadius: "4px", padding: "8px 10px", fontSize: "13px", background: "#fff", minWidth: 0 }
const labelStyle = { display: "grid", gap: "5px", fontSize: "12px", fontWeight: 700 }

interface Props {
    invite: AthleteInviteInput
    busy: boolean
    inviteResult: AthleteInviteResult | null
    onUpdate: (name: keyof AthleteInviteInput, value: string) => void
    onClose: () => void
    onSubmit: (event: React.FormEvent) => Promise<void>
}

export default function AthleteInviteModal({ invite, busy, inviteResult, onUpdate, onClose, onSubmit }: Props) {
    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-athlete-modal-title"
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
                        <h2 id="invite-athlete-modal-title" style={{ margin: 0 }}>Invita atlet</h2>
                        <p style={{ margin: "6px 0 0", color: "#666", fontSize: "13px" }}>
                            Creeaza rapid un cont nou de atlet si genereaza parola temporara.
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
                    <form onSubmit={onSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", alignItems: "end" }}>
                        <label style={labelStyle}>Email<input type="email" required value={invite.email} onChange={e => onUpdate("email", e.target.value)} style={fieldStyle} /></label>
                        <label style={labelStyle}>Prenume<input required value={invite.firstName} onChange={e => onUpdate("firstName", e.target.value)} style={fieldStyle} /></label>
                        <label style={labelStyle}>Nume<input required value={invite.lastName} onChange={e => onUpdate("lastName", e.target.value)} style={fieldStyle} /></label>
                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", gridColumn: "1 / -1", marginTop: "6px" }}>
                            <button type="button" onClick={onClose} style={{ ...fieldStyle, cursor: "pointer" }}>Anuleaza</button>
                            <button disabled={busy} style={{ ...fieldStyle, border: 0, background: "#0056b3", color: "#fff", fontWeight: 700, cursor: "pointer" }}>{busy ? "Se creeaza..." : "Trimite invitatia"}</button>
                        </div>
                    </form>
                    {inviteResult && <div role="status" style={{ marginTop: 12, padding: 10, background: inviteResult.success ? "#ecfdf5" : "#fef2f2", color: inviteResult.success ? "#166534" : "#b91c1c", fontSize: 13 }}>{inviteResult.success ? <>Cont creat pentru <strong>{inviteResult.email}</strong>. Parola temporara: <strong style={{ userSelect: "all" }}>{inviteResult.temporaryPassword}</strong></> : inviteResult.error}</div>}
                </div>
            </div>
        </div>
    )
}
"use client"

import BaseModal, { modalInputStyle } from "@/components/base-modal"
import type { AthleteInviteInput, AthleteInviteResult } from "./athlete-actions"

const fieldStyle = { ...modalInputStyle, minWidth: 0 }
const labelStyle = { display: "grid" as const, gap: "5px", fontSize: "12px", fontWeight: 700 }

type TeamOption = { id: number; name: string }

interface Props {
    invite: AthleteInviteInput
    teams?: TeamOption[]
    busy: boolean
    inviteResult: AthleteInviteResult | null
    onUpdate: (name: keyof AthleteInviteInput, value: string) => void
    onClose: () => void
    onSubmit: (event: React.FormEvent) => Promise<void>
}

export default function AthleteInviteModal({ invite, busy, inviteResult, onUpdate, onClose, onSubmit }: Props) {
    return (
        <BaseModal
            modalId="invite-athlete-modal-title"
            title="Invita atlet"
            subtitle="Creeaza rapid un cont nou de atlet si genereaza parola temporara."
            maxWidth="900px"
            onClose={onClose}
        >
            <form onSubmit={onSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", alignItems: "end" }}>
                <label style={labelStyle}>Email<input type="email" required value={invite.email} onChange={e => onUpdate("email", e.target.value)} style={fieldStyle} /></label>
                <label style={labelStyle}>Prenume<input required value={invite.firstName} onChange={e => onUpdate("firstName", e.target.value)} style={fieldStyle} /></label>
                <label style={labelStyle}>Nume<input required value={invite.lastName} onChange={e => onUpdate("lastName", e.target.value)} style={fieldStyle} /></label>
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", gridColumn: "1 / -1", marginTop: "6px" }}>
                    <button type="button" onClick={onClose} style={{ ...fieldStyle, cursor: "pointer" }}>Anuleaza</button>
                    <button disabled={busy} style={{ ...fieldStyle, border: 0, background: "#0056b3", color: "#fff", fontWeight: 700, cursor: "pointer" }}>{busy ? "Se creeaza..." : "Trimite invitatia"}</button>
                </div>
            </form>
            {inviteResult && <div role="status" style={{ marginTop: 12, padding: 10, background: inviteResult.success ? "rgba(34, 197, 94, 0.14)" : "rgba(248, 113, 113, 0.14)", color: inviteResult.success ? "#22c55e" : "#f87171", fontSize: 13 }}>{inviteResult.success ? <>Cont creat pentru <strong>{inviteResult.email}</strong>. Parola temporara: <strong style={{ userSelect: "all" }}>{inviteResult.temporaryPassword}</strong></> : inviteResult.error}</div>}
        </BaseModal>
    )
}

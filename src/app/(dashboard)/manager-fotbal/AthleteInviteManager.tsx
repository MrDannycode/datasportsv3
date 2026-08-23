"use client"

import { useEffect, useRef, useState } from "react"
import AthleteInviteModal from "./AthleteInviteModal"
import { importAthletes, inviteAthlete, type AthleteInviteInput, type AthleteInviteResult } from "./athlete-actions"
import { parseCsv } from "@/lib/csv"

const emptyInvite: AthleteInviteInput = { email: "", firstName: "", lastName: "", position: "mijlocas", preferredFoot: "dreapta", teamId: "", jerseyNumber: "" }
const fieldStyle = { border: "1px solid #cbd5e1", borderRadius: "4px", padding: "8px 10px", fontSize: "13px", background: "#fff", minWidth: 0 }
const labelStyle = { display: "grid", gap: "5px", fontSize: "12px", fontWeight: 700 }

type TeamOption = { id: number; name: string }

function normalizeTeamName(value: string) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim()
}

interface Props {
    shouldOpenInviteModal?: boolean
    teams?: TeamOption[]
}

export default function AthleteInviteManager({ shouldOpenInviteModal = false, teams = [] }: Props) {
    const [invite, setInvite] = useState<AthleteInviteInput>(emptyInvite)
    const [inviteResult, setInviteResult] = useState<AthleteInviteResult | null>(null)
    const [importResults, setImportResults] = useState<AthleteInviteResult[]>([])
    const [error, setError] = useState("")
    const [busy, setBusy] = useState<"invite" | "import" | null>(null)
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const hasOpenedFromQueryRef = useRef(false)
    const fileRef = useRef<HTMLInputElement>(null)
    const update = (name: keyof AthleteInviteInput, value: string) => setInvite(current => ({ ...current, [name]: value }))

    useEffect(() => {
        if (!shouldOpenInviteModal || hasOpenedFromQueryRef.current) {
            return
        }

        hasOpenedFromQueryRef.current = true
        setIsInviteModalOpen(true)
    }, [shouldOpenInviteModal])

    async function submitInvite(event: React.FormEvent) {
        event.preventDefault(); setBusy("invite"); setInviteResult(null)
        try {
            const result = await inviteAthlete(invite)
            setInviteResult(result)
            if (result.success) {
                setInvite(emptyInvite)
            }
        } finally { setBusy(null) }
    }

    async function submitCsv(file: File) {
        setBusy("import"); setError(""); setImportResults([])
        try {
            const records = parseCsv((await file.text()).replace(/^\uFEFF/, ""))
            const headers = records.shift()?.map(value => value.toLowerCase().trim()) ?? []
            const required = ["email", "firstname", "lastname", "pozitie", "echipa"]
            const missing = required.filter(name => !headers.includes(name))
            if (missing.length) throw new Error(`Lipsesc coloanele obligatorii: ${missing.join(", ")}.`)
            const value = (row: string[], name: string) => row[headers.indexOf(name)] ?? ""
            const rows = records.map(row => {
                const position = value(row, "pozitie")
                const teamName = value(row, "echipa")
                const team = teams.find(item => normalizeTeamName(item.name) === normalizeTeamName(teamName))
                return { email: value(row, "email"), firstName: value(row, "firstname"), lastName: value(row, "lastname"), position, preferredFoot: "dreapta", teamId: team?.id.toString() ?? (teamName ? "invalid" : ""), jerseyNumber: "" }
            })
            if (!rows.length) throw new Error("Fisierul CSV nu contine atleti.")
            setImportResults((await importAthletes(rows)).results)
        } catch (reason) { setError(reason instanceof Error ? reason.message : "Importul a esuat.") }
        finally { setBusy(null); if (fileRef.current) fileRef.current.value = "" }
    }

    function downloadTemporaryPasswords() {
        const rows = importResults.filter(result => result.success && result.temporaryPassword)
        if (!rows.length) return
        const escapeCsv = (value: string | number | undefined) => `"${String(value ?? "").replace(/"/g, '""')}"`
        const csv = [
            ["rand", "email", "parolaTemporara"].map(escapeCsv).join(","),
            ...rows.map(result => [result.row, result.email, result.temporaryPassword].map(escapeCsv).join(",")),
        ].join("\n")
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
        const link = document.createElement("a"); link.href = url; link.download = "parole-temporare-atleti.csv"; link.click(); URL.revokeObjectURL(url)
    }

    function downloadTemplate() {
        const teamName = teams[0]?.name ?? "Nume Echipa"
        const csv = `email,firstName,lastName,pozitie,echipa\natlet@example.com,Ion,Popescu,mijlocas,${teamName}`
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
        const link = document.createElement("a"); link.href = url; link.download = "model-import-atleti.csv"; link.click(); URL.revokeObjectURL(url)
    }

    return <div style={{ display: "grid", gap: "20px" }}>
        <div className="sd-box"><div className="sd-box-header"><h2>Invita atlet</h2></div><div className="sd-box-content">
            <form onSubmit={submitInvite} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", alignItems: "end" }}>
                <label style={labelStyle}>Email<input type="email" required value={invite.email} onChange={e => update("email", e.target.value)} className="sd-input" /></label>
                <label style={labelStyle}>Prenume<input required value={invite.firstName} onChange={e => update("firstName", e.target.value)} className="sd-input" /></label>
                <label style={labelStyle}>Nume<input required value={invite.lastName} onChange={e => update("lastName", e.target.value)} className="sd-input" /></label>
                <button disabled={busy !== null} style={{ ...fieldStyle, border: 0, background: "#0056b3", color: "#fff", fontWeight: 700, cursor: "pointer" }}>{busy === "invite" ? "Se creeaza..." : "Trimite invitatia"}</button>
            </form>
            {inviteResult && <div role="status" style={{ marginTop: 12, padding: 10, background: inviteResult.success ? "#ecfdf5" : "#fef2f2", color: inviteResult.success ? "#166534" : "#b91c1c", fontSize: 13 }}>{inviteResult.success ? <>Cont creat pentru <strong>{inviteResult.email}</strong>. Parola temporara: <strong style={{ userSelect: "all" }}>{inviteResult.temporaryPassword}</strong></> : inviteResult.error}</div>}
        </div></div>

        <div className="sd-box"><div className="sd-box-header"><h2>Importa atleti din CSV</h2></div><div className="sd-box-content">
            <p style={{ marginTop: 0, color: "#64748b", fontSize: 13 }}>Obligatoriu: email, firstName, lastName, pozitie, echipa. Maximum 250 de randuri.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button type="button" onClick={downloadTemplate} style={{ ...fieldStyle, cursor: "pointer" }}>Descarca model CSV</button><label style={{ ...fieldStyle, background: "#0056b3", color: "#fff", cursor: "pointer", fontWeight: 700 }}>{busy === "import" ? "Se importa..." : "Alege fisier CSV"}<input ref={fileRef} type="file" accept=".csv,text/csv" disabled={busy !== null} onChange={e => { const file = e.target.files?.[0]; if (file) void submitCsv(file) }} style={{ display: "none" }} /></label></div>
            {error && <p style={{ color: "#b91c1c", fontSize: 13 }}>{error}</p>}
            {importResults.length > 0 && <div style={{ marginTop: 14, overflowX: "auto" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}><p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Import finalizat: {importResults.filter(r => r.success).length} creati, {importResults.filter(r => !r.success).length} respinsi.</p><button type="button" onClick={downloadTemporaryPasswords} disabled={!importResults.some(r => r.success && r.temporaryPassword)} style={{ ...fieldStyle, cursor: "pointer" }}>Download parole</button></div><table className="sd-table" style={{ marginTop: 10 }}><thead><tr><th>Rand</th><th>Email</th><th>Rezultat</th><th>Parola temporara / eroare</th></tr></thead><tbody>{importResults.map(result => <tr key={`${result.row}-${result.email}`}><td>{result.row}</td><td>{result.email || "�"}</td><td style={{ color: result.success ? "#166534" : "#b91c1c", fontWeight: 700 }}>{result.success ? "Creat" : "Respins"}</td><td style={{ userSelect: result.success ? "all" : "auto" }}>{result.temporaryPassword ?? result.error}</td></tr>)}</tbody></table></div>}
        </div></div>

        {isInviteModalOpen && (
            <AthleteInviteModal
                invite={invite}
                busy={busy === "invite"}
                inviteResult={inviteResult}
                onUpdate={update}
                onClose={() => setIsInviteModalOpen(false)}
                onSubmit={submitInvite}
            />
        )}
    </div>
}










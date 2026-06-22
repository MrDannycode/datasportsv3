"use client"

import { useRef, useState } from "react"
import { importAthletes, inviteAthlete, type AthleteInviteInput, type AthleteInviteResult } from "./athlete-actions"

type Team = { id: number; name: string }
const emptyInvite: AthleteInviteInput = { email: "", firstName: "", lastName: "", position: "mijlocas", preferredFoot: "dreapta", teamId: "", jerseyNumber: "" }
const fieldStyle = { border: "1px solid #cbd5e1", borderRadius: "4px", padding: "8px 10px", fontSize: "13px", background: "#fff", minWidth: 0 }
const labelStyle = { display: "grid", gap: "5px", fontSize: "12px", fontWeight: 700 }

function parseCsv(text: string) {
    const records: string[][] = []
    let record: string[] = [], field = "", quoted = false
    for (let i = 0; i < text.length; i++) {
        const char = text[i]
        if (char === '"') {
            if (quoted && text[i + 1] === '"') { field += '"'; i++ } else quoted = !quoted
        } else if (char === "," && !quoted) { record.push(field.trim()); field = "" }
        else if ((char === "\n" || char === "\r") && !quoted) {
            if (char === "\r" && text[i + 1] === "\n") i++
            record.push(field.trim())
            if (record.some(Boolean)) records.push(record)
            record = []; field = ""
        } else field += char
    }
    record.push(field.trim())
    if (record.some(Boolean)) records.push(record)
    return records
}

export default function AthleteInviteManager({ teams }: { teams: Team[] }) {
    const [invite, setInvite] = useState<AthleteInviteInput>(emptyInvite)
    const [inviteResult, setInviteResult] = useState<AthleteInviteResult | null>(null)
    const [importResults, setImportResults] = useState<AthleteInviteResult[]>([])
    const [error, setError] = useState("")
    const [busy, setBusy] = useState<"invite" | "import" | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)
    const update = (name: keyof AthleteInviteInput, value: string) => setInvite(current => ({ ...current, [name]: value }))

    async function submitInvite(event: React.FormEvent) {
        event.preventDefault(); setBusy("invite"); setInviteResult(null)
        try {
            const result = await inviteAthlete(invite)
            setInviteResult(result)
            if (result.success) setInvite(emptyInvite)
        } finally { setBusy(null) }
    }

    async function submitCsv(file: File) {
        setBusy("import"); setError(""); setImportResults([])
        try {
            const records = parseCsv((await file.text()).replace(/^\uFEFF/, ""))
            const headers = records.shift()?.map(value => value.toLowerCase().trim()) ?? []
            const required = ["email", "firstname", "lastname", "position", "preferredfoot"]
            const missing = required.filter(name => !headers.includes(name))
            if (missing.length) throw new Error(`Lipsesc coloanele obligatorii: ${missing.join(", ")}.`)
            const value = (row: string[], name: string) => row[headers.indexOf(name)] ?? ""
            const rows = records.map(row => ({ email: value(row, "email"), firstName: value(row, "firstname"), lastName: value(row, "lastname"), position: value(row, "position"), preferredFoot: value(row, "preferredfoot"), teamId: value(row, "teamid"), jerseyNumber: value(row, "jerseynumber") }))
            if (!rows.length) throw new Error("Fișierul CSV nu conține atleți.")
            setImportResults((await importAthletes(rows)).results)
        } catch (reason) { setError(reason instanceof Error ? reason.message : "Importul a eșuat.") }
        finally { setBusy(null); if (fileRef.current) fileRef.current.value = "" }
    }

    function downloadTemplate() {
        const csv = "email,firstName,lastName,position,preferredFoot,teamId,jerseyNumber\natlet@example.com,Ion,Popescu,mijlocas,dreapta,,10"
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
        const link = document.createElement("a"); link.href = url; link.download = "model-import-atleti.csv"; link.click(); URL.revokeObjectURL(url)
    }

    return <div style={{ display: "grid", gap: "20px" }}>
        <div className="sd-box"><div className="sd-box-header"><h2>Invită atlet</h2></div><div className="sd-box-content">
            <form onSubmit={submitInvite} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px", alignItems: "end" }}>
                <label style={labelStyle}>Email<input type="email" required value={invite.email} onChange={e => update("email", e.target.value)} style={fieldStyle} /></label>
                <label style={labelStyle}>Prenume<input required value={invite.firstName} onChange={e => update("firstName", e.target.value)} style={fieldStyle} /></label>
                <label style={labelStyle}>Nume<input required value={invite.lastName} onChange={e => update("lastName", e.target.value)} style={fieldStyle} /></label>
                <label style={labelStyle}>Poziție<select value={invite.position} onChange={e => update("position", e.target.value)} style={fieldStyle}><option value="portar">Portar</option><option value="fundas">Fundaș</option><option value="mijlocas">Mijlocaș</option><option value="atacant">Atacant</option></select></label>
                <label style={labelStyle}>Picior preferat<select value={invite.preferredFoot} onChange={e => update("preferredFoot", e.target.value)} style={fieldStyle}><option value="stanga">Stângul</option><option value="dreapta">Dreptul</option><option value="ambele">Ambele</option></select></label>
                <label style={labelStyle}>Echipa<select value={invite.teamId ?? ""} onChange={e => update("teamId", e.target.value)} style={fieldStyle}><option value="">Fără echipă</option>{teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
                <label style={labelStyle}>Număr tricou<input type="number" min="1" max="99" value={invite.jerseyNumber ?? ""} onChange={e => update("jerseyNumber", e.target.value)} style={fieldStyle} /></label>
                <button disabled={busy !== null} style={{ ...fieldStyle, border: 0, background: "#0056b3", color: "#fff", fontWeight: 700, cursor: "pointer" }}>{busy === "invite" ? "Se creează..." : "Trimite invitația"}</button>
            </form>
            {inviteResult && <div role="status" style={{ marginTop: 12, padding: 10, background: inviteResult.success ? "#ecfdf5" : "#fef2f2", color: inviteResult.success ? "#166534" : "#b91c1c", fontSize: 13 }}>{inviteResult.success ? <>Cont creat pentru <strong>{inviteResult.email}</strong>. Parolă temporară: <strong style={{ userSelect: "all" }}>{inviteResult.temporaryPassword}</strong></> : inviteResult.error}</div>}
        </div></div>

        <div className="sd-box"><div className="sd-box-header"><h2>Importă atleți din CSV</h2></div><div className="sd-box-content">
            <p style={{ marginTop: 0, color: "#64748b", fontSize: 13 }}>Obligatoriu: email, firstName, lastName, position, preferredFoot. Opțional: teamId, jerseyNumber. Maximum 250 de rânduri.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button type="button" onClick={downloadTemplate} style={{ ...fieldStyle, cursor: "pointer" }}>Descarcă model CSV</button><label style={{ ...fieldStyle, background: "#0056b3", color: "#fff", cursor: "pointer", fontWeight: 700 }}>{busy === "import" ? "Se importă..." : "Alege fișier CSV"}<input ref={fileRef} type="file" accept=".csv,text/csv" disabled={busy !== null} onChange={e => { const file = e.target.files?.[0]; if (file) void submitCsv(file) }} style={{ display: "none" }} /></label></div>
            {error && <p style={{ color: "#b91c1c", fontSize: 13 }}>{error}</p>}
            {importResults.length > 0 && <div style={{ marginTop: 14, overflowX: "auto" }}><p style={{ fontSize: 13, fontWeight: 700 }}>Import finalizat: {importResults.filter(r => r.success).length} creați, {importResults.filter(r => !r.success).length} respinși.</p><table className="sd-table"><thead><tr><th>Rând</th><th>Email</th><th>Rezultat</th><th>Parolă temporară / eroare</th></tr></thead><tbody>{importResults.map(result => <tr key={`${result.row}-${result.email}`}><td>{result.row}</td><td>{result.email || "—"}</td><td style={{ color: result.success ? "#166534" : "#b91c1c", fontWeight: 700 }}>{result.success ? "Creat" : "Respins"}</td><td style={{ userSelect: result.success ? "all" : "auto" }}>{result.temporaryPassword ?? result.error}</td></tr>)}</tbody></table></div>}
        </div></div>
    </div>
}

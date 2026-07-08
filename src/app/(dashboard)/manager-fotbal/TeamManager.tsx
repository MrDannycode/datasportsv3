"use client"

import { useRef, useState } from "react"
import { createTeam, updateTeam, deleteTeam, importTeams, type TeamImportResult } from "./actions"
import { parseCsv } from "@/lib/csv"

type Team = {
    id: number
    name: string
    stadium: string | null
    county: string | null
    country: string
    continent: string
}

type League = {
    id: number
    name: string
}

const fieldStyle = { border: "1px solid #cbd5e1", borderRadius: "4px", padding: "8px 10px", fontSize: "13px", background: "#fff", minWidth: 0 }

export default function TeamManager({
    initialTeams,
    leagues,
    assignedCountry,
    assignedContinent,
}: {
    initialTeams: Team[]
    leagues: League[]
    assignedCountry: string | null
    assignedContinent: string | null
}) {
    const [isEditing, setIsEditing] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [importLoading, setImportLoading] = useState(false)
    const [error, setError] = useState("")
    const [importError, setImportError] = useState("")
    const [importResults, setImportResults] = useState<TeamImportResult[]>([])
    const fileRef = useRef<HTMLInputElement>(null)

    const [formData, setFormData] = useState({
        name: "",
        stadium: "",
        county: "",
        country: assignedCountry ?? "",
        continent: assignedContinent ?? "",
    })

    const resetForm = () => {
        setFormData({
            name: "",
            stadium: "",
            county: "",
            country: assignedCountry ?? "",
            continent: assignedContinent ?? "",
        })
        setIsEditing(null)
        setError("")
    }

    const handleEdit = (team: Team) => {
        setIsEditing(team.id)
        setFormData({
            name: team.name,
            stadium: team.stadium ?? "",
            county: team.county ?? "",
            country: assignedCountry ?? team.country,
            continent: assignedContinent ?? team.continent,
        })
        setError("")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            if (isEditing) {
                await updateTeam(isEditing, formData)
            } else {
                await createTeam(formData)
            }
            resetForm()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "A aparut o eroare.")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Sigur doriti sa stergeti aceasta echipa? (Daca are meciuri asociate, stergerea poate esua.)")) return
        setLoading(true)
        try {
            await deleteTeam(id)
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "A aparut o eroare la stergere. Posibil ca echipa sa fie asociata cu alte inregistrari (meciuri, etc).")
        } finally {
            setLoading(false)
        }
    }

    async function submitCsv(file: File) {
        setImportLoading(true)
        setImportError("")
        setImportResults([])

        try {
            const records = parseCsv((await file.text()).replace(/^\uFEFF/, ""))
            const headers = records.shift()?.map(value => value.toLowerCase().trim()) ?? []
            const required = ["name", "league"]
            const missing = required.filter(name => !headers.includes(name))
            if (missing.length) throw new Error(`Lipsesc coloanele obligatorii: ${missing.join(", ")}.`)

            const value = (row: string[], name: string) => row[headers.indexOf(name)] ?? ""
            const rows = records.map(row => ({
                name: value(row, "name"),
                stadium: value(row, "stadium"),
                county: value(row, "county"),
                continent: value(row, "league"),
            }))
            if (!rows.length) throw new Error("Fisierul CSV nu contine echipe.")

            setImportResults((await importTeams(rows)).results)
        } catch (reason) {
            setImportError(reason instanceof Error ? reason.message : "Importul a esuat.")
        } finally {
            setImportLoading(false)
            if (fileRef.current) fileRef.current.value = ""
        }
    }

    function downloadTemplate() {
        const csv = `name,stadium,county,league`
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
        const link = document.createElement("a")
        link.href = url
        link.download = "model-import-echipe.csv"
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="sd-box">
            <div className="sd-box-header">
                <h2>Gestionare Echipe Fotbal</h2>
            </div>
            <div className="sd-box-content">
                {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px", marginBottom: "20px", padding: "15px", border: "1px solid #ddd", borderRadius: "5px", background: "#f9f9f9" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Nume Echipa</label>
                        <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }} />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Stadion</label>
                        <input type="text" value={formData.stadium} onChange={e => setFormData({ ...formData, stadium: e.target.value })} style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }} />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Judet</label>
                        <input type="text" value={formData.county} onChange={e => setFormData({ ...formData, county: e.target.value })} style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }} />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "5px" }}>Liga</label>
                        <select required value={formData.continent} onChange={e => setFormData({ ...formData, continent: e.target.value })} style={{ width: "100%", padding: "5px", borderRadius: "3px", border: "1px solid #ccc" }}>
                            <option value="">Selecteaza liga</option>
                            {assignedContinent && !leagues.some(league => league.name === assignedContinent) && <option value={assignedContinent}>{assignedContinent}</option>}
                            {leagues.map(league => <option key={league.id} value={league.name}>{league.name}</option>)}
                        </select>
                    </div>

                    <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px", marginTop: "10px" }}>
                        <button disabled={loading} type="submit" style={{ padding: "8px 15px", background: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                            {isEditing ? "Salveaza Modificarile" : "Adauga Echipa"}
                        </button>
                        {isEditing && <button disabled={loading} type="button" onClick={resetForm} style={{ padding: "8px 15px", background: "#ccc", color: "#333", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Anuleaza</button>}
                    </div>
                </form>

                <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ddd", borderRadius: "5px", background: "#f9f9f9" }}>
                    <h3 style={{ marginTop: 0, marginBottom: "8px" }}>Importa echipe din CSV</h3>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button type="button" onClick={downloadTemplate} style={{ ...fieldStyle, cursor: "pointer" }}>Descarca model CSV</button>
                        <label style={{ ...fieldStyle, background: "#0056b3", color: "#fff", cursor: "pointer", fontWeight: 700 }}>
                            {importLoading ? "Se importa..." : "Alege fisier CSV"}
                            <input ref={fileRef} type="file" accept=".csv,text/csv" disabled={importLoading || loading} onChange={e => { const file = e.target.files?.[0]; if (file) void submitCsv(file) }} style={{ display: "none" }} />
                        </label>
                    </div>
                    {importError && <p style={{ color: "#b91c1c", fontSize: 13 }}>{importError}</p>}
                    {importResults.length > 0 && <div style={{ marginTop: 14, overflowX: "auto" }}><p style={{ fontSize: 13, fontWeight: 700 }}>Import finalizat: {importResults.filter(r => r.success).length} create, {importResults.filter(r => !r.success).length} respinse.</p><table className="sd-table"><thead><tr><th>Rand</th><th>Echipa</th><th>Rezultat</th><th>ID / eroare</th></tr></thead><tbody>{importResults.map(result => <tr key={`${result.row}-${result.name}`}><td>{result.row}</td><td>{result.name || "-"}</td><td style={{ color: result.success ? "#166534" : "#b91c1c", fontWeight: 700 }}>{result.success ? "Creata" : "Respinsa"}</td><td>{result.id ?? result.error}</td></tr>)}</tbody></table></div>}
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table className="sd-table">
                        <thead>
                            <tr><th>ID</th><th>Nume</th><th>Stadion</th><th>Judet</th><th>Liga</th><th>Actiuni</th></tr>
                        </thead>
                        <tbody>
                            {initialTeams.map(team => (
                                <tr key={team.id}>
                                    <td>{team.id}</td>
                                    <td>{team.name}</td>
                                    <td>{team.stadium || "-"}</td>
                                    <td>{team.county || "-"}</td>
                                    <td>{team.continent}</td>
                                    <td>
                                        <button disabled={loading} onClick={() => handleEdit(team)} style={{ marginRight: "10px", padding: "4px 10px", cursor: "pointer", background: "#f0f0f0", border: "1px solid #ccc", borderRadius: "3px" }}>Editeaza</button>
                                        <button disabled={loading} onClick={() => handleDelete(team.id)} style={{ padding: "4px 10px", cursor: "pointer", background: "#fff0f0", color: "red", border: "1px solid #ffcccc", borderRadius: "3px" }}>Sterge</button>
                                    </td>
                                </tr>
                            ))}
                            {initialTeams.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: "15px", color: "#666" }}>Nu exista echipe adaugate.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}


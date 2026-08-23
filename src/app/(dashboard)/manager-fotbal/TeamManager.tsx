"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useTableMode } from "@/components/table-mode-provider"
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

type SortField = "id" | "name" | "stadium" | "county" | "league"
type SortDirection = "asc" | "desc"

const fieldStyle = { border: "1px solid #cbd5e1", borderRadius: "4px", padding: "8px 10px", fontSize: "13px", background: "#fff", minWidth: 0 }
const sortButtonStyle = { background: "none", border: 0, padding: 0, color: "inherit", font: "inherit", fontWeight: 700, cursor: "pointer" } as const

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
    const { tableMode } = useTableMode()
    const isNormalMode = tableMode === "normal"

    const [teams, setTeams] = useState<Team[]>(initialTeams)
    const [loading, setLoading] = useState(false)
    const [importLoading, setImportLoading] = useState(false)
    const [error, setError] = useState("")
    const [importError, setImportError] = useState("")
    const [importResults, setImportResults] = useState<TeamImportResult[]>([])
    const [sortConfig, setSortConfig] = useState<{ field: SortField, direction: SortDirection }>({
        field: "name",
        direction: "asc",
    })
    const fileRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setTeams(initialTeams)
    }, [initialTeams])

    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    // Modal edit state
    const [editingTeam, setEditingTeam] = useState<Team | null>(null)
    const [editFormData, setEditFormData] = useState({
        name: "",
        stadium: "",
        county: "",
        country: assignedCountry ?? "",
        continent: assignedContinent ?? "",
    })
    const [editLoading, setEditLoading] = useState(false)
    const [editError, setEditError] = useState("")

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
        setError("")
    }

    const handleEdit = (team: Team) => {
        setEditingTeam(team)
        setEditFormData({
            name: team.name,
            stadium: team.stadium ?? "",
            county: team.county ?? "",
            country: assignedCountry ?? team.country,
            continent: assignedContinent ?? team.continent,
        })
        setEditError("")
    }

    const closeEditModal = () => {
        setEditingTeam(null)
        setEditError("")
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingTeam) return
        setEditLoading(true)
        setEditError("")
        try {
            await updateTeam(editingTeam.id, editFormData)
            setTeams(current => current.map(t =>
                t.id === editingTeam.id
                    ? { ...t, name: editFormData.name, stadium: editFormData.stadium || null, county: editFormData.county || null, continent: editFormData.continent }
                    : t
            ))
            closeEditModal()
        } catch (err: unknown) {
            setEditError(err instanceof Error ? err.message : "A aparut o eroare.")
        } finally {
            setEditLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            await createTeam(formData)
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
            setTeams(current => current.filter(t => t.id !== id))
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
        const csv = `name,stadium,county,League`
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
        const link = document.createElement("a")
        link.href = url
        link.download = "model-import-echipe.csv"
        link.click()
        URL.revokeObjectURL(url)
    }

    const sortedTeams = useMemo(() => {
        return [...teams].sort((a, b) => {
            if (sortConfig.field === "id") {
                const result = a.id - b.id

                if (result !== 0) {
                    return sortConfig.direction === "asc" ? result : -result
                }

                return a.name.localeCompare(b.name, "ro", { sensitivity: "base" })
            }

            const getValue = (team: Team) => {
                switch (sortConfig.field) {
                    case "stadium":
                        return team.stadium || "-"
                    case "county":
                        return team.county || "-"
                    case "league":
                        return team.continent
                    case "name":
                    default:
                        return team.name
                }
            }

            const result = getValue(a).localeCompare(getValue(b), "ro", { sensitivity: "base" })

            if (result !== 0) {
                return sortConfig.direction === "asc" ? result : -result
            }

            return a.name.localeCompare(b.name, "ro", { sensitivity: "base" })
        })
    }, [teams, sortConfig])

    const handleSort = (field: SortField) => {
        setSortConfig(current => ({
            field,
            direction: current.field === field && current.direction === "asc" ? "desc" : "asc",
        }))
    }

    const renderSortIndicator = (field: SortField) => {
        if (sortConfig.field !== field) {
            return "Sort"
        }

        return sortConfig.direction === "asc" ? "A-Z" : "Z-A"
    }

    return (
        <>
            <div className="sd-box">
                <div className="sd-box-header">
                    <h2>Gestionare Echipe Fotbal</h2>
                </div>
                <div className="sd-box-content">
                    {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}

                    {/* Form Adaugare Echipa */}
                    <form
                        id="team-form"
                        onSubmit={handleSubmit}
                        className="sd-btn-focus-square"
                        style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px", marginBottom: "20px", padding: "15px", border: "1px solid #ddd", borderRadius: isNormalMode ? "5px" : "0", background: "#f9f9f9" }}
                    >
                        <div>
                            <label style={{ display: "block", marginBottom: "5px" }}>Nume Echipa</label>
                            <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="sd-btn-focus-square" style={{ width: "100%", padding: "5px", borderRadius: isNormalMode ? "3px" : "0", border: "1px solid #ccc" }} />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px" }}>Stadion</label>
                            <input type="text" value={formData.stadium} onChange={e => setFormData({ ...formData, stadium: e.target.value })} className="sd-btn-focus-square" style={{ width: "100%", padding: "5px", borderRadius: isNormalMode ? "3px" : "0", border: "1px solid #ccc" }} />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px" }}>Judet</label>
                            <input type="text" value={formData.county} onChange={e => setFormData({ ...formData, county: e.target.value })} className="sd-btn-focus-square" style={{ width: "100%", padding: "5px", borderRadius: isNormalMode ? "3px" : "0", border: "1px solid #ccc" }} />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px" }}>Liga</label>
                            <select required value={formData.continent} onChange={e => setFormData({ ...formData, continent: e.target.value })} className="sd-btn-focus-square" style={{ width: "100%", padding: "5px", borderRadius: isNormalMode ? "3px" : "0", border: "1px solid #ccc" }}>
                                <option value="">Selecteaza liga</option>
                                {assignedContinent && !leagues.some(league => league.name === assignedContinent) && <option value={assignedContinent}>{assignedContinent}</option>}
                                {leagues.map(league => <option key={league.id} value={league.name}>{league.name}</option>)}
                            </select>
                        </div>

                        <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px", marginTop: "10px" }}>
                            <button className="sd-btn-focus-square" disabled={loading} type="submit" style={{ padding: "8px 15px", background: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                                Adauga Echipa
                            </button>
                        </div>
                    </form>

                    {/* Sectiune Import Echipe CSV */}
                    <div
                        id="csv-import-echipe"
                        style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ddd", borderRadius: "5px", background: "#f9f9f9" }}
                    >
                        <h3 style={{ marginTop: 0, marginBottom: "8px" }}>Importa echipe din CSV</h3>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <button className="sd-btn-focus-square" type="button" onClick={downloadTemplate} style={{ ...fieldStyle, cursor: "pointer" }}>Descarca model CSV</button>
                            <label className="sd-btn-focus-square" style={{ ...fieldStyle, background: "#0056b3", color: "#fff", cursor: "pointer", fontWeight: 700 }}>
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
                                <tr>
                                    <th>
                                        <button type="button" onClick={() => handleSort("id")} aria-label="Sorteaza dupa ID" style={sortButtonStyle}>
                                            ID {sortConfig.field === "id" ? (sortConfig.direction === "asc" ? "1-9" : "9-1") : "Sort"}
                                        </button>
                                    </th>
                                    <th>
                                        <button type="button" onClick={() => handleSort("name")} aria-label="Sorteaza dupa numele echipei" style={sortButtonStyle}>
                                            Nume {renderSortIndicator("name")}
                                        </button>
                                    </th>
                                    <th>
                                        <button type="button" onClick={() => handleSort("stadium")} aria-label="Sorteaza dupa stadion" style={sortButtonStyle}>
                                            Stadion {renderSortIndicator("stadium")}
                                        </button>
                                    </th>
                                    <th>
                                        <button type="button" onClick={() => handleSort("county")} aria-label="Sorteaza dupa judet" style={sortButtonStyle}>
                                            Judet {renderSortIndicator("county")}
                                        </button>
                                    </th>
                                    <th>
                                        <button type="button" onClick={() => handleSort("league")} aria-label="Sorteaza dupa liga" style={sortButtonStyle}>
                                            Liga {renderSortIndicator("league")}
                                        </button>
                                    </th>
                                    <th>Actiuni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedTeams.map(team => (
                                    <tr key={team.id}>
                                        <td>{team.id}</td>
                                        <td>{team.name}</td>
                                        <td>{team.stadium || "-"}</td>
                                        <td>{team.county || "-"}</td>
                                        <td>{team.continent}</td>
                                        <td>
                                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                                <button
                                                    type="button"
                                                    disabled={loading}
                                                    onClick={() => handleEdit(team)}
                                                    style={isNormalMode ? { padding: "4px 10px", cursor: "pointer", background: "#f0f7ff", color: "#0050b3", border: "1px solid #91d5ff", borderRadius: "3px" } : { fontSize: "11px", border: "1px solid #0056b3", color: "#0056b3", backgroundColor: "transparent", padding: "2px 8px", cursor: "pointer" }}
                                                >
                                                    Editeaza
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={loading}
                                                    onClick={() => handleDelete(team.id)}
                                                    style={isNormalMode ? { padding: "4px 10px", cursor: "pointer", background: "#fff0f0", color: "red", border: "1px solid #ffcccc", borderRadius: "3px" } : { fontSize: "11px", border: "1px solid #c00", color: "#c00", backgroundColor: "transparent", padding: "2px 8px", cursor: "pointer" }}
                                                >
                                                    Sterge
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {sortedTeams.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: "15px", color: "#666" }}>Nu exista echipe adaugate.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Team Edit Modal */}
            {mounted && editingTeam && typeof document !== "undefined"
                ? createPortal(
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="edit-team-modal-title"
                        onClick={closeEditModal}
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
                                maxWidth: "760px",
                                backgroundColor: "var(--sd-box-bg, #fff)",
                                color: "var(--sd-text, #333)",
                                border: "1px solid var(--sd-border, #e5e7eb)",
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
                                    borderBottom: "1px solid var(--sd-border, #e5e7eb)",
                                }}
                            >
                                <div>
                                    <h2 id="edit-team-modal-title" style={{ margin: 0 }}>Editeaza echipa</h2>
                                    <p style={{ margin: "6px 0 0", color: "color-mix(in srgb, var(--sd-text, #333) 68%, transparent)", fontSize: "13px" }}>
                                        Actualizeaza datele echipei.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    style={{ border: "none", background: "transparent", fontSize: "24px", lineHeight: 1, cursor: "pointer", color: "var(--sd-text, #333)" }}
                                    aria-label="Inchide"
                                >
                                    ×
                                </button>
                            </div>

                            <div style={{ padding: "22px" }}>
                                <form onSubmit={handleEditSubmit} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 180px" }}>
                                        <label style={{ fontSize: "12px", fontWeight: "bold" }}>Nume Echipa</label>
                                        <input
                                            type="text"
                                            required
                                            value={editFormData.name}
                                            onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                            style={{ border: "1px solid var(--sd-border, #ccc)", padding: "10px 12px", fontSize: "13px", backgroundColor: "var(--sd-input-bg, #fff)", color: "var(--sd-text, #333)" }}
                                        />
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 160px" }}>
                                        <label style={{ fontSize: "12px", fontWeight: "bold" }}>Stadion</label>
                                        <input
                                            type="text"
                                            value={editFormData.stadium}
                                            onChange={e => setEditFormData({ ...editFormData, stadium: e.target.value })}
                                            style={{ border: "1px solid var(--sd-border, #ccc)", padding: "10px 12px", fontSize: "13px", backgroundColor: "var(--sd-input-bg, #fff)", color: "var(--sd-text, #333)" }}
                                        />
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 160px" }}>
                                        <label style={{ fontSize: "12px", fontWeight: "bold" }}>Judet</label>
                                        <input
                                            type="text"
                                            value={editFormData.county}
                                            onChange={e => setEditFormData({ ...editFormData, county: e.target.value })}
                                            style={{ border: "1px solid var(--sd-border, #ccc)", padding: "10px 12px", fontSize: "13px", backgroundColor: "var(--sd-input-bg, #fff)", color: "var(--sd-text, #333)" }}
                                        />
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 160px" }}>
                                        <label style={{ fontSize: "12px", fontWeight: "bold" }}>Liga</label>
                                        <select
                                            required
                                            value={editFormData.continent}
                                            onChange={e => setEditFormData({ ...editFormData, continent: e.target.value })}
                                            style={{ border: "1px solid var(--sd-border, #ccc)", padding: "10px 12px", fontSize: "13px", backgroundColor: "var(--sd-input-bg, #fff)", color: "var(--sd-text, #333)" }}
                                        >
                                            <option value="">Selecteaza liga</option>
                                            {assignedContinent && !leagues.some(league => league.name === assignedContinent) && <option value={assignedContinent}>{assignedContinent}</option>}
                                            {leagues.map(league => <option key={league.id} value={league.name}>{league.name}</option>)}
                                        </select>
                                    </div>

                                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", width: "100%", marginTop: "8px" }}>
                                        <button
                                            type="button"
                                            onClick={closeEditModal}
                                            style={{ border: "1px solid var(--sd-border, #ccc)", background: "var(--sd-box-bg, #fff)", padding: "9px 18px", cursor: "pointer", color: "var(--sd-text, #333)" }}
                                        >
                                            Anuleaza
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={editLoading}
                                            style={{
                                                backgroundColor: editLoading ? "#aaa" : "#0056b3",
                                                color: "#fff",
                                                border: "none",
                                                padding: "9px 20px",
                                                fontSize: "13px",
                                                fontWeight: "bold",
                                                cursor: editLoading ? "not-allowed" : "pointer",
                                            }}
                                        >
                                            {editLoading ? "Se salveaza..." : "Salveaza"}
                                        </button>
                                    </div>
                                </form>

                                {editError && (
                                    <p style={{ color: "#c00", fontSize: "12px", marginTop: "10px" }}>{editError}</p>
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )
                : null}
        </>
    )
}

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import CompetitionCreateModal from "./CompetitionCreateModal"
import CompetitionEditModal from "./CompetitionEditModal"
import { createCompetition, deleteCompetition, updateCompetition } from "./actions"

type Competition = {
    id: number
    name: string
    sport: "fotbal" | "tenis"
    country: string
    continent: string
    startDate: Date | string | null
    endDate: Date | string | null
    createdAt: Date
}

type SortField = "name" | "sport" | "country" | "continent"
type SortDirection = "asc" | "desc"
type CompetitionFilter = "all" | string

type CompetitionFormData = {
    name: string
    sport: "fotbal" | "tenis"
    country: string
    continent: string
    startDate: string
    endDate: string
}

interface Props {
    initialCompetitions: Competition[]
    shouldOpenNewCompetitionModal?: boolean
}

const emptyFormData: CompetitionFormData = {
    name: "",
    sport: "fotbal",
    country: "",
    continent: "",
    startDate: "",
    endDate: "",
}

function toDateInputValue(value: Date | string | null) {
    if (!value) return ""
    return new Date(value).toISOString().slice(0, 10)
}

function sportLabel(value: Competition["sport"]) {
    return value === "fotbal" ? "Fotbal" : "Tenis"
}

function formatCompetitionDuration(startDate: Date | string | null, endDate: Date | string | null) {
    if (!startDate || !endDate) return "-"

    const start = new Date(startDate).toLocaleDateString("ro-RO")
    const end = new Date(endDate).toLocaleDateString("ro-RO")
    return `${start} - ${end}`
}

export default function CompetitionsManager({ initialCompetitions, shouldOpenNewCompetitionModal = false }: Props) {
    const [competitions, setCompetitions] = useState<Competition[]>(initialCompetitions)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null)
    const [editError, setEditError] = useState("")
    const hasOpenedFromQueryRef = useRef(false)
    const [formData, setFormData] = useState<CompetitionFormData>(emptyFormData)
    const [editFormData, setEditFormData] = useState<CompetitionFormData>(emptyFormData)
    const [sportFilter, setSportFilter] = useState<CompetitionFilter>("all")
    const [countryFilter, setCountryFilter] = useState<CompetitionFilter>("all")
    const [continentFilter, setContinentFilter] = useState<CompetitionFilter>("all")
    const [sortConfig, setSortConfig] = useState<{ field: SortField, direction: SortDirection }>({
        field: "name",
        direction: "asc",
    })

    useEffect(() => {
        if (!shouldOpenNewCompetitionModal || hasOpenedFromQueryRef.current) {
            return
        }

        hasOpenedFromQueryRef.current = true
        setIsCreateModalOpen(true)
    }, [shouldOpenNewCompetitionModal])

    const resetForm = () => {
        setFormData(emptyFormData)
        setError("")
        setSuccess("")
    }

    const closeCreateModal = () => {
        setIsCreateModalOpen(false)
        setError("")
        setSuccess("")
    }

    const openEditModal = (competition: Competition) => {
        setEditingCompetition(competition)
        setEditFormData({
            name: competition.name,
            sport: competition.sport,
            country: competition.country,
            continent: competition.continent,
            startDate: toDateInputValue(competition.startDate),
            endDate: toDateInputValue(competition.endDate),
        })
        setEditError("")
        setError("")
        setSuccess("")
    }

    const closeEditModal = () => {
        setEditingCompetition(null)
        setEditFormData(emptyFormData)
        setEditError("")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        setSuccess("")

        try {
            const result = await createCompetition(formData)
            if (result?.competition) {
                setCompetitions(currentCompetitions => [result.competition, ...currentCompetitions])
            }
            setSuccess("Competitia a fost adaugata cu succes!")
            resetForm()
            setIsCreateModalOpen(false)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "A aparut o eroare.")
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingCompetition) return

        setLoading(true)
        setEditError("")
        setError("")
        setSuccess("")

        try {
            const result = await updateCompetition(editingCompetition.id, editFormData)
            if (result?.competition) {
                setCompetitions(currentCompetitions => currentCompetitions.map(competition => (
                    competition.id === result.competition.id ? result.competition : competition
                )))
            }
            setSuccess("Competitia a fost actualizata.")
            closeEditModal()
        } catch (err: unknown) {
            setEditError(err instanceof Error ? err.message : "A aparut o eroare la editare.")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Sigur doriti sa stergeti aceasta competitie?")) return
        setLoading(true)
        setError("")
        setSuccess("")
        try {
            await deleteCompetition(id)
            setCompetitions(currentCompetitions => currentCompetitions.filter(competition => competition.id !== id))
            setSuccess("Competitia a fost stearsa.")
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "A aparut o eroare la stergere.")
        } finally {
            setLoading(false)
        }
    }

    const countryOptions = useMemo(() => {
        return Array.from(new Set(competitions.map(competition => competition.country))).sort((a, b) => a.localeCompare(b, "ro", { sensitivity: "base" }))
    }, [competitions])

    const continentOptions = useMemo(() => {
        return Array.from(new Set(competitions.map(competition => competition.continent))).sort((a, b) => a.localeCompare(b, "ro", { sensitivity: "base" }))
    }, [competitions])

    const filteredCompetitions = useMemo(() => {
        return competitions.filter(competition => {
            const matchesSport = sportFilter === "all" || competition.sport === sportFilter
            const matchesCountry = countryFilter === "all" || competition.country === countryFilter
            const matchesContinent = continentFilter === "all" || competition.continent === continentFilter

            return matchesSport && matchesCountry && matchesContinent
        })
    }, [competitions, sportFilter, countryFilter, continentFilter])

    const sortedCompetitions = useMemo(() => {
        return [...filteredCompetitions].sort((a, b) => {
            const getValue = (competition: Competition) => {
                if (sortConfig.field === "sport") return sportLabel(competition.sport)
                return competition[sortConfig.field]
            }
            const result = getValue(a).localeCompare(getValue(b), "ro", { sensitivity: "base" })

            if (result !== 0) {
                return sortConfig.direction === "asc" ? result : -result
            }

            return a.name.localeCompare(b.name, "ro", { sensitivity: "base" })
        })
    }, [filteredCompetitions, sortConfig])

    const handleSort = (field: SortField) => {
        setSortConfig((current) => ({
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
        <div className="sd-box">
            <div className="sd-box-header">
                <h2>Adaugare Competitie Noua</h2>
            </div>
            <div className="sd-box-content">
                {error && <div style={{ color: "red", marginBottom: "10px", padding: "10px", background: "#fee", borderRadius: "5px" }}>{error}</div>}
                {success && <div style={{ color: "green", marginBottom: "10px", padding: "10px", background: "#efe", borderRadius: "5px" }}>{success}</div>}

                <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", alignItems: "flex-end", marginBottom: "30px", padding: "15px", border: "1px solid #ddd", borderRadius: "5px", background: "#f9f9f9", flexWrap: "wrap" }}>
                    <div style={{ flex: "2 1 240px" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Nume Competitie</label>
                        <input
                            required
                            type="text"
                            placeholder="ex: Liga 1"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                        />
                    </div>
                    <div style={{ flex: "1 1 150px" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Sport</label>
                        <select
                            required
                            value={formData.sport}
                            onChange={e => setFormData({ ...formData, sport: e.target.value as "fotbal" | "tenis" })}
                            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                        >
                            <option value="fotbal">Fotbal</option>
                            <option value="tenis">Tenis</option>
                        </select>
                    </div>
                    <div style={{ flex: "1 1 150px" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Tara</label>
                        <input
                            required
                            type="text"
                            placeholder="ex: Romania"
                            value={formData.country}
                            onChange={e => setFormData({ ...formData, country: e.target.value })}
                            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                        />
                    </div>
                    <div style={{ flex: "1 1 150px" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Continent</label>
                        <input
                            required
                            type="text"
                            placeholder="ex: Europa"
                            value={formData.continent}
                            onChange={e => setFormData({ ...formData, continent: e.target.value })}
                            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                        />
                    </div>
                    <div style={{ flex: "1 1 150px" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Data inceput</label>
                        <input
                            type="date"
                            value={formData.startDate}
                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                        />
                    </div>
                    <div style={{ flex: "1 1 150px" }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Data final</label>
                        <input
                            type="date"
                            value={formData.endDate}
                            min={formData.startDate || undefined}
                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                        />
                    </div>
                    <div>
                        <button disabled={loading} type="submit" style={{ padding: "9px 20px", background: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                            {loading ? "Se salveaza..." : "Adauga"}
                        </button>
                    </div>
                </form>

                <h3 style={{ marginBottom: "15px", fontSize: "16px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>Competitii Existente ({sortedCompetitions.length}/{competitions.length})</h3>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
                    <label htmlFor="competition-sport-filter" style={{ fontSize: "12px", fontWeight: "bold" }}>Sport</label>
                    <select
                        id="competition-sport-filter"
                        value={sportFilter}
                        onChange={e => setSportFilter(e.target.value)}
                        style={{ border: "1px solid #ccc", padding: "6px 10px", fontSize: "13px", backgroundColor: "#fff", minWidth: "150px" }}
                    >
                        <option value="all">Toate sporturile</option>
                        <option value="fotbal">Fotbal</option>
                        <option value="tenis">Tenis</option>
                    </select>

                    <label htmlFor="competition-country-filter" style={{ fontSize: "12px", fontWeight: "bold" }}>Tara</label>
                    <select
                        id="competition-country-filter"
                        value={countryFilter}
                        onChange={e => setCountryFilter(e.target.value)}
                        style={{ border: "1px solid #ccc", padding: "6px 10px", fontSize: "13px", backgroundColor: "#fff", minWidth: "170px" }}
                    >
                        <option value="all">Toate tarile</option>
                        {countryOptions.map(country => (
                            <option key={country} value={country}>{country}</option>
                        ))}
                    </select>

                    <label htmlFor="competition-continent-filter" style={{ fontSize: "12px", fontWeight: "bold" }}>Continent</label>
                    <select
                        id="competition-continent-filter"
                        value={continentFilter}
                        onChange={e => setContinentFilter(e.target.value)}
                        style={{ border: "1px solid #ccc", padding: "6px 10px", fontSize: "13px", backgroundColor: "#fff", minWidth: "170px" }}
                    >
                        <option value="all">Toate continentele</option>
                        {continentOptions.map(continent => (
                            <option key={continent} value={continent}>{continent}</option>
                        ))}
                    </select>
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table className="sd-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>
                                    <button type="button" onClick={() => handleSort("name")} aria-label="Sorteaza dupa numele competitiei" style={{ background: "none", border: 0, padding: 0, color: "inherit", font: "inherit", fontWeight: 700, cursor: "pointer" }}>
                                        Nume Competitie {renderSortIndicator("name")}
                                    </button>
                                </th>
                                <th>
                                    <button type="button" onClick={() => handleSort("sport")} aria-label="Sorteaza dupa sport" style={{ background: "none", border: 0, padding: 0, color: "inherit", font: "inherit", fontWeight: 700, cursor: "pointer" }}>
                                        Sport {renderSortIndicator("sport")}
                                    </button>
                                </th>
                                <th>
                                    <button type="button" onClick={() => handleSort("country")} aria-label="Sorteaza dupa tara" style={{ background: "none", border: 0, padding: 0, color: "inherit", font: "inherit", fontWeight: 700, cursor: "pointer" }}>
                                        Tara {renderSortIndicator("country")}
                                    </button>
                                </th>
                                <th>
                                    <button type="button" onClick={() => handleSort("continent")} aria-label="Sorteaza dupa continent" style={{ background: "none", border: 0, padding: 0, color: "inherit", font: "inherit", fontWeight: 700, cursor: "pointer" }}>
                                        Continent {renderSortIndicator("continent")}
                                    </button>
                                </th>
                                <th>Durata</th>
                                <th>Data Crearii</th>
                                <th style={{ textAlign: "right" }}>Actiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedCompetitions.map(comp => (
                                <tr key={comp.id}>
                                    <td>#{comp.id}</td>
                                    <td style={{ fontWeight: "bold" }}>{comp.name}</td>
                                    <td>
                                        <span style={{
                                            padding: "3px 8px",
                                            borderRadius: "12px",
                                            fontSize: "12px",
                                            background: comp.sport === "fotbal" ? "#e6f7ff" : "#f6ffed",
                                            color: comp.sport === "fotbal" ? "#0050b3" : "#389e0d",
                                            border: `1px solid ${comp.sport === "fotbal" ? "#91d5ff" : "#b7eb8f"}`
                                        }}>
                                            {sportLabel(comp.sport)}
                                        </span>
                                    </td>
                                    <td>{comp.country}</td>
                                    <td>{comp.continent}</td>
                                    <td>{formatCompetitionDuration(comp.startDate, comp.endDate)}</td>
                                    <td>{new Date(comp.createdAt).toLocaleDateString("ro-RO")}</td>
                                    <td style={{ textAlign: "right" }}>
                                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                                            <button disabled={loading} type="button" onClick={() => openEditModal(comp)} style={{ padding: "4px 10px", cursor: "pointer", background: "#f0f7ff", color: "#0050b3", border: "1px solid #91d5ff", borderRadius: "3px" }}>Edit</button>
                                            <button disabled={loading} type="button" onClick={() => handleDelete(comp.id)} style={{ padding: "4px 10px", cursor: "pointer", background: "#fff0f0", color: "red", border: "1px solid #ffcccc", borderRadius: "3px" }}>Sterge</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {sortedCompetitions.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: "center", padding: "20px", color: "#666" }}>Nu exista nicio competitie pentru filtrele selectate.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingCompetition && (
                <CompetitionEditModal
                    name={editFormData.name}
                    sport={editFormData.sport}
                    country={editFormData.country}
                    continent={editFormData.continent}
                    startDate={editFormData.startDate}
                    endDate={editFormData.endDate}
                    loading={loading}
                    error={editError}
                    onNameChange={(value) => setEditFormData({ ...editFormData, name: value })}
                    onSportChange={(value) => setEditFormData({ ...editFormData, sport: value })}
                    onCountryChange={(value) => setEditFormData({ ...editFormData, country: value })}
                    onContinentChange={(value) => setEditFormData({ ...editFormData, continent: value })}
                    onStartDateChange={(value) => setEditFormData({ ...editFormData, startDate: value })}
                    onEndDateChange={(value) => setEditFormData({ ...editFormData, endDate: value })}
                    onClose={closeEditModal}
                    onSubmit={handleEdit}
                />
            )}

            {isCreateModalOpen && (
                <CompetitionCreateModal
                    name={formData.name}
                    sport={formData.sport}
                    country={formData.country}
                    continent={formData.continent}
                    startDate={formData.startDate}
                    endDate={formData.endDate}
                    loading={loading}
                    error={error}
                    success={success}
                    onNameChange={(value) => setFormData({ ...formData, name: value })}
                    onSportChange={(value) => setFormData({ ...formData, sport: value })}
                    onCountryChange={(value) => setFormData({ ...formData, country: value })}
                    onContinentChange={(value) => setFormData({ ...formData, continent: value })}
                    onStartDateChange={(value) => setFormData({ ...formData, startDate: value })}
                    onEndDateChange={(value) => setFormData({ ...formData, endDate: value })}
                    onClose={closeCreateModal}
                    onSubmit={handleSubmit}
                />
            )}
        </div>
    )
}

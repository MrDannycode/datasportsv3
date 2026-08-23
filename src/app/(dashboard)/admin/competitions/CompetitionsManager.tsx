"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useTableMode } from "@/components/table-mode-provider"
import TableSortHeader, { sortAriaValue, type SortDirection } from "@/components/table-sort-header"
import CompetitionCreateModal from "./CompetitionCreateModal"
import CompetitionEditModal from "./CompetitionEditModal"
import { createCompetition, deleteCompetition, updateCompetition } from "./actions"
import { MANAGER_LOCATION_OPTIONS } from "@/lib/manager-locations"

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
    initialSportFilter?: string
    initialContinentFilter?: string
}

const locationContinentOptions = Array.from(new Set(MANAGER_LOCATION_OPTIONS.map(option => option.continent)))

const createInputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid var(--sd-border)",
    backgroundColor: "var(--sd-box-bg)",
    color: "var(--sd-text)",
}

const normalCreateSubmitStyle = {
    padding: "9px 20px",
    background: "#0070f3",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
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

export default function CompetitionsManager({ initialCompetitions, shouldOpenNewCompetitionModal = false, initialSportFilter, initialContinentFilter }: Props) {
    const { tableMode } = useTableMode()
    const isNormalMode = tableMode === "normal"
    const defaultSportFilter: CompetitionFilter = initialSportFilter === "fotbal" || initialSportFilter === "tenis" ? initialSportFilter : "all"
    const defaultContinentFilter: CompetitionFilter = initialCompetitions.some(competition => competition.continent === initialContinentFilter) ? initialContinentFilter ?? "all" : "all"
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
    const [sportFilter, setSportFilter] = useState<CompetitionFilter>(defaultSportFilter)
    const [countryFilter, setCountryFilter] = useState<CompetitionFilter>("all")
    const [continentFilter, setContinentFilter] = useState<CompetitionFilter>(defaultContinentFilter)
    const [sortConfig, setSortConfig] = useState<{ field: SortField, direction: SortDirection }>({
        field: "name",
        direction: "asc",
    })
    const createCountryOptions = MANAGER_LOCATION_OPTIONS.filter(option => option.continent === formData.continent)

    const handleCreateContinentChange = (value: string) => {
        setFormData(current => ({
            ...current,
            continent: value,
            country: MANAGER_LOCATION_OPTIONS.some(option => option.continent === value && option.country === current.country) ? current.country : "",
        }))
    }

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

    const filterCountryOptions = useMemo(() => {
        if (continentFilter === "all") {
            return MANAGER_LOCATION_OPTIONS
        }

        return MANAGER_LOCATION_OPTIONS.filter(option => option.continent === continentFilter)
    }, [continentFilter])

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

    const sortState = (field: SortField) => sortAriaValue(sortConfig.field === field, sortConfig.direction)

    return (
        <>
            <div className="sd-box" style={{ marginBottom: "24px" }}>
                <div className="sd-box-header">
                    <h2>Adaugare competitie noua</h2>
                </div>
                <div className="sd-box-content">
                    {error && <div style={{ color: "red", marginBottom: "10px", padding: "10px", background: "#fee", borderRadius: "5px" }}>{error}</div>}
                    {success && <div style={{ color: "green", marginBottom: "10px", padding: "10px", background: "#efe", borderRadius: "5px" }}>{success}</div>}

                    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
                        <div style={{ flex: "2 1 240px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Nume competitie</label>
                            <input
                                required
                                type="text"
                                placeholder="ex: Liga 1"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                style={{ ...createInputStyle, borderRadius: isNormalMode ? "4px" : "0" }}
                            />
                        </div>
                        <div style={{ flex: "1 1 150px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Sport</label>
                            <select
                                required
                                value={formData.sport}
                                onChange={e => setFormData({ ...formData, sport: e.target.value as "fotbal" | "tenis" })}
                                style={{ ...createInputStyle, borderRadius: isNormalMode ? "4px" : "0" }}
                            >
                                <option value="fotbal">Fotbal</option>
                                <option value="tenis">Tenis</option>
                            </select>
                        </div>
                        <div style={{ flex: "1 1 150px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Continent</label>
                            <select
                                required
                                value={formData.continent}
                                onChange={e => handleCreateContinentChange(e.target.value)}
                                style={{ ...createInputStyle, borderRadius: isNormalMode ? "4px" : "0" }}
                            >
                                <option value="">Selecteaza continent</option>
                                {locationContinentOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: "1 1 150px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Tara</label>
                            <select
                                required
                                value={formData.country}
                                onChange={e => setFormData({ ...formData, country: e.target.value })}
                                disabled={!formData.continent}
                                style={{
                                    ...createInputStyle,
                                    borderRadius: isNormalMode ? "4px" : "0",
                                    backgroundColor: !formData.continent ? "color-mix(in srgb, var(--sd-box-bg) 82%, var(--sd-border))" : "var(--sd-box-bg)",
                                }}
                            >
                                <option value="">Selecteaza tara</option>
                                {createCountryOptions.map(option => (
                                    <option key={option.country} value={option.country}>{option.country}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: "1 1 150px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Data inceput</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                style={{ ...createInputStyle, borderRadius: isNormalMode ? "4px" : "0" }}
                            />
                        </div>
                        <div style={{ flex: "1 1 150px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Data final</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                min={formData.startDate || undefined}
                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                style={{ ...createInputStyle, borderRadius: isNormalMode ? "4px" : "0" }}
                            />
                        </div>
                        <div>
                            <button
                                disabled={loading}
                                type="submit"
                                className={isNormalMode ? undefined : "sd-btn-primary"}
                                style={isNormalMode ? normalCreateSubmitStyle : { borderRadius: "0" }}
                            >
                                {loading ? "Se salveaza..." : "Adauga"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="sd-box">
                <div className="sd-box-header">
                    <h2>Competitii existente ({sortedCompetitions.length}/{competitions.length})</h2>
                </div>
                <div className="sd-box-content" style={{ padding: 0, overflowX: "auto" }}>
                    <div className="sd-table-toolbar">
                        <label htmlFor="competition-sport-filter" className="sd-table-toolbar-label">Sport</label>
                        <select
                            id="competition-sport-filter"
                            value={sportFilter}
                            onChange={e => setSportFilter(e.target.value)}
                            className="sd-input"
                            style={{ minWidth: "150px" }}
                        >
                            <option value="all">Toate sporturile</option>
                            <option value="fotbal">Fotbal</option>
                            <option value="tenis">Tenis</option>
                        </select>

                        <label htmlFor="competition-continent-filter" className="sd-table-toolbar-label">Continent</label>
                        <select
                            id="competition-continent-filter"
                            value={continentFilter}
                            onChange={e => {
                                setContinentFilter(e.target.value)
                                setCountryFilter("all")
                            }}
                            className="sd-input"
                            style={{ minWidth: "170px" }}
                        >
                            <option value="all">Toate continentele</option>
                            {locationContinentOptions.map(continent => (
                                <option key={continent} value={continent}>{continent}</option>
                            ))}
                        </select>

                        <label htmlFor="competition-country-filter" className="sd-table-toolbar-label">Tara</label>
                        <select
                            id="competition-country-filter"
                            value={countryFilter}
                            onChange={e => setCountryFilter(e.target.value)}
                            className="sd-input"
                            style={{ minWidth: "170px" }}
                        >
                            <option value="all">Toate tarile</option>
                            {Array.from(new Map(filterCountryOptions.map(option => [option.country, option])).values()).map(option => (
                                <option key={`${option.continent}-${option.country}`} value={option.country}>{option.country}</option>
                            ))}
                        </select>
                    </div>

                    {sortedCompetitions.length === 0 ? (
                        <div className="sd-empty-state">
                            <p>Nu exista nicio competitie pentru filtrele selectate.</p>
                        </div>
                    ) : (
                        <table className="sd-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th aria-sort={sortState("name")}>
                                        <TableSortHeader
                                            label="Nume competitie"
                                            ariaLabel="Sorteaza dupa numele competitiei"
                                            active={sortConfig.field === "name"}
                                            direction={sortConfig.direction}
                                            onSort={() => handleSort("name")}
                                        />
                                    </th>
                                    <th aria-sort={sortState("sport")}>
                                        <TableSortHeader
                                            label="Sport"
                                            ariaLabel="Sorteaza dupa sport"
                                            active={sortConfig.field === "sport"}
                                            direction={sortConfig.direction}
                                            onSort={() => handleSort("sport")}
                                        />
                                    </th>
                                    <th aria-sort={sortState("country")}>
                                        <TableSortHeader
                                            label="Tara"
                                            ariaLabel="Sorteaza dupa tara"
                                            active={sortConfig.field === "country"}
                                            direction={sortConfig.direction}
                                            onSort={() => handleSort("country")}
                                        />
                                    </th>
                                    <th aria-sort={sortState("continent")}>
                                        <TableSortHeader
                                            label="Continent"
                                            ariaLabel="Sorteaza dupa continent"
                                            active={sortConfig.field === "continent"}
                                            direction={sortConfig.direction}
                                            onSort={() => handleSort("continent")}
                                        />
                                    </th>
                                    <th>Durata</th>
                                    <th>Data crearii</th>
                                    <th style={{ textAlign: "right" }}>Actiuni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedCompetitions.map(comp => (
                                    <tr key={comp.id}>
                                        <td>#{comp.id}</td>
                                        <td style={{ fontWeight: "bold" }}>{comp.name}</td>
                                        <td>
                                            <span className="sd-badge sd-badge-tehnic">{sportLabel(comp.sport)}</span>
                                        </td>
                                        <td>{comp.country}</td>
                                        <td>{comp.continent}</td>
                                        <td>{formatCompetitionDuration(comp.startDate, comp.endDate)}</td>
                                        <td>{new Date(comp.createdAt).toLocaleDateString("ro-RO")}</td>
                                        <td style={{ textAlign: "right" }}>
                                            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                                                <button disabled={loading} type="button" onClick={() => openEditModal(comp)} style={isNormalMode ? { padding: "4px 10px", cursor: "pointer", background: "#f0f7ff", color: "#0050b3", border: "1px solid #91d5ff", borderRadius: "3px" } : { fontSize: "11px", border: "1px solid #0056b3", color: "#0056b3", backgroundColor: "transparent", padding: "2px 8px", cursor: "pointer" }}>Editeaza</button>
                                                <button disabled={loading} type="button" onClick={() => handleDelete(comp.id)} style={isNormalMode ? { padding: "4px 10px", cursor: "pointer", background: "#fff0f0", color: "red", border: "1px solid #ffcccc", borderRadius: "3px" } : { fontSize: "11px", border: "1px solid #c00", color: "#c00", backgroundColor: "transparent", padding: "2px 8px", cursor: "pointer" }}>Sterge</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
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
        </>
    )
}

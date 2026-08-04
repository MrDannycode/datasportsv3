"use client"

import { useMemo, useState } from "react"
import { useTableMode } from "@/components/table-mode-provider"
import TableSortHeader, { sortAriaValue, type SortDirection } from "@/components/table-sort-header"
import { assignFootballManagerLocation } from "./actions"

type Manager = {
    id: number
    email: string
    firstName: string
    lastName: string
    country: string | null
    continent: string | null
}

type LocationOption = {
    country: string
    continent: string
}

type SortField = "manager" | "country" | "continent"
type LocationFilter = "all" | string

const NO_ASSIGNMENT_LABEL = "Neasignat"

const normalSubmitStyle = {
    padding: "9px 20px",
    background: "#0070f3",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
}

interface Props {
    initialManagers: Manager[]
    locationOptions: LocationOption[]
}

export default function ManagerAssignmentManager({ initialManagers, locationOptions }: Props) {
    const { tableMode } = useTableMode()
    const isNormalMode = tableMode === "normal"
    const [managers, setManagers] = useState(initialManagers)
    const [selectedContinentByManager, setSelectedContinentByManager] = useState<Record<number, string>>(() => Object.fromEntries(
        initialManagers.flatMap(manager => manager.continent ? [[manager.id, manager.continent]] : [])
    ))
    const [selectedCountryByManager, setSelectedCountryByManager] = useState<Record<number, string>>(() => Object.fromEntries(
        initialManagers.flatMap(manager => manager.country ? [[manager.id, manager.country]] : [])
    ))
    const [savingManagerId, setSavingManagerId] = useState<number | null>(null)
    const [continentFilter, setContinentFilter] = useState<LocationFilter>("all")
    const [countryFilter, setCountryFilter] = useState<LocationFilter>("all")
    const [sortConfig, setSortConfig] = useState<{ field: SortField, direction: SortDirection }>({
        field: "manager",
        direction: "asc",
    })
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")

    const continentOptions = useMemo(() => {
        return Array.from(new Set(locationOptions.map(option => option.continent)))
    }, [locationOptions])

    const countriesByContinent = useMemo(() => {
        return locationOptions.reduce<Record<string, LocationOption[]>>((groups, option) => {
            groups[option.continent] = [...(groups[option.continent] ?? []), option]
            return groups
        }, {})
    }, [locationOptions])

    const managerLabel = (manager: Manager) => `${manager.firstName} ${manager.lastName}`.trim() || manager.email
    const countryLabel = (manager: Manager) => manager.country || NO_ASSIGNMENT_LABEL
    const continentLabel = (manager: Manager) => manager.continent || NO_ASSIGNMENT_LABEL

    const filterCountryOptions = useMemo(() => {
        if (continentFilter === NO_ASSIGNMENT_LABEL) {
            return []
        }

        const options = continentFilter === "all"
            ? locationOptions
            : locationOptions.filter(option => option.continent === continentFilter)

        return Array.from(new Set(options.map(option => option.country)))
    }, [locationOptions, continentFilter])

    const filteredManagers = useMemo(() => {
        return managers.filter(manager => {
            const matchesContinent = continentFilter === "all" || continentLabel(manager) === continentFilter
            const matchesCountry = countryFilter === "all" || countryLabel(manager) === countryFilter

            return matchesContinent && matchesCountry
        })
    }, [managers, continentFilter, countryFilter])

    const sortedManagers = useMemo(() => {
        return [...filteredManagers].sort((a, b) => {
            const getValue = (manager: Manager) => {
                if (sortConfig.field === "country") return countryLabel(manager)
                if (sortConfig.field === "continent") return continentLabel(manager)
                return managerLabel(manager)
            }
            const result = getValue(a).localeCompare(getValue(b), "ro", { sensitivity: "base" })

            if (result !== 0) {
                return sortConfig.direction === "asc" ? result : -result
            }

            return a.email.localeCompare(b.email, "ro", { sensitivity: "base" })
        })
    }, [filteredManagers, sortConfig])

    const handleSort = (field: SortField) => {
        setSortConfig((current) => ({
            field,
            direction: current.field === field && current.direction === "asc" ? "desc" : "asc",
        }))
    }

    const sortState = (field: SortField) => sortAriaValue(sortConfig.field === field, sortConfig.direction)

    const handleAssign = async (managerId: number) => {
        const continent = selectedContinentByManager[managerId] ?? ""
        const country = selectedCountryByManager[managerId] ?? ""

        if (!country || !continent) {
            setError("Selecteaza tara si continent pentru manager.")
            setMessage("")
            return
        }

        setSavingManagerId(managerId)
        setError("")
        setMessage("")

        const result = await assignFootballManagerLocation({ managerId, country, continent })

        if (result.error) {
            setError(result.error)
        } else if (result.manager) {
            const updatedManager = result.manager
            setManagers(currentManagers => currentManagers.map(manager => (
                manager.id === updatedManager.id
                    ? {
                        ...manager,
                        country: updatedManager.country,
                        continent: updatedManager.continent,
                    }
                    : manager
            )))
            setMessage("Asignarea managerului a fost actualizata.")
        }

        setSavingManagerId(null)
    }

    return (
        <div className="sd-box">

            <div className="sd-box-content">
                {error && <div style={{ color: "#c00", marginBottom: "12px", fontSize: "13px" }}>{error}</div>}
                {message && <div style={{ color: "#2a7a2a", marginBottom: "12px", fontSize: "13px" }}>{message}</div>}

                <div className="sd-table-toolbar" style={{ padding: "0 0 12px" }}>
                    <label htmlFor="manager-continent-filter" className="sd-table-toolbar-label">Continent</label>
                    <select
                        id="manager-continent-filter"
                        value={continentFilter}
                        onChange={event => {
                            setContinentFilter(event.target.value)
                            setCountryFilter("all")
                        }}
                        className="sd-input"
                        style={{ minWidth: "180px" }}
                    >
                        <option value="all">Toate continentele</option>
                        <option value={NO_ASSIGNMENT_LABEL}>{NO_ASSIGNMENT_LABEL}</option>
                        {continentOptions.map(continent => (
                            <option key={continent} value={continent}>{continent}</option>
                        ))}
                    </select>

                    <label htmlFor="manager-country-filter" className="sd-table-toolbar-label">Tara</label>
                    <select
                        id="manager-country-filter"
                        value={countryFilter}
                        onChange={event => setCountryFilter(event.target.value)}
                        className="sd-input"
                        style={{ minWidth: "180px" }}
                    >
                        <option value="all">Toate tarile</option>
                        <option value={NO_ASSIGNMENT_LABEL}>{NO_ASSIGNMENT_LABEL}</option>
                        {filterCountryOptions.map(country => (
                            <option key={country} value={country}>{country}</option>
                        ))}
                    </select>

                    {(continentFilter !== "all" || countryFilter !== "all") && (
                        <div className="sd-table-toolbar-actions">
                            <button
                                type="button"
                                onClick={() => {
                                    setContinentFilter("all")
                                    setCountryFilter("all")
                                }}
                                className="sd-btn-secondary"
                                style={{ borderRadius: isNormalMode ? "4px" : "0" }}
                            >
                                Reseteaza filtrele
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table className="sd-table sd-manager-assignment-table">
                        <thead>
                            <tr>
                                <th aria-sort={sortState("manager")}>
                                    <TableSortHeader
                                        label="Manager"
                                        ariaLabel="Sorteaza dupa manager"
                                        active={sortConfig.field === "manager"}
                                        direction={sortConfig.direction}
                                        onSort={() => handleSort("manager")}
                                    />
                                </th>
                                <th aria-sort={sortState("country") !== "none" ? sortState("country") : sortState("continent")}>
                                    <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                                        <TableSortHeader
                                            label="Tara"
                                            ariaLabel="Sorteaza dupa tara asignata"
                                            active={sortConfig.field === "country"}
                                            direction={sortConfig.direction}
                                            onSort={() => handleSort("country")}
                                            fontSize="11px"
                                        />
                                        <TableSortHeader
                                            label="Continent"
                                            ariaLabel="Sorteaza dupa continentul asignat"
                                            active={sortConfig.field === "continent"}
                                            direction={sortConfig.direction}
                                            onSort={() => handleSort("continent")}
                                            fontSize="11px"
                                        />
                                    </div>
                                </th>
                                <th>Continent</th>
                                <th>Tara</th>
                                <th>Actiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedManagers.map(manager => (
                                <tr key={manager.id}>
                                    <td>
                                        <strong>{manager.firstName} {manager.lastName}</strong>
                                        <div style={{ color: "#666", fontSize: "12px" }}>{manager.email}</div>
                                    </td>
                                    <td>
                                        {manager.country && manager.continent ? (
                                            <>
                                                <strong>{manager.country}</strong>
                                                <div style={{ color: "#666", fontSize: "12px" }}>{manager.continent}</div>
                                            </>
                                        ) : (
                                            <span style={{ color: "#999" }}>{NO_ASSIGNMENT_LABEL}</span>
                                        )}
                                    </td>
                                    <td>
                                        <select
                                            value={selectedContinentByManager[manager.id] ?? ""}
                                            onChange={event => {
                                                const continent = event.target.value
                                                setSelectedContinentByManager(current => ({ ...current, [manager.id]: continent }))
                                                setSelectedCountryByManager(current => ({ ...current, [manager.id]: "" }))
                                            }}
                                            disabled={savingManagerId === manager.id || continentOptions.length === 0}
                                            style={{ border: "1px solid #ccc", padding: "6px 10px", fontSize: "13px", backgroundColor: "#fff", minWidth: "180px" }}
                                        >
                                            <option value="">Selecteaza continent</option>
                                            {continentOptions.map(continent => (
                                                <option key={continent} value={continent}>{continent}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <select
                                            value={selectedCountryByManager[manager.id] ?? ""}
                                            onChange={event => setSelectedCountryByManager(current => ({ ...current, [manager.id]: event.target.value }))}
                                            disabled={savingManagerId === manager.id || !selectedContinentByManager[manager.id]}
                                            style={{ border: "1px solid #ccc", padding: "6px 10px", fontSize: "13px", backgroundColor: !selectedContinentByManager[manager.id] ? "#f3f4f6" : "#fff", minWidth: "180px" }}
                                        >
                                            <option value="">Selecteaza tara</option>
                                            {(countriesByContinent[selectedContinentByManager[manager.id] ?? ""] ?? []).map(option => (
                                                <option key={option.country} value={option.country}>{option.country}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            onClick={() => void handleAssign(manager.id)}
                                            disabled={savingManagerId === manager.id}
                                            className={isNormalMode ? undefined : "sd-btn-primary"}
                                            style={isNormalMode ? {
                                                ...normalSubmitStyle,
                                                cursor: savingManagerId === manager.id ? "not-allowed" : "pointer",
                                            } : {
                                                borderRadius: "0",
                                                cursor: savingManagerId === manager.id ? "not-allowed" : "pointer",
                                            }}
                                        >
                                            {savingManagerId === manager.id ? "Se salveaza..." : "Salveaza"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {sortedManagers.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", color: "#999", padding: "20px" }}>
                                        {managers.length === 0
                                            ? "Nu exista manageri de fotbal."
                                            : "Niciun manager gasit pentru filtrele selectate."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

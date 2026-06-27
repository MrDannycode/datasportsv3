"use client"

import { useMemo, useState } from "react"
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

interface Props {
    initialManagers: Manager[]
    locationOptions: LocationOption[]
}

export default function ManagerAssignmentManager({ initialManagers, locationOptions }: Props) {
    const [managers, setManagers] = useState(initialManagers)
    const [selectedContinentByManager, setSelectedContinentByManager] = useState<Record<number, string>>(() => Object.fromEntries(
        initialManagers.flatMap(manager => manager.continent ? [[manager.id, manager.continent]] : [])
    ))
    const [selectedCountryByManager, setSelectedCountryByManager] = useState<Record<number, string>>(() => Object.fromEntries(
        initialManagers.flatMap(manager => manager.country ? [[manager.id, manager.country]] : [])
    ))
    const [savingManagerId, setSavingManagerId] = useState<number | null>(null)
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
            <div className="sd-box-header">
                <h2>Gestiune Manageri</h2>
            </div>
            <div className="sd-box-content">
                {error && <div style={{ color: "#c00", marginBottom: "12px", fontSize: "13px" }}>{error}</div>}
                {message && <div style={{ color: "#2a7a2a", marginBottom: "12px", fontSize: "13px" }}>{message}</div>}

                <div style={{ overflowX: "auto" }}>
                    <table className="sd-table">
                        <thead>
                            <tr>
                                <th>Manager</th>
                                <th>Asignare curenta</th>
                                <th>Continent</th>
                                <th>Tara</th>
                                <th>Actiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {managers.map(manager => (
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
                                            <span style={{ color: "#999" }}>Neasignat</span>
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
                                            style={{
                                                border: "1px solid #0056b3",
                                                color: "#0056b3",
                                                backgroundColor: "transparent",
                                                padding: "4px 10px",
                                                cursor: savingManagerId === manager.id ? "not-allowed" : "pointer",
                                            }}
                                        >
                                            {savingManagerId === manager.id ? "Se salveaza..." : "Salveaza"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {managers.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", color: "#999", padding: "20px" }}>
                                        Nu exista manageri de fotbal.
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

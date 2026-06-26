"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { normalizeTournamentFilters } from "@/lib/tournament-filters"

type SyncResult = {
    success: boolean
    tourneeSincronizate: number
    jucatoriActualizati: number
    timestamp: string
}

type FilterOption = {
    label: string
    value: string
}

type Props = {
    redirectPath?: string
    enableFilters?: boolean
    initialCountry?: string
    initialContinent?: string
    initialDateFrom?: string
    countryOptions?: FilterOption[]
    continentOptions?: FilterOption[]
}

export default function TournamentSyncButton({
    redirectPath = "",
    enableFilters = false,
    initialCountry = "",
    initialContinent = "",
    initialDateFrom = "",
    countryOptions = [],
    continentOptions = [],
}: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<SyncResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [country, setCountry] = useState(initialCountry)
    const [continent, setContinent] = useState(initialContinent)
    const [dateFrom, setDateFrom] = useState(initialDateFrom)

    async function handleSync(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setResult(null)

        const filters = normalizeTournamentFilters({ country, continent, dateFrom })

        try {
            const res = await fetch("/api/tournaments/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(filters),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data?.error ?? `Eroare HTTP ${res.status}`)
            }
            const data: SyncResult = await res.json()
            setResult(data)

            if (redirectPath) {
                const params = new URLSearchParams()
                if (filters.country) params.set("country", filters.country)
                if (filters.continent) params.set("continent", filters.continent)
                if (filters.dateFrom) params.set("dateFrom", filters.dateFrom)
                const nextUrl = params.size > 0 ? `${redirectPath}?${params.toString()}` : redirectPath
                router.push(nextUrl)
                router.refresh()
                return
            }

            window.location.reload()
        } catch (e) {
            setError(e instanceof Error ? e.message : "Eroare necunoscuta")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form className="sd-sync-bar" onSubmit={handleSync}>
            {enableFilters && (
                <>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 180 }}>
                        <span style={{ fontSize: 12, color: "#555", fontWeight: "bold" }}>Tara</span>
                        <input
                            type="text"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            list="tournament-country-options"
                            placeholder="Ex: Romania"
                            style={{ padding: "8px 10px", border: "1px solid #d6d6d6", backgroundColor: "#fff", fontSize: 13 }}
                        />
                        <datalist id="tournament-country-options">
                            {countryOptions.map((option) => (
                                <option key={option.value} value={option.value} label={option.label} />
                            ))}
                        </datalist>
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 180 }}>
                        <span style={{ fontSize: 12, color: "#555", fontWeight: "bold" }}>Continent</span>
                        <input
                            type="text"
                            value={continent}
                            onChange={(e) => setContinent(e.target.value)}
                            list="tournament-continent-options"
                            placeholder="Ex: Europe"
                            style={{ padding: "8px 10px", border: "1px solid #d6d6d6", backgroundColor: "#fff", fontSize: 13 }}
                        />
                        <datalist id="tournament-continent-options">
                            {continentOptions.map((option) => (
                                <option key={option.value} value={option.value} label={option.label} />
                            ))}
                        </datalist>
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 180 }}>
                        <span style={{ fontSize: 12, color: "#555", fontWeight: "bold" }}>Data de la</span>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            style={{ padding: "8px 10px", border: "1px solid #d6d6d6", backgroundColor: "#fff", fontSize: 13 }}
                        />
                    </label>
                </>
            )}

            <button
                id="tournament-sync-btn"
                className="sd-btn-primary"
                type="submit"
                disabled={loading}
                style={{ minWidth: 160, alignSelf: "flex-end" }}
            >
                {loading ? "Se sincronizeaza..." : "Actualizare date turnee"}
            </button>

            <div className="sd-sync-status">
                {result && !loading && (
                    <span style={{ color: "#166534" }}>
                        {result.tourneeSincronizate} turnee sincronizate, {" "}
                        {result.jucatoriActualizati} jucatori actualizati
                    </span>
                )}
                {error && (
                    <span style={{ color: "#991b1b" }}>
                        {error}
                    </span>
                )}
                {!result && !error && !loading && (
                    <span>
                        Se cauta doar turnee si liste de acceptare de pe itftennis.com.
                    </span>
                )}
            </div>
        </form>
    )
}

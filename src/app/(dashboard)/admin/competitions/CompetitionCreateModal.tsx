"use client"

import { MANAGER_LOCATION_OPTIONS } from "@/lib/manager-locations"

interface Props {
    name: string
    sport: "fotbal" | "tenis"
    country: string
    continent: string
    startDate: string
    endDate: string
    loading: boolean
    error: string
    success: string
    onNameChange: (value: string) => void
    onSportChange: (value: "fotbal" | "tenis") => void
    onCountryChange: (value: string) => void
    onContinentChange: (value: string) => void
    onStartDateChange: (value: string) => void
    onEndDateChange: (value: string) => void
    onClose: () => void
    onSubmit: (e: React.FormEvent) => Promise<void>
}

const continentOptions = Array.from(new Set(MANAGER_LOCATION_OPTIONS.map(option => option.continent)))

const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "4px",
    border: "1px solid var(--sd-border)",
    backgroundColor: "var(--sd-box-bg)",
    color: "var(--sd-text)",
}

export default function CompetitionCreateModal({
    name,
    sport,
    country,
    continent,
    startDate,
    endDate,
    loading,
    error,
    success,
    onNameChange,
    onSportChange,
    onCountryChange,
    onContinentChange,
    onStartDateChange,
    onEndDateChange,
    onClose,
    onSubmit,
}: Props) {
    const countryOptions = MANAGER_LOCATION_OPTIONS.filter(option => option.continent === continent)

    const handleContinentChange = (value: string) => {
        onContinentChange(value)
        if (!MANAGER_LOCATION_OPTIONS.some(option => option.continent === value && option.country === country)) {
            onCountryChange("")
        }
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-competition-modal-title"
            onClick={onClose}
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
                    maxWidth: "720px",
                    backgroundColor: "var(--sd-box-bg)",
                    color: "var(--sd-text)",
                    border: "1px solid var(--sd-border)",
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
                        borderBottom: "1px solid var(--sd-border)",
                    }}
                >
                    <div>
                        <h2 id="new-competition-modal-title" style={{ margin: 0 }}>Adauga competitie noua</h2>
                        <p style={{ margin: "6px 0 0", color: "color-mix(in srgb, var(--sd-text) 68%, transparent)", fontSize: "13px" }}>
                            Completeaza datele de baza si durata de desfasurare.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ border: "none", background: "transparent", fontSize: "24px", lineHeight: 1, cursor: "pointer", color: "var(--sd-text)" }}
                        aria-label="Inchide"
                    >
                        x
                    </button>
                </div>

                <div style={{ padding: "22px" }}>
                    {error && <div style={{ color: "#f87171", marginBottom: "10px", padding: "10px", background: "rgba(248, 113, 113, 0.14)", borderRadius: "5px" }}>{error}</div>}
                    {success && <div style={{ color: "#22c55e", marginBottom: "10px", padding: "10px", background: "rgba(34, 197, 94, 0.14)", borderRadius: "5px" }}>{success}</div>}

                    <form onSubmit={onSubmit} style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
                        <div style={{ flex: "2 1 280px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Nume Competitie</label>
                            <input
                                required
                                type="text"
                                placeholder="ex: Liga 1"
                                value={name}
                                onChange={e => onNameChange(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ flex: "1 1 180px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Sport</label>
                            <select
                                required
                                value={sport}
                                onChange={e => onSportChange(e.target.value as "fotbal" | "tenis")}
                                style={inputStyle}
                            >
                                <option value="fotbal">Fotbal</option>
                                <option value="tenis">Tenis</option>
                            </select>
                        </div>
                        <div style={{ flex: "1 1 180px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Continent</label>
                            <select
                                required
                                value={continent}
                                onChange={e => handleContinentChange(e.target.value)}
                                style={inputStyle}
                            >
                                <option value="">Selecteaza continent</option>
                                {continentOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: "1 1 180px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Tara</label>
                            <select
                                required
                                value={country}
                                onChange={e => onCountryChange(e.target.value)}
                                disabled={!continent}
                                style={{ ...inputStyle, backgroundColor: !continent ? "color-mix(in srgb, var(--sd-box-bg) 82%, var(--sd-border))" : "var(--sd-box-bg)" }}
                            >
                                <option value="">Selecteaza tara</option>
                                {countryOptions.map(option => (
                                    <option key={option.country} value={option.country}>{option.country}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: "1 1 180px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Data inceput</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => onStartDateChange(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ flex: "1 1 180px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Data final</label>
                            <input
                                type="date"
                                value={endDate}
                                min={startDate || undefined}
                                onChange={e => onEndDateChange(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", width: "100%", marginTop: "8px" }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{ border: "1px solid var(--sd-border)", background: "var(--sd-box-bg)", color: "var(--sd-text)", padding: "9px 18px", cursor: "pointer" }}
                            >
                                Anuleaza
                            </button>
                            <button
                                disabled={loading}
                                type="submit"
                                style={{ padding: "9px 20px", background: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                            >
                                {loading ? "Se salveaza..." : "Adauga"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

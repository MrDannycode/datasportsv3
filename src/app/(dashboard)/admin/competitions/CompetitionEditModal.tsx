"use client"

import BaseModal, { ModalActions, modalInputStyle, useModalRadius } from "@/components/base-modal"
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

export default function CompetitionEditModal({
    name,
    sport,
    country,
    continent,
    startDate,
    endDate,
    loading,
    error,
    onNameChange,
    onSportChange,
    onCountryChange,
    onContinentChange,
    onStartDateChange,
    onEndDateChange,
    onClose,
    onSubmit,
}: Props) {
    const radius = useModalRadius()
    const countryOptions = MANAGER_LOCATION_OPTIONS.filter(option => option.continent === continent)

    const handleContinentChange = (value: string) => {
        onContinentChange(value)
        if (!MANAGER_LOCATION_OPTIONS.some(option => option.continent === value && option.country === country)) {
            onCountryChange("")
        }
    }

    return (
        <BaseModal
            modalId="edit-competition-modal-title"
            title="Editeaza competitie"
            subtitle="Actualizeaza datele competitiei si durata de desfasurare."
            maxWidth="720px"
            onClose={onClose}
        >
            {error && <div style={{ color: "#f87171", marginBottom: "10px", padding: "10px", background: "rgba(248, 113, 113, 0.14)", borderRadius: "5px" }}>{error}</div>}

            <form onSubmit={onSubmit} style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: "2 1 280px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Nume Competitie</label>
                    <input
                        required
                        type="text"
                        placeholder="ex: Liga 1"
                        value={name}
                        onChange={e => onNameChange(e.target.value)}
                        style={{ ...modalInputStyle, width: "100%", borderRadius: radius }}
                    />
                </div>
                <div style={{ flex: "1 1 180px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Sport</label>
                    <select
                        required
                        value={sport}
                        onChange={e => onSportChange(e.target.value as "fotbal" | "tenis")}
                        style={{ ...modalInputStyle, width: "100%", borderRadius: radius }}
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
                        style={{ ...modalInputStyle, width: "100%", borderRadius: radius }}
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
                        style={{
                            ...modalInputStyle,
                            width: "100%",
                            borderRadius: radius,
                            backgroundColor: !continent ? "color-mix(in srgb, var(--sd-box-bg) 82%, var(--sd-border))" : "var(--sd-box-bg)",
                        }}
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
                        style={{ ...modalInputStyle, width: "100%", borderRadius: radius }}
                    />
                </div>
                <div style={{ flex: "1 1 180px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Data final</label>
                    <input
                        type="date"
                        value={endDate}
                        min={startDate || undefined}
                        onChange={e => onEndDateChange(e.target.value)}
                        style={{ ...modalInputStyle, width: "100%", borderRadius: radius }}
                    />
                </div>

                <ModalActions
                    onClose={onClose}
                    loading={loading}
                    submitLabel="Salveaza"
                    loadingLabel="Se salveaza..."
                />
            </form>
        </BaseModal>
    )
}

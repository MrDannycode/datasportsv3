"use client"

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
    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-competition-modal-title"
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
                    backgroundColor: "#fff",
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
                        borderBottom: "1px solid #e5e7eb",
                    }}
                >
                    <div>
                        <h2 id="edit-competition-modal-title" style={{ margin: 0 }}>Editeaza competitie</h2>
                        <p style={{ margin: "6px 0 0", color: "#666", fontSize: "13px" }}>
                            Actualizeaza datele competitiei si durata de desfasurare.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ border: "none", background: "transparent", fontSize: "24px", lineHeight: 1, cursor: "pointer", color: "#666" }}
                        aria-label="Inchide"
                    >
                        x
                    </button>
                </div>

                <div style={{ padding: "22px" }}>
                    {error && <div style={{ color: "red", marginBottom: "10px", padding: "10px", background: "#fee", borderRadius: "5px" }}>{error}</div>}

                    <form onSubmit={onSubmit} style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
                        <div style={{ flex: "2 1 280px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Nume Competitie</label>
                            <input
                                required
                                type="text"
                                placeholder="ex: Liga 1"
                                value={name}
                                onChange={e => onNameChange(e.target.value)}
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "4px", border: "1px solid #ccc" }}
                            />
                        </div>
                        <div style={{ flex: "1 1 180px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Sport</label>
                            <select
                                required
                                value={sport}
                                onChange={e => onSportChange(e.target.value as "fotbal" | "tenis")}
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "4px", border: "1px solid #ccc" }}
                            >
                                <option value="fotbal">Fotbal</option>
                                <option value="tenis">Tenis</option>
                            </select>
                        </div>
                        <div style={{ flex: "1 1 180px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Tara</label>
                            <input
                                required
                                type="text"
                                placeholder="ex: Romania"
                                value={country}
                                onChange={e => onCountryChange(e.target.value)}
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "4px", border: "1px solid #ccc" }}
                            />
                        </div>
                        <div style={{ flex: "1 1 180px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Continent</label>
                            <input
                                required
                                type="text"
                                placeholder="ex: Europa"
                                value={continent}
                                onChange={e => onContinentChange(e.target.value)}
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "4px", border: "1px solid #ccc" }}
                            />
                        </div>
                        <div style={{ flex: "1 1 180px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Data inceput</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => onStartDateChange(e.target.value)}
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "4px", border: "1px solid #ccc" }}
                            />
                        </div>
                        <div style={{ flex: "1 1 180px" }}>
                            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Data final</label>
                            <input
                                type="date"
                                value={endDate}
                                min={startDate || undefined}
                                onChange={e => onEndDateChange(e.target.value)}
                                style={{ width: "100%", padding: "10px 12px", borderRadius: "4px", border: "1px solid #ccc" }}
                            />
                        </div>
                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", width: "100%", marginTop: "8px" }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{ border: "1px solid #ccc", background: "#fff", padding: "9px 18px", cursor: "pointer" }}
                            >
                                Anuleaza
                            </button>
                            <button
                                disabled={loading}
                                type="submit"
                                style={{ padding: "9px 20px", background: loading ? "#aaa" : "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold" }}
                            >
                                {loading ? "Se salveaza..." : "Salveaza"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

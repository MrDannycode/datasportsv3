"use client"

interface Props {
    name: string
    sport: "fotbal" | "tenis"
    loading: boolean
    error: string
    success: string
    onNameChange: (value: string) => void
    onSportChange: (value: "fotbal" | "tenis") => void
    onClose: () => void
    onSubmit: (e: React.FormEvent) => Promise<void>
}

export default function CompetitionCreateModal({
    name,
    sport,
    loading,
    error,
    success,
    onNameChange,
    onSportChange,
    onClose,
    onSubmit,
}: Props) {
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
                        <h2 id="new-competition-modal-title" style={{ margin: 0 }}>Adauga competitie noua</h2>
                        <p style={{ margin: "6px 0 0", color: "#666", fontSize: "13px" }}>
                            Completeaza datele de baza pentru competitia noua.
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
                    {success && <div style={{ color: "green", marginBottom: "10px", padding: "10px", background: "#efe", borderRadius: "5px" }}>{success}</div>}

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
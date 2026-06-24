"use client"

const ALL_ROLES = [
    { value: "admin_global", label: "Admin Global" },
    { value: "manager_fotbal", label: "Manager Fotbal" },
    { value: "manager_tenis", label: "Manager Tenis" },
    { value: "antrenor_fotbal", label: "Antrenor Fotbal" },
    { value: "antrenor_fitness", label: "Antrenor Fitness" },
    { value: "medic", label: "Medic" },
    { value: "atlet_fotbal", label: "Atlet Fotbal" },
    { value: "atlet_tenis", label: "Atlet Tenis" },
]

interface Props {
    email: string
    password: string
    role: string
    saving: boolean
    formError: string
    onEmailChange: (value: string) => void
    onPasswordChange: (value: string) => void
    onRoleChange: (value: string) => void
    onClose: () => void
    onSubmit: (e: React.FormEvent) => Promise<void>
}

export default function UserEditModal({
    email,
    password,
    role,
    saving,
    formError,
    onEmailChange,
    onPasswordChange,
    onRoleChange,
    onClose,
    onSubmit,
}: Props) {
    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-user-modal-title"
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
                    maxWidth: "760px",
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
                        <h2 id="edit-user-modal-title" style={{ margin: 0 }}>Editeaza utilizator</h2>
                        <p style={{ margin: "6px 0 0", color: "#666", fontSize: "13px" }}>
                            Actualizeaza emailul, rolul sau parola contului.
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
                    <form onSubmit={onSubmit} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 180px" }}>
                            <label style={{ fontSize: "12px", fontWeight: "bold" }}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => onEmailChange(e.target.value)}
                                required
                                style={{ border: "1px solid #ccc", padding: "10px 12px", fontSize: "13px" }}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 160px" }}>
                            <label style={{ fontSize: "12px", fontWeight: "bold" }}>Parola noua</label>
                            <input
                                type="text"
                                value={password}
                                onChange={e => onPasswordChange(e.target.value)}
                                placeholder="lasa gol pentru neschimbata"
                                style={{ border: "1px solid #ccc", padding: "10px 12px", fontSize: "13px" }}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 160px" }}>
                            <label style={{ fontSize: "12px", fontWeight: "bold" }}>Rol</label>
                            <select
                                value={role}
                                onChange={e => onRoleChange(e.target.value)}
                                style={{ border: "1px solid #ccc", padding: "10px 12px", fontSize: "13px", backgroundColor: "#fff" }}
                            >
                                {ALL_ROLES.map(currentRole => (
                                    <option key={currentRole.value} value={currentRole.value}>{currentRole.label}</option>
                                ))}
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
                                type="submit"
                                disabled={saving}
                                style={{
                                    backgroundColor: saving ? "#aaa" : "#0056b3",
                                    color: "#fff",
                                    border: "none",
                                    padding: "9px 20px",
                                    fontSize: "13px",
                                    fontWeight: "bold",
                                    cursor: saving ? "not-allowed" : "pointer",
                                }}
                            >
                                {saving ? "Se salveaza..." : "Salveaza"}
                            </button>
                        </div>
                    </form>

                    {formError && (
                        <p style={{ color: "#c00", fontSize: "12px", marginTop: "10px" }}>{formError}</p>
                    )}
                </div>
            </div>
        </div>
    )
}
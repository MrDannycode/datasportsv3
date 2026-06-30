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

const inputStyle = {
    border: "1px solid var(--sd-border)",
    backgroundColor: "var(--sd-box-bg)",
    color: "var(--sd-text)",
    padding: "10px 12px",
    fontSize: "13px",
}

interface Props {
    email: string
    password: string
    role: string
    creating: boolean
    formError: string
    formSuccess: string
    onEmailChange: (value: string) => void
    onPasswordChange: (value: string) => void
    onRoleChange: (value: string) => void
    onClose: () => void
    onSubmit: (e: React.FormEvent) => Promise<void>
}

export default function UserCreateModal({
    email,
    password,
    role,
    creating,
    formError,
    formSuccess,
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
            aria-labelledby="new-user-modal-title"
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
                        <h2 id="new-user-modal-title" style={{ margin: 0 }}>Adauga utilizator nou</h2>
                        <p style={{ margin: "6px 0 0", color: "color-mix(in srgb, var(--sd-text) 68%, transparent)", fontSize: "13px" }}>
                            Completeaza datele de baza pentru contul nou.
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
                    <form onSubmit={onSubmit} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 180px" }}>
                            <label style={{ fontSize: "12px", fontWeight: "bold" }}>Email</label>
                            <input
                                id="new-user-email"
                                type="email"
                                value={email}
                                onChange={e => onEmailChange(e.target.value)}
                                required
                                placeholder="user@example.com"
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 160px" }}>
                            <label style={{ fontSize: "12px", fontWeight: "bold" }}>Parola</label>
                            <input
                                id="new-user-password"
                                type="text"
                                value={password}
                                onChange={e => onPasswordChange(e.target.value)}
                                required
                                placeholder="parola temporara"
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 160px" }}>
                            <label style={{ fontSize: "12px", fontWeight: "bold" }}>Rol</label>
                            <select
                                id="new-user-role"
                                value={role}
                                onChange={e => onRoleChange(e.target.value)}
                                style={inputStyle}
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
                                style={{ border: "1px solid var(--sd-border)", background: "var(--sd-box-bg)", color: "var(--sd-text)", padding: "9px 18px", cursor: "pointer" }}
                            >
                                Anuleaza
                            </button>
                            <button
                                id="new-user-submit"
                                type="submit"
                                disabled={creating}
className="sd-btn-primary"
                            >
                                {creating ? "Se creeaza..." : "Creeaza"}
                            </button>
                        </div>
                    </form>

                    {formError && (
                        <p style={{ color: "#c00", fontSize: "12px", marginTop: "10px" }}>{formError}</p>
                    )}
                    {formSuccess && (
                        <p style={{ color: "#2a7a2a", fontSize: "12px", marginTop: "10px" }}>{formSuccess}</p>
                    )}
                </div>
            </div>
        </div>
    )
}

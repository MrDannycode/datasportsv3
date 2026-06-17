"use client"

import { useState } from "react"
import { createUser, deleteUser } from "./actions"

const ALL_ROLES = [
    { value: "admin_global",     label: "Admin Global" },
    { value: "manager_fotbal",   label: "Manager Fotbal" },
    { value: "manager_tenis",    label: "Manager Tenis" },
    { value: "antrenor_fotbal",  label: "Antrenor Fotbal" },
    { value: "antrenor_fitness", label: "Antrenor Fitness" },
    { value: "medic",            label: "Medic" },
    { value: "atlet_fotbal",     label: "Atlet Fotbal" },
    { value: "atlet_tenis",      label: "Atlet Tenis" },
]

interface User {
    id: number
    email: string
    role: string
    createdAt: Date | string
}

interface Props {
    initialUsers: User[]
}

export default function UsersManager({ initialUsers }: Props) {
    const [users, setUsers] = useState<User[]>(initialUsers)

    // Form state
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState("atlet_fotbal")
    const [creating, setCreating] = useState(false)
    const [formError, setFormError] = useState("")
    const [formSuccess, setFormSuccess] = useState("")

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        setCreating(true)
        setFormError("")
        setFormSuccess("")

        const result = await createUser({ email, password, role })

        if (result.error) {
            setFormError(result.error)
        } else if (result.user) {
            setUsers([result.user, ...users])
            setFormSuccess(`Utilizatorul ${result.user.email} a fost creat cu succes.`)
            setEmail("")
            setPassword("")
            setRole("atlet_fotbal")
        }
        setCreating(false)
    }

    async function handleDelete(id: number, userEmail: string) {
        if (!confirm(`Ștergi utilizatorul ${userEmail}?`)) return
        
        const result = await deleteUser(id)
        if (result.success) {
            setUsers(users.filter(u => u.id !== id))
        } else {
            alert(result.error ?? "Eroare la ștergere")
        }
    }

    const roleLabel = (r: string) => ALL_ROLES.find(x => x.value === r)?.label ?? r

    return (
        <>
            {/* ── Create user form ─────────────────────────────── */}
            <div className="sd-box" style={{ marginBottom: "24px" }}>
                <div className="sd-box-header">
                    <h2>Adaugă utilizator nou</h2>
                </div>
                <div className="sd-box-content">
                    <form onSubmit={handleCreate} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 180px" }}>
                            <label style={{ fontSize: "12px", fontWeight: "bold" }}>Email</label>
                            <input
                                id="new-user-email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                placeholder="user@example.com"
                                style={{ border: "1px solid #ccc", padding: "6px 10px", fontSize: "13px" }}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 160px" }}>
                            <label style={{ fontSize: "12px", fontWeight: "bold" }}>Parolă</label>
                            <input
                                id="new-user-password"
                                type="text"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="parolă temporară"
                                style={{ border: "1px solid #ccc", padding: "6px 10px", fontSize: "13px" }}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 160px" }}>
                            <label style={{ fontSize: "12px", fontWeight: "bold" }}>Rol</label>
                            <select
                                id="new-user-role"
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                style={{ border: "1px solid #ccc", padding: "6px 10px", fontSize: "13px", backgroundColor: "#fff" }}
                            >
                                {ALL_ROLES.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            id="new-user-submit"
                            type="submit"
                            disabled={creating}
                            style={{
                                backgroundColor: creating ? "#aaa" : "#0056b3",
                                color: "#fff",
                                border: "none",
                                padding: "7px 20px",
                                fontSize: "13px",
                                fontWeight: "bold",
                                cursor: creating ? "not-allowed" : "pointer",
                                alignSelf: "flex-end",
                            }}
                        >
                            {creating ? "Se creează..." : "Creează"}
                        </button>
                    </form>

                    {formError && (
                        <p style={{ color: "#c00", fontSize: "12px", marginTop: "10px" }}>{formError}</p>
                    )}
                    {formSuccess && (
                        <p style={{ color: "#2a7a2a", fontSize: "12px", marginTop: "10px" }}>{formSuccess}</p>
                    )}
                </div>
            </div>

            {/* ── Users table ──────────────────────────────────── */}
            <div className="sd-box">
                <div className="sd-box-header">
                    <h2>Toți utilizatorii ({users.length})</h2>
                </div>
                <div className="sd-box-content" style={{ padding: 0 }}>
                    <table className="sd-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Creat la</th>
                                <th>Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td style={{ color: "#999" }}>{u.id}</td>
                                    <td>{u.email}</td>
                                    <td>
                                        <span style={{
                                            backgroundColor: "#e8f0fb",
                                            color: "#0056b3",
                                            padding: "2px 8px",
                                            fontSize: "11px",
                                            fontWeight: "bold",
                                            borderRadius: "2px",
                                        }}>
                                            {roleLabel(u.role)}
                                        </span>
                                    </td>
                                    <td style={{ color: "#666", fontSize: "12px" }}>
                                        {new Date(u.createdAt).toLocaleDateString("ro-RO")}
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleDelete(u.id, u.email)}
                                            style={{
                                                fontSize: "11px",
                                                border: "1px solid #c00",
                                                color: "#c00",
                                                backgroundColor: "transparent",
                                                padding: "2px 8px",
                                                cursor: "pointer",
                                            }}
                                        >
                                            Șterge
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", color: "#999", padding: "20px" }}>
                                        Niciun utilizator găsit.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}

"use client"

import { useEffect, useRef, useState } from "react"
import UserCreateModal from "./UserCreateModal"
import { createUser, deleteUser } from "./actions"

interface User {
    id: number
    email: string
    role: string
    createdAt: Date | string
}

interface Props {
    initialUsers: User[]
    shouldOpenNewUserModal?: boolean
}

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

export default function UsersManager({ initialUsers, shouldOpenNewUserModal = false }: Props) {
    const [users, setUsers] = useState<User[]>(initialUsers)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState("atlet_fotbal")
    const [creating, setCreating] = useState(false)
    const [formError, setFormError] = useState("")
    const [formSuccess, setFormSuccess] = useState("")
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const hasOpenedFromQueryRef = useRef(false)

    useEffect(() => {
        if (!shouldOpenNewUserModal || hasOpenedFromQueryRef.current) {
            return
        }

        hasOpenedFromQueryRef.current = true
        setIsCreateModalOpen(true)
    }, [shouldOpenNewUserModal])

    const closeCreateModal = () => {
        setIsCreateModalOpen(false)
        setFormError("")
        setFormSuccess("")
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        setCreating(true)
        setFormError("")
        setFormSuccess("")

        const result = await createUser({ email, password, role })

        if (result.error) {
            setFormError(result.error)
        } else if (result.user) {
            setUsers(currentUsers => [result.user, ...currentUsers])
            setFormSuccess(`Utilizatorul ${result.user.email} a fost creat cu succes.`)
            setEmail("")
            setPassword("")
            setRole("atlet_fotbal")
            setIsCreateModalOpen(false)
        }

        setCreating(false)
    }

    async function handleDelete(id: number, userEmail: string) {
        if (!confirm(`Stergi utilizatorul ${userEmail}?`)) return

        const result = await deleteUser(id)
        if (result.success) {
            setUsers(currentUsers => currentUsers.filter(user => user.id !== id))
        } else {
            alert(result.error ?? "Eroare la stergere")
        }
    }

    const roleLabel = (value: string) => ALL_ROLES.find(currentRole => currentRole.value === value)?.label ?? value

    return (
        <>
            <div className="sd-box" style={{ marginBottom: "24px" }}>
                <div className="sd-box-header">
                    <h2>Adauga utilizator nou</h2>
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
                            <label style={{ fontSize: "12px", fontWeight: "bold" }}>Parola</label>
                            <input
                                id="new-user-password"
                                type="text"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="parola temporara"
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
                                {ALL_ROLES.map(currentRole => (
                                    <option key={currentRole.value} value={currentRole.value}>{currentRole.label}</option>
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
                            {creating ? "Se creeaza..." : "Creeaza"}
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

            <div className="sd-box">
                <div className="sd-box-header">
                    <h2>Toti utilizatorii ({users.length})</h2>
                </div>
                <div className="sd-box-content" style={{ padding: 0 }}>
                    <table className="sd-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Creat la</th>
                                <th>Actiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td style={{ color: "#999" }}>{user.id}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span style={{
                                            backgroundColor: "#e8f0fb",
                                            color: "#0056b3",
                                            padding: "2px 8px",
                                            fontSize: "11px",
                                            fontWeight: "bold",
                                            borderRadius: "2px",
                                        }}>
                                            {roleLabel(user.role)}
                                        </span>
                                    </td>
                                    <td style={{ color: "#666", fontSize: "12px" }}>
                                        {new Date(user.createdAt).toLocaleDateString("ro-RO")}
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleDelete(user.id, user.email)}
                                            style={{
                                                fontSize: "11px",
                                                border: "1px solid #c00",
                                                color: "#c00",
                                                backgroundColor: "transparent",
                                                padding: "2px 8px",
                                                cursor: "pointer",
                                            }}
                                        >
                                            Sterge
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", color: "#999", padding: "20px" }}>
                                        Niciun utilizator gasit.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isCreateModalOpen && (
                <UserCreateModal
                    email={email}
                    password={password}
                    role={role}
                    creating={creating}
                    formError={formError}
                    formSuccess={formSuccess}
                    onEmailChange={setEmail}
                    onPasswordChange={setPassword}
                    onRoleChange={setRole}
                    onClose={closeCreateModal}
                    onSubmit={handleCreate}
                />
            )}
        </>
    )
}
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useTableMode } from "@/components/table-mode-provider"
import TableSortHeader, { sortAriaValue, type SortDirection } from "@/components/table-sort-header"
import UserCreateModal from "./UserCreateModal"
import UserEditModal from "./UserEditModal"
import { createUser, deleteUser, updateUser } from "./actions"
import { MANAGER_LOCATION_OPTIONS } from "@/lib/manager-locations"

interface User {
    id: number
    email: string
    role: string
    createdAt: Date | string
    country?: string | null
    continent?: string | null
}

interface Props {
    initialUsers: User[]
    shouldOpenNewUserModal?: boolean
    initialRoleFilter?: string
}

type SortField = "email" | "role"
type RoleFilter = "all" | string
type LocationFilter = "all" | string

const NO_COUNTRY_LABEL = "Fara tara"
const NO_CONTINENT_LABEL = "Fara continent"
const locationContinentOptions = Array.from(new Set(MANAGER_LOCATION_OPTIONS.map(option => option.continent)))

const createInputStyle = {
    border: "1px solid var(--sd-border)",
    backgroundColor: "var(--sd-box-bg)",
    color: "var(--sd-text)",
    padding: "10px 12px",
    fontSize: "13px",
}

const normalCreateSubmitStyle = {
    padding: "9px 20px",
    background: "#0070f3",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
}

const ALL_ROLES = [
    { value: "admin_global", label: "Admin Global" },
    { value: "manager_fotbal", label: "Manager Fotbal" },
    // { value: "manager_tenis", label: "Manager Tenis" },
    { value: "antrenor_fotbal", label: "Antrenor Fotbal" },
    { value: "antrenor_fitness", label: "Antrenor Fitness" },
    { value: "medic", label: "Medic" },
    { value: "atlet_fotbal", label: "Atlet Fotbal" },
    { value: "atlet_tenis", label: "Atlet Tenis" },
]

export default function UsersManager({ initialUsers, shouldOpenNewUserModal = false, initialRoleFilter }: Props) {
    const { tableMode } = useTableMode()
    const isNormalMode = tableMode === "normal"
    const defaultRoleFilter: RoleFilter = ALL_ROLES.some(currentRole => currentRole.value === initialRoleFilter) ? initialRoleFilter ?? "all" : "all"
    const [users, setUsers] = useState<User[]>(initialUsers)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState("atlet_fotbal")
    const [creating, setCreating] = useState(false)
    const [formError, setFormError] = useState("")
    const [formSuccess, setFormSuccess] = useState("")
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [editEmail, setEditEmail] = useState("")
    const [editPassword, setEditPassword] = useState("")
    const [editRole, setEditRole] = useState("atlet_fotbal")
    const [editing, setEditing] = useState(false)
    const [editError, setEditError] = useState("")
    const [roleFilter, setRoleFilter] = useState<RoleFilter>(defaultRoleFilter)
    const [countryFilter, setCountryFilter] = useState<LocationFilter>("all")
    const [continentFilter, setContinentFilter] = useState<LocationFilter>("all")
    const [sortConfig, setSortConfig] = useState<{ field: SortField, direction: SortDirection }>({
        field: "email",
        direction: "asc",
    })
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

    function openEditModal(user: User) {
        setEditingUser(user)
        setEditEmail(user.email)
        setEditPassword("")
        setEditRole(user.role)
        setEditError("")
    }

    function closeEditModal() {
        setEditingUser(null)
        setEditEmail("")
        setEditPassword("")
        setEditRole("atlet_fotbal")
        setEditError("")
    }

    async function handleEdit(e: React.FormEvent) {
        e.preventDefault()
        if (!editingUser) return

        setEditing(true)
        setEditError("")

        const result = await updateUser(editingUser.id, {
            email: editEmail,
            password: editPassword,
            role: editRole,
        })

        if (result.error) {
            setEditError(result.error)
        } else if (result.user) {
            setUsers(currentUsers => currentUsers.map(user => user.id === result.user.id ? result.user : user))
            closeEditModal()
        }

        setEditing(false)
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
    const countryLabel = (user: User) => user.country || NO_COUNTRY_LABEL
    const continentLabel = (user: User) => user.continent || NO_CONTINENT_LABEL

    const filterCountryOptions = useMemo(() => {
        const locationOptions = continentFilter === "all"
            ? MANAGER_LOCATION_OPTIONS
            : MANAGER_LOCATION_OPTIONS.filter(option => option.continent === continentFilter)

        return [NO_COUNTRY_LABEL, ...Array.from(new Set(locationOptions.map(option => option.country)))]
    }, [continentFilter])

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesRole = roleFilter === "all" || user.role === roleFilter
            const matchesCountry = countryFilter === "all" || countryLabel(user) === countryFilter
            const matchesContinent = continentFilter === "all" || continentLabel(user) === continentFilter

            return matchesRole && matchesCountry && matchesContinent
        })
    }, [users, roleFilter, countryFilter, continentFilter])

    const sortedUsers = useMemo(() => {
        return [...filteredUsers].sort((a, b) => {
            const aValue = sortConfig.field === "email" ? a.email : roleLabel(a.role)
            const bValue = sortConfig.field === "email" ? b.email : roleLabel(b.role)
            const result = aValue.localeCompare(bValue, "ro", { sensitivity: "base" })

            if (result !== 0) {
                return sortConfig.direction === "asc" ? result : -result
            }

            return a.email.localeCompare(b.email, "ro", { sensitivity: "base" })
        })
    }, [filteredUsers, sortConfig])

    const handleSort = (field: SortField) => {
        setSortConfig((current) => ({
            field,
            direction: current.field === field && current.direction === "asc" ? "desc" : "asc",
        }))
    }

    const sortState = (field: SortField) => sortAriaValue(sortConfig.field === field, sortConfig.direction)

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
                                style={{ ...createInputStyle, borderRadius: isNormalMode ? "4px" : "0" }}
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
                                style={{ ...createInputStyle, borderRadius: isNormalMode ? "4px" : "0" }}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 160px" }}>
                            <label style={{ fontSize: "12px", fontWeight: "bold" }}>Rol</label>
                            <select
                                id="new-user-role"
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                style={{ ...createInputStyle, borderRadius: isNormalMode ? "4px" : "0" }}
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
                            className={isNormalMode ? undefined : "sd-btn-primary"}
                            style={{
                                ...(isNormalMode ? normalCreateSubmitStyle : { borderRadius: "0" }),
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
                    <h2>Toti utilizatorii ({sortedUsers.length}/{users.length})</h2>
                </div>
                <div className="sd-box-content" style={{ padding: 0, overflowX: "auto" }}>
                    <div className="sd-table-toolbar">
                        <label htmlFor="user-role-filter" className="sd-table-toolbar-label">Rol</label>
                        <select
                            id="user-role-filter"
                            value={roleFilter}
                            onChange={e => setRoleFilter(e.target.value)}
                            className="sd-input"
                            style={{ minWidth: "180px" }}
                        >
                            <option value="all">Toate rolurile</option>
                            {ALL_ROLES.map(currentRole => (
                                <option key={currentRole.value} value={currentRole.value}>{currentRole.label}</option>
                            ))}
                        </select>

                        <label htmlFor="user-continent-filter" className="sd-table-toolbar-label">Continent</label>
                        <select
                            id="user-continent-filter"
                            value={continentFilter}
                            onChange={e => {
                                setContinentFilter(e.target.value)
                                setCountryFilter("all")
                            }}
                            className="sd-input"
                            style={{ minWidth: "180px" }}
                        >
                            <option value="all">Toate continentele</option>
                            <option value={NO_CONTINENT_LABEL}>{NO_CONTINENT_LABEL}</option>
                            {locationContinentOptions.map(continent => (
                                <option key={continent} value={continent}>{continent}</option>
                            ))}
                        </select>

                        <label htmlFor="user-country-filter" className="sd-table-toolbar-label">Tara</label>
                        <select
                            id="user-country-filter"
                            value={countryFilter}
                            onChange={e => setCountryFilter(e.target.value)}
                            className="sd-input"
                            style={{ minWidth: "180px" }}
                        >
                            <option value="all">Toate tarile</option>
                            {filterCountryOptions.map(country => (
                                <option key={country} value={country}>{country}</option>
                            ))}
                        </select>
                    </div>

                    {sortedUsers.length === 0 ? (
                        <div className="sd-empty-state">
                            <p>Niciun utilizator gasit pentru filtrul selectat.</p>
                        </div>
                    ) : (
                        <table className="sd-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th aria-sort={sortState("email")}>
                                        <TableSortHeader
                                            label="Email"
                                            ariaLabel="Sorteaza dupa email"
                                            active={sortConfig.field === "email"}
                                            direction={sortConfig.direction}
                                            onSort={() => handleSort("email")}
                                        />
                                    </th>
                                    <th aria-sort={sortState("role")}>
                                        <TableSortHeader
                                            label="Rol"
                                            ariaLabel="Sorteaza dupa rol"
                                            active={sortConfig.field === "role"}
                                            direction={sortConfig.direction}
                                            onSort={() => handleSort("role")}
                                        />
                                    </th>
                                    <th>Creat la</th>
                                    <th>Actiuni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedUsers.map(user => (
                                    <tr key={user.id}>
                                        <td style={{ color: "#999" }}>{user.id}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className="sd-badge sd-badge-tehnic">{roleLabel(user.role)}</span>
                                        </td>
                                        <td style={{ color: "#666", fontSize: "12px" }}>
                                            {new Date(user.createdAt).toLocaleDateString("ro-RO")}
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(user)}
                                                    className="sd-btn-edit"
                                                >
                                                    Editeaza
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(user.id, user.email)}
                                                    className="sd-btn-delete"
                                                >
                                                    Sterge
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {editingUser && (
                <UserEditModal
                    email={editEmail}
                    password={editPassword}
                    role={editRole}
                    saving={editing}
                    formError={editError}
                    onEmailChange={setEditEmail}
                    onPasswordChange={setEditPassword}
                    onRoleChange={setEditRole}
                    onClose={closeEditModal}
                    onSubmit={handleEdit}
                />
            )}

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

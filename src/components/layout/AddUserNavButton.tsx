"use client"

import { useState } from "react"
import { createUser } from "@/app/(dashboard)/admin/users/actions"
import UserCreateModal from "@/app/(dashboard)/admin/users/UserCreateModal"

interface Props {
    label: string
    isActive?: boolean
}

export default function AddUserNavButton({ label, isActive = false }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState("atlet_fotbal")
    const [creating, setCreating] = useState(false)
    const [formError, setFormError] = useState("")
    const [formSuccess, setFormSuccess] = useState("")

    const closeModal = () => {
        setIsOpen(false)
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
            setEmail("")
            setPassword("")
            setRole("atlet_fotbal")
            setIsOpen(false)
            window.location.reload()
        }

        setCreating(false)
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={isActive ? "active" : ""}
                style={{
                    margin: "0 10px",
                    fontWeight: "bold",
                    color: "#555",
                    fontSize: "14px",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                }}
            >
                {label}
            </button>

            {isOpen && (
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
                    onClose={closeModal}
                    onSubmit={handleCreate}
                />
            )}
        </>
    )
}
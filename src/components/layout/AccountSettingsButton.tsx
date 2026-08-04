"use client"

import { type FormEvent, useState, useTransition } from "react"
import { updateAccountSettings } from "@/app/(dashboard)/actions/account-settings"

interface AccountSettingsData {
    firstName: string
    lastName: string
    email: string
    phone: string
}

interface Props {
    account: AccountSettingsData
}

const fieldStyle = {
    border: "1px solid var(--sd-border)",
    padding: "10px 12px",
    fontSize: "13px",
    backgroundColor: "var(--sd-input-bg)",
    color: "var(--sd-text)",
}
const labelStyle = { display: "flex", flexDirection: "column" as const, gap: "5px", fontSize: "12px", fontWeight: "bold", color: "var(--sd-text)" }

export default function AccountSettingsButton({ account }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [firstName, setFirstName] = useState(account.firstName)
    const [lastName, setLastName] = useState(account.lastName)
    const [email, setEmail] = useState(account.email)
    const [phone, setPhone] = useState(account.phone)
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")
    const [isPending, startTransition] = useTransition()

    const closeModal = () => {
        setIsOpen(false)
        setMessage("")
        setError("")
        setNewPassword("")
        setConfirmPassword("")
    }

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setMessage("")
        setError("")

        const formData = new FormData(event.currentTarget)
        startTransition(async () => {
            const result = await updateAccountSettings(formData)

            if (!result.success) {
                setError(result.error)
                return
            }

            setEmail(result.email)
            setNewPassword("")
            setConfirmPassword("")
            setMessage("Setarile contului au fost salvate")
        })
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="sd-user-link-button"
            >
                Account settings
            </button>

            {isOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="account-settings-modal-title"
                    onClick={closeModal}
                    style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", zIndex: 1000 }}
                >
                    <div
                        onClick={(event) => event.stopPropagation()}
                        style={{ width: "100%", maxWidth: "620px", backgroundColor: "var(--sd-box-bg)", color: "var(--sd-text)", border: "1px solid var(--sd-border)", borderRadius: "8px", boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)", overflow: "hidden" }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", padding: "18px 22px", borderBottom: "1px solid var(--sd-border)" }}>
                            <div>
                                <h2 id="account-settings-modal-title" style={{ margin: 0, color: "var(--sd-heading)" }}>Account settings</h2>
                                <p style={{ margin: "6px 0 0", color: "var(--sd-muted)", fontSize: "13px" }}>Datele contului si schimbarea parolei.</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                style={{ border: "none", background: "transparent", fontSize: "24px", lineHeight: 1, cursor: "pointer", color: "var(--sd-muted)" }}
                                aria-label="Inchide"
                            >
                                x
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "18px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
                                <label style={labelStyle}>
                                    Nume
                                    <input name="lastName" type="text" value={lastName} onChange={(event) => setLastName(event.target.value)} required placeholder="Nume" style={fieldStyle} />
                                </label>
                                <label style={labelStyle}>
                                    Prenume
                                    <input name="firstName" type="text" value={firstName} onChange={(event) => setFirstName(event.target.value)} required placeholder="Prenume" style={fieldStyle} />
                                </label>
                                <label style={labelStyle}>
                                    Email
                                    <input name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="email@example.com" style={fieldStyle} />
                                </label>
                                <label style={labelStyle}>
                                    Telefon
                                    <input name="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+373..." style={fieldStyle} />
                                </label>
                            </div>

                            <div style={{ borderTop: "1px solid var(--sd-border)", paddingTop: "16px" }}>
                                <h3 style={{ margin: "0 0 12px", fontSize: "15px", color: "var(--sd-heading)" }}>Schimbare Parola</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
                                    <label style={labelStyle}>
                                        Parola noua
                                        <input name="newPassword" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Parola noua" style={fieldStyle} />
                                    </label>
                                    <label style={labelStyle}>
                                        Confirma parola
                                        <input name="confirmPassword" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirma parola" style={fieldStyle} />
                                    </label>
                                </div>
                            </div>

                            {error && <p style={{ color: "var(--sd-danger)", fontSize: "12px", margin: 0 }}>{error}</p>}
                            {message && <p style={{ color: "var(--sd-success)", fontSize: "12px", margin: 0 }}>{message}</p>}

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "4px" }}>
                                <button type="button" onClick={closeModal} disabled={isPending} style={{ border: "1px solid var(--sd-border)", background: "var(--sd-box-bg)", color: "var(--sd-text)", padding: "9px 18px", cursor: isPending ? "not-allowed" : "pointer" }}>
                                    Anuleaza
                                </button>
                                <button type="submit" disabled={isPending} style={{ backgroundColor: isPending ? "#aaa" : "#0056b3", color: "#fff", border: "none", padding: "9px 20px", fontSize: "13px", fontWeight: "bold", cursor: isPending ? "not-allowed" : "pointer" }}>
                                    {isPending ? "Se salveaza..." : "Salveaza"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

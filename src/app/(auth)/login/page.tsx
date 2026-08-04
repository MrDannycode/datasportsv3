"use client"

import { useState, useSyncExternalStore } from "react"
import { signIn } from "next-auth/react"
import { useTheme } from "@/components/theme-provider"
import { useRouter } from "next/navigation"
import { useTableMode } from "@/components/table-mode-provider"

const demoAccounts = [
    { label: "Admin", email: "AdminGlobal@datasports.test", password: "adminglobal" },
    { label: "Manager Fotbal", email: "MngFtbRomania@datasports.test", password: "mngftbromania" },
    { label: "Antrenor Fotbal", email: "DorinelMunteanu@datasports.test", password: "dorinelmunteanuog" },
    { label: "Antrenor Fitness", email: "FitnesOtelGl@datasports.test", password: "fitnesotelgl" },
    { label: "Medic", email: "MedicOtelGl@datasports.test", password: "medicotelgl" },
    { label: "Atlet Fotbal", email: "antal@datasports.test", password: "Ds!0W0QFxbH" },
    { label: "Atlet tenis", email: "tenisdan@datasports.test", password: "tenisdan" },
]

export default function LoginPage() {
    const router = useRouter()
    const { theme } = useTheme()
    const { tableMode } = useTableMode()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const isMounted = useSyncExternalStore(() => () => {}, () => true, () => false)
    const isDark = isMounted && theme === "dark"
    const isNormal = tableMode === "normal"
    const colors = isDark
        ? {
            pageBg: isNormal ? "#0f1729" : "#000000",
            cardBg: isNormal ? "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)" : "#171717",
            fieldBg: isNormal ? "#1a2540" : "#0f0f0f",
            border: isNormal ? "rgba(99, 102, 241, 0.25)" : "#333",
            text: isNormal ? "#e0e7ff" : "#e5edf7",
            muted: isNormal ? "#818cf8" : "#aebdd0",
            button: isNormal ? "#4f46e5" : "#2563eb",
            buttonHover: isNormal ? "#4338ca" : "#1d4ed8",
            demoBg: isNormal ? "rgba(129, 140, 248, 0.12)" : "#1f1f1f",
            errorBg: "rgba(248, 113, 113, 0.14)",
            errorText: "#fca5a5",
        }
        : {
            pageBg: isNormal ? "#eef2ff" : "#f4f4f4",
            cardBg: isNormal ? "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)" : "#ffffff",
            fieldBg: "#ffffff",
            border: isNormal ? "rgba(79, 70, 229, 0.3)" : "#ccc",
            text: isNormal ? "#1e1b4b" : "#333",
            muted: isNormal ? "#3730a3" : "#536273",
            button: isNormal ? "#1e3a8a" : "#0056b3",
            buttonHover: isNormal ? "#1e40af" : "#004494",
            demoBg: isNormal ? "rgba(79, 70, 229, 0.08)" : "#f5f5f5",
            errorBg: "#fff0f0",
            errorText: "#c00",
        }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")

        const result = await signIn("credentials", {
            email: email.trim(),
            password,
            redirect: false,
        })

        if (result?.error) {
            setError("Email sau parola gresita")
            setLoading(false)
            return
        }

        router.refresh()
    }

    function fillDemoAccount(account: (typeof demoAccounts)[number]) {
        setEmail(account.email)
        setPassword(account.password)
    }

    return (
        <main
            style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: colors.pageBg,
                color: colors.text,
                fontFamily: "Arial, Helvetica, sans-serif",
                padding: 20,
            }}
        >
            <section
                style={{
                    width: "100%",
                    maxWidth: 520,
                    background: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: isNormal ? 16 : 0,
                    boxShadow: isNormal ? "0 18px 42px rgba(15, 23, 42, 0.16)" : "none",
                    padding: isNormal ? "30px 34px" : "30px 40px",
                }}
            >
                <div style={{ marginBottom: 20, borderBottom: `2px solid ${colors.border}`, paddingBottom: 10 }}>
                    <strong style={{ fontSize: 18 }}>SportsData</strong>
                </div>

                <h1 style={{ fontSize: 20, fontWeight: "normal", margin: "0 0 20px" }}>
                    Sign in to your account
                </h1>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 12 }}>
                        <label htmlFor="login-email" style={{ display: "block", fontSize: 13, marginBottom: 4, fontWeight: "bold" }}>
                            Email
                        </label>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: "100%",
                                border: `1px solid ${colors.border}`,
                                borderRadius: isNormal ? 10 : 0,
                                background: colors.fieldBg,
                                color: colors.text,
                                padding: isNormal ? "9px 11px" : "6px 10px",
                                fontSize: 13,
                                boxSizing: "border-box",
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <label htmlFor="login-password" style={{ display: "block", fontSize: 13, marginBottom: 4, fontWeight: "bold" }}>
                            Parola
                        </label>
                        <input
                            id="login-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: "100%",
                                border: `1px solid ${colors.border}`,
                                borderRadius: isNormal ? 10 : 0,
                                background: colors.fieldBg,
                                color: colors.text,
                                padding: isNormal ? "9px 11px" : "6px 10px",
                                fontSize: 13,
                                boxSizing: "border-box",
                            }}
                        />
                    </div>

                    {error && (
                        <p
                            style={{
                                color: colors.errorText,
                                background: colors.errorBg,
                                border: `1px solid ${colors.errorText}`,
                                borderRadius: isNormal ? 10 : 3,
                                fontSize: 12,
                                margin: "0 0 10px",
                                padding: "8px 10px",
                            }}
                        >
                            {error}
                        </p>
                    )}

                    <button
                        id="login-submit"
                        type="submit"
                        disabled={loading}
                        onMouseEnter={(event) => {
                            if (!loading) event.currentTarget.style.backgroundColor = colors.buttonHover
                        }}
                        onMouseLeave={(event) => {
                            event.currentTarget.style.backgroundColor = loading ? "#aaa" : colors.button
                        }}
                        style={{
                            width: "100%",
                            backgroundColor: loading ? "#aaa" : colors.button,
                            color: "#fff",
                            border: "none",
                            borderRadius: isNormal ? 10 : 0,
                            padding: isNormal ? "10px 0" : "8px 0",
                            fontSize: 14,
                            cursor: loading ? "not-allowed" : "pointer",
                            fontWeight: "bold",
                        }}
                    >
                        {loading ? "Se incarca..." : "Intra in cont"}
                    </button>
                </form>

                <div style={{ marginTop: 20, borderTop: `1px solid ${colors.border}`, paddingTop: 14 }}>
                    <p style={{ fontSize: 11, color: colors.muted, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0 }}>
                        Conturi demo
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {demoAccounts.map((account) => (
                            <button
                                key={account.email}
                                type="button"
                                onClick={() => fillDemoAccount(account)}
                                style={{
                                    flex: "1 1 120px",
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: isNormal ? 999 : 0,
                                    background: colors.demoBg,
                                    color: colors.text,
                                    padding: "6px 9px",
                                    fontSize: 12,
                                    cursor: "pointer",
                                    textAlign: "center",
                                }}
                            >
                                {account.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    )
}

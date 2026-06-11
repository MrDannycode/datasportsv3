"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        })

        if (result?.error) {
            setError("Email sau parolă greșită")
            setLoading(false)
            return
        }

        router.refresh()
    }

    return (
        <div style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "14px",
            color: "#333",
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            padding: "30px 40px",
            width: "100%",
            maxWidth: "400px",
        }}>
            {/* Logo / brand */}
            <div style={{ marginBottom: "20px", borderBottom: "2px solid #ccc", paddingBottom: "10px" }}>
                <strong style={{ fontSize: "18px" }}>SportsData</strong>
            </div>

            <h1 style={{ fontSize: "20px", fontWeight: "normal", marginBottom: "20px" }}>
                Sign in to your account
            </h1>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", fontSize: "13px", marginBottom: "4px", fontWeight: "bold" }}>
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
                            border: "1px solid #ccc",
                            padding: "6px 10px",
                            fontSize: "13px",
                            boxSizing: "border-box",
                        }}
                    />
                </div>

                <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", fontSize: "13px", marginBottom: "4px", fontWeight: "bold" }}>
                        Parolă
                    </label>
                    <input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                            width: "100%",
                            border: "1px solid #ccc",
                            padding: "6px 10px",
                            fontSize: "13px",
                            boxSizing: "border-box",
                        }}
                    />
                </div>

                {error && (
                    <p style={{ color: "#c00", fontSize: "12px", marginBottom: "10px" }}>
                        {error}
                    </p>
                )}

                <button
                    id="login-submit"
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        backgroundColor: loading ? "#aaa" : "#0056b3",
                        color: "#fff",
                        border: "none",
                        padding: "8px 0",
                        fontSize: "14px",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontWeight: "bold",
                    }}
                >
                    {loading ? "Se încarcă..." : "Intră în cont"}
                </button>
            </form>

            {/* Demo accounts quick-fill */}
            <div style={{ marginTop: "20px", borderTop: "1px solid #eee", paddingTop: "14px" }}>
                <p style={{ fontSize: "11px", color: "#888", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Conturi demo
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        id="demo-admin"
                        type="button"
                        onClick={() => { setEmail("admin@test.com"); setPassword("parola123") }}
                        style={{
                            flex: 1,
                            border: "1px solid #ccc",
                            backgroundColor: "#f5f5f5",
                            padding: "5px 8px",
                            fontSize: "12px",
                            cursor: "pointer",
                            textAlign: "center",
                        }}
                    >
                        🛡️ Admin
                    </button>
                    <button
                        id="demo-atlet-fotbal"
                        type="button"
                        onClick={() => { setEmail("atlet@test.com"); setPassword("parola123") }}
                        style={{
                            flex: 1,
                            border: "1px solid #ccc",
                            backgroundColor: "#f5f5f5",
                            padding: "5px 8px",
                            fontSize: "12px",
                            cursor: "pointer",
                            textAlign: "center",
                        }}
                    >
                        ⚽ Atlet Fotbal
                    </button>
                </div>
            </div>
        </div>
    )
}
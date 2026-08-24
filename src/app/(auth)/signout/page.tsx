"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import { useTheme } from "@/components/theme-provider"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { useTableMode } from "@/components/table-mode-provider"

export default function SignOutPage() {
    const router = useRouter()
    const { theme } = useTheme()
    const { tableMode } = useTableMode()
    const isDark = theme === "dark"
    const isNormal = tableMode === "normal"

    const colors = isDark
        ? {
            pageBg: isNormal ? "#0f1722" : "#000000",
            cardBg: isNormal ? "linear-gradient(180deg, #202a3a 0%, #182232 100%)" : "#171717",
            border: isNormal ? "#2f3a4a" : "#333",
            text: "#e5edf7",
            muted: "#aebdd0",
            button: "#2563eb",
            buttonHover: "#1d4ed8",
            secondaryBg: isNormal ? "rgba(96, 165, 250, 0.11)" : "transparent",
        }
        : {
            pageBg: isNormal ? "#eef4fb" : "#f4f4f4",
            cardBg: isNormal ? "linear-gradient(180deg, #ffffff 0%, #f4f7fb 100%)" : "#ffffff",
            border: isNormal ? "#d7e0eb" : "#ccc",
            text: "#243447",
            muted: "#536273",
            button: "#0056b3",
            buttonHover: "#004494",
            secondaryBg: isNormal ? "rgba(0, 86, 179, 0.075)" : "transparent",
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
                    maxWidth: 460,
                    background: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: isNormal ? 16 : 0,
                    boxShadow: isNormal ? "0 18px 42px rgba(15, 23, 42, 0.16)" : "none",
                    padding: isNormal ? "30px 34px" : "30px 40px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom: `2px solid ${colors.border}`,
                        paddingBottom: 12,
                        marginBottom: 20,
                    }}
                >
                    <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
                        <img src="/logomic.svg" alt="SportsData" style={{ height: 18 }} />
                    </Link>
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 34,
                            height: 34,
                            borderRadius: isNormal ? 999 : 4,
                            border: `1px solid ${colors.border}`,
                            background: colors.secondaryBg,
                        }}
                    >
                        <LogOut size={17} />
                    </span>
                </div>

                <h1 style={{ fontSize: 20, fontWeight: "normal", margin: "0 0 10px" }}>
                    Iesire din cont
                </h1>
                <p style={{ color: colors.muted, fontSize: 13, lineHeight: 1.5, margin: "0 0 22px" }}>
                    Confirma ca vrei sa inchizi sesiunea curenta.
                </p>

                <div style={{ display: "flex", gap: 10 }}>
                    <button className="sd-btn-focus-square"
                        type="button"
                        onClick={() => router.back()}
                        style={{
                            flex: 1,
                            border: `1px solid ${colors.border}`,
                            borderRadius: isNormal ? 10 : 3,
                            background: colors.secondaryBg,
                            color: colors.text,
                            cursor: "pointer",
                            fontSize: 14,
                            fontWeight: "bold",
                            padding: "10px 0",
                        }}
                    >
                        Cancel
                    </button>
                    <button className="sd-btn-focus-square"
                        type="button"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        onMouseEnter={(event) => {
                            event.currentTarget.style.backgroundColor = colors.buttonHover
                        }}
                        onMouseLeave={(event) => {
                            event.currentTarget.style.backgroundColor = colors.button
                        }}
                        style={{
                            flex: 1,
                            border: "none",
                            borderRadius: isNormal ? 10 : 3,
                            backgroundColor: colors.button,
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: 14,
                            fontWeight: "bold",
                            padding: "10px 0",
                        }}
                    >
                        Logout
                    </button>
                </div>
            </section>
        </main>
    )
}

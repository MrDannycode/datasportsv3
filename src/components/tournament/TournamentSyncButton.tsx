"use client"

import { useState } from "react"

type SyncResult = {
    success: boolean
    tourneeSincronizate: number
    jucatoriActualizati: number
    timestamp: string
}

export default function TournamentSyncButton() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<SyncResult | null>(null)
    const [error, setError] = useState<string | null>(null)

    async function handleSync() {
        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const res = await fetch("/api/tournaments/sync", { method: "POST" })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data?.error ?? `Eroare HTTP ${res.status}`)
            }
            const data: SyncResult = await res.json()
            setResult(data)
            // Reîncarcă pagina după sync ca să apară datele noi
            window.location.reload()
        } catch (e) {
            setError(e instanceof Error ? e.message : "Eroare necunoscută")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="sd-sync-bar">
            <button
                id="tournament-sync-btn"
                className="sd-btn-primary"
                onClick={handleSync}
                disabled={loading}
                style={{ minWidth: 160 }}
            >
                {loading ? "⏳ Se sincronizează..." : "🔄 Actualizare date turnee"}
            </button>

            <div className="sd-sync-status">
                {result && !loading && (
                    <span style={{ color: "#166534" }}>
                        ✅ {result.tourneeSincronizate} turnee sincronizate,{" "}
                        {result.jucatoriActualizati} jucători actualizați
                    </span>
                )}
                {error && (
                    <span style={{ color: "#991b1b" }}>
                        ❌ {error}
                    </span>
                )}
                {!result && !error && !loading && (
                    <span>
                        Apasă butonul pentru a importa turneele și jucătorii înscriși.
                    </span>
                )}
            </div>
        </div>
    )
}

"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Team {
    id: number
    name: string
}

interface InitialData {
    id: number
    teamId: number
    title: string
    description: string
    type: "tehnic" | "fizic" | "tactic"
    date: string // YYYY-MM-DD
}

interface Props {
    teams: Team[]
    mode: "create" | "edit"
    initialData?: InitialData
}

export default function PlanFormClient({ teams, mode, initialData }: Props) {
    const router = useRouter()

    const [teamId, setTeamId] = useState<string>(
        initialData ? String(initialData.teamId) : teams[0] ? String(teams[0].id) : ""
    )
    const [title, setTitle] = useState(initialData?.title ?? "")
    const [description, setDescription] = useState(initialData?.description ?? "")
    const [type, setType] = useState<"tehnic" | "fizic" | "tactic">(
        initialData?.type ?? "tehnic"
    )
    const [date, setDate] = useState(
        initialData?.date ?? new Date().toISOString().split("T")[0]
    )

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const payload = { teamId: Number(teamId), title, description, type, date }

        const url =
            mode === "create"
                ? "/api/antrenor-fotbal/antrenamente"
                : `/api/antrenor-fotbal/antrenamente/${initialData!.id}`

        const method = mode === "create" ? "POST" : "PUT"

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error ?? "Eroare la salvare")
            }

            router.push("/antrenor-fotbal/antrenamente")
            router.refresh()
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Eroare necunoscută")
            setLoading(false)
        }
    }

    return (
        <div className="sd-box" style={{ maxWidth: 640 }}>
            <div className="sd-box-header">
                <h2>{mode === "create" ? "Plan nou" : "Editează plan"}</h2>
            </div>
            <div className="sd-box-content">
                {error && <div className="sd-error-banner">{error}</div>}

                <form onSubmit={handleSubmit} className="sd-form">
                    {/* Titlu */}
                    <div className="sd-form-group">
                        <label htmlFor="plan-title" className="sd-label">
                            Titlu <span className="sd-required">*</span>
                        </label>
                        <input
                            id="plan-title"
                            type="text"
                            className="sd-input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            maxLength={200}
                            placeholder="ex. Antrenament tactic ofensiv"
                        />
                    </div>

                    {/* Tip */}
                    <div className="sd-form-group">
                        <label htmlFor="plan-type" className="sd-label">
                            Tip antrenament <span className="sd-required">*</span>
                        </label>
                        <select
                            id="plan-type"
                            className="sd-input"
                            value={type}
                            onChange={(e) => setType(e.target.value as "tehnic" | "fizic" | "tactic")}
                            required
                        >
                            <option value="tehnic">Tehnic</option>
                            <option value="fizic">Fizic</option>
                            <option value="tactic">Tactic</option>
                        </select>
                    </div>

                    {/* Echipă */}
                    <div className="sd-form-group">
                        <label htmlFor="plan-team" className="sd-label">
                            Echipă <span className="sd-required">*</span>
                        </label>
                        {teams.length === 0 ? (
                            <p className="sd-hint" style={{ color: "#c00" }}>
                                Nu există echipe de fotbal în sistem. Contactați administratorul.
                            </p>
                        ) : (
                            <select
                                id="plan-team"
                                className="sd-input"
                                value={teamId}
                                onChange={(e) => setTeamId(e.target.value)}
                                required
                            >
                                {teams.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Data */}
                    <div className="sd-form-group">
                        <label htmlFor="plan-date" className="sd-label">
                            Data <span className="sd-required">*</span>
                        </label>
                        <input
                            id="plan-date"
                            type="date"
                            className="sd-input"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    {/* Descriere */}
                    <div className="sd-form-group">
                        <label htmlFor="plan-description" className="sd-label">
                            Descriere
                        </label>
                        <textarea
                            id="plan-description"
                            className="sd-input sd-textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            maxLength={1000}
                            placeholder="Detalii despre antrenament (opțional)"
                        />
                    </div>

                    {/* Butoane */}
                    <div className="sd-form-actions">
                        <Link
                            href="/antrenor-fotbal/antrenamente"
                            className="sd-btn-secondary"
                        >
                            Anulează
                        </Link>
                        <button
                            type="submit"
                            className="sd-btn-primary"
                            disabled={loading || teams.length === 0}
                        >
                            {loading
                                ? mode === "create"
                                    ? "Se creează..."
                                    : "Se salvează..."
                                : mode === "create"
                                    ? "Creează plan"
                                    : "Salvează modificările"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

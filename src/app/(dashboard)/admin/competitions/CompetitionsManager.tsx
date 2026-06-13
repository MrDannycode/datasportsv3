"use client"

import { useState } from "react"
import { createCompetition, deleteCompetition } from "./actions"

type Competition = {
    id: number
    name: string
    sport: string
    createdAt: Date
}

export default function CompetitionsManager({ initialCompetitions }: { initialCompetitions: Competition[] }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const [formData, setFormData] = useState<{name: string, sport: "fotbal" | "tenis"}>({
        name: "",
        sport: "fotbal"
    })

    const resetForm = () => {
        setFormData({ name: "", sport: "fotbal" })
        setError("")
        setSuccess("")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        setSuccess("")

        try {
            await createCompetition(formData)
            setSuccess("Competiția a fost adăugată cu succes!")
            resetForm()
        } catch (err: any) {
            setError(err.message || "A apărut o eroare.")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Sigur doriți să ștergeți această competiție?")) return
        setLoading(true)
        setError("")
        setSuccess("")
        try {
            await deleteCompetition(id)
            setSuccess("Competiția a fost ștearsă.")
        } catch (err: any) {
            setError(err.message || "A apărut o eroare la ștergere.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="sd-box">
            <div className="sd-box-header">
                <h2>Adăugare Competiție Nouă</h2>
            </div>
            <div className="sd-box-content">
                {error && <div style={{ color: "red", marginBottom: "10px", padding: "10px", background: "#fee", borderRadius: "5px" }}>{error}</div>}
                {success && <div style={{ color: "green", marginBottom: "10px", padding: "10px", background: "#efe", borderRadius: "5px" }}>{success}</div>}
                
                <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", alignItems: "flex-end", marginBottom: "30px", padding: "15px", border: "1px solid #ddd", borderRadius: "5px", background: "#f9f9f9" }}>
                    <div style={{ flex: 2 }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Nume Competiție</label>
                        <input 
                            required 
                            type="text" 
                            placeholder="ex: Liga 1"
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Sport</label>
                        <select 
                            required 
                            value={formData.sport} 
                            onChange={e => setFormData({...formData, sport: e.target.value as "fotbal" | "tenis"})}
                            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                        >
                            <option value="fotbal">Fotbal</option>
                            <option value="tenis">Tenis</option>
                        </select>
                    </div>
                    <div>
                        <button disabled={loading} type="submit" style={{ padding: "9px 20px", background: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                            {loading ? "Se salvează..." : "Adaugă"}
                        </button>
                    </div>
                </form>

                <h3 style={{ marginBottom: "15px", fontSize: "16px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>Competiții Existente</h3>
                
                <div style={{ overflowX: "auto" }}>
                    <table className="sd-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nume Competiție</th>
                                <th>Sport</th>
                                <th>Data Creării</th>
                                <th style={{ textAlign: "right" }}>Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {initialCompetitions.map(comp => (
                                <tr key={comp.id}>
                                    <td>#{comp.id}</td>
                                    <td style={{ fontWeight: "bold" }}>{comp.name}</td>
                                    <td>
                                        <span style={{ 
                                            padding: "3px 8px", 
                                            borderRadius: "12px", 
                                            fontSize: "12px",
                                            background: comp.sport === 'fotbal' ? '#e6f7ff' : '#f6ffed',
                                            color: comp.sport === 'fotbal' ? '#0050b3' : '#389e0d',
                                            border: `1px solid ${comp.sport === 'fotbal' ? '#91d5ff' : '#b7eb8f'}`
                                        }}>
                                            {comp.sport === 'fotbal' ? 'Fotbal' : 'Tenis'}
                                        </span>
                                    </td>
                                    <td>{new Date(comp.createdAt).toLocaleDateString("ro-RO")}</td>
                                    <td style={{ textAlign: "right" }}>
                                        <button disabled={loading} onClick={() => handleDelete(comp.id)} style={{ padding: "4px 10px", cursor: "pointer", background: "#fff0f0", color: "red", border: "1px solid #ffcccc", borderRadius: "3px" }}>Șterge</button>
                                    </td>
                                </tr>
                            ))}
                            {initialCompetitions.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", padding: "20px", color: "#666" }}>Nu există nicio competiție adăugată.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

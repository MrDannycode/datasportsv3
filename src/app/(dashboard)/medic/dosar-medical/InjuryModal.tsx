"use client"

import { useState } from "react"
import { Severity } from "@prisma/client"
import { saveMedicalRecord } from "./actions"
import { Athlete, Injury } from "./DosarManager"

interface Props {
    athletes: Athlete[];
    onClose: () => void;
    onSuccess: () => void;
}

const createEmptyInjury = (): Omit<Injury, "id" | "medicalRecordId"> => ({
    injuryType: "",
    bodyPart: "",
    severity: Severity.usoara,
    recoveryDays: 0,
    notes: "",
})

export default function InjuryModal({ athletes, onClose, onSuccess }: Props) {
    const [athleteId, setAthleteId] = useState<number | "">("")
    const [injuries, setInjuries] = useState<Omit<Injury, "id" | "medicalRecordId">[]>([createEmptyInjury()])
    const [loading, setLoading] = useState(false)

    const handleAddInjury = () => {
        setInjuries((current) => [...current, createEmptyInjury()])
    }

    const handleRemoveInjury = (index: number) => {
        setInjuries((current) => current.filter((_, currentIndex) => currentIndex !== index))
    }

    const handleInjuryChange = (index: number, field: keyof Omit<Injury, "id" | "medicalRecordId">, value: string | number | Severity | null) => {
        setInjuries((current) =>
            current.map((injury, currentIndex) => currentIndex === index ? { ...injury, [field]: value } : injury)
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (athleteId === "") return

        setLoading(true)
        try {
            await saveMedicalRecord({
                athleteId: Number(athleteId),
                diagnosis: "Accidentare",
                treatment: "De stabilit",
                startDate: new Date(),
                endDate: null,
                isAvailable: false,
                injuries: injuries.map((injury) => ({
                    injuryType: injury.injuryType,
                    bodyPart: injury.bodyPart,
                    severity: injury.severity as Severity,
                    recoveryDays: Number(injury.recoveryDays),
                    notes: injury.notes || undefined,
                })),
            })

            onSuccess()
        } catch (error) {
            console.error(error)
            alert("Eroare la salvarea accidentării")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
            <div style={{
                background: "white", padding: "24px", borderRadius: "8px", width: "600px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto",
            }}>
                <h2 style={{ marginTop: 0 }}>Adaugă Accidentare</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "16px", borderTop: "1px solid #eee", paddingTop: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <h3 style={{ margin: 0 }}>Accidentări Specifice</h3>
                            <button type="button" onClick={handleAddInjury} style={{ padding: "4px 8px", background: "#eee", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}>
                                + Adaugă Accidentare
                            </button>
                        </div>

                        <div style={{ marginBottom: "12px" }}>
                            <label style={{ display: "block", marginBottom: "8px" }}>Atlet (Fotbal)</label>
                            <select
                                value={athleteId}
                                onChange={e => setAthleteId(e.target.value ? Number(e.target.value) : "")}
                                required
                                style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                            >
                                <option value="">Selectează atlet</option>
                                {athletes.map((athlete) => (
                                    <option key={athlete.id} value={athlete.id}>
                                        {athlete.user.profile?.firstName} {athlete.user.profile?.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {injuries.map((injury, index) => (
                            <div key={index} style={{ background: "#f9f9f9", padding: "12px", borderRadius: "4px", marginBottom: "8px", border: "1px solid #e0e0e0" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <strong>Accidentare #{index + 1}</strong>
                                    {injuries.length > 1 ? (
                                        <button type="button" onClick={() => handleRemoveInjury(index)} style={{ color: "red", background: "none", border: "none", cursor: "pointer" }}>Șterge</button>
                                    ) : <span />}
                                </div>
                                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                                    <input
                                        type="text"
                                        placeholder="Tip (ex: Entorsă)"
                                        value={injury.injuryType}
                                        onChange={e => handleInjuryChange(index, "injuryType", e.target.value)}
                                        required
                                        style={{ flex: 1, padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Parte corp (ex: Glezna stângă)"
                                        value={injury.bodyPart}
                                        onChange={e => handleInjuryChange(index, "bodyPart", e.target.value)}
                                        required
                                        style={{ flex: 1, padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                                    />
                                </div>
                                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                                    <select
                                        value={injury.severity}
                                        onChange={e => handleInjuryChange(index, "severity", e.target.value as Severity)}
                                        style={{ flex: 1, padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                                    >
                                        <option value={Severity.usoara}>Ușoară</option>
                                        <option value={Severity.medie}>Medie</option>
                                        <option value={Severity.grava}>Gravă</option>
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="Zile recuperare"
                                        value={injury.recoveryDays}
                                        onChange={e => handleInjuryChange(index, "recoveryDays", e.target.value)}
                                        required
                                        min="0"
                                        style={{ flex: 1, padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Note (opțional)"
                                        value={injury.notes || ""}
                                        onChange={e => handleInjuryChange(index, "notes", e.target.value)}
                                        style={{ width: "100%", padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                        <button type="button" onClick={onClose} style={{ padding: "8px 16px", background: "white", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}>
                            Anulează
                        </button>
                        <button type="submit" disabled={loading} style={{ padding: "8px 16px", background: "#0056b3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                            {loading ? "Se salvează..." : "Salvează"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

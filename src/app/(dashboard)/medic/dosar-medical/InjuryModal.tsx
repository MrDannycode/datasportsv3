"use client"

import { useState } from "react"
import { Severity } from "@prisma/client"
import { saveMedicalRecord } from "./actions"
import { Athlete, Injury } from "./DosarManager"
import BaseModal, { modalInputStyle } from "@/components/base-modal"

const fieldStyle = { ...modalInputStyle, width: "100%", padding: "8px" }
const smallFieldStyle = { ...modalInputStyle, flex: 1, padding: "6px" }

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
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
    const [endDate, setEndDate] = useState("")
    const [isAvailable, setIsAvailable] = useState(false)
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
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                isAvailable,
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
        <BaseModal
            modalId="injury-modal-title"
            title="Adaugă Accidentare"
            maxWidth="600px"
            onClose={onClose}
        >
            <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "16px", borderTop: "1px solid var(--sd-border)", paddingTop: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <h3 style={{ margin: 0 }}>Accidentări Specifice</h3>
                            <button type="button" onClick={handleAddInjury} style={{ padding: "4px 8px", background: "var(--sd-box-bg)", color: "var(--sd-text)", border: "1px solid var(--sd-border)", borderRadius: "4px", cursor: "pointer" }}>
                                + Adaugă Accidentare
                            </button>
                        </div>

                        <div style={{ marginBottom: "12px" }}>
                            <label style={{ display: "block", marginBottom: "8px" }}>Atlet (Fotbal)</label>
                            <select
                                value={athleteId}
                                onChange={e => setAthleteId(e.target.value ? Number(e.target.value) : "")}
                                required
                                style={fieldStyle}
                            >
                                <option value="">Selectează atlet</option>
                                {athletes.map((athlete) => (
                                    <option key={athlete.id} value={athlete.id}>
                                        {athlete.user.profile?.firstName} {athlete.user.profile?.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: "block", marginBottom: "8px" }}>Data Inceput</label>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required style={fieldStyle} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: "block", marginBottom: "8px" }}>Data Sfarsit (Optional)</label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} style={fieldStyle} />
                            </div>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <input
                                    type="checkbox"
                                    checked={isAvailable}
                                    onChange={e => setIsAvailable(e.target.checked)}
                                />
                                Atletul este apt pentru joc/antrenament
                            </label>
                        </div>

                        {injuries.map((injury, index) => (
                            <div key={index} style={{ background: "color-mix(in srgb, var(--sd-box-bg) 88%, var(--sd-border))", padding: "12px", borderRadius: "4px", marginBottom: "8px", border: "1px solid var(--sd-border)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <strong>Accidentare #{index + 1}</strong>
                                    {injuries.length > 1 ? (
                                        <button type="button" onClick={() => handleRemoveInjury(index)} style={{ color: "#f87171", background: "none", border: "none", cursor: "pointer" }}>Șterge</button>
                                    ) : <span />}
                                </div>
                                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                                    <input
                                        type="text"
                                        placeholder="Tip (ex: Entorsă)"
                                        value={injury.injuryType}
                                        onChange={e => handleInjuryChange(index, "injuryType", e.target.value)}
                                        required
                                        style={smallFieldStyle}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Parte corp (ex: Glezna stângă)"
                                        value={injury.bodyPart}
                                        onChange={e => handleInjuryChange(index, "bodyPart", e.target.value)}
                                        required
                                        style={smallFieldStyle}
                                    />
                                </div>
                                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                                    <select
                                        value={injury.severity}
                                        onChange={e => handleInjuryChange(index, "severity", e.target.value as Severity)}
                                        style={smallFieldStyle}
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
                                        style={smallFieldStyle}
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Note (opțional)"
                                        value={injury.notes || ""}
                                        onChange={e => handleInjuryChange(index, "notes", e.target.value)}
                                        style={{ ...modalInputStyle, width: "100%", padding: "6px", borderRadius: "4px" }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                        <button type="button" onClick={onClose} style={{ padding: "8px 16px", background: "var(--sd-box-bg)", color: "var(--sd-text)", border: "1px solid var(--sd-border)", borderRadius: "4px", cursor: "pointer" }}>
                            Anulează
                        </button>
                        <button type="submit" disabled={loading} style={{ padding: "8px 16px", background: "#0056b3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                            {loading ? "Se salvează..." : "Salvează"}
                        </button>
                    </div>
                </form>
            </div>
        </BaseModal>
    )
}

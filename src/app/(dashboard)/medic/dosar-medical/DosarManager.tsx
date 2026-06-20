"use client"

import { useState } from "react"
import { saveMedicalRecord } from "./actions"
import { Severity } from "@prisma/client"

type Profile = {
    firstName: string;
    lastName: string;
}

type User = {
    profile: Profile | null;
}

type Athlete = {
    id: number;
    user: User;
}

type Injury = {
    id: number;
    medicalRecordId: number;
    injuryType: string;
    bodyPart: string;
    severity: Severity;
    recoveryDays: number;
    notes: string | null;
}

type MedicalRecord = {
    id: number;
    athleteId: number;
    medicId: number;
    diagnosis: string;
    treatment: string;
    startDate: Date;
    endDate: Date | null;
    isAvailable: boolean;
    createdAt: Date;
    athlete: Athlete;
    injuries: Injury[];
}

interface Props {
    initialRecords: MedicalRecord[];
    athletes: Athlete[];
}

export default function DosarManager({ initialRecords, athletes }: Props) {
    const [records, setRecords] = useState<MedicalRecord[]>(initialRecords)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null)

    // Form state
    const [athleteId, setAthleteId] = useState<number | "">("")
    const [diagnosis, setDiagnosis] = useState("")
    const [treatment, setTreatment] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [isAvailable, setIsAvailable] = useState(true)
    const [injuries, setInjuries] = useState<Omit<Injury, "id" | "medicalRecordId">[]>([])

    const [loading, setLoading] = useState(false)

    const openModal = (record?: MedicalRecord) => {
        if (record) {
            setEditingRecord(record)
            setAthleteId(record.athleteId)
            setDiagnosis(record.diagnosis)
            setTreatment(record.treatment)
            setStartDate(new Date(record.startDate).toISOString().split('T')[0])
            setEndDate(record.endDate ? new Date(record.endDate).toISOString().split('T')[0] : "")
            setIsAvailable(record.isAvailable)
            setInjuries(record.injuries)
        } else {
            setEditingRecord(null)
            setAthleteId("")
            setDiagnosis("")
            setTreatment("")
            setStartDate(new Date().toISOString().split('T')[0])
            setEndDate("")
            setIsAvailable(true)
            setInjuries([])
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingRecord(null)
    }

    const handleAddInjury = () => {
        setInjuries([...injuries, {
            injuryType: "",
            bodyPart: "",
            severity: Severity.usoara,
            recoveryDays: 0,
            notes: ""
        }])
    }

    const handleRemoveInjury = (index: number) => {
        const newInjuries = [...injuries]
        newInjuries.splice(index, 1)
        setInjuries(newInjuries)
    }

    const handleInjuryChange = (index: number, field: keyof Omit<Injury, "id" | "medicalRecordId">, value: any) => {
        const newInjuries = [...injuries]
        newInjuries[index] = { ...newInjuries[index], [field]: value }
        setInjuries(newInjuries)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (athleteId === "") return

        setLoading(true)
        try {
            const result = await saveMedicalRecord({
                id: editingRecord?.id,
                athleteId: Number(athleteId),
                diagnosis,
                treatment,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                isAvailable,
                injuries: injuries.map(i => ({
                    injuryType: i.injuryType,
                    bodyPart: i.bodyPart,
                    severity: i.severity as Severity,
                    recoveryDays: Number(i.recoveryDays),
                    notes: i.notes || undefined
                }))
            })

            // Very simple reload strategy
            window.location.reload()
        } catch (error) {
            console.error(error)
            alert("Error saving record")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="sd-box">
            <div className="sd-box-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Dosar Medical - Evidență</h2>
                <button onClick={() => openModal()} className="sd-btn sd-btn-primary" style={{ padding: '8px 16px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Adaugă Dosar
                </button>
            </div>

            <div className="sd-box-content">
                {records.length === 0 ? (
                    <p>Nu există dosare medicale înregistrate.</p>
                ) : (
                    <table className="sd-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #eee', textAlign: 'left' }}>
                                <th style={{ padding: '12px' }}>Atlet</th>
                                <th style={{ padding: '12px' }}>Diagnostic</th>
                                <th style={{ padding: '12px' }}>Tratament</th>
                                <th style={{ padding: '12px' }}>Data Început</th>
                                <th style={{ padding: '12px' }}>Disponibilitate</th>
                                <th style={{ padding: '12px' }}>Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map(record => (
                                <tr key={record.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px' }}>
                                        {record.athlete.user.profile?.firstName} {record.athlete.user.profile?.lastName}
                                    </td>
                                    <td style={{ padding: '12px' }}>{record.diagnosis}</td>
                                    <td style={{ padding: '12px' }}>{record.treatment}</td>
                                    <td style={{ padding: '12px' }}>{new Date(record.startDate).toLocaleDateString()}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            background: record.isAvailable ? '#e6f4ea' : '#fce8e6',
                                            color: record.isAvailable ? '#1e8e3e' : '#d93025'
                                        }}>
                                            {record.isAvailable ? "Disponibil" : "Indisponibil"}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <button onClick={() => openModal(record)} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#0056b3', textDecoration: 'underline' }}>
                                            Editează
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'white', padding: '24px', borderRadius: '8px', width: '600px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <h2 style={{ marginTop: 0 }}>{editingRecord ? 'Editează Dosar' : 'Adaugă Dosar Medical'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px' }}>Atlet (Fotbal)</label>
                                <select 
                                    value={athleteId} 
                                    onChange={e => setAthleteId(e.target.value ? Number(e.target.value) : "")}
                                    required
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                >
                                    <option value="">Selectează atlet</option>
                                    {athletes.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.user.profile?.firstName} {a.user.profile?.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px' }}>Diagnostic</label>
                                <input 
                                    type="text" 
                                    value={diagnosis} 
                                    onChange={e => setDiagnosis(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px' }}>Tratament</label>
                                <textarea 
                                    value={treatment} 
                                    onChange={e => setTreatment(e.target.value)}
                                    required
                                    rows={3}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px' }}>Data Început</label>
                                    <input 
                                        type="date" 
                                        value={startDate} 
                                        onChange={e => setStartDate(e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px' }}>Data Sfârșit (Opțional)</label>
                                    <input 
                                        type="date" 
                                        value={endDate} 
                                        onChange={e => setEndDate(e.target.value)}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={isAvailable} 
                                        onChange={e => setIsAvailable(e.target.checked)}
                                    />
                                    Atletul este apt pentru joc/antrenament
                                </label>
                            </div>

                            <div style={{ marginBottom: '16px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h3 style={{ margin: 0 }}>Accidentări Specifice</h3>
                                    <button type="button" onClick={handleAddInjury} style={{ padding: '4px 8px', background: '#eee', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>
                                        + Adaugă Accidentare
                                    </button>
                                </div>
                                
                                {injuries.map((injury, index) => (
                                    <div key={index} style={{ background: '#f9f9f9', padding: '12px', borderRadius: '4px', marginBottom: '8px', border: '1px solid #e0e0e0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <strong>Accidentare #{index + 1}</strong>
                                            <button type="button" onClick={() => handleRemoveInjury(index)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>Șterge</button>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                            <input 
                                                type="text" 
                                                placeholder="Tip (ex: Entorsă)" 
                                                value={injury.injuryType} 
                                                onChange={e => handleInjuryChange(index, "injuryType", e.target.value)}
                                                required
                                                style={{ flex: 1, padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                                            />
                                            <input 
                                                type="text" 
                                                placeholder="Parte corp (ex: Glezna stângă)" 
                                                value={injury.bodyPart} 
                                                onChange={e => handleInjuryChange(index, "bodyPart", e.target.value)}
                                                required
                                                style={{ flex: 1, padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                            <select 
                                                value={injury.severity} 
                                                onChange={e => handleInjuryChange(index, "severity", e.target.value as Severity)}
                                                style={{ flex: 1, padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
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
                                                style={{ flex: 1, padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                                            />
                                        </div>
                                        <div>
                                            <input 
                                                type="text" 
                                                placeholder="Note (opțional)" 
                                                value={injury.notes || ""} 
                                                onChange={e => handleInjuryChange(index, "notes", e.target.value)}
                                                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                <button type="button" onClick={closeModal} style={{ padding: '8px 16px', background: 'white', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>
                                    Anulează
                                </button>
                                <button type="submit" disabled={loading} style={{ padding: '8px 16px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                    {loading ? 'Se salvează...' : 'Salvează'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

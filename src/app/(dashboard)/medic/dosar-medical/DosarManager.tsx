"use client"

import { useEffect, useRef, useState } from "react"
import { Severity } from "@prisma/client"
import DosarMedicalModal from "./DosarMedicalModal"
import { saveMedicalRecord } from "./actions"

export type Profile = {
    firstName: string;
    lastName: string;
}

export type User = {
    profile: Profile | null;
}

export type Athlete = {
    id: number;
    user: User;
}

export type Injury = {
    id: number;
    medicalRecordId: number;
    injuryType: string;
    bodyPart: string;
    severity: Severity;
    recoveryDays: number;
    notes: string | null;
}

export type MedicalRecord = {
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
    shouldOpenNewRecordModal?: boolean;
}

type AvailabilityFilter = "toate" | "disponibil" | "indisponibil"
type SeverityFilter = "toate" | Severity

const SEVERITY_LABELS: Record<Severity, string> = {
    [Severity.usoara]: "Usoara",
    [Severity.medie]: "Medie",
    [Severity.grava]: "Grava",
}

const FILTER_FIELD_STYLE = { display: "flex", flexDirection: "column" as const, gap: "4px" }
const FILTER_LABEL_STYLE = { fontSize: "12px", fontWeight: "bold" } as const

function getAthleteName(athlete: Athlete) {
    return `${athlete.user.profile?.firstName ?? ""} ${athlete.user.profile?.lastName ?? ""}`.trim()
}

export default function DosarManager({ initialRecords, athletes, shouldOpenNewRecordModal = false }: Props) {
    const [records, setRecords] = useState<MedicalRecord[]>(initialRecords)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [athleteFilter, setAthleteFilter] = useState<number | "">("")
    const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("toate")
    const [injurySearchQuery, setInjurySearchQuery] = useState("")
    const [injuryAthleteFilter, setInjuryAthleteFilter] = useState<number | "">("")
    const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("toate")
    const [athleteId, setAthleteId] = useState<number | "">("")
    const [diagnosis, setDiagnosis] = useState("")
    const [treatment, setTreatment] = useState("")
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
    const [endDate, setEndDate] = useState("")
    const [isAvailable, setIsAvailable] = useState(true)
    const [injuries, setInjuries] = useState<Omit<Injury, "id" | "medicalRecordId">[]>([])
    const [loading, setLoading] = useState(false)
    const hasOpenedFromQueryRef = useRef(false)

    useEffect(() => {
        if (!shouldOpenNewRecordModal || hasOpenedFromQueryRef.current) {
            return
        }

        hasOpenedFromQueryRef.current = true
        setEditingRecord(null)
        setIsModalOpen(true)
    }, [shouldOpenNewRecordModal])

    const normalizedSearchQuery = searchQuery.trim().toLowerCase()
    const hasActiveMedicalFilters = normalizedSearchQuery !== "" || athleteFilter !== ""
    const medicalRecords = records.filter((record) => {
        if (record.injuries.length > 0) return false
        if (athleteFilter !== "" && record.athleteId !== athleteFilter) return false
        if (normalizedSearchQuery === "") return true

        return [getAthleteName(record.athlete), record.diagnosis, record.treatment]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearchQuery)
    })

    const allInjuryRecords = records.flatMap((record) =>
        record.injuries.map((injury) => ({ record, injury }))
    )
    const normalizedInjurySearchQuery = injurySearchQuery.trim().toLowerCase()
    const hasActiveInjuryFilters = normalizedInjurySearchQuery !== "" || injuryAthleteFilter !== "" || severityFilter !== "toate" || availabilityFilter !== "toate"
    const injuryRecords = allInjuryRecords.filter(({ record, injury }) => {
        if (injuryAthleteFilter !== "" && record.athleteId !== injuryAthleteFilter) return false
        if (severityFilter !== "toate" && injury.severity !== severityFilter) return false
        if (availabilityFilter === "disponibil" && !record.isAvailable) return false
        if (availabilityFilter === "indisponibil" && record.isAvailable) return false
        if (normalizedInjurySearchQuery === "") return true

        return [getAthleteName(record.athlete), injury.injuryType, injury.bodyPart, injury.notes ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(normalizedInjurySearchQuery)
    })
    const totalMedicalRecords = records.filter((record) => record.injuries.length === 0).length
    const totalInjuries = allInjuryRecords.length
    const openModal = (record?: MedicalRecord) => {
        setEditingRecord(record || null)
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingRecord(null)
    }

    const resetInlineForm = () => {
        setAthleteId("")
        setDiagnosis("")
        setTreatment("")
        setStartDate(new Date().toISOString().split("T")[0])
        setEndDate("")
        setIsAvailable(true)
        setInjuries([])
    }

    const resetMedicalFilters = () => {
        setSearchQuery("")
        setAthleteFilter("")
    }

    const resetInjuryFilters = () => {
        setInjurySearchQuery("")
        setInjuryAthleteFilter("")
        setSeverityFilter("toate")
        setAvailabilityFilter("toate")
    }

    const handleRemoveInjury = (index: number) => {
        const newInjuries = [...injuries]
        newInjuries.splice(index, 1)
        setInjuries(newInjuries)
    }

    const handleInjuryChange = (index: number, field: keyof Omit<Injury, "id" | "medicalRecordId">, value: string | number | Severity | null) => {
        const newInjuries = [...injuries]
        newInjuries[index] = { ...newInjuries[index], [field]: value }
        setInjuries(newInjuries)
    }

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (athleteId === "") return

        setLoading(true)
        try {
            const createdRecord = await saveMedicalRecord({
                athleteId: Number(athleteId),
                diagnosis,
                treatment,
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

            const selectedAthlete = athletes.find((athlete) => athlete.id === Number(athleteId))

            setRecords((current) => [
                {
                    ...createdRecord,
                    athlete: selectedAthlete ?? { id: Number(athleteId), user: { profile: null } },
                    injuries,
                } as MedicalRecord,
                ...current,
            ])
            resetInlineForm()
        } catch (error) {
            console.error(error)
            alert("Eroare la salvarea dosarului")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="sd-box" style={{ marginBottom: "24px" }}>
                <div className="sd-box-header">
                    <h2>Adauga Dosar Medical</h2>
                </div>
                <div className="sd-box-content">
                    <form onSubmit={handleCreateSubmit}>
                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", marginBottom: "8px" }}>Atlet (Fotbal)</label>
                            <select
                                value={athleteId}
                                onChange={(e) => setAthleteId(e.target.value ? Number(e.target.value) : "")}
                                required
                                style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                            >
                                <option value="">Selecteaza atlet</option>
                                {athletes.map((athlete) => (
                                    <option key={athlete.id} value={athlete.id}>
                                        {athlete.user.profile?.firstName} {athlete.user.profile?.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", marginBottom: "8px" }}>Diagnostic</label>
                            <input
                                type="text"
                                value={diagnosis}
                                onChange={(e) => setDiagnosis(e.target.value)}
                                required
                                style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                            />
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", marginBottom: "8px" }}>Tratament</label>
                            <textarea
                                value={treatment}
                                onChange={(e) => setTreatment(e.target.value)}
                                required
                                rows={3}
                                style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: "block", marginBottom: "8px" }}>Data Inceput</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                    style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: "block", marginBottom: "8px" }}>Data Sfarsit (Optional)</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                                />
                            </div>
                        </div>

    
                        <div style={{ marginBottom: "16px", borderTop: "1px solid #eee", paddingTop: "16px" }}>
                            {injuries.map((injury, index) => (
                                <div key={index} style={{ background: "#f9f9f9", padding: "12px", borderRadius: "4px", marginBottom: "8px", border: "1px solid #e0e0e0" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                        <strong>Accidentare #{index + 1}</strong>
                                        <button type="button" onClick={() => handleRemoveInjury(index)} style={{ color: "red", background: "none", border: "none", cursor: "pointer" }}>Sterge</button>
                                    </div>
                                    <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                                        <input
                                            type="text"
                                            placeholder="Tip (ex: Entorsa)"
                                            value={injury.injuryType}
                                            onChange={(e) => handleInjuryChange(index, "injuryType", e.target.value)}
                                            required
                                            style={{ flex: 1, padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Parte corp (ex: Glezna stanga)"
                                            value={injury.bodyPart}
                                            onChange={(e) => handleInjuryChange(index, "bodyPart", e.target.value)}
                                            required
                                            style={{ flex: 1, padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                                        />
                                    </div>
                                    <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                                        <select
                                            value={injury.severity}
                                            onChange={(e) => handleInjuryChange(index, "severity", e.target.value as Severity)}
                                            style={{ flex: 1, padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                                        >
                                            <option value={Severity.usoara}>Usoara</option>
                                            <option value={Severity.medie}>Medie</option>
                                            <option value={Severity.grava}>Grava</option>
                                        </select>
                                        <input
                                            type="number"
                                            placeholder="Zile recuperare"
                                            value={injury.recoveryDays}
                                            onChange={(e) => handleInjuryChange(index, "recoveryDays", e.target.value)}
                                            required
                                            min="0"
                                            style={{ flex: 1, padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Note (optional)"
                                            value={injury.notes || ""}
                                            onChange={(e) => handleInjuryChange(index, "notes", e.target.value)}
                                            style={{ width: "100%", padding: "6px", border: "1px solid #ccc", borderRadius: "4px" }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                            <button type="button" onClick={resetInlineForm} style={{ padding: "8px 16px", background: "white", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}>
                                Anuleaza
                            </button>
                            <button type="submit" disabled={loading} style={{ padding: "8px 16px", background: "#0056b3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                                {loading ? "Se salveaza..." : "Salveaza"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="sd-box" style={{ marginBottom: "24px" }}>
                <div className="sd-box-header">
                    <h2>Dosare medicale ({medicalRecords.length}{hasActiveMedicalFilters ? ` din ${totalMedicalRecords}` : ""})</h2>
                </div>
                <div className="sd-box-content" style={{ padding: 0, overflowX: "auto" }}>
                    <div className="sd-table-toolbar">
                        <div style={{ ...FILTER_FIELD_STYLE, flex: "1 1 220px" }}>
                            <label htmlFor="medical-record-search" className="sd-table-toolbar-label" style={FILTER_LABEL_STYLE}>Cauta</label>
                            <input
                                id="medical-record-search"
                                type="search"
                                className="sd-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Atlet, diagnostic, tratament..."
                            />
                        </div>
                        <div style={{ ...FILTER_FIELD_STYLE, flex: "1 1 180px" }}>
                            <label htmlFor="medical-record-athlete-filter" className="sd-table-toolbar-label" style={FILTER_LABEL_STYLE}>Atlet</label>
                            <select
                                id="medical-record-athlete-filter"
                                className="sd-input"
                                value={athleteFilter}
                                onChange={(e) => setAthleteFilter(e.target.value ? Number(e.target.value) : "")}
                            >
                                <option value="">Toti atletii</option>
                                {athletes.map((athlete) => (
                                    <option key={athlete.id} value={athlete.id}>
                                        {getAthleteName(athlete) || `Atlet #${athlete.id}`}
                                    </option>
                                ))}
                            </select>
                        </div>


                        <div className="sd-table-toolbar-actions">
                            <button
                                type="button"
                                className="sd-btn-secondary"
                                onClick={resetMedicalFilters}
                                disabled={!hasActiveMedicalFilters}
                                style={{ cursor: hasActiveMedicalFilters ? "pointer" : "not-allowed", opacity: hasActiveMedicalFilters ? 1 : 0.55 }}
                            >
                                Reseteaza
                            </button>
                        </div>
                    </div>
                    {totalMedicalRecords === 0 ? (
                        <p style={{ padding: "16px" }}>Nu exista dosare medicale inregistrate.</p>
                    ) : (
                        <table className="sd-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #eee", textAlign: "left" }}>
                                    <th style={{ padding: "12px" }}>Atlet</th>
                                    <th style={{ padding: "12px" }}>Diagnostic</th>
                                    <th style={{ padding: "12px" }}>Tratament</th>
                                    <th style={{ padding: "12px" }}>Data inceput</th>
                                    <th style={{ padding: "12px" }}>Data sfarsit</th>
                                    <th style={{ padding: "12px" }}>Actiuni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {medicalRecords.map((record) => (
                                    <tr key={record.id} style={{ borderBottom: "1px solid #eee" }}>
                                        <td style={{ padding: "12px" }}>
                                            {record.athlete.user.profile?.firstName} {record.athlete.user.profile?.lastName}
                                        </td>
                                        <td style={{ padding: "12px" }}>{record.diagnosis}</td>
                                        <td style={{ padding: "12px" }}>{record.treatment}</td>
                                        <td style={{ padding: "12px" }}>{new Date(record.startDate).toLocaleDateString()}</td>
                                        <td style={{ padding: "12px" }}>
                                            {record.endDate ? new Date(record.endDate).toLocaleDateString() : "-"}
                                        </td>

                                        <td style={{ padding: "12px" }}>
                                            <button
                                                onClick={() => openModal(record)}
                                                style={{ cursor: "pointer", background: "none", border: "none", color: "#0056b3", textDecoration: "underline" }}
                                            >
                                                Editeaza
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {medicalRecords.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: "center", color: "#999", padding: "20px" }}>
                                            Nu exista dosare medicale pentru filtrele selectate.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <div className="sd-box">
                <div className="sd-box-header">
                    <h2>Accidentari ({injuryRecords.length}{hasActiveInjuryFilters ? ` din ${totalInjuries}` : ""})</h2>
                </div>
                <div className="sd-box-content" style={{ padding: 0, overflowX: "auto" }}>
                    <div className="sd-table-toolbar">
                        <div style={{ ...FILTER_FIELD_STYLE, flex: "1 1 220px" }}>
                            <label htmlFor="injury-search" className="sd-table-toolbar-label" style={FILTER_LABEL_STYLE}>Cauta</label>
                            <input id="injury-search" type="search" className="sd-input" value={injurySearchQuery} onChange={(e) => setInjurySearchQuery(e.target.value)} placeholder="Atlet, tip, parte corp, note..." />
                        </div>
                        <div style={{ ...FILTER_FIELD_STYLE, flex: "1 1 180px" }}>
                            <label htmlFor="injury-athlete-filter" className="sd-table-toolbar-label" style={FILTER_LABEL_STYLE}>Atlet</label>
                            <select id="injury-athlete-filter" className="sd-input" value={injuryAthleteFilter} onChange={(e) => setInjuryAthleteFilter(e.target.value ? Number(e.target.value) : "")}>
                                <option value="">Toti atletii</option>
                                {athletes.map((athlete) => <option key={athlete.id} value={athlete.id}>{getAthleteName(athlete) || `Atlet #${athlete.id}`}</option>)}
                            </select>
                        </div>
                        <div style={{ ...FILTER_FIELD_STYLE, flex: "1 1 150px" }}>
                            <label htmlFor="injury-severity-filter" className="sd-table-toolbar-label" style={FILTER_LABEL_STYLE}>Severitate</label>
                            <select id="injury-severity-filter" className="sd-input" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}>
                                <option value="toate">Toate</option>
                                {Object.values(Severity).map((severity) => <option key={severity} value={severity}>{SEVERITY_LABELS[severity]}</option>)}
                            </select>
                        </div>

                        <div style={{ ...FILTER_FIELD_STYLE, flex: "1 1 150px" }}>
                            <label htmlFor="injury-availability-filter" className="sd-table-toolbar-label" style={FILTER_LABEL_STYLE}>Disponibilitate</label>
                            <select
                                id="injury-availability-filter"
                                className="sd-input"
                                value={availabilityFilter}
                                onChange={(e) => setAvailabilityFilter(e.target.value as AvailabilityFilter)}
                            >
                                <option value="toate">Toate</option>
                                <option value="disponibil">Disponibil</option>
                                <option value="indisponibil">Indisponibil</option>
                            </select>
                        </div>
                        <div className="sd-table-toolbar-actions">
                            <button type="button" className="sd-btn-secondary" onClick={resetInjuryFilters} disabled={!hasActiveInjuryFilters} style={{ cursor: hasActiveInjuryFilters ? "pointer" : "not-allowed", opacity: hasActiveInjuryFilters ? 1 : 0.55 }}>
                                Reseteaza
                            </button>
                        </div>
                    </div>
                    {totalInjuries === 0 ? (
                        <p style={{ padding: "16px" }}>Nu exista accidentari inregistrate.</p>
                    ) : (
                        <table className="sd-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #eee", textAlign: "left" }}>
                                    <th style={{ padding: "12px" }}>Atlet</th>
                                    <th style={{ padding: "12px" }}>Tip accidentare</th>
                                    <th style={{ padding: "12px" }}>Parte corp</th>
                                    <th style={{ padding: "12px" }}>Severitate</th>
                                    <th style={{ padding: "12px" }}>Zile recuperare</th>
                                    <th style={{ padding: "12px" }}>Data inceput</th>
                                    <th style={{ padding: "12px" }}>Data sfarsit</th>
                                    <th style={{ padding: "12px" }}>Disponibilitate</th>
                                    <th style={{ padding: "12px" }}>Actiuni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {injuryRecords.map(({ record, injury }) => (
                                    <tr key={injury.id} style={{ borderBottom: "1px solid #eee" }}>
                                        <td style={{ padding: "12px" }}>{getAthleteName(record.athlete)}</td>
                                        <td style={{ padding: "12px" }}>{injury.injuryType}</td>
                                        <td style={{ padding: "12px" }}>{injury.bodyPart}</td>
                                        <td style={{ padding: "12px" }}>{SEVERITY_LABELS[injury.severity]}</td>
                                        <td style={{ padding: "12px" }}>{injury.recoveryDays}</td>
                                        <td style={{ padding: "12px" }}>{new Date(record.startDate).toLocaleDateString()}</td>
                                        <td style={{ padding: "12px" }}>{record.endDate ? new Date(record.endDate).toLocaleDateString() : "-"}</td>
                                        <td style={{ padding: "12px" }}>
                                            <span style={{ padding: "4px 8px", borderRadius: "12px", fontSize: "12px", background: record.isAvailable ? "#e6f4ea" : "#fce8e6", color: record.isAvailable ? "#1e8e3e" : "#d93025" }}>
                                                {record.isAvailable ? "Disponibil" : "Indisponibil"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px" }}>
                                            <button
                                                onClick={() => openModal(record)}
                                                style={{ cursor: "pointer", background: "none", border: "none", color: "#0056b3", textDecoration: "underline" }}
                                            >
                                                Editeaza
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {injuryRecords.length === 0 && (
                                    <tr>
                                        <td colSpan={9} style={{ textAlign: "center", color: "#999", padding: "20px" }}>
                                            Nu exista accidentari pentru filtrele selectate.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {isModalOpen && (
                <DosarMedicalModal
                    editingRecord={editingRecord}
                    athletes={athletes}
                    onClose={closeModal}
                    onSuccess={() => window.location.reload()}
                />
            )}
        </>
    )
}

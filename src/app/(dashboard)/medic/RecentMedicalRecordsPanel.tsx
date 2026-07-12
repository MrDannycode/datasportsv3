"use client"

import { useMemo, useState } from "react"

type RecentRecord = {
    id: number
    createdAt: string
    athleteName: string
    diagnosis: string
    treatment: string
    isAvailable: boolean
    injuries: Array<{ id: number; injuryType: string; bodyPart: string; severity: string }>
}

const severityLabels: Record<string, string> = { usoara: "Usoara", medie: "Medie", grava: "Grava" }

export default function RecentMedicalRecordsPanel({ records }: { records: RecentRecord[] }) {
    const [view, setView] = useState<"records" | "injuries">("records")
    const medicalRecords = useMemo(() => records.filter(record => record.injuries.length === 0).slice(0, 5), [records])
    const injuries = useMemo(() => records.flatMap(record => record.injuries.map(injury => ({ record, injury }))).slice(0, 5), [records])

    return (
        <div className="sd-box-content">
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                <button type="button" className={view === "records" ? "sd-btn-primary" : "sd-btn-secondary"} onClick={() => setView("records")}>Dosare medicale</button>
                <button type="button" className={view === "injuries" ? "sd-btn-primary" : "sd-btn-secondary"} onClick={() => setView("injuries")}>Accidentari</button>
            </div>

            {view === "records" ? (
                medicalRecords.length === 0 ? <p>Nu exista dosare medicale recente pentru echipa ta.</p> : (
                    <table className="sd-table">
                        <thead><tr><th>Data</th><th>Atlet</th><th>Diagnostic</th><th>Tratament</th></tr></thead>
                        <tbody>{medicalRecords.map(record => <tr key={record.id}><td>{new Date(record.createdAt).toLocaleDateString()}</td><td>{record.athleteName}</td><td>{record.diagnosis}</td><td>{record.treatment}</td></tr>)}</tbody>
                    </table>
                )
            ) : injuries.length === 0 ? <p>Nu exista accidentari recente pentru echipa ta.</p> : (
                <table className="sd-table">
                    <thead><tr><th>Data</th><th>Atlet</th><th>Accidentare</th><th>Parte corp</th><th>Severitate</th><th>Disponibilitate</th></tr></thead>
                    <tbody>{injuries.map(({ record, injury }) => <tr key={injury.id}><td>{new Date(record.createdAt).toLocaleDateString()}</td><td>{record.athleteName}</td><td>{injury.injuryType}</td><td>{injury.bodyPart}</td><td>{severityLabels[injury.severity] ?? injury.severity}</td><td>{record.isAvailable ? "Disponibil" : "Indisponibil"}</td></tr>)}</tbody>
                </table>
            )}
        </div>
    )
}
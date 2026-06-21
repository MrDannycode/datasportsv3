"use client"

import { useEffect, useRef, useState } from "react"
import { Severity } from "@prisma/client"
import DosarMedicalModal from "./DosarMedicalModal"

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

export default function DosarManager({ initialRecords, athletes, shouldOpenNewRecordModal = false }: Props) {
    const [records, setRecords] = useState<MedicalRecord[]>(initialRecords)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null)
    const hasOpenedFromQueryRef = useRef(false)

    useEffect(() => {
        if (!shouldOpenNewRecordModal || hasOpenedFromQueryRef.current) {
            return
        }

        hasOpenedFromQueryRef.current = true
        openModal()
    }, [shouldOpenNewRecordModal])

    const openModal = (record?: MedicalRecord) => {
        setEditingRecord(record || null)
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingRecord(null)
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
                <DosarMedicalModal
                    editingRecord={editingRecord}
                    athletes={athletes}
                    onClose={closeModal}
                    onSuccess={() => window.location.reload()}
                />
            )}
        </div>
    )
}




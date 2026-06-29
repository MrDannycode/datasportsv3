"use client"

import React, { useState } from "react"

type ProfileData = {
  firstName: string
  lastName: string
  dateOfBirth: string | null
  phone: string | null
  restingHeartRate: number | null
  maxHeartRate: number | null
  gender: "MALE" | "FEMALE" | null
  heightCm?: number | null
  weightKg?: number | null
  preferredFoot?: string | null
  preferredHand?: string | null
  atpWtaRanking?: number | null
  sportType?: "fotbal" | "tenis" | null
}


type ProfileSubmitData = {
  firstName: string
  lastName: string
  dateOfBirth: string
  phone: string
  gender: string
  restingHeartRate: string
  maxHeartRate: string
  heightCm: string
  weightKg: string
  preferredFoot: string
  preferredHand: string
  atpWtaRanking: string
}
type Props = {
  initialData: ProfileData
  isPending: boolean
  formError: string | null
  formSuccess: string | null
  onSubmit: (e: React.FormEvent, data: ProfileSubmitData) => void
  onClose: () => void
}

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  border: "1px solid #ddd",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "bold",
  color: "#555",
  display: "block",
  marginBottom: "4px",
}

const FIELD_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  marginBottom: "12px",
  width: "100%",
}

export default function MyProfileModal({
  initialData,
  isPending,
  formError,
  formSuccess,
  onSubmit,
  onClose,
}: Props) {
  const [firstName, setFirstName] = useState(initialData.firstName || "")
  const [lastName, setLastName] = useState(initialData.lastName || "")
  const [dateOfBirth, setDateOfBirth] = useState(initialData.dateOfBirth ? initialData.dateOfBirth.slice(0, 10) : "")
  const [phone, setPhone] = useState(initialData.phone || "")
  const [gender, setGender] = useState(initialData.gender || "")
  const [restingHeartRate, setRestingHeartRate] = useState(initialData.restingHeartRate?.toString() || "")
  const [maxHeartRate, setMaxHeartRate] = useState(initialData.maxHeartRate?.toString() || "")

  const [heightCm, setHeightCm] = useState(initialData.heightCm?.toString() || "")
  const [weightKg, setWeightKg] = useState(initialData.weightKg?.toString() || "")
  const [preferredFoot, setPreferredFoot] = useState(initialData.preferredFoot || "")
  const [preferredHand, setPreferredHand] = useState(initialData.preferredHand || "")
  const [atpWtaRanking, setAtpWtaRanking] = useState(initialData.atpWtaRanking?.toString() || "")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(e, {
      firstName,
      lastName,
      dateOfBirth,
      phone,
      gender,
      restingHeartRate,
      maxHeartRate,
      heightCm,
      weightKg,
      preferredFoot,
      preferredHand,
      atpWtaRanking,
    })
  }

  return (
    <div
    role="dialog"
    aria-modal="true"
    onClick={onClose}
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      zIndex: 9999,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        backgroundColor: "#fff",
        borderRadius: "6px",
        width: "100%",
        maxWidth: "500px",
        maxHeight: "90vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
      }}
    >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "16px", color: "#333" }}>Profilul Meu</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#999" }}>&times;</button>
        </div>

        <div style={{ padding: "20px" }}>
          <form onSubmit={handleSubmit}>
            <h3 style={{ fontSize: "14px", borderBottom: "1px solid #ddd", paddingBottom: "4px", marginBottom: "12px", color: "#0056b3" }}>Date Personale</h3>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ ...FIELD_STYLE, flex: 1 }}>
                <label style={LABEL_STYLE}>Prenume *</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required style={INPUT_STYLE} />
              </div>
              <div style={{ ...FIELD_STYLE, flex: 1 }}>
                <label style={LABEL_STYLE}>Nume *</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required style={INPUT_STYLE} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ ...FIELD_STYLE, flex: 1 }}>
                <label style={LABEL_STYLE}>Data Nașterii</label>
                <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} max={new Date().toISOString().slice(0, 10)} style={INPUT_STYLE} />
              </div>
              <div style={{ ...FIELD_STYLE, flex: 1 }}>
                <label style={LABEL_STYLE}>Gen</label>
                <select value={gender} onChange={e => setGender(e.target.value)} style={{ ...INPUT_STYLE, backgroundColor: "#fff" }}>
                  <option value="">Neselectat</option>
                  <option value="MALE">Masculin (MALE)</option>
                  <option value="FEMALE">Feminin (FEMALE)</option>
                </select>
              </div>
            </div>

            <div style={{ ...FIELD_STYLE }}>
              <label style={LABEL_STYLE}>Telefon</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={INPUT_STYLE} />
            </div>

            <h3 style={{ fontSize: "14px", borderBottom: "1px solid #ddd", paddingBottom: "4px", marginTop: "20px", marginBottom: "12px", color: "#0056b3" }}>Date Sănătate & Ritm Cardiac</h3>
            <p style={{ fontSize: "11px", color: "#666", marginBottom: "12px" }}>Ritmul cardiac este folosit la calcularea efortului sportiv (Training Load / TRIMP).</p>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ ...FIELD_STYLE, flex: 1 }}>
                <label style={LABEL_STYLE}>HR Minim (Repaus)</label>
                <input type="number" value={restingHeartRate} onChange={e => setRestingHeartRate(e.target.value)} min="30" max="150" placeholder="ex. 50" style={INPUT_STYLE} />
              </div>
              <div style={{ ...FIELD_STYLE, flex: 1 }}>
                <label style={LABEL_STYLE}>HR Maxim</label>
                <input type="number" value={maxHeartRate} onChange={e => setMaxHeartRate(e.target.value)} min="100" max="250" placeholder="ex. 195" style={INPUT_STYLE} />
              </div>
            </div>

            {(initialData.sportType === "fotbal" || initialData.sportType === "tenis") && (
              <>
                <h3 style={{ fontSize: "14px", borderBottom: "1px solid #ddd", paddingBottom: "4px", marginTop: "20px", marginBottom: "12px", color: "#0056b3" }}>Date Sportive</h3>
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ ...FIELD_STYLE, flex: 1 }}>
                    <label style={LABEL_STYLE}>Înălțime (cm)</label>
                    <input type="number" value={heightCm} onChange={e => setHeightCm(e.target.value)} min="100" max="250" step="0.1" style={INPUT_STYLE} />
                  </div>
                  <div style={{ ...FIELD_STYLE, flex: 1 }}>
                    <label style={LABEL_STYLE}>Greutate (kg)</label>
                    <input type="number" value={weightKg} onChange={e => setWeightKg(e.target.value)} min="30" max="200" step="0.1" style={INPUT_STYLE} />
                  </div>
                </div>

                {initialData.sportType === "fotbal" && (
                  <div style={{ ...FIELD_STYLE }}>
                    <label style={LABEL_STYLE}>Picior Preferat</label>
                    <select value={preferredFoot} onChange={e => setPreferredFoot(e.target.value)} style={{ ...INPUT_STYLE, backgroundColor: "#fff" }}>
                      <option value="">Neselectat</option>
                      <option value="dreapta">Dreapta</option>
                      <option value="stanga">Stânga</option>
                      <option value="ambele">Ambele</option>
                    </select>
                  </div>
                )}

                {initialData.sportType === "tenis" && (
                  <>
                  <div style={{ ...FIELD_STYLE }}>
                    <label style={LABEL_STYLE}>Mână Preferată</label>
                    <select value={preferredHand} onChange={e => setPreferredHand(e.target.value)} style={{ ...INPUT_STYLE, backgroundColor: "#fff" }}>
                      <option value="">Neselectat</option>
                      <option value="dreapta">Dreapta</option>
                      <option value="stanga">Stânga</option>
                    </select>
                  </div>
                  <div style={{ ...FIELD_STYLE }}>
                    <label style={LABEL_STYLE}>Clasament ATP/WTA</label>
                    <input type="number" value={atpWtaRanking} onChange={e => setAtpWtaRanking(e.target.value)} min="1" max="3000" step="1" placeholder="ex. 850" style={INPUT_STYLE} />
                  </div>
                  </>
                )}
              </>
            )}

            {formError && <p style={{ color: "#c00", fontSize: "12px", marginTop: "10px" }}>❌ {formError}</p>}
            {formSuccess && <p style={{ color: "#2a7a2a", fontSize: "12px", marginTop: "10px" }}>✅ {formSuccess}</p>}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "20px" }}>
              <button type="button" onClick={onClose} style={{ padding: "8px 16px", backgroundColor: "#f5f5f5", border: "1px solid #ddd", cursor: "pointer", fontSize: "13px" }}>
                Anulează
              </button>
              <button type="submit" disabled={isPending} style={{ padding: "8px 16px", backgroundColor: isPending ? "#aaa" : "#0056b3", color: "#fff", border: "none", cursor: isPending ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "13px" }}>
                {isPending ? "Se salvează..." : "Salvează Modificări"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}



"use client"

import type { CSSProperties, FormEvent } from "react"

type SportOption = {
  value: string
  label: string
}

type Props = {
  date: string
  durationMin: string
  avgHeartRate: string
  sport: string
  notes: string
  hasCardiacData: boolean
  sportOptions: SportOption[]
  isPending: boolean
  formError: string | null
  formSuccess: string | null
  today: string
  onDateChange: (value: string) => void
  onDurationChange: (value: string) => void
  onHeartRateChange: (value: string) => void
  onSportChange: (value: string) => void
  onNotesChange: (value: string) => void
  onClose: () => void
  onSubmit: (e: FormEvent) => void
}

const INPUT_STYLE: CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid var(--sd-border)",
  backgroundColor: "var(--sd-box-bg)",
  color: "var(--sd-text)",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
}

const LABEL_STYLE: CSSProperties = {
  fontSize: "12px",
  fontWeight: "bold",
  color: "var(--sd-text)",
  display: "block",
  marginBottom: "4px",
}

const SECONDARY_BUTTON_STYLE: CSSProperties = {
  fontSize: "13px",
  border: "1px solid var(--sd-border)",
  color: "var(--sd-text)",
  backgroundColor: "var(--sd-box-bg)",
  padding: "7px 20px",
  fontWeight: "bold",
  cursor: "pointer",
}

const FIELD_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
}

export default function ActivityModal({
  date,
  durationMin,
  avgHeartRate,
  sport,
  notes,
  hasCardiacData,
  sportOptions,
  isPending,
  formError,
  formSuccess,
  today,
  onDateChange,
  onDurationChange,
  onHeartRateChange,
  onSportChange,
  onNotesChange,
  onClose,
  onSubmit,
}: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-modal-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "900px",
          backgroundColor: "var(--sd-box-bg)",
          color: "var(--sd-text)",
          border: "1px solid var(--sd-border)",
          borderRadius: "8px",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.18)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 22px",
            borderBottom: "1px solid var(--sd-border)",
          }}
        >
          <div>
            <h2 id="activity-modal-title" style={{ margin: 0 }}>Adauga activitate noua</h2>
            <p style={{ margin: "6px 0 0", color: "color-mix(in srgb, var(--sd-text) 68%, transparent)", fontSize: "13px" }}>
              Completeaza rapid o activitate noua pentru dashboard-ul tau de load.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: "none", background: "transparent", fontSize: "24px", lineHeight: 1, cursor: "pointer", color: "var(--sd-text)" }}
            aria-label="Inchide"
          >
            x
          </button>
        </div>

        <div style={{ padding: "22px" }}>
          <form onSubmit={onSubmit} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ ...FIELD_STYLE, flex: "1 1 140px" }}>
              <label htmlFor="activity-modal-date" style={LABEL_STYLE}>Data *</label>
              <input id="activity-modal-date" type="date" value={date} onChange={(e) => onDateChange(e.target.value)} required max={today} style={INPUT_STYLE} />
            </div>
            <div style={{ ...FIELD_STYLE, flex: "1 1 140px" }}>
              <label htmlFor="activity-modal-duration" style={LABEL_STYLE}>Durata (minute) *</label>
              <input id="activity-modal-duration" type="number" value={durationMin} onChange={(e) => onDurationChange(e.target.value)} required min="1" max="600" step="1" placeholder="ex. 90" style={INPUT_STYLE} />
            </div>
            <div style={{ ...FIELD_STYLE, flex: "1 1 160px" }}>
              <label htmlFor="activity-modal-sport" style={LABEL_STYLE}>Sport</label>
              <select id="activity-modal-sport" value={sport} onChange={(e) => onSportChange(e.target.value)} style={INPUT_STYLE}>
                {sportOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div style={{ ...FIELD_STYLE, flex: "1 1 160px" }}>
              <label htmlFor="activity-modal-hr" style={LABEL_STYLE}>FC medie (bpm){!hasCardiacData && <span style={{ color: "#f59e0b", marginLeft: "4px" }}>- necesar profil</span>}</label>
              <input id="activity-modal-hr" type="number" value={avgHeartRate} onChange={(e) => onHeartRateChange(e.target.value)} min="30" max="250" step="1" placeholder="ex. 155" style={INPUT_STYLE} />
            </div>
            <div style={{ ...FIELD_STYLE, flex: "1 1 100%", width: "100%" }}>
              <label htmlFor="activity-modal-notes" style={LABEL_STYLE}>Note (optional)</label>
              <textarea id="activity-modal-notes" value={notes} onChange={(e) => onNotesChange(e.target.value)} rows={3} maxLength={500} placeholder="ex. Antrenament tactic, teren greu, recuperare dupa meci..." style={{ ...INPUT_STYLE, resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", width: "100%", marginTop: "8px" }}>
              <button type="button" onClick={onClose} style={SECONDARY_BUTTON_STYLE}>
                Inchide
              </button>
              <button id="activity-modal-submit" type="submit" disabled={isPending} style={{ backgroundColor: isPending ? "#aaa" : "#0056b3", color: "#fff", border: "none", padding: "7px 20px", fontSize: "13px", fontWeight: "bold", cursor: isPending ? "not-allowed" : "pointer" }}>
                {isPending ? "Se salveaza..." : "Adauga activitate"}
              </button>
            </div>
          </form>
          {formError && <p style={{ color: "#f87171", fontSize: "12px", marginTop: "10px" }}>Eroare: {formError}</p>}
          {formSuccess && <p style={{ color: "#22c55e", fontSize: "12px", marginTop: "10px" }}>{formSuccess}</p>}
        </div>
      </div>
    </div>
  )
}

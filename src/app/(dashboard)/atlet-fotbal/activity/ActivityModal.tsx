"use client"

import type { CSSProperties, FormEvent } from "react"
import BaseModal, { ModalActions, ModalFeedback, modalInputStyle, modalLabelStyle, modalFieldStyle, modalSecondaryBtnStyle } from "@/components/base-modal"

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
  ...modalInputStyle,
  width: "100%",
  outline: "none",
  boxSizing: "border-box",
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
    <BaseModal
      modalId="activity-modal-title"
      title="Adauga activitate noua"
      subtitle="Completeaza rapid o activitate noua pentru dashboard-ul tau de load."
      maxWidth="900px"
      onClose={onClose}
    >
      <form onSubmit={onSubmit} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ ...modalFieldStyle, flex: "1 1 140px" }}>
          <label htmlFor="activity-modal-date" style={modalLabelStyle}>Data *</label>
          <input id="activity-modal-date" type="date" value={date} onChange={(e) => onDateChange(e.target.value)} required max={today} style={INPUT_STYLE} />
        </div>
        <div style={{ ...modalFieldStyle, flex: "1 1 140px" }}>
          <label htmlFor="activity-modal-duration" style={modalLabelStyle}>Durata (minute) *</label>
          <input id="activity-modal-duration" type="number" value={durationMin} onChange={(e) => onDurationChange(e.target.value)} required min="1" max="600" step="1" placeholder="ex. 90" style={INPUT_STYLE} />
        </div>
        <div style={{ ...modalFieldStyle, flex: "1 1 160px" }}>
          <label htmlFor="activity-modal-sport" style={modalLabelStyle}>Sport</label>
          <select id="activity-modal-sport" value={sport} onChange={(e) => onSportChange(e.target.value)} style={INPUT_STYLE}>
            {sportOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div style={{ ...modalFieldStyle, flex: "1 1 160px" }}>
          <label htmlFor="activity-modal-hr" style={modalLabelStyle}>FC medie (bpm){!hasCardiacData && <span style={{ color: "#f59e0b", marginLeft: "4px" }}>- necesar profil</span>}</label>
          <input id="activity-modal-hr" type="number" value={avgHeartRate} onChange={(e) => onHeartRateChange(e.target.value)} min="30" max="250" step="1" placeholder="ex. 155" style={INPUT_STYLE} />
        </div>
        <div style={{ ...modalFieldStyle, flex: "1 1 100%", width: "100%" }}>
          <label htmlFor="activity-modal-notes" style={modalLabelStyle}>Note (optional)</label>
          <textarea id="activity-modal-notes" value={notes} onChange={(e) => onNotesChange(e.target.value)} rows={3} maxLength={500} placeholder="ex. Antrenament tactic, teren greu, recuperare dupa meci..." style={{ ...INPUT_STYLE, resize: "vertical" }} />
        </div>

        <ModalActions
          onClose={onClose}
          loading={isPending}
          submitLabel="Adauga activitate"
          loadingLabel="Se salveaza..."
          submitId="activity-modal-submit"
          cancelLabel="Inchide"
        />
      </form>
      <ModalFeedback error={formError ?? undefined} success={formSuccess ?? undefined} />
    </BaseModal>
  )
}

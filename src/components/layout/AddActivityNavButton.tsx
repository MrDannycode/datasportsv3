"use client"

import { useState, useTransition } from "react"
import ActivityModal from "@/app/(dashboard)/atlet-fotbal/activity/ActivityModal"
import { addActivity } from "@/app/(dashboard)/atlet-fotbal/activity/actions"

const SPORT_OPTIONS = [
  { value: "fotbal", label: "Fotbal" },
  { value: "tenis", label: "Tenis" },
  { value: "alergare", label: "Alergare" },
  { value: "ciclism", label: "Ciclism" },
  { value: "inot", label: "Inot" },
  { value: "fitness", label: "Fitness / Sala" },
  { value: "alta", label: "Alta" },
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function AddActivityNavButton({
  label,
  isActive = false,
  hasCardiacData,
  defaultSport = "fotbal",
}: {
  label: string
  isActive?: boolean
  hasCardiacData: boolean
  defaultSport?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [date, setDate] = useState(today())
  const [durationMin, setDurationMin] = useState("")
  const [avgHeartRate, setAvgHeartRate] = useState("")
  const [sport, setSport] = useState(defaultSport)
  const [notes, setNotes] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  function resetForm() {
    setDate(today())
    setDurationMin("")
    setAvgHeartRate("")
    setSport(defaultSport)
    setNotes("")
    setFormError(null)
    setFormSuccess(null)
  }

  function closeModal() {
    setIsOpen(false)
    resetForm()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    const fd = new FormData()
    fd.append("date", date)
    fd.append("durationMin", durationMin)
    if (avgHeartRate) fd.append("avgHeartRate", avgHeartRate)
    fd.append("sport", sport)
    if (notes) fd.append("notes", notes)

    startTransition(async () => {
      const result = await addActivity(fd)
      if (!result.success) {
        setFormError(result.error)
        return
      }

      closeModal()
      window.location.reload()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`sd-nav-button${isActive ? " active" : ""}`}
      >
        {label}
      </button>

      {isOpen && (
        <ActivityModal
          date={date}
          durationMin={durationMin}
          avgHeartRate={avgHeartRate}
          sport={sport}
          notes={notes}
          hasCardiacData={hasCardiacData}
          sportOptions={SPORT_OPTIONS}
          isPending={isPending}
          formError={formError}
          formSuccess={formSuccess}
          today={today()}
          onDateChange={setDate}
          onDurationChange={setDurationMin}
          onHeartRateChange={setAvgHeartRate}
          onSportChange={setSport}
          onNotesChange={setNotes}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
    </>
  )
}
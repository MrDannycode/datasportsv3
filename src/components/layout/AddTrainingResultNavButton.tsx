"use client"

import { useMemo, useState, useTransition } from "react"
import TrainingResultModal from "@/components/layout/TrainingResultModal"
import { addTrainingResult } from "@/app/(dashboard)/atlet-fotbal/activity/actions"

export type TrainingResultPlanOption = {
  id: number
  trainingType: "fitness" | "fotbal"
  title: string
  typeLabel: string
  date: string
  coachName: string
}

type TrainingType = TrainingResultPlanOption["trainingType"]

export default function AddTrainingResultNavButton({
  label,
  isActive = false,
  plans,
  hasCardiacData,
}: {
  label: string
  isActive?: boolean
  plans: TrainingResultPlanOption[]
  hasCardiacData: boolean
}) {
  const defaultTrainingType: TrainingType = plans.some((plan) => plan.trainingType === "fitness") ? "fitness" : "fotbal"
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [trainingType, setTrainingType] = useState<TrainingType>(defaultTrainingType)
  const [selectedPlanId, setSelectedPlanId] = useState(() => String(plans.find((plan) => plan.trainingType === defaultTrainingType)?.id ?? ""))
  const [durationMin, setDurationMin] = useState("")
  const [avgHeartRate, setAvgHeartRate] = useState("")
  const [notes, setNotes] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  const firstPlanByType = useMemo(() => {
    return plans.find((plan) => plan.trainingType === trainingType)
  }, [plans, trainingType])

  function resetForm() {
    const nextType = plans.some((plan) => plan.trainingType === "fitness") ? "fitness" : "fotbal"
    setTrainingType(nextType)
    setSelectedPlanId(String(plans.find((plan) => plan.trainingType === nextType)?.id ?? ""))
    setDurationMin("")
    setAvgHeartRate("")
    setNotes("")
    setFormError(null)
  }

  function closeModal() {
    setIsOpen(false)
    resetForm()
  }

  function handleTrainingTypeChange(value: TrainingType) {
    setTrainingType(value)
    setSelectedPlanId(String(plans.find((plan) => plan.trainingType === value)?.id ?? ""))
    setFormError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    const fd = new FormData()
    fd.append("trainingType", trainingType)
    fd.append("planId", selectedPlanId || String(firstPlanByType?.id ?? ""))
    fd.append("durationMin", durationMin)
    fd.append("avgHeartRate", avgHeartRate)
    if (notes) fd.append("notes", notes)

    startTransition(async () => {
      const result = await addTrainingResult(fd)
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
        <TrainingResultModal
          trainingType={trainingType}
          selectedPlanId={selectedPlanId}
          durationMin={durationMin}
          avgHeartRate={avgHeartRate}
          notes={notes}
          plans={plans}
          hasCardiacData={hasCardiacData}
          isPending={isPending}
          formError={formError}
          onTrainingTypeChange={handleTrainingTypeChange}
          onPlanChange={setSelectedPlanId}
          onDurationChange={setDurationMin}
          onHeartRateChange={setAvgHeartRate}
          onNotesChange={setNotes}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
    </>
  )
}

"use client"

import { useState } from "react"
import TrainingPlanModal from "@/app/(dashboard)/antrenor-fotbal/antrenamente/TrainingPlanModal"
import { createPlan } from "@/app/(dashboard)/antrenor-fotbal/antrenamente/actions"

type PlanType = "tehnic" | "fizic" | "tactic"

export default function AddTrainingNavButton({ label, isActive = false }: { label: string; isActive?: boolean }) {
    const [isOpen, setIsOpen] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [type, setType] = useState<PlanType>("tehnic")
    const [date, setDate] = useState(new Date().toISOString().split("T")[0])
    const [formLoading, setFormLoading] = useState(false)
    const [formError, setFormError] = useState("")
    const [formSuccess, setFormSuccess] = useState("")

    function resetForm() {
        setTitle("")
        setDescription("")
        setType("tehnic")
        setDate(new Date().toISOString().split("T")[0])
        setFormError("")
        setFormSuccess("")
    }

    function closeModal() {
        setIsOpen(false)
        resetForm()
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setFormLoading(true)
        setFormError("")
        setFormSuccess("")

        try {
            const result = await createPlan({ title, description, type, date })
            if (result?.error) throw new Error(result.error)

            if (result?.plan) {
                closeModal()
                window.location.reload()
            }
        } catch (error: unknown) {
            setFormError(error instanceof Error ? error.message : "Eroare necunoscuta")
        } finally {
            setFormLoading(false)
        }
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
                <TrainingPlanModal
                    editMode={false}
                    title={title}
                    description={description}
                    type={type}
                    date={date}
                    formLoading={formLoading}
                    formError={formError}
                    formSuccess={formSuccess}
                    onTitleChange={setTitle}
                    onDescriptionChange={setDescription}
                    onTypeChange={setType}
                    onDateChange={setDate}
                    onCancelEdit={() => undefined}
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                />
            )}
        </>
    )
}
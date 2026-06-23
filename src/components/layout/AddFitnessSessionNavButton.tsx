"use client"

import { useState } from "react"
import FitnessPlanModal from "@/app/(dashboard)/antrenor-fitness/trainfit/FitnessPlanModal"
import { createPlan } from "@/app/(dashboard)/antrenor-fitness/trainfit/actions"

type PlanType = "forta" | "rezistenta" | "vitezare" | "flexibilitate" | "coordonare"

export default function AddFitnessSessionNavButton({ label, isActive = false }: { label: string; isActive?: boolean }) {
    const [isOpen, setIsOpen] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [type, setType] = useState<PlanType>("forta")
    const [date, setDate] = useState(new Date().toISOString().split("T")[0])
    const [formLoading, setFormLoading] = useState(false)
    const [formError, setFormError] = useState("")
    const [formSuccess, setFormSuccess] = useState("")

    function resetForm() {
        setTitle("")
        setDescription("")
        setType("forta")
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
                className={isActive ? "active" : ""}
                style={{
                    margin: "0 10px",
                    fontWeight: "bold",
                    color: "#555",
                    fontSize: "14px",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                }}
            >
                {label}
            </button>

            {isOpen && (
                <FitnessPlanModal
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
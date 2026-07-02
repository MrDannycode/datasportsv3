"use client"

import { useState } from "react"
import FitnessWeeklyGoalModal from "@/components/layout/FitnessWeeklyGoalModal"
import { setFitnessWeeklyGoal } from "@/app/(dashboard)/actions/fitness-weekly-goal"

type FitnessWeeklyGoalNavButtonProps = {
    label: string
    isActive?: boolean
    weekStart?: string
    weekLabel?: string
    targetTrimp?: number | null
}

export default function FitnessWeeklyGoalNavButton({
    label,
    isActive = false,
    weekStart,
    weekLabel,
    targetTrimp,
}: FitnessWeeklyGoalNavButtonProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [targetValue, setTargetValue] = useState(targetTrimp ? String(Math.round(targetTrimp)) : "")
    const [formLoading, setFormLoading] = useState(false)
    const [formError, setFormError] = useState("")

    function openModal() {
        setTargetValue(targetTrimp ? String(Math.round(targetTrimp)) : "")
        setFormError("")
        setIsOpen(true)
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault()
        setFormLoading(true)
        setFormError("")

        try {
            const result = await setFitnessWeeklyGoal({
                weekStart,
                targetTrimp: Number(targetValue),
            })

            if (result?.error) throw new Error(result.error)

            setIsOpen(false)
            window.location.reload()
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Eroare necunoscuta.")
        } finally {
            setFormLoading(false)
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={openModal}
                className={`sd-nav-button${isActive ? " active" : ""}`}
            >
                {label}
            </button>

            {isOpen && (
                <FitnessWeeklyGoalModal
                    targetTrimp={targetValue}
                    weekLabel={weekLabel}
                    formLoading={formLoading}
                    formError={formError}
                    onTargetTrimpChange={setTargetValue}
                    onClose={() => setIsOpen(false)}
                    onSubmit={handleSubmit}
                />
            )}
        </>
    )
}

"use client"

import { useState } from "react"
import FitnessWeeklyGoalModal from "@/components/layout/FitnessWeeklyGoalModal"
import { setFitnessWeeklyGoal } from "@/app/(dashboard)/actions/fitness-weekly-goal"

export type SidebarRecentInjury = {
    id: number
    athleteName: string
    injuryType: string
    bodyPart: string
    severity: string
    createdAt: string
}

export type SidebarWeeklyGoalTraining = {
    id: number
    date: string
    trimp: number | null
}

export type SidebarWeeklyGoalAthlete = {
    id: number
    name: string
    acRatio: number | null
    currentWeekTrimp: number
    expectedTrimp: number
    trainings: SidebarWeeklyGoalTraining[]
}

export type SidebarWeeklyGoal = {
    currentTrimp: number
    targetTrimp: number
    weekStart: string
    weekLabel: string
    acRiskAthletes: SidebarWeeklyGoalAthlete[]
    underExpectedAthletes: SidebarWeeklyGoalAthlete[]
}

type DashboardLeftSidebarProps = {
    recentInjuries?: SidebarRecentInjury[]
    weeklyGoal?: SidebarWeeklyGoal | null
    canEditWeeklyGoal?: boolean
}

function formatNumber(value: number | null | undefined, digits = 0) {
    if (value == null || Number.isNaN(value)) return "-"
    return value.toLocaleString("ro-RO", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
    })
}

function formatShortDate(value: string) {
    return new Date(value).toLocaleDateString("ro-RO", {
        day: "2-digit",
        month: "short",
    })
}

function renderWeeklyAthletes(athletes: SidebarWeeklyGoalAthlete[], emptyMessage: string) {
    if (athletes.length === 0) {
        return <p className="sd-progress-text">{emptyMessage}</p>
    }

    return (
        <ul className="sd-list">
            {athletes.map((athlete) => (
                <li key={athlete.id}>
                    <strong>{athlete.name}</strong>
                    <br />
                    A:C {formatNumber(athlete.acRatio, 2)} | TRIMP {formatNumber(athlete.currentWeekTrimp)} / {formatNumber(athlete.expectedTrimp)}
                    {athlete.trainings.length > 0 && (
                        <div style={{ display: "grid", gap: "4px", marginTop: "6px" }}>
                            {athlete.trainings.map((training) => (
                                <span key={training.id} className="sd-progress-text">
                                    {formatShortDate(training.date)} | A:C {formatNumber(athlete.acRatio, 2)} | {formatNumber(training.trimp)} TRIMP
                                </span>
                            ))}
                        </div>
                    )}
                </li>
            ))}
        </ul>
    )
}

export default function DashboardLeftSidebar({
    recentInjuries,
    weeklyGoal,
    canEditWeeklyGoal = false,
}: DashboardLeftSidebarProps) {
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
    const [targetValue, setTargetValue] = useState(weeklyGoal ? String(Math.round(weeklyGoal.targetTrimp)) : "")
    const [formLoading, setFormLoading] = useState(false)
    const [formError, setFormError] = useState("")

    function openGoalModal() {
        setTargetValue(weeklyGoal ? String(Math.round(weeklyGoal.targetTrimp)) : "")
        setFormError("")
        if (canEditWeeklyGoal) setIsGoalModalOpen(true)
    }

    async function handleGoalSubmit(event: React.FormEvent) {
        event.preventDefault()
        if (!weeklyGoal) return

        setFormLoading(true)
        setFormError("")

        try {
            const result = await setFitnessWeeklyGoal({
                weekStart: weeklyGoal.weekStart,
                targetTrimp: Number(targetValue),
            })

            if (result?.error) throw new Error(result.error)

            setIsGoalModalOpen(false)
            window.location.reload()
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Eroare necunoscuta.")
        } finally {
            setFormLoading(false)
        }
    }

    const weeklyGoalProgress = weeklyGoal?.targetTrimp
        ? Math.round((weeklyGoal.currentTrimp / weeklyGoal.targetTrimp) * 100)
        : 0
    const weeklyGoalProgressWidth = Math.min(weeklyGoalProgress, 100)

    if (!weeklyGoal && !recentInjuries) return null

    return (
        <aside className="sd-athlete-left-sidebar sd-sticky-sidebar">
            {isGoalModalOpen && weeklyGoal && canEditWeeklyGoal && (
                <FitnessWeeklyGoalModal
                    targetTrimp={targetValue}
                    weekLabel={weeklyGoal.weekLabel}
                    formLoading={formLoading}
                    formError={formError}
                    onTargetTrimpChange={setTargetValue}
                    onClose={() => setIsGoalModalOpen(false)}
                    onSubmit={handleGoalSubmit}
                />
            )}
            {weeklyGoal && (
                <div className="sd-box">
                    <div className="sd-box-header">
                        <h2>
                            {canEditWeeklyGoal ? (
                                <button
                                    type="button"
                                    onClick={openGoalModal}
                                    style={{ all: "unset", cursor: "pointer" }}
                                >
                                    Fitness Weekly Goal
                                </button>
                            ) : (
                                "Fitness Weekly Goal"
                            )}
                        </h2>
                    </div>
                    <div className="sd-box-content" style={{ display: "grid", gap: "12px" }}>
                        <div>
                            <div className="sd-metric-title">Saptamana</div>
                            <div style={{ fontWeight: "bold" }}>{weeklyGoal.weekLabel}</div>
                        </div>

                        <div>
                            <div className="sd-metric-title">TRIMP echipa</div>
                            <div className="sd-metric-value" style={{ fontSize: "18px" }}>
                                {formatNumber(weeklyGoal.currentTrimp)} / {formatNumber(weeklyGoal.targetTrimp)}
                            </div>
                        </div>

                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center" }}>
                                <div className="sd-metric-title" style={{ marginBottom: 0 }}>Progres</div>
                                <strong>{weeklyGoalProgress}%</strong>
                            </div>
                            <div className="sd-progress-bar" aria-label={`Weekly Goal ${weeklyGoalProgress}%`}>
                                <div
                                    className="sd-progress-fill"
                                    style={{ width: `${weeklyGoalProgressWidth}%` }}
                                />
                            </div>
                        </div>

                        <details>
                            <summary className="sd-btn-secondary" style={{ width: "100%", textAlign: "center" }}>
                                Atleti cu A:C risk ({weeklyGoal.acRiskAthletes.length})
                            </summary>
                            <div style={{ marginTop: "10px" }}>
                                {renderWeeklyAthletes(weeklyGoal.acRiskAthletes, "Nu exista atleti cu A:C risk.")}
                            </div>
                        </details>

                        <details>
                            <summary className="sd-btn-secondary" style={{ width: "100%", textAlign: "center" }}>
                                Atleti sub media asteptata ({weeklyGoal.underExpectedAthletes.length})
                            </summary>
                            <div style={{ marginTop: "10px" }}>
                                {renderWeeklyAthletes(weeklyGoal.underExpectedAthletes, "Nu exista atleti sub media asteptata.")}
                            </div>
                        </details>
                    </div>
                </div>
            )}

            {recentInjuries && (
                <div className="sd-box">
                    <div className="sd-box-header">
                        <h2>Accidentari Recente</h2>
                    </div>
                    <div className="sd-box-content">
                        {recentInjuries.length === 0 ? (
                            <div className="sd-empty-state">
                                <p>Nu exista accidentari recente.</p>
                            </div>
                        ) : (
                            <ul className="sd-list">
                                {recentInjuries.map((injury) => (
                                    <li key={injury.id}>
                                        <strong>{injury.athleteName}</strong>
                                        <br />
                                        {injury.injuryType} - {injury.bodyPart}
                                        <br />
                                        <span style={{ color: "#666" }}>
                                            {injury.severity} - {" "}
                                            {new Date(injury.createdAt).toLocaleDateString("ro-RO", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </aside>
    )
}

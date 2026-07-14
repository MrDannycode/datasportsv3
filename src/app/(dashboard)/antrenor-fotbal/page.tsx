import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import ActivitiesCalendar from "../atlet-fotbal/ActivitiesCalendar"
import type { Prisma } from "@prisma/client"

type ReadinessPlayer = {
    id: number
    name: string
    score: number
    tsbScore: number
    atlScore: number
    ctlScore: number
    acRatioScore: number
}

type UpcomingMatch = Prisma.FootballMatchGetPayload<{ include: { teamHome: true; teamAway: true; competition: true } }>
type AssignedTrainingPlan = Prisma.TrainingPlanGetPayload<{ include: { creator: { include: { profile: true } } } }>
type AssignedFitnessPlan = Prisma.FitnessPlanGetPayload<{ include: { creator: { include: { profile: true } } } }>
type ActivityCalendarEvent = {
    id: string
    date: Date
    label: string
    title: string
    details: string
    color: string
    backgroundColor: string
}

const TRAINING_TYPE_LABELS: Record<string, string> = {
    tehnic: "Tehnic",
    fizic: "Fizic",
    tactic: "Tactic",
}

const FITNESS_TYPE_LABELS: Record<string, string> = {
    forta: "Forta",
    rezistenta: "Rezistenta",
    vitezare: "Viteza",
    flexibilitate: "Flexibilitate",
    coordonare: "Coordonare",
}

function clampScore(value: number) {
    return Math.max(0, Math.min(100, value))
}

function normalize(value: number, min: number, max: number) {
    if (max === min) return 0
    return clampScore(((value - min) / (max - min)) * 100)
}

function inverseNormalize(value: number, min: number, max: number) {
    return 100 - normalize(value, min, max)
}

function calculateAcRatioScore(acRatio: number) {
    if (acRatio >= 0.8 && acRatio <= 1.3) return 100
    if (acRatio < 0.8) return clampScore(((acRatio - 0.5) / 0.3) * 100)
    return clampScore(((1.8 - acRatio) / 0.5) * 100)
}

function calculatePlayerReadiness(load: { tsb: number; atl: number; ctl: number; acRatio: number }) {
    const tsbScore = normalize(load.tsb, -30, 30)
    const atlScore = inverseNormalize(load.atl, 0, 120)
    const ctlScore = normalize(load.ctl, 0, 120)
    const acRatioScore = calculateAcRatioScore(load.acRatio)
    const score = tsbScore * 0.4 + atlScore * 0.25 + ctlScore * 0.2 + acRatioScore * 0.15

    return { score, tsbScore, atlScore, ctlScore, acRatioScore }
}

function getReadinessStatus(score: number | null) {
    if (score === null) return { label: "Fara date", color: "#64748b", background: "#f1f5f9" }
    if (score >= 80) return { label: "Pregatita", color: "#166534", background: "#dcfce7" }
    if (score >= 60) return { label: "Partial pregatita", color: "#92400e", background: "#fef3c7" }
    return { label: "Nepregatita", color: "#991b1b", background: "#fee2e2" }
}

function formatReadinessScore(score: number | null) {
    return score === null ? "-" : Math.round(score).toString()
}

export default async function AntrenorFotbalPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "antrenor_fotbal") {
        redirect("/login")
    }

    const coachId = Number(session.user.id)
    const coachProfile = await prisma.profile.findUnique({
        where: { userId: coachId },
        select: { teamId: true },
    })

    const [totalPlans, recentPlans, teamAthletes] = await Promise.all([
        prisma.trainingPlan.count({ where: { createdBy: coachId } }),
        prisma.trainingPlan.findMany({
            where: { createdBy: coachId },
            orderBy: { date: "desc" },
            take: 5,
        }),
        coachProfile?.teamId
            ? prisma.footballAthlete.findMany({
                where: { user: { profile: { teamId: coachProfile.teamId } } },
                select: {
                    id: true,
                    user: {
                        select: {
                            email: true,
                            profile: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    dailyLoads: {
                                        orderBy: { date: "desc" },
                                        take: 1,
                                        select: { tsb: true, atl: true, ctl: true, acRatio: true },
                                    },
                                },
                            },
                        },
                    },
                    medicalRecords: {
                        orderBy: { createdAt: "desc" },
                        take: 1,
                        select: { isAvailable: true },
                    },
                },
            })
            : Promise.resolve([]),
    ])

    let upcomingMatches: UpcomingMatch[] = []
    let assignedTrainingPlans: AssignedTrainingPlan[] = []
    let assignedFitnessPlans: AssignedFitnessPlan[] = []

    if (coachProfile?.teamId) {
        upcomingMatches = await prisma.footballMatch.findMany({
            where: {
                OR: [
                    { teamHomeId: coachProfile.teamId },
                    { teamAwayId: coachProfile.teamId },
                ],
                matchDate: {
                    gte: new Date(),
                },
            },
            include: {
                teamHome: true,
                teamAway: true,
                competition: true,
            },
            orderBy: {
                matchDate: "asc",
            },
            take: 5,
        })

        assignedTrainingPlans = await prisma.trainingPlan.findMany({
            where: {
                creator: {
                    role: "antrenor_fotbal",
                    profile: {
                        is: {
                            teamId: coachProfile.teamId,
                        },
                    },
                },
            },
            include: {
                creator: {
                    include: {
                        profile: true,
                    },
                },
            },
            orderBy: {
                date: "asc",
            },
            take: 5,
        })

        assignedFitnessPlans = await prisma.fitnessPlan.findMany({
            where: {
                creator: {
                    role: "antrenor_fitness",
                    profile: {
                        is: {
                            teamId: coachProfile.teamId,
                        },
                    },
                },
            },
            include: {
                creator: {
                    include: {
                        profile: true,
                    },
                },
            },
            orderBy: {
                date: "asc",
            },
            take: 30,
        })
    }

    const readinessPlayers: ReadinessPlayer[] = teamAthletes.flatMap((athlete) => {
        const latestMedicalRecord = athlete.medicalRecords[0]
        const latestLoad = athlete.user.profile?.dailyLoads[0]

        if (!latestMedicalRecord?.isAvailable || !latestLoad) return []

        const profile = athlete.user.profile
        const name = profile ? [profile.firstName, profile.lastName].join(" ") : athlete.user.email
        const readiness = calculatePlayerReadiness(latestLoad)

        return [{ id: athlete.id, name, ...readiness }]
    })
    const teamReadiness = readinessPlayers.length > 0
        ? readinessPlayers.reduce((sum, player) => sum + player.score, 0) / readinessPlayers.length
        : null
    const readinessStatus = getReadinessStatus(teamReadiness)
    const today = new Date()
    const fitnessEvents: ActivityCalendarEvent[] = assignedFitnessPlans.map((plan) => {
        const coachName = plan.creator.profile
            ? `${plan.creator.profile.firstName} ${plan.creator.profile.lastName}`.trim()
            : plan.creator.email

        return {
            id: `fitness-${plan.id}`,
            date: plan.date,
            label: FITNESS_TYPE_LABELS[plan.type] ?? plan.type,
            title: plan.title,
            details: `Fitness - ${coachName || "Nespecificat"}`,
            color: "#2a7a2a",
            backgroundColor: "#eef7ed",
        }
    })
    const matchEvents: ActivityCalendarEvent[] = upcomingMatches.map((match) => ({
        id: `match-${match.id}`,
        date: match.matchDate,
        label: "Meci",
        title: `${match.teamHome.name} vs ${match.teamAway.name}`,
        details: `${match.location} | ${match.competition.name}`,
        color: "#9a4b00",
        backgroundColor: "#fff4e6",
    }))
    const trainingEvents: ActivityCalendarEvent[] = assignedTrainingPlans.map((plan) => {
        const coachName = plan.creator.profile
            ? `${plan.creator.profile.firstName} ${plan.creator.profile.lastName}`.trim()
            : plan.creator.email

        return {
            id: `training-${plan.id}`,
            date: plan.date,
            label: TRAINING_TYPE_LABELS[plan.type] ?? plan.type,
            title: plan.title,
            details: `Antrenor: ${coachName || "Nespecificat"}`,
            color: "#0056b3",
            backgroundColor: "#e8f0fb",
        }
    })
    const activityCalendarEvents = [...fitnessEvents, ...matchEvents, ...trainingEvents].sort(
        (firstEvent, secondEvent) => firstEvent.date.getTime() - secondEvent.date.getTime()
    )
    const nextCalendarEvent = activityCalendarEvents.find((event) => event.date >= today)
    const activityCalendarMonth = nextCalendarEvent?.date ?? activityCalendarEvents[0]?.date ?? today
    const serializedActivityCalendarEvents = activityCalendarEvents.map((event) => ({
        ...event,
        date: event.date.toISOString(),
    }))

    return (
        <main>
            <div className="sd-box">
                <div className="sd-box-header">
                    <h2>Dashboard overview</h2>
                </div>
                <div className="sd-box-content">

                    <div className="sd-metrics">
                        <div className="sd-box sd-metric-box" style={{ height: "auto", minHeight: "150px", flex: 1 }}>
                            <div className="sd-metric-title">Activities calendar</div>
                            <div style={{ marginTop: "15px", textAlign: "left" }}>
                                <ActivitiesCalendar
                                    events={serializedActivityCalendarEvents}
                                    initialMonth={activityCalendarMonth.toISOString().slice(0, 7)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="sd-box" style={{ marginTop: "24px" }}>
                        <div className="sd-box-header">
                            <h2>Team Readiness</h2>
                            <span
                                className="sd-badge"
                                style={{
                                    background: readinessStatus.background,
                                    color: readinessStatus.color,
                                    border: `1px solid ${readinessStatus.color}`,
                                }}
                            >
                                {readinessStatus.label}
                            </span>
                        </div>
                        <div className="sd-box-content">
                            <dl style={{ margin: "0 0 18px" }}>
                                {[
                                    ["Scor echipa", formatReadinessScore(teamReadiness)],
                                    ["Jucatori inclusi", readinessPlayers.length],
                                ].map(([label, value], index) => (
                                    <div
                                        key={label}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: "24px",
                                            padding: "10px 0",
                                            borderBottom: index < 1 ? "1px solid var(--sd-border)" : undefined,
                                        }}
                                    >
                                        <dt style={{ color: "var(--sd-text)", fontSize: "14px", opacity: 0.7 }}>{label}</dt>
                                        <dd style={{ margin: 0, fontWeight: 600, textAlign: "right" }}>{value}</dd>
                                    </div>
                                ))}
                            </dl>

                            <div style={{ marginBottom: "16px" }}>
                                <div style={{ height: "12px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
                                    <div
                                        style={{
                                            width: `${teamReadiness ?? 0}%`,
                                            height: "100%",
                                            background: readinessStatus.color,
                                        }}
                                    />
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", color: "#64748b", fontSize: "12px" }}>
                                    <span>0</span>
                                    <span>60</span>
                                    <span>80</span>
                                    <span>100</span>
                                </div>
                            </div>

                            {readinessPlayers.length === 0 ? (
                                <div className="sd-empty-state">
                                    <p>Nu exista jucatori disponibili cu aviz medical si date de incarcare.</p>
                                </div>
                            ) : (
                                <table className="sd-table">
                                    <thead>
                                        <tr>
                                            <th>Jucator</th>
                                            <th>Scor</th>
                                            <th>TSB 40%</th>
                                            <th>ATL 25%</th>
                                            <th>CTL 20%</th>
                                            <th>A:C 15%</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {readinessPlayers
                                            .sort((a, b) => b.score - a.score)
                                            .map((player) => (
                                                <tr key={player.id}>
                                                    <td>{player.name}</td>
                                                    <td><strong>{formatReadinessScore(player.score)}</strong></td>
                                                    <td>{formatReadinessScore(player.tsbScore)}</td>
                                                    <td>{formatReadinessScore(player.atlScore)}</td>
                                                    <td>{formatReadinessScore(player.ctlScore)}</td>
                                                    <td>{formatReadinessScore(player.acRatioScore)}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    <div className="sd-panels">
                        <div className="sd-box sd-activities">
                            <div className="sd-box-header">
                                <h2>Planurile de antrenament</h2>
                                <Link href="/antrenor-fotbal/antrenamente">Vezi toate</Link>
                            </div>
                            <div className="sd-box-content">
                                {recentPlans.length === 0 ? (
                                    <div className="sd-empty-state">
                                        <p>Nu exista planuri de antrenament recente.</p>
                                    </div>
                                ) : (
                                    <table className="sd-table">
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Tip</th>
                                                <th>Titlu</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentPlans.map((plan) => (
                                                <tr key={plan.id}>
                                                    <td>
                                                        {new Date(plan.date).toLocaleDateString("ro-RO", {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            year: "numeric",
                                                        })}
                                                    </td>
                                                    <td>{TRAINING_TYPE_LABELS[plan.type] ?? plan.type}</td>
                                                    <td>{plan.title}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}


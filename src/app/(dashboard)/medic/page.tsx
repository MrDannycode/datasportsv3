import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import ActivitiesCalendar from "../atlet-fotbal/ActivitiesCalendar"
import type { Prisma } from "@prisma/client"
import InjuryHistoryChart from "./InjuryHistoryChart"
import RecentMedicalRecordsPanel from "./RecentMedicalRecordsPanel"

type UpcomingMatch = Prisma.FootballMatchGetPayload<{ include: { teamHome: true; teamAway: true; competition: true } }>
type AssignedTrainingPlan = Prisma.TrainingPlanGetPayload<{ include: { creator: { include: { profile: true } } } }>
type AssignedFitnessPlan = Prisma.FitnessPlanGetPayload<{ include: { creator: { include: { profile: true } } } }>
type RecentMedicalRecord = Prisma.MedicalRecordGetPayload<{
    include: {
        athlete: {
            include: {
                user: {
                    include: {
                        profile: true
                    }
                }
            }
        }
        injuries: true
    }
}>
type InjuryHistory = Prisma.InjuryGetPayload<{
    include: { medicalRecord: { include: { athlete: { include: { user: { include: { profile: true } } } } } } }
}>
type WorkloadHistory = Prisma.DailyLoadGetPayload<{
    include: { athlete: { include: { user: { include: { footballAthlete: true } } } } }
}>
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

const SEVERITY_LABELS: Record<string, string> = {
    usoara: "Usoara",
    medie: "Medie",
    grava: "Grava",
}

export default async function MedicPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "medic") {
        redirect("/login")
    }

    const doctorProfile = await prisma.profile.findUnique({
        where: { userId: Number(session.user.id) },
        select: { teamId: true },
    })

    let upcomingMatches: UpcomingMatch[] = []
    let assignedTrainingPlans: AssignedTrainingPlan[] = []
    let assignedFitnessPlans: AssignedFitnessPlan[] = []
    let recentMedicalRecords: RecentMedicalRecord[] = []
    let injuryHistory: InjuryHistory[] = []
    let workloadHistory: WorkloadHistory[] = []

    if (doctorProfile?.teamId) {
        upcomingMatches = await prisma.footballMatch.findMany({
            where: {
                OR: [
                    { teamHomeId: doctorProfile.teamId },
                    { teamAwayId: doctorProfile.teamId },
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
                            teamId: doctorProfile.teamId,
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
                            teamId: doctorProfile.teamId,
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

        recentMedicalRecords = await prisma.medicalRecord.findMany({
            where: {
                athlete: {
                    user: {
                        profile: {
                            is: {
                                teamId: doctorProfile.teamId,
                            },
                        },
                    },
                },
            },
            include: {
                athlete: {
                    include: {
                        user: {
                            include: {
                                profile: true,
                            },
                        },
                    },
                },
                injuries: true,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 20,
        })

        injuryHistory = await prisma.injury.findMany({
            where: { medicalRecord: { athlete: { user: { profile: { is: { teamId: doctorProfile.teamId } } } } } },
            include: { medicalRecord: { include: { athlete: { include: { user: { include: { profile: true } } } } } } },
            orderBy: { medicalRecord: { startDate: "asc" } },
        })

        const workloadFromDate = new Date()
        workloadFromDate.setMonth(workloadFromDate.getMonth() - 12, 1)
        workloadFromDate.setHours(0, 0, 0, 0)
        workloadHistory = await prisma.dailyLoad.findMany({
            where: {
                date: { gte: workloadFromDate },
                athlete: {
                    teamId: doctorProfile.teamId,
                    user: { footballAthlete: { isNot: null } },
                },
            },
            include: { athlete: { include: { user: { include: { footballAthlete: true } } } } },
            orderBy: { date: "asc" },
        })
    }

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
    const serializedInjuryHistory = injuryHistory.map((injury) => ({
        id: injury.id,
        date: injury.medicalRecord.startDate.toISOString(),
        athleteId: injury.medicalRecord.athlete.id,
        athleteName: `${injury.medicalRecord.athlete.user.profile?.firstName ?? ""} ${injury.medicalRecord.athlete.user.profile?.lastName ?? ""}`.trim() || "Atlet necunoscut",
        severity: injury.severity,
    }))
    const serializedWorkloadHistory = workloadHistory.flatMap((load) => {
        const footballAthlete = load.athlete.user.footballAthlete
        return footballAthlete ? [{
            date: load.date.toISOString(),
            athleteId: footballAthlete.id,
            acRatio: load.acRatio,
        }] : []
    })

    const serializedRecentMedicalRecords = recentMedicalRecords.map(record => ({
        id: record.id,
        createdAt: record.createdAt.toISOString(),
        athleteName: `${record.athlete.user.profile?.firstName ?? ""} ${record.athlete.user.profile?.lastName ?? ""}`.trim() || "Atlet necunoscut",
        diagnosis: record.diagnosis,
        treatment: record.treatment,
        isAvailable: record.isAvailable,
        injuries: record.injuries.map(injury => ({ id: injury.id, injuryType: injury.injuryType, bodyPart: injury.bodyPart, severity: injury.severity })),
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

                    <div className="sd-box sd-hover-box injury-history-panel">
                        <div className="sd-box-header"><h2>Grafic Istoric Accidentari</h2></div>
                        <div className="sd-box-content"><InjuryHistoryChart injuries={serializedInjuryHistory} workloads={serializedWorkloadHistory} /></div>
                    </div>

                    <div className="sd-panels">
                        <div className="sd-box sd-activities sd-hover-box">
                            <div className="sd-box-header">
                                <h2>Dosare recente</h2>
                                <Link href="/medic/dosar-medical">Vezi toate</Link>
                            </div>
                            <RecentMedicalRecordsPanel records={serializedRecentMedicalRecords} />
                        </div>


                    </div>
                </div>
            </div>
        </main>
    )
}

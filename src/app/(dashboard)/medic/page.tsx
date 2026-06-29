import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import ActivitiesCalendar from "../atlet-fotbal/ActivitiesCalendar"
import type { Prisma } from "@prisma/client"

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
            take: 5,
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

                    <div className="sd-panels">
                        <div className="sd-box sd-activities sd-hover-box">
                            <div className="sd-box-header">
                                <h2>Dosare recente</h2>
                                <Link href="/medic/dosar-medical">Vezi toate</Link>
                            </div>
                            <div className="sd-box-content">
                                {recentMedicalRecords.length === 0 ? (
                                    <p>Nu exista dosare medicale recente pentru echipa ta.</p>
                                ) : (
                                    <table className="sd-table">
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Atlet</th>
                                                <th>Diagnostic</th>
                                                <th>Accidentari</th>
                                                <th>Severitate</th>
                                                <th>Disponibilitate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentMedicalRecords.map((record) => {
                                                const athleteName = `${record.athlete.user.profile?.firstName ?? ""} ${record.athlete.user.profile?.lastName ?? ""}`.trim() || "Atlet necunoscut"
                                                const latestInjury = record.injuries[0]

                                                return (
                                                    <tr key={record.id}>
                                                        <td>{new Date(record.createdAt).toLocaleDateString()}</td>
                                                        <td>{athleteName}</td>
                                                        <td>{record.diagnosis}</td>
                                                        <td>{record.injuries.length}</td>
                                                        <td>{latestInjury ? SEVERITY_LABELS[latestInjury.severity] ?? latestInjury.severity : "-"}</td>
                                                        <td>{record.isAvailable ? "Disponibil" : "Indisponibil"}</td>
                                                    </tr>
                                                )
                                            })}
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

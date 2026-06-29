import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import LoadQualityChart from "@/components/sport-science/LoadQualityChart"
import ActivitiesCalendar from "../atlet-fotbal/ActivitiesCalendar"
import type { Prisma } from "@prisma/client"

const FITNESS_TYPE_LABELS: Record<string, string> = {
    forta: "Forta",
    rezistenta: "Rezistenta",
    vitezare: "Viteza",
    flexibilitate: "Flexibilitate",
    coordonare: "Coordonare",
}

const TRAINING_TYPE_LABELS: Record<string, string> = {
    tehnic: "Tehnic",
    fizic: "Fizic",
    tactic: "Tactic",
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

type TeamLoadPoint = {
    date: string
    label: string
    athleteCount: number
    monotony: number | null
    strain: number | null
    acRatio: number | null
}

function formatShortDate(date: Date) {
    return date.toLocaleDateString("ro-RO", {
        day: "2-digit",
        month: "short",
    })
}

export default async function AntrenorFitnessPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "antrenor_fitness") {
        redirect("/login")
    }

    const coachProfile = await prisma.profile.findUnique({
        where: { userId: Number(session.user.id) },
        select: { teamId: true },
    })

    let upcomingMatches: UpcomingMatch[] = []
    let assignedTrainingPlans: AssignedTrainingPlan[] = []
    let assignedFitnessPlans: AssignedFitnessPlan[] = []

    const loadsFromDate = new Date()
    loadsFromDate.setUTCDate(loadsFromDate.getUTCDate() - 42)
    loadsFromDate.setUTCHours(0, 0, 0, 0)

    const [fitnessPlans, teamProfiles] = await Promise.all([
        prisma.fitnessPlan.findMany({
            where: { createdBy: Number(session.user.id) },
            orderBy: { date: "asc" },
            take: 5,
        }),
        coachProfile?.teamId
            ? prisma.profile.findMany({
                where: {
                    teamId: coachProfile.teamId,
                    user: {
                        footballAthlete: {
                            isNot: null,
                        },
                    },
                },
                select: {
                    firstName: true,
                    lastName: true,
                    dailyLoads: {
                        where: {
                            date: {
                                gte: loadsFromDate,
                            },
                        },
                        orderBy: { date: "asc" },
                        select: {
                            date: true,
                            monotony: true,
                            strain: true,
                            acRatio: true,
                        },
                    },
                },
                orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
            })
            : Promise.resolve([]),
    ])

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

    const groupedLoads = new Map<string, {
        date: Date
        monotonySum: number
        monotonyCount: number
        strainSum: number
        strainCount: number
        acRatioSum: number
        acRatioCount: number
        athleteCount: number
    }>()

    for (const profile of teamProfiles) {
        for (const load of profile.dailyLoads) {
            const dateKey = load.date.toISOString().slice(0, 10)
            const existing = groupedLoads.get(dateKey) ?? {
                date: load.date,
                monotonySum: 0,
                monotonyCount: 0,
                strainSum: 0,
                strainCount: 0,
                acRatioSum: 0,
                acRatioCount: 0,
                athleteCount: 0,
            }

            if (load.monotony != null) {
                existing.monotonySum += load.monotony
                existing.monotonyCount += 1
            }

            if (load.strain != null) {
                existing.strainSum += load.strain
                existing.strainCount += 1
            }

            if (load.acRatio != null) {
                existing.acRatioSum += load.acRatio
                existing.acRatioCount += 1
            }

            existing.athleteCount += 1
            groupedLoads.set(dateKey, existing)
        }
    }

    const loadQualityPoints: TeamLoadPoint[] = Array.from(groupedLoads.entries())
        .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
        .map(([date, value]) => ({
            date,
            label: formatShortDate(value.date),
            athleteCount: value.athleteCount,
            monotony: value.monotonyCount > 0 ? value.monotonySum / value.monotonyCount : null,
            strain: value.strainCount > 0 ? value.strainSum / value.strainCount : null,
            acRatio: value.acRatioCount > 0 ? value.acRatioSum / value.acRatioCount : null,
        }))

    const latestLoadQuality = loadQualityPoints[loadQualityPoints.length - 1] ?? null
    const teamAthleteCount = teamProfiles.length
    const safeDaysCount = loadQualityPoints.filter((point) => point.acRatio != null && point.acRatio >= 0.8 && point.acRatio <= 1.3).length
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

                    <div className="sd-box">
                        <div className="sd-box-content">
                            <LoadQualityChart points={loadQualityPoints} />
                        </div>
                    </div>

                    <div className="sd-panels">
                        <div className="sd-box sd-activities">
                            <div className="sd-box-header">
                                <h2>Planuri de Fitness Recente</h2>
                                <Link href="/antrenor-fitness/trainfit">Vezi toate</Link>
                            </div>
                            <div className="sd-box-content">
                                {fitnessPlans.length === 0 ? (
                                    <p>Nu exista planuri de fitness create inca.</p>
                                ) : (
                                    <table className="sd-table">
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Tip</th>
                                                <th>Titlu</th>
                                                <th>Descriere</th>
                                                <th>Creat la</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fitnessPlans.map((plan) => (
                                                <tr key={plan.id}>
                                                    <td>{new Date(plan.date).toLocaleDateString()}</td>
                                                    <td>{FITNESS_TYPE_LABELS[plan.type] ?? plan.type}</td>
                                                    <td>{plan.title}</td>
                                                    <td>{plan.description?.trim() || "-"}</td>
                                                    <td>{new Date(plan.createdAt).toLocaleDateString()}</td>
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

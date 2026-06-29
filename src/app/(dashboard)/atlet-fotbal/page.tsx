import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import SportScienceMetrics, { type SportScienceLoad } from "@/components/sport-science/SportScienceMetrics"
import TrainingLoadChart from "@/components/sport-science/TrainingLoadChart"
import ActivitiesCalendar from "./ActivitiesCalendar"
import type { Prisma } from "@prisma/client"

type UpcomingMatch = Prisma.FootballMatchGetPayload<{ include: { teamHome: true; teamAway: true; competition: true } }>
type AssignedTrainingPlan = Prisma.TrainingPlanGetPayload<{ include: { creator: { include: { profile: true } } } }>
type AssignedFitnessPlan = Prisma.FitnessPlanGetPayload<{ include: { creator: { include: { profile: true } } } }>
type RecentActivity = {
    id: number
    date: Date
    durationMin: number
    avgHeartRate: number | null
    sport: string | null
    notes: string | null
    trimp: number | null
}
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

const SPORT_LABELS: Record<string, string> = {
    fotbal: "Fotbal",
    tenis: "Tenis",
    alergare: "Alergare",
    ciclism: "Ciclism",
    inot: "Inot",
    fitness: "Fitness / Sala",
    alta: "Alta",
}

function formatActivityDate(date: Date) {
    return date.toLocaleDateString("ro-RO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
}

function formatDuration(minutes: number) {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = Math.round(minutes % 60)

    if (hours === 0) return String(remainingMinutes) + " min"
    return String(hours) + "h " + String(remainingMinutes) + "min"
}


export default async function AtletFotbalPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "atlet_fotbal") {
        redirect("/login")
    }

    const userId = Number(session.user.id);

    const profile = await prisma.profile.findUnique({
        where: { userId }
    });

    let upcomingMatches: UpcomingMatch[] = [];
    let assignedTrainingPlans: AssignedTrainingPlan[] = [];
    let assignedFitnessPlans: AssignedFitnessPlan[] = [];
    let latestLoad: SportScienceLoad | null = null;
    let trainingLoads: SportScienceLoad[] = [];
    let recentActivities: RecentActivity[] = [];

    if (profile) {
        const loadFromDate = new Date();
        loadFromDate.setUTCDate(loadFromDate.getUTCDate() - 90);
        loadFromDate.setUTCHours(0, 0, 0, 0);

        trainingLoads = await prisma.dailyLoad.findMany({
            where: {
                athleteId: profile.id,
                date: {
                    gte: loadFromDate,
                },
            },
            orderBy: { date: "asc" },
            take: 100,
            select: {
                date: true,
                trimp: true,
                atl: true,
                ctl: true,
                tsb: true,
                acRatio: true,
                monotony: true,
                strain: true,
            },
        });
        latestLoad = trainingLoads[trainingLoads.length - 1] ?? null;

        recentActivities = await prisma.activity.findMany({
            where: { athleteId: profile.id },
            orderBy: { date: "desc" },
            take: 5,
            select: {
                id: true,
                date: true,
                durationMin: true,
                avgHeartRate: true,
                sport: true,
                notes: true,
                trimp: true,
            },
        });
    }

    if (profile?.teamId) {
        upcomingMatches = await prisma.footballMatch.findMany({
            where: {
                OR: [
                    { teamHomeId: profile.teamId },
                    { teamAwayId: profile.teamId }
                ],
                matchDate: {
                    gte: new Date()
                }
            },
            include: {
                teamHome: true,
                teamAway: true,
                competition: true
            },
            orderBy: {
                matchDate: 'asc'
            },
            take: 5
        });

        assignedTrainingPlans = await prisma.trainingPlan.findMany({
            where: {
                creator: {
                    role: "antrenor_fotbal",
                    profile: {
                        is: {
                            teamId: profile.teamId,
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
        });

        assignedFitnessPlans = await prisma.fitnessPlan.findMany({
            where: {
                creator: {
                    role: "antrenor_fitness",
                    profile: {
                        is: {
                            teamId: profile.teamId,
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
        });
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
        <main className="sd-athlete-dashboard-layout">
            <aside className="sd-athlete-left-sidebar sd-sticky-sidebar">
                <div className="sd-box">
                    <div className="sd-box-header">
                        <h2>Sport Science</h2>
                    </div>
                    <div className="sd-box-content">
                        <SportScienceMetrics latestLoad={latestLoad} />
                    </div>
                </div>
            </aside>
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

                        <div className="sd-box" id="performance-management-chart">
                            <div className="sd-box-content">
                                <TrainingLoadChart loads={trainingLoads} />
                            </div>
                        </div>

                        <div className="sd-panels">
                            <div className="sd-box sd-activities">
                                <div className="sd-box-header">
                                    <h2>Recent Activities</h2>
                                    <a href="/atlet-fotbal/activity">View All</a>
                                </div>
                                <div className="sd-box-content">
                                    <table className="sd-table">
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Sport</th>
                                                <th>Durata</th>
                                                <th>FC medie</th>
                                                <th>TRIMP</th>
                                                <th>Note</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentActivities.map((activity) => (
                                                <tr key={activity.id}>
                                                    <td>{formatActivityDate(activity.date)}</td>
                                                    <td>{activity.sport ? SPORT_LABELS[activity.sport] ?? activity.sport : "-"}</td>
                                                    <td>{formatDuration(activity.durationMin)}</td>
                                                    <td>{activity.avgHeartRate ? String(activity.avgHeartRate) + " bpm" : "-"}</td>
                                                    <td>{activity.trimp != null ? activity.trimp.toFixed(1) : "N/A"}</td>
                                                    <td>{activity.notes ? (activity.notes.length > 50 ? activity.notes.slice(0, 50) + "..." : activity.notes) : "-"}</td>
                                                </tr>
                                            ))}
                                            {recentActivities.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} style={{ textAlign: "center", color: "#999", padding: "24px" }}>
                                                        Nu ai adaugat nicio activitate inca.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            
        </main>
    )
}

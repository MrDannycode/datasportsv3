import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import SportScienceMetrics, { type SportScienceLoad } from "@/components/sport-science/SportScienceMetrics"
import TrainingLoadChart from "@/components/sport-science/TrainingLoadChart"
import type { Prisma } from "@prisma/client"

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

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"]

function formatDateKey(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function buildMonthDays(monthDate: Date) {
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const mondayStartOffset = (firstDay.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const totalCells = Math.ceil((mondayStartOffset + daysInMonth) / 7) * 7

    return Array.from({ length: totalCells }, (_, index) => {
        const date = new Date(year, month, index - mondayStartOffset + 1)
        return {
            date,
            key: formatDateKey(date),
            day: date.getDate(),
            isCurrentMonth: date.getMonth() === month,
        }
    })
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
    const activityCalendarDays = buildMonthDays(activityCalendarMonth)
    const activityEventsByDate = activityCalendarEvents.reduce<Record<string, ActivityCalendarEvent[]>>((acc, event) => {
        const key = formatDateKey(event.date)
        acc[key] = [...(acc[key] ?? []), event]
        return acc
    }, {})


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

            <div className="sd-athlete-main-content">
                <div className="sd-page-title">
                <h1>Dashboard overview</h1>
            </div>

            <div className="sd-metrics">
                <div className="sd-box sd-metric-box" style={{ height: "auto", minHeight: "150px", flex: 1 }}>
                    <div className="sd-metric-title">Activities calendar</div>
                    <div style={{ marginTop: "15px", textAlign: "left" }}>
                        {activityCalendarEvents.length === 0 ? (
                            <p style={{ fontSize: "14px", color: "#666" }}>Nu exista activitati, meciuri sau antrenamente programate.</p>
                        ) : (
                            <div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "10px" }}>
                                    <strong style={{ fontSize: "13px", color: "#333", textTransform: "capitalize" }}>
                                        {activityCalendarMonth.toLocaleDateString("ro-RO", { month: "long", year: "numeric" })}
                                    </strong>
                                    <span style={{ fontSize: "12px", color: "#666" }}>
                                        {activityCalendarEvents.length} evenimente
                                    </span>
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px", fontSize: "11px", color: "#555" }}>
                                    <span><strong style={{ color: "#2a7a2a" }}>Fitness</strong></span>
                                    <span><strong style={{ color: "#9a4b00" }}>Meci</strong></span>
                                    <span><strong style={{ color: "#0056b3" }}>Antrenament</strong></span>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(28px, 1fr))", gap: "4px", marginBottom: "4px" }}>
                                    {WEEKDAY_LABELS.map((label, index) => (
                                        <div key={`${label}-${index}`} style={{ fontSize: "11px", color: "#777", fontWeight: "bold", textAlign: "center" }}>
                                            {label}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(28px, 1fr))", gap: "4px" }}>
                                    {activityCalendarDays.map((day) => {
                                        const dayEvents = activityEventsByDate[day.key] ?? []
                                        const dayTitle = dayEvents
                                            .map((event) => `${event.title} - ${event.details}`)
                                            .join("\n")

                                        return (
                                            <div
                                                key={day.key}
                                                title={dayTitle || undefined}
                                                style={{
                                                    minHeight: "58px",
                                                    border: "1px solid #e2e2e2",
                                                    backgroundColor: dayEvents.length > 0 ? "#f8fbff" : day.isCurrentMonth ? "#fff" : "#f7f7f7",
                                                    color: day.isCurrentMonth ? "#333" : "#aaa",
                                                    padding: "4px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "3px",
                                                    overflow: "hidden",
                                                }}
                                            >
                                                <span style={{ fontSize: "11px", fontWeight: dayEvents.length > 0 ? "bold" : "normal", lineHeight: 1 }}>
                                                    {day.day}
                                                </span>
                                                {dayEvents.slice(0, 3).map((event) => (
                                                    <span
                                                        key={event.id}
                                                        style={{
                                                            display: "block",
                                                            backgroundColor: event.backgroundColor,
                                                            color: event.color,
                                                            border: `1px solid ${event.color}`,
                                                            fontSize: "10px",
                                                            fontWeight: "bold",
                                                            lineHeight: "12px",
                                                            padding: "1px 3px",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        {event.label}
                                                    </span>
                                                ))}
                                                {dayEvents.length > 3 && (
                                                    <span style={{ fontSize: "10px", color: "#333", fontWeight: "bold", lineHeight: 1 }}>
                                                        +{dayEvents.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
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
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Title</th>
                                    <th>Distance</th>
                                    <th>Duration</th>
                                    <th>Pace / Speed</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Today</td>
                                    <td>Run</td>
                                    <td>Morning Tempo Run</td>
                                    <td>10.0 km</td>
                                    <td>45:00</td>
                                    <td>4:30 /km</td>
                                </tr>
                                <tr>
                                    <td>Yesterday</td>
                                    <td>Bike</td>
                                    <td>Recovery Ride</td>
                                    <td>25.4 km</td>
                                    <td>1:08:52</td>
                                    <td>22.1 km/h</td>
                                </tr>
                                <tr>
                                    <td>Wed</td>
                                    <td>Run</td>
                                    <td>Long Interval Session</td>
                                    <td>15.2 km</td>
                                    <td>1:12:15</td>
                                    <td>4:45 /km</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            </div>
        </main>
    )
}
















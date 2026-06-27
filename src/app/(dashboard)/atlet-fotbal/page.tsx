import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import SportScienceMetrics, { type SportScienceLoad } from "@/components/sport-science/SportScienceMetrics"
import TrainingLoadChart from "@/components/sport-science/TrainingLoadChart"
import type { Prisma } from "@prisma/client"

type UpcomingMatch = Prisma.FootballMatchGetPayload<{ include: { teamHome: true; teamAway: true; competition: true } }>
type AssignedTrainingPlan = Prisma.TrainingPlanGetPayload<{ include: { creator: { include: { profile: true } } } }>
type AssignedFitnessPlan = Prisma.FitnessPlanGetPayload<{ include: { creator: { include: { profile: true } } } }>

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
    const nextFitnessPlan = assignedFitnessPlans.find((plan) => plan.date >= today)
    const activityCalendarMonth = nextFitnessPlan?.date ?? assignedFitnessPlans[0]?.date ?? today
    const activityCalendarDays = buildMonthDays(activityCalendarMonth)
    const activityPlansByDate = assignedFitnessPlans.reduce<Record<string, AssignedFitnessPlan[]>>((acc, plan) => {
        const key = formatDateKey(plan.date)
        acc[key] = [...(acc[key] ?? []), plan]
        return acc
    }, {})

    return (
        <main>
            <div className="sd-page-title">
                <h1>Dashboard overview</h1>
            </div>

            <div className="sd-metrics">
                <div className="sd-box sd-metric-box" style={{ height: "auto", minHeight: "150px" }}>
                    <div className="sd-metric-title">Match calendar</div>
                    <div style={{ marginTop: "15px", textAlign: "left" }}>
                        {upcomingMatches.length === 0 ? (
                            <p style={{ fontSize: "14px", color: "#666" }}>Nu există meciuri viitoare programate.</p>
                        ) : (
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "14px" }}>
                                {upcomingMatches.map((match) => (
                                    <li key={match.id} style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #eee" }}>
                                        <div style={{ fontWeight: "bold" }}>
                                            {match.teamHome.name} vs {match.teamAway.name}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                                            {new Date(match.matchDate).toLocaleDateString('ro-RO', { 
                                                weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#666" }}>
                                            {match.location} | {match.competition.name}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
                <div className="sd-box sd-metric-box" style={{ height: "auto", minHeight: "150px" }}>
                    <div className="sd-metric-title">Activities calendar</div>
                    <div style={{ marginTop: "15px", textAlign: "left" }}>
                        {assignedFitnessPlans.length === 0 ? (
                            <p style={{ fontSize: "14px", color: "#666" }}>Nu exista activitati alocate de antrenorul de fitness.</p>
                        ) : (
                            <div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "10px" }}>
                                    <strong style={{ fontSize: "13px", color: "#333", textTransform: "capitalize" }}>
                                        {activityCalendarMonth.toLocaleDateString("ro-RO", { month: "long", year: "numeric" })}
                                    </strong>
                                    <span style={{ fontSize: "12px", color: "#666" }}>
                                        {assignedFitnessPlans.length} activitati
                                    </span>
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
                                        const dayPlans = activityPlansByDate[day.key] ?? []
                                        const dayTitle = dayPlans
                                            .map((plan) => {
                                                const coachName = plan.creator.profile
                                                    ? `${plan.creator.profile.firstName} ${plan.creator.profile.lastName}`.trim()
                                                    : plan.creator.email
                                                return `${plan.title} - ${FITNESS_TYPE_LABELS[plan.type] ?? plan.type} - ${coachName || "Nespecificat"}`
                                            })
                                            .join("\n")

                                        return (
                                            <div
                                                key={day.key}
                                                title={dayTitle || undefined}
                                                style={{
                                                    minHeight: "46px",
                                                    border: "1px solid #e2e2e2",
                                                    backgroundColor: dayPlans.length > 0 ? "#eef7ed" : day.isCurrentMonth ? "#fff" : "#f7f7f7",
                                                    color: day.isCurrentMonth ? "#333" : "#aaa",
                                                    padding: "4px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "3px",
                                                    overflow: "hidden",
                                                }}
                                            >
                                                <span style={{ fontSize: "11px", fontWeight: dayPlans.length > 0 ? "bold" : "normal", lineHeight: 1 }}>
                                                    {day.day}
                                                </span>
                                                {dayPlans.slice(0, 2).map((plan) => (
                                                    <span
                                                        key={plan.id}
                                                        style={{
                                                            display: "block",
                                                            backgroundColor: "#2a7a2a",
                                                            color: "#fff",
                                                            fontSize: "10px",
                                                            fontWeight: "bold",
                                                            lineHeight: "12px",
                                                            padding: "1px 3px",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        {FITNESS_TYPE_LABELS[plan.type] ?? plan.type}
                                                    </span>
                                                ))}
                                                {dayPlans.length > 2 && (
                                                    <span style={{ fontSize: "10px", color: "#2a7a2a", fontWeight: "bold", lineHeight: 1 }}>
                                                        +{dayPlans.length - 2}
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
                <div className="sd-box sd-metric-box" style={{ height: "auto", minHeight: "150px" }}>
                    <div className="sd-metric-title">Training calendar</div>
                    <div style={{ marginTop: "15px", textAlign: "left" }}>
                        {assignedTrainingPlans.length === 0 ? (
                            <p style={{ fontSize: "14px", color: "#666" }}>Nu exista antrenamente alocate de antrenor.</p>
                        ) : (
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "14px" }}>
                                {assignedTrainingPlans.map((plan) => {
                                    const coachName = plan.creator.profile
                                        ? `${plan.creator.profile.firstName} ${plan.creator.profile.lastName}`.trim()
                                        : plan.creator.email

                                    return (
                                        <li key={plan.id} style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #eee" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center" }}>
                                                <span style={{ fontWeight: "bold" }}>{plan.title}</span>
                                                <span style={{ backgroundColor: "#e8f0fb", color: "#0056b3", padding: "2px 8px", fontSize: "11px", fontWeight: "bold", borderRadius: "2px", whiteSpace: "nowrap" }}>
                                                    {TRAINING_TYPE_LABELS[plan.type]}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                                                {new Date(plan.date).toLocaleDateString("ro-RO", {
                                                    weekday: "short", day: "numeric", month: "short",
                                                })}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#666" }}>
                                                Antrenor: {coachName || "Nespecificat"}
                                            </div>
                                            {plan.description && (
                                                <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                                                    {plan.description}
                                                </div>
                                            )}
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </div>
                </div>
                <Link href="/atlet-fotbal/activity" style={{ flex: 1, textDecoration: "none" }}>
                    <div className="sd-box sd-metric-box" style={{ cursor: "pointer" }}>
                        <div className="sd-metric-title">Activities</div>
                        <div className="sd-metric-value" style={{ fontSize: "14px", marginTop: "8px", color: "#0056b3" }}>
                            Gestionează →
                        </div>
                    </div>
                </Link>
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
                        <a href="#">View All</a>
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

                <div className="sd-sidebar">
                    <div className="sd-box">
                        <div className="sd-box-header">
                            <h2>Next Match Analysis</h2>
                        </div>
                        <div className="sd-box-content">
                            <p>Next match: Liverpool</p>
                            <p>Difficulty: —</p>
                            <p>Weather: —</p>
                        </div>
                    </div>

                    <div className="sd-box">
                        <div className="sd-box-header">
                            <h2>Sport Science</h2>
                        </div>
                        <div className="sd-box-content">
                            <SportScienceMetrics latestLoad={latestLoad} />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}










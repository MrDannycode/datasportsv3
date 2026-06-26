import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import SportScienceMetrics, { type SportScienceLoad } from "@/components/sport-science/SportScienceMetrics"
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

    if (profile) {
        latestLoad = await prisma.dailyLoad.findFirst({
            where: { athleteId: profile.id },
            orderBy: { date: "desc" },
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
            take: 5,
        });
    }

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
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "14px" }}>
                                {assignedFitnessPlans.map((plan) => {
                                    const coachName = plan.creator.profile
                                        ? `${plan.creator.profile.firstName} ${plan.creator.profile.lastName}`.trim()
                                        : plan.creator.email

                                    return (
                                        <li key={plan.id} style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #eee" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center" }}>
                                                <span style={{ fontWeight: "bold" }}>{plan.title}</span>
                                                <span style={{ backgroundColor: "#eef7ed", color: "#2a7a2a", padding: "2px 8px", fontSize: "11px", fontWeight: "bold", borderRadius: "2px", whiteSpace: "nowrap" }}>
                                                    {FITNESS_TYPE_LABELS[plan.type]}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                                                {new Date(plan.date).toLocaleDateString("ro-RO", {
                                                    weekday: "short", day: "numeric", month: "short",
                                                })}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#666" }}>
                                                Antrenor fitness: {coachName || "Nespecificat"}
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










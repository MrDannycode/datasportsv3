import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import LoadQualityChart from "@/components/sport-science/LoadQualityChart"

const FITNESS_TYPE_LABELS: Record<string, string> = {
    forta: "Forta",
    rezistenta: "Rezistenta",
    vitezare: "Viteza",
    flexibilitate: "Flexibilitate",
    coordonare: "Coordonare",
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

    return (
        <main>
            <div className="sd-box">
                <div className="sd-box-header">
                    <h2>Dashboard overview</h2>
                </div>
                <div className="sd-box-content">
                    <div className="sd-metrics">
                        <div className="sd-box sd-metric-box" style={{ height: "auto", minHeight: "150px" }}>
                            <div className="sd-metric-title">Fitness calendar</div>
                            <div style={{ marginTop: "15px", textAlign: "left" }}>
                                {fitnessPlans.length === 0 ? (
                                    <p style={{ fontSize: "14px", color: "#666" }}>Nu ai adaugat activitati de fitness.</p>
                                ) : (
                                    <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "14px" }}>
                                        {fitnessPlans.map((plan) => (
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
                                                {plan.description && (
                                                    <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                                                        {plan.description}
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <Link href="/antrenor-fitness/fitness-calendar" style={{ display: "inline-block", marginTop: "8px", fontSize: "13px", color: "#0056b3", textDecoration: "none" }}>
                                Vezi toate activitatile
                            </Link>
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
                                <h2>Load quality focus</h2>
                                <Link href="/antrenor-fitness/fitness-calendar">Vezi calendarul</Link>
                            </div>
                            <div className="sd-box-content">
                                <ul className="sd-list">
                                    <li>Strain evidentiaza stresul cumulat real si scoate rapid la suprafata blocurile prea dense.</li>
                                    <li>Monotony mare inseamna distributie prea uniforma a efortului si risc crescut de supraantrenament.</li>
                                    <li>A:C Ratio intre 0.8 si 1.3 marcheaza zilele in care incarcare acuta si cronica raman echilibrate.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="sd-sidebar">
                            <div className="sd-box">
                                <div className="sd-box-header">
                                    <h2>Squad snapshot</h2>
                                </div>
                                <div className="sd-box-content">
                                    <p>Atleti urmariti: {teamAthleteCount}</p>
                                    <p>A:C Ratio curent: {latestLoadQuality?.acRatio?.toFixed(2) ?? "-"}</p>
                                    <p>Zile agregate: {loadQualityPoints.length}</p>
                                </div>
                            </div>

                            <div className="sd-box">
                                <div className="sd-box-header">
                                    <h2>Interpretare</h2>
                                </div>
                                <div className="sd-box-content">
                                    <ul className="sd-list">
                                        <li>A:C sub 0.8 poate sugera pierdere de stimul.</li>
                                        <li>A:C peste 1.3 cere prudenta la incarcarea urmatoare.</li>
                                        <li>Monotony peste 2.0 merita verificata distributia saptamanii.</li>
                                        <li>Strain in crestere cu monotony mare indica risc acumulat.</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="sd-box sd-metric-box" style={{ height: "auto", minHeight: "150px" }}>
                                <div className="sd-metric-title">Load quality</div>
                                <div style={{ marginTop: "15px", textAlign: "left", fontSize: "13px", color: "#555" }}>
                                    <p style={{ margin: "0 0 8px" }}>Atleti in echipa: <strong>{teamAthleteCount}</strong></p>
                                    <p style={{ margin: "0 0 8px" }}>Zile in zona safe A:C: <strong>{safeDaysCount}</strong></p>
                                    <p style={{ margin: "0 0 8px" }}>Monotony curent: <strong>{latestLoadQuality?.monotony?.toFixed(2) ?? "-"}</strong></p>
                                    <p style={{ margin: 0 }}>Strain curent: <strong>{latestLoadQuality?.strain?.toFixed(0) ?? "-"}</strong></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

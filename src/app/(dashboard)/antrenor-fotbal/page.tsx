import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

type ReadinessPlayer = {
    id: number
    name: string
    score: number
    tsbScore: number
    atlScore: number
    ctlScore: number
    acRatioScore: number
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

    const [totalPlans, recentPlans, recentInjuries, teamAthletes] = await Promise.all([
        prisma.trainingPlan.count({ where: { createdBy: coachId } }),
        prisma.trainingPlan.findMany({
            where: { createdBy: coachId },
            orderBy: { date: "desc" },
            take: 5,
        }),
        prisma.injury.findMany({
            include: {
                medicalRecord: {
                    include: {
                        athlete: {
                            include: {
                                user: { include: { profile: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { medicalRecord: { createdAt: "desc" } },
            take: 3,
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

    return (
        <main>
            <div className="sd-page-title">
                <h1>Dashboard - Antrenor Fotbal</h1>
            </div>

            <div className="sd-metrics">
                <div className="sd-box sd-metric-box" style={{ flex: 1 }}>
                    <div className="sd-metric-title">Accidentari Recente</div>
                    {recentInjuries.length === 0 ? (
                        <div className="sd-metric-value">-</div>
                    ) : (
                        <div style={{ textAlign: "left", marginTop: "10px" }}>
                            <div className="sd-metric-value" style={{ fontSize: "24px", marginBottom: "8px", textAlign: "center" }}>
                                {recentInjuries.length}
                            </div>
                            <ul className="sd-list">
                                {recentInjuries.map((injury) => {
                                    const profile = injury.medicalRecord.athlete.user.profile
                                    const athleteName = profile
                                        ? [profile.firstName, profile.lastName].join(" ")
                                        : injury.medicalRecord.athlete.user.email

                                    return (
                                        <li key={injury.id}>
                                            <strong>{athleteName}</strong>
                                            <br />
                                            {injury.injuryType} - {injury.bodyPart}
                                            <br />
                                            <span style={{ color: "#666" }}>
                                                {injury.severity} - {" "}
                                                {new Date(injury.medicalRecord.createdAt).toLocaleDateString("ro-RO", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                })}
                                            </span>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="sd-box sd-metric-box">
                    <div className="sd-metric-title">Planuri de antrenament</div>
                    <div className="sd-metric-value">{totalPlans}</div>
                </div>
                <Link href="/antrenor-fotbal/antrenamente" style={{ flex: 1, textDecoration: "none" }}>
                    <div className="sd-box sd-metric-box" style={{ cursor: "pointer" }}>
                        <div className="sd-metric-title">Antrenamente</div>
                        <div className="sd-metric-value" style={{ fontSize: "14px", marginTop: "8px", color: "#0056b3" }}>
                            Gestioneaza -&gt;
                        </div>
                    </div>
                </Link>
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
                    <div className="sd-metrics" style={{ marginBottom: "18px" }}>
                        <div className="sd-box sd-metric-box">
                            <div className="sd-metric-title">Scor echipa</div>
                            <div className="sd-metric-value">{formatReadinessScore(teamReadiness)}</div>
                        </div>
                        <div className="sd-box sd-metric-box">
                            <div className="sd-metric-title">Jucatori inclusi</div>
                            <div className="sd-metric-value">{readinessPlayers.length}</div>
                        </div>
                        <div className="sd-box sd-metric-box">
                            <div className="sd-metric-title">Eligibilitate</div>
                            <div className="sd-metric-value" style={{ fontSize: "14px", marginTop: "8px" }}>
                                Disponibili cu aviz medical
                            </div>
                        </div>
                    </div>

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
                        <h2>Planuri recente</h2>
                        <Link href="/antrenor-fotbal/antrenamente">Vezi toate</Link>
                    </div>
                    <div className="sd-box-content" style={{ padding: 0 }}>
                        {recentPlans.length === 0 ? (
                            <div className="sd-empty-state">
                                <p>Nu ai creat niciun plan de antrenament.</p>
                                <Link href="/antrenor-fotbal/antrenamente/nou" className="sd-btn-primary">
                                    Creeaza primul plan
                                </Link>
                            </div>
                        ) : (
                            <table className="sd-table">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Titlu</th>
                                        <th>Tip</th>
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
                                            <td>
                                                <Link href={`/antrenor-fotbal/antrenamente/${plan.id}/edit`}>
                                                    {plan.title}
                                                </Link>
                                            </td>
                                            <td>
                                                <span className={`sd-badge sd-badge-${plan.type}`}>
                                                    {plan.type.charAt(0).toUpperCase() + plan.type.slice(1)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="sd-sidebar">
                    <div className="sd-box">
                        <div className="sd-box-header">
                            <h2>Navigare rapida</h2>
                        </div>
                        <div className="sd-box-content">
                            <ul className="sd-list">
                                <li>
                                    <Link href="/antrenor-fotbal/antrenamente">
                                        Toate antrenamentele
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/antrenor-fotbal/antrenamente/nou">
                                        Plan nou de antrenament
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="sd-box">
                        <div className="sd-box-header">
                            <h2>Tipuri antrenament</h2>
                        </div>
                        <div className="sd-box-content">
                            <ul className="sd-list">
                                <li>
                                    <span className="sd-badge sd-badge-tehnic">Tehnic</span>
                                    {" - lucru cu mingea, dribling, pase"}
                                </li>
                                <li>
                                    <span className="sd-badge sd-badge-fizic">Fizic</span>
                                    {" - rezistenta, viteza, forta"}
                                </li>
                                <li>
                                    <span className="sd-badge sd-badge-tactic">Tactic</span>
                                    {" - scheme, pozitionare, faze fixe"}
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="sd-box">
                        <div className="sd-box-header">
                            <h2>Bara verde ca la fifa</h2>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

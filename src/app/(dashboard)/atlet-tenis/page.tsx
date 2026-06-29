import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import SportScienceMetrics, { type SportScienceLoad } from "@/components/sport-science/SportScienceMetrics"
import TrainingLoadChart from "@/components/sport-science/TrainingLoadChart"
import { calculateDifficulty } from "@/lib/tournament-difficulty"
import Link from "next/link"

type TournamentDifficulty = "greu" | "mediu" | "usor" | null

type RegisteredTournamentInsight = {
    id: number
    name: string
    location: string | null
    surface: string | null
    startDate: Date
    endDate: Date | null
    difficulty: TournamentDifficulty
    avgRanking: number | null
    playerCount: number
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

const SURFACE_LABELS: Record<string, string> = {
    hard: "Hard",
    zgura: "Zgura",
    iarba: "Iarba",
}

const DIFFICULTY_STYLES: Record<Exclude<TournamentDifficulty, null>, { label: string; color: string; background: string }> = {
    greu: { label: "Greu", color: "#991b1b", background: "#fee2e2" },
    mediu: { label: "Mediu", color: "#92400e", background: "#fef3c7" },
    usor: { label: "Usor", color: "#166534", background: "#dcfce7" },
}

function formatActivityDate(date: Date) {
    return date.toLocaleDateString("ro-RO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
}

function formatTournamentDate(date: Date) {
    return date.toLocaleDateString("ro-RO", {
        day: "numeric",
        month: "short",
    })
}

function getDaysUntil(date: Date) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const target = new Date(date)
    target.setHours(0, 0, 0, 0)

    return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

function formatDuration(minutes: number) {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = Math.round(minutes % 60)

    if (hours === 0) return `${remainingMinutes} min`
    return `${hours}h ${remainingMinutes}min`
}

function TournamentInsightsSidebar({
    tournaments,
    hasTennisProfile,
}: {
    tournaments: RegisteredTournamentInsight[]
    hasTennisProfile: boolean
}) {
    if (!hasTennisProfile) {
        return (
            <div className="sd-box">
                <div className="sd-box-header">
                    <h2>Turneele mele</h2>
                </div>
                <div className="sd-box-content">
                    <p style={{ fontSize: "13px", color: "#666", margin: 0 }}>
                        Completeaza Profilul meu pentru tenis ca sa vezi sumarul inscrierilor.
                    </p>
                </div>
            </div>
        )
    }

    const upcomingTournaments = tournaments.filter((tournament) => tournament.startDate >= new Date())
    const nextTournament = upcomingTournaments[0] ?? tournaments[0] ?? null
    const countByDifficulty = {
        greu: tournaments.filter((tournament) => tournament.difficulty === "greu").length,
        mediu: tournaments.filter((tournament) => tournament.difficulty === "mediu").length,
        usor: tournaments.filter((tournament) => tournament.difficulty === "usor").length,
    }
    const daysUntilNext = nextTournament ? getDaysUntil(nextTournament.startDate) : null

    return (
        <div className="sd-box">
            <div className="sd-box-header">
                <h2>Turneele mele</h2>
                <Link href="/atlet-tenis/turnee/inscrieri">Vezi toate</Link>
            </div>
            <div className="sd-box-content" style={{ display: "grid", gap: 12 }}>
                {nextTournament ? (
                    <>
                        <div>
                            <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", fontWeight: "bold" }}>
                                Urmatorul turneu
                            </div>
                            <div style={{ fontSize: "15px", fontWeight: "bold", marginTop: 4 }}>
                                {nextTournament.name}
                            </div>
                            <div style={{ fontSize: "12px", color: "#666", marginTop: 4 }}>
                                {formatTournamentDate(nextTournament.startDate)}
                                {nextTournament.location ? ` | ${nextTournament.location}` : ""}
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <div style={{ border: "1px solid #e5e7eb", padding: "8px 10px" }}>
                                <div style={{ fontSize: "11px", color: "#666", fontWeight: "bold" }}>Start</div>
                                <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                                    {daysUntilNext != null && daysUntilNext > 0 ? `${daysUntilNext} zile` : "Azi"}
                                </div>
                            </div>
                            <div style={{ border: "1px solid #e5e7eb", padding: "8px 10px" }}>
                                <div style={{ fontSize: "11px", color: "#666", fontWeight: "bold" }}>Suprafata</div>
                                <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                                    {nextTournament.surface ? SURFACE_LABELS[nextTournament.surface] ?? nextTournament.surface : "-"}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", fontSize: "11px" }}>
                            <span style={{ padding: "3px 8px", color: "#991b1b", background: "#fee2e2", fontWeight: "bold" }}>
                                Grele {countByDifficulty.greu}
                            </span>
                            <span style={{ padding: "3px 8px", color: "#92400e", background: "#fef3c7", fontWeight: "bold" }}>
                                Medii {countByDifficulty.mediu}
                            </span>
                            <span style={{ padding: "3px 8px", color: "#166534", background: "#dcfce7", fontWeight: "bold" }}>
                                Usoare {countByDifficulty.usor}
                            </span>
                        </div>

                        <div style={{ display: "grid", gap: 8 }}>
                            {tournaments.slice(0, 3).map((tournament) => {
                                const difficulty = tournament.difficulty ? DIFFICULTY_STYLES[tournament.difficulty] : null

                                return (
                                    <div key={tournament.id} style={{ borderTop: "1px solid #eee", paddingTop: 8 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                                            <div style={{ fontSize: "13px", fontWeight: "bold" }}>{tournament.name}</div>
                                            {difficulty && (
                                                <span style={{ flexShrink: 0, padding: "2px 6px", fontSize: "10px", color: difficulty.color, background: difficulty.background, fontWeight: "bold" }}>
                                                    {difficulty.label}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#666", marginTop: 3 }}>
                                            {formatTournamentDate(tournament.startDate)} | {tournament.playerCount} jucatori
                                            {tournament.avgRanking ? ` | avg #${tournament.avgRanking}` : ""}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                ) : (
                    <div className="sd-empty-state" style={{ padding: 0 }}>
                        <p>Nu esti inscris la niciun turneu momentan.</p>
                        <Link href="/atlet-tenis/turnee" className="sd-players-toggle" style={{ display: "inline-block", marginTop: 8 }}>
                            Vezi turnee disponibile
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

export default async function AtletTenisPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "atlet_tenis") {
        redirect("/login")
    }

    const userId = Number(session.user.id)
    const profile = await prisma.profile.findUnique({
        where: { userId },
        select: { id: true },
    })

    let latestLoad: SportScienceLoad | null = null
    let trainingLoads: SportScienceLoad[] = []
    let registeredTournamentInsights: RegisteredTournamentInsight[] = []
    let hasTennisProfile = false
    let recentActivities: Array<{
        id: number
        date: Date
        durationMin: number
        avgHeartRate: number | null
        sport: string | null
        notes: string | null
        trimp: number | null
    }> = []

    if (profile) {
        const loadFromDate = new Date()
        loadFromDate.setUTCDate(loadFromDate.getUTCDate() - 90)
        loadFromDate.setUTCHours(0, 0, 0, 0)

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
        })
        latestLoad = trainingLoads[trainingLoads.length - 1] ?? null

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
        })
    }

    const tennisAthlete = await prisma.tennisAthlete.findUnique({
        where: { userId },
        select: { id: true, atpWtaRanking: true },
    })

    hasTennisProfile = !!tennisAthlete

    if (tennisAthlete) {
        const registrations = await prisma.tournamentRegistration.findMany({
            where: { athleteId: tennisAthlete.id, status: "inscris" },
            include: {
                tournament: {
                    include: {
                        players: { orderBy: { atpWtaRanking: "asc" } },
                    },
                },
            },
            orderBy: { tournament: { startDate: "asc" } },
            take: 6,
        })

        registeredTournamentInsights = registrations.map((registration) => {
            const tournament = registration.tournament
            const rankings = tournament.players.map((player) => player.atpWtaRanking)
            const validRankings = rankings.filter((ranking): ranking is number => ranking !== null && ranking > 0)
            const avgRanking = validRankings.length > 0
                ? Math.round(validRankings.reduce((sum, ranking) => sum + ranking, 0) / validRankings.length)
                : null

            return {
                id: tournament.id,
                name: tournament.name,
                location: tournament.location,
                surface: tournament.surface,
                startDate: tournament.startDate,
                endDate: tournament.endDate,
                difficulty: calculateDifficulty(rankings, tournament.name, tennisAthlete.atpWtaRanking),
                avgRanking,
                playerCount: tournament.players.length,
            }
        })
    }

    return (
        <main className="sd-athlete-dashboard-layout">
            <div className="sd-box sd-athlete-main-content">
                <div className="sd-box-header">
                    <h2>Dashboard overview</h2>
                </div>
                <div className="sd-box-content">


                    <div className="sd-box" id="performance-management-chart">
                        <div className="sd-box-content">
                            <TrainingLoadChart loads={trainingLoads} />
                        </div>
                    </div>

                    <div className="sd-panels">
                        <div className="sd-box sd-activities">
                            <div className="sd-box-header">
                                <h2>Recent Activities</h2>
                                <Link href="/atlet-tenis/activity">View All</Link>
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
                                                <td>{activity.avgHeartRate ? `${activity.avgHeartRate} bpm` : "-"}</td>
                                                <td>{activity.trimp != null ? activity.trimp.toFixed(1) : "N/A"}</td>
                                                <td>{activity.notes ? (activity.notes.length > 50 ? `${activity.notes.slice(0, 50)}...` : activity.notes) : "-"}</td>
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

            <aside className="sd-athlete-right-sidebar sd-sticky-sidebar">
                <TournamentInsightsSidebar
                    tournaments={registeredTournamentInsights}
                    hasTennisProfile={hasTennisProfile}
                />

                <div className="sd-box">
                    <div className="sd-box-header">
                        <h2>Sport Science</h2>
                    </div>
                    <div className="sd-box-content">
                        <SportScienceMetrics latestLoad={latestLoad} />
                    </div>
                </div>
            </aside>
        </main>
    )
}






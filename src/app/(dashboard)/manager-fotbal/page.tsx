import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import MatchManager from "./MatchManager"
import TeamManager from "./TeamManager"
import PlayerManager from "./PlayerManager"

export default async function ManagerFotbalPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "manager_fotbal") {
        redirect("/login")
    }

    const teams = await prisma.team.findMany({
        where: { sport: "fotbal" },
        select: { id: true, name: true, country: true, continent: true },
        orderBy: { name: 'asc' }
    })

    const competitions = await prisma.competition.findMany({
        where: { sport: "fotbal" },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    })

    const users = await prisma.user.findMany({
        where: { role: "atlet_fotbal" },
        include: {
            profile: {
                include: { team: true }
            }
        },
        orderBy: { email: 'asc' }
    })

    const players = users.map(u => ({
        id: u.id,
        firstName: u.profile?.firstName || u.email.split('@')[0],
        lastName: u.profile?.lastName || "",
        teamId: u.profile?.teamId || null,
        team: u.profile?.team || null,
        hasProfile: !!u.profile
    }))

    const matches = await prisma.footballMatch.findMany({
        include: {
            teamHome: { select: { id: true, name: true } },
            teamAway: { select: { id: true, name: true } },
            competition: { select: { id: true, name: true } }
        },
        orderBy: { matchDate: 'desc' }
    })

    return (
        <main>
            <div className="sd-page-title">
                <h1>Dashboard Manager Fotbal</h1>
            </div>

            {/* Key Metrics */}
            <div className="sd-metrics">
                <div className="sd-box sd-metric-box">
                    <div className="sd-metric-title">Meciuri Totale: {matches.length}</div>
                </div>
                <div className="sd-box sd-metric-box">
                    <div className="sd-metric-title">Echipe Fotbal: {teams.length}</div>
                </div>
            </div>

            {/* Main Panels */}
            <div className="sd-panels" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <PlayerManager players={players as any} teams={teams} />
                <TeamManager initialTeams={teams} />
                <MatchManager initialMatches={matches as any} teams={teams} competitions={competitions} />

                {/* Sidebar panels */}
                <div className="sd-sidebar">
                    <div className="sd-box">
                        <div className="sd-box-header">
                            <h2>Next Match</h2>
                        </div>
                        <div className="sd-box-content">
                            <p>Opponent: Liverpool</p>
                            <p>Difficulty: —</p>
                            <p>Weather: —</p>
                        </div>
                    </div>

                    <div className="sd-box">
                        <div className="sd-box-header">
                            <h2>Team Stats</h2>
                        </div>
                        <div className="sd-box-content">
                            <ul className="sd-list">
                                <li>Squad fitness</li>
                                <li>Injury list</li>
                                <li>Training load</li>
                                <li>Workload ratio</li>
                                <li>Fatigue index</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

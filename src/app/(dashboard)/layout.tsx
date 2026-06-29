import "../dashboard.css"
import DashboardHeader from "@/components/layout/DashboardHeader"
import DashboardSidebar from "@/components/layout/DashboardSidebar"
import type { SidebarRecentInjury, SidebarStanding } from "@/components/layout/DashboardSidebar"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const rolesWithoutSidebar = new Set([
    "admin_global",
    "manager_fotbal",
    "manager_tenis",
    "atlet_tenis",
])

async function getSidebarPlayers(userId?: string) {
    const parsedUserId = Number(userId)
    if (!Number.isInteger(parsedUserId)) return []

    const profile = await prisma.profile.findUnique({
        where: { userId: parsedUserId },
        select: { teamId: true },
    })

    if (!profile?.teamId) return []

    const athletes = await prisma.footballAthlete.findMany({
        where: {
            user: {
                profile: {
                    teamId: profile.teamId,
                },
            },
        },
        select: {
            id: true,
            user: {
                select: {
                    profile: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            dailyLoads: {
                                orderBy: { date: "desc" },
                                take: 1,
                                select: {
                                    ctl: true,
                                    atl: true,
                                    tsb: true,
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: [
            { user: { profile: { lastName: "asc" } } },
            { user: { profile: { firstName: "asc" } } },
        ],
    })

    return athletes
        .map((athlete) => {
            const profile = athlete.user.profile
            const latestLoad = profile?.dailyLoads[0]

            return {
                id: athlete.id,
                name: profile ? profile.firstName + " " + profile.lastName : "Jucator fara profil",
                ctl: latestLoad?.ctl ?? null,
                atl: latestLoad?.atl ?? null,
                tsb: latestLoad?.tsb ?? null,
            }
        })
        .sort((a, b) => (b.atl ?? -Infinity) - (a.atl ?? -Infinity) || a.name.localeCompare(b.name))
}

async function getSidebarStandings(userId?: string): Promise<{ leagueName: string | null; standings: SidebarStanding[] }> {
    const parsedUserId = Number(userId)
    if (!Number.isInteger(parsedUserId)) return { leagueName: null, standings: [] }

    const profile = await prisma.profile.findUnique({
        where: { userId: parsedUserId },
        select: {
            team: {
                select: {
                    continent: true,
                },
            },
        },
    })

    const leagueName = profile?.team?.continent
    if (!leagueName) return { leagueName: null, standings: [] }

    const [teams, matches] = await Promise.all([
        prisma.team.findMany({
            where: {
                sport: "fotbal",
                continent: leagueName,
            },
            select: {
                id: true,
                name: true,
            },
        }),
        prisma.footballMatch.findMany({
            where: {
                competition: {
                    sport: "fotbal",
                    name: leagueName,
                },
                scoreHome: { not: null },
                scoreAway: { not: null },
            },
            select: {
                teamHomeId: true,
                teamAwayId: true,
                scoreHome: true,
                scoreAway: true,
            },
        }),
    ])

    const standings = new Map<number, Omit<SidebarStanding, "pos"> & { goalDifference: number; goalsFor: number }>()

    for (const team of teams) {
        standings.set(team.id, {
            team: team.name,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            pts: 0,
            goalDifference: 0,
            goalsFor: 0,
        })
    }

    for (const match of matches) {
        if (match.scoreHome === null || match.scoreAway === null) continue

        const home = standings.get(match.teamHomeId)
        const away = standings.get(match.teamAwayId)
        if (!home || !away) continue

        home.played += 1
        away.played += 1
        home.goalsFor += match.scoreHome
        away.goalsFor += match.scoreAway
        home.goalDifference += match.scoreHome - match.scoreAway
        away.goalDifference += match.scoreAway - match.scoreHome

        if (match.scoreHome > match.scoreAway) {
            home.won += 1
            away.lost += 1
            home.pts += 3
        } else if (match.scoreHome < match.scoreAway) {
            away.won += 1
            home.lost += 1
            away.pts += 3
        } else {
            home.drawn += 1
            away.drawn += 1
            home.pts += 1
            away.pts += 1
        }
    }

    return {
        leagueName,
        standings: Array.from(standings.values())
            .sort((a, b) =>
                b.pts - a.pts ||
                b.goalDifference - a.goalDifference ||
                b.goalsFor - a.goalsFor ||
                a.team.localeCompare(b.team)
            )
            .map((standing, index) => ({
                pos: index + 1,
                team: standing.team,
                played: standing.played,
                won: standing.won,
                drawn: standing.drawn,
                lost: standing.lost,
                pts: standing.pts,
            })),
    }
}

async function getSidebarRecentInjuries(userId?: string): Promise<SidebarRecentInjury[]> {
    const parsedUserId = Number(userId)
    if (!Number.isInteger(parsedUserId)) return []

    const profile = await prisma.profile.findUnique({
        where: { userId: parsedUserId },
        select: { teamId: true },
    })

    if (!profile?.teamId) return []

    const injuries = await prisma.injury.findMany({
        where: {
            medicalRecord: {
                athlete: {
                    user: {
                        profile: {
                            teamId: profile.teamId,
                        },
                    },
                },
            },
        },
        include: {
            medicalRecord: {
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
                },
            },
        },
        orderBy: { medicalRecord: { createdAt: "desc" } },
        take: 3,
    })

    return injuries.map((injury) => {
        const athleteProfile = injury.medicalRecord.athlete.user.profile
        const athleteName = athleteProfile
            ? [athleteProfile.firstName, athleteProfile.lastName].join(" ")
            : injury.medicalRecord.athlete.user.email

        return {
            id: injury.id,
            athleteName,
            injuryType: injury.injuryType,
            bodyPart: injury.bodyPart,
            severity: injury.severity,
            createdAt: injury.medicalRecord.createdAt.toISOString(),
        }
    })
}

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)
    const showSidebar = !session?.user.role || !rolesWithoutSidebar.has(session.user.role)
    const shouldShowRecentInjuries = session?.user.role === "antrenor_fotbal"
    const [sidebarPlayers, sidebarStandingsData, sidebarRecentInjuries] = showSidebar
        ? await Promise.all([
            getSidebarPlayers(session?.user.id),
            getSidebarStandings(session?.user.id),
            shouldShowRecentInjuries
                ? getSidebarRecentInjuries(session?.user.id)
                : Promise.resolve([]),
        ])
        : [[], { leagueName: null, standings: [] }, []]

    return (
        <div className="sd-container">
            <div className="sd-inner">
                <DashboardHeader activeHref="#" />
                <div className="sd-with-sidebar">
                    <div className="sd-main-content">
                        {children}
                    </div>
                    {showSidebar && (
                        <DashboardSidebar
                            players={sidebarPlayers}
                            standings={sidebarStandingsData.standings}
                            standingsLeagueName={sidebarStandingsData.leagueName}
                            recentInjuries={shouldShowRecentInjuries ? sidebarRecentInjuries : undefined}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

import "../dashboard.css"
import DashboardHeader from "@/components/layout/DashboardHeader"
import DashboardLeftSidebar from "@/components/layout/DashboardLeftSidebar"
import DashboardSidebar from "@/components/layout/DashboardSidebar"
import type { SidebarRecentInjury, SidebarWeeklyGoal } from "@/components/layout/DashboardLeftSidebar"
import type { SidebarStanding } from "@/components/layout/DashboardSidebar"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const DAY_MS = 24 * 60 * 60 * 1000

function formatShortDate(date: Date) {
    return date.toLocaleDateString("ro-RO", {
        day: "2-digit",
        month: "short",
    })
}

function startOfUtcDay(date: Date) {
    const result = new Date(date)
    result.setUTCHours(0, 0, 0, 0)
    return result
}

function startOfUtcWeek(date: Date) {
    const result = startOfUtcDay(date)
    const day = result.getUTCDay()
    const daysSinceMonday = day === 0 ? 6 : day - 1
    result.setUTCDate(result.getUTCDate() - daysSinceMonday)
    return result
}

function addUtcDays(date: Date, days: number) {
    const result = new Date(date)
    result.setUTCDate(result.getUTCDate() + days)
    return result
}

function sumTrimp(items: { trimp: number | null }[]) {
    return items.reduce((total, item) => total + (item.trimp ?? 0), 0)
}

function hasPostgresCode(error: unknown, code: string) {
    if (typeof error !== "object" || error === null) return false

    const directCode = "code" in error ? error.code : null
    const meta = "meta" in error ? error.meta : null
    const metaCode = typeof meta === "object" && meta !== null && "code" in meta ? meta.code : null

    return directCode === code || metaCode === code
}
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

type SidebarWeeklyGoalOptions = {
    targetTable: "fitness_weekly_goals" | "football_weekly_goals"
    activitySport: "fitness" | "fotbal"
    activityNotesPrefix: string
}

async function getSidebarWeeklyGoal(
    userId: string | undefined,
    options: SidebarWeeklyGoalOptions
): Promise<SidebarWeeklyGoal | null> {
    const parsedUserId = Number(userId)
    if (!Number.isInteger(parsedUserId)) return null

    const coachProfile = await prisma.profile.findUnique({
        where: { userId: parsedUserId },
        select: { teamId: true },
    })

    if (!coachProfile?.teamId) return null

    const today = new Date()
    const todayStart = startOfUtcDay(today)
    const currentWeekStart = startOfUtcWeek(today)
    const currentWeekEnd = addUtcDays(currentWeekStart, 7)
    const expectedFromDate = addUtcDays(currentWeekStart, -28)
    const loadsFromDate = addUtcDays(todayStart, -42)
    const elapsedWeekDays = Math.min(7, Math.max(1, Math.floor((todayStart.getTime() - currentWeekStart.getTime()) / DAY_MS) + 1))

    let savedWeeklyGoals: { target_trimp: number }[] = []

    try {
        savedWeeklyGoals = options.targetTable === "football_weekly_goals"
            ? await prisma.$queryRaw<{ target_trimp: number }[]>`
                SELECT target_trimp
                FROM football_weekly_goals
                WHERE team_id = ${coachProfile.teamId}
                  AND week_start = ${currentWeekStart}::date
                LIMIT 1
            `
            : await prisma.$queryRaw<{ target_trimp: number }[]>`
                SELECT target_trimp
                FROM fitness_weekly_goals
                WHERE team_id = ${coachProfile.teamId}
                  AND week_start = ${currentWeekStart}::date
                LIMIT 1
            `
    } catch (error) {
        if (!hasPostgresCode(error, "42P01")) {
            throw error
        }
    }

    const teamProfiles = await prisma.profile.findMany({
        where: {
            teamId: coachProfile.teamId,
            user: {
                footballAthlete: {
                    isNot: null,
                },
            },
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            activities: {
                where: {
                    date: {
                        gte: expectedFromDate,
                        lt: currentWeekEnd,
                    },
                    sport: options.activitySport,
                    notes: {
                        startsWith: options.activityNotesPrefix,
                    },
                },
                orderBy: { date: "asc" },
                select: {
                    id: true,
                    date: true,
                    trimp: true,
                },
            },
            dailyLoads: {
                where: {
                    date: {
                        gte: loadsFromDate,
                    },
                },
                orderBy: { date: "asc" },
                select: {
                    acRatio: true,
                },
            },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    })

    const weeklyAthletes = teamProfiles.map((profile) => {
        const currentWeekActivities = profile.activities.filter(
            (activity) => activity.date >= currentWeekStart && activity.date < currentWeekEnd
        )
        const previousActivities = profile.activities.filter(
            (activity) => activity.date >= expectedFromDate && activity.date < currentWeekStart
        )
        const currentWeekTrimp = sumTrimp(currentWeekActivities)
        const expectedWeeklyTrimp = sumTrimp(previousActivities) / 4
        const expectedTrimp = expectedWeeklyTrimp * (elapsedWeekDays / 7)
        const latestLoad = profile.dailyLoads[profile.dailyLoads.length - 1] ?? null

        return {
            id: profile.id,
            name: `${profile.firstName} ${profile.lastName}`.trim(),
            acRatio: latestLoad?.acRatio ?? null,
            currentWeekTrimp,
            expectedTrimp,
            expectedWeeklyTrimp,
            trainings: currentWeekActivities.map((activity) => ({
                id: activity.id,
                date: activity.date.toISOString(),
                trimp: activity.trimp,
            })),
        }
    })

    return {
        currentTrimp: weeklyAthletes.reduce((total, athlete) => total + athlete.currentWeekTrimp, 0),
        targetTrimp: savedWeeklyGoals[0]?.target_trimp ?? weeklyAthletes.reduce((total, athlete) => total + athlete.expectedWeeklyTrimp, 0),
        weekStart: currentWeekStart.toISOString(),
        weekLabel: `${formatShortDate(currentWeekStart)} - ${formatShortDate(addUtcDays(currentWeekEnd, -1))}`,
        acRiskAthletes: weeklyAthletes
            .filter((athlete) => athlete.acRatio != null && athlete.acRatio > 1.3)
            .sort((left, right) => (right.acRatio ?? 0) - (left.acRatio ?? 0)),
        underExpectedAthletes: weeklyAthletes
            .filter((athlete) => athlete.expectedTrimp > 0 && athlete.currentWeekTrimp < athlete.expectedTrimp)
            .sort((left, right) => (left.currentWeekTrimp / left.expectedTrimp) - (right.currentWeekTrimp / right.expectedTrimp)),
    }
}

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)
    const showSidebar = !session?.user.role || !rolesWithoutSidebar.has(session.user.role)
    const shouldShowRecentInjuries = session?.user.role === "antrenor_fotbal" || session?.user.role === "antrenor_fitness"
    const shouldShowFitnessWeeklyGoal = session?.user.role === "antrenor_fitness" || session?.user.role === "antrenor_fotbal"
    const shouldShowFootballWeeklyGoal = session?.user.role === "antrenor_fotbal"
    const shouldShowLeftSidebar = shouldShowRecentInjuries || shouldShowFitnessWeeklyGoal || shouldShowFootballWeeklyGoal
    const [sidebarPlayers, sidebarStandingsData, sidebarRecentInjuries, sidebarWeeklyGoal, sidebarFootballWeeklyGoal] = showSidebar
        ? await Promise.all([
            getSidebarPlayers(session?.user.id),
            getSidebarStandings(session?.user.id),
            shouldShowRecentInjuries
                ? getSidebarRecentInjuries(session?.user.id)
                : Promise.resolve([]),
            shouldShowFitnessWeeklyGoal
                ? getSidebarWeeklyGoal(session?.user.id, {
                    targetTable: "fitness_weekly_goals",
                    activitySport: "fitness",
                    activityNotesPrefix: "Rezultat antrenament Fitness:",
                })
                : Promise.resolve(null),
            shouldShowFootballWeeklyGoal
                ? getSidebarWeeklyGoal(session?.user.id, {
                    targetTable: "football_weekly_goals",
                    activitySport: "fotbal",
                    activityNotesPrefix: "Rezultat antrenament Fotbal:",
                })
                : Promise.resolve(null),
        ])
        : [[], { leagueName: null, standings: [] }, [], null, null]

    return (
        <div className="sd-container">
            <div className="sd-inner">
                <DashboardHeader
                    activeHref="#"
                    weeklyGoal={shouldShowFitnessWeeklyGoal ? sidebarWeeklyGoal : null}
                    footballWeeklyGoal={shouldShowFootballWeeklyGoal ? sidebarFootballWeeklyGoal : null}
                />
                <div className="sd-with-sidebar" style={{ gap: "20px" }}>
                    {showSidebar && shouldShowLeftSidebar && (
                        <DashboardLeftSidebar
                            recentInjuries={shouldShowRecentInjuries ? sidebarRecentInjuries : undefined}
                            weeklyGoal={shouldShowFitnessWeeklyGoal ? sidebarWeeklyGoal : undefined}
                            footballWeeklyGoal={shouldShowFootballWeeklyGoal ? sidebarFootballWeeklyGoal : undefined}
                        />
                    )}
                    <div className="sd-main-content">
                        {children}
                    </div>
                    {showSidebar && (
                        <DashboardSidebar
                            players={sidebarPlayers}
                            standings={sidebarStandingsData.standings}
                            standingsLeagueName={sidebarStandingsData.leagueName}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

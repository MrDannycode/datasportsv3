"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { normalizeFootballLeagueName } from "@/lib/football-league"

async function requireFootballManagerAssignment() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'manager_fotbal') {
        throw new Error('Unauthorized')
    }

    const assignment = await prisma.managerAssignment.findUnique({
        where: { userId: Number(session.user.id) },
        select: { country: true, continent: true },
    })

    const assignedCountry = assignment?.country?.trim()
    const assignedContinent = assignment?.continent?.trim()

    if (!assignedCountry || !assignedContinent) {
        throw new Error('Managerul nu are o tara si un continent asignate.')
    }

    return { session, assignedCountry, assignedContinent }
}

function validateAssignedTeamLocation(data: { country: string; continent: string }, assignedCountry: string) {
    if (data.country.trim() !== assignedCountry) {
        throw new Error('Poti administra echipe doar in tara la care ai fost asignat.')
    }

    if (!data.continent.trim()) {
        throw new Error('Selecteaza liga echipei.')
    }
}

async function validateMatchSelection(data: { teamHomeId: string; teamAwayId: string; competitionId: string }, assignedCountry: string) {
    const teamHomeId = Number(data.teamHomeId)
    const teamAwayId = Number(data.teamAwayId)
    const competitionId = Number(data.competitionId)

    if (!Number.isInteger(teamHomeId) || !Number.isInteger(teamAwayId) || !Number.isInteger(competitionId)) {
        throw new Error('Selecteaza competitia si ambele echipe.')
    }

    if (teamHomeId === teamAwayId) {
        throw new Error('Echipa gazda si echipa oaspete trebuie sa fie diferite.')
    }

    const [competition, homeTeam, awayTeam] = await Promise.all([
        prisma.competition.findFirst({
            where: { id: competitionId, sport: 'fotbal', country: assignedCountry },
            select: { id: true, name: true },
        }),
        prisma.team.findFirst({
            where: { id: teamHomeId, sport: 'fotbal', country: assignedCountry },
            select: { id: true, continent: true },
        }),
        prisma.team.findFirst({
            where: { id: teamAwayId, sport: 'fotbal', country: assignedCountry },
            select: { id: true, continent: true },
        }),
    ])

    if (!competition) {
        throw new Error('Selecteaza o competitie valida pentru tara ta.')
    }

    if (!homeTeam || !awayTeam) {
        throw new Error('Selecteaza echipe valide pentru tara ta.')
    }

    const competitionLeague = normalizeFootballLeagueName(competition.name)
    if (normalizeFootballLeagueName(homeTeam.continent) !== competitionLeague || normalizeFootballLeagueName(awayTeam.continent) !== competitionLeague) {
        throw new Error('Echipele selectate trebuie sa apartina competitiei alese.')
    }

    return { teamHomeId, teamAwayId, competitionId }
}

export async function createMatch(data: {
    teamHomeId: string
    teamAwayId: string
    matchDate: string
    location: string
    competitionId: string
    stage?: string
}) {
    const { session, assignedCountry } = await requireFootballManagerAssignment()
    const { teamHomeId, teamAwayId, competitionId } = await validateMatchSelection(data, assignedCountry)

    const match = await prisma.footballMatch.create({
        data: {
            teamHomeId,
            teamAwayId,
            matchDate: new Date(data.matchDate),
            location: data.location,
            stage: data.stage?.trim() || null,
            competitionId,
        }
    })
    
    await logAudit({ userId: session.user.id, action: "create", tableAffected: "football_matches", recordId: match.id, details: { location: match.location, matchDate: match.matchDate.toISOString() } })
    revalidatePath("/manager-fotbal")
}

export async function updateMatch(id: number, data: {
    teamHomeId: string
    teamAwayId: string
    matchDate: string
    location: string
    competitionId: string
    stage?: string
}) {
    const { session, assignedCountry } = await requireFootballManagerAssignment()
    const { teamHomeId, teamAwayId, competitionId } = await validateMatchSelection(data, assignedCountry)

    const existingMatch = await prisma.footballMatch.findFirst({
        where: { id, competition: { country: assignedCountry } },
        select: { id: true },
    })

    if (!existingMatch) {
        throw new Error('Poti modifica doar meciuri din tara ta.')
    }

    const match = await prisma.footballMatch.update({
        where: { id },
        data: {
            teamHomeId,
            teamAwayId,
            matchDate: new Date(data.matchDate),
            location: data.location,
            stage: data.stage?.trim() || null,
            competitionId,
        }
    })
    
    await logAudit({ userId: session.user.id, action: "update", tableAffected: "football_matches", recordId: match.id, details: { location: match.location, matchDate: match.matchDate.toISOString() } })
    revalidatePath("/manager-fotbal")
}

export async function updateMatchResult(id: number, data: {
    stage?: string
    scoreHome: string
    scoreAway: string
}) {
    const { session, assignedCountry } = await requireFootballManagerAssignment()
    const scoreHome = Number(data.scoreHome)
    const scoreAway = Number(data.scoreAway)

    if (!Number.isInteger(scoreHome) || !Number.isInteger(scoreAway) || scoreHome < 0 || scoreAway < 0) {
        throw new Error('Introdu scoruri valide pentru ambele echipe.')
    }

    const existingMatch = await prisma.footballMatch.findFirst({
        where: { id, competition: { country: assignedCountry } },
        select: { id: true },
    })

    if (!existingMatch) {
        throw new Error('Poti adauga rezultat doar pentru meciuri din tara ta.')
    }

    const match = await prisma.footballMatch.update({
        where: { id },
        data: {
            stage: data.stage?.trim() || null,
            scoreHome,
            scoreAway,
        },
    })

    await logAudit({ userId: session.user.id, action: "update", tableAffected: "football_matches", recordId: match.id, details: { stage: match.stage, scoreHome: match.scoreHome, scoreAway: match.scoreAway } })
    revalidatePath("/manager-fotbal")
    revalidatePath("/manager-fotbal/meciuri")
}

export async function deleteMatch(id: number) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "manager_fotbal") {
        throw new Error("Unauthorized")
    }

    const match = await prisma.footballMatch.delete({
        where: { id }
    })
    
    await logAudit({ userId: session.user.id, action: "delete", tableAffected: "football_matches", recordId: match.id, details: { location: match.location, matchDate: match.matchDate.toISOString() } })
    revalidatePath("/manager-fotbal")
}

export async function createTeam(data: {
    name: string
    stadium?: string
    county?: string
    country: string
    continent: string
}) {
    const { session, assignedCountry } = await requireFootballManagerAssignment()
    validateAssignedTeamLocation(data, assignedCountry)

    const team = await prisma.team.create({
        data: {
            name: data.name.trim(),
            stadium: data.stadium?.trim() || null,
            county: data.county?.trim() || null,
            sport: "fotbal",
            country: assignedCountry,
            continent: data.continent.trim()
        }
    })
    
    await logAudit({ userId: session.user.id, action: "create", tableAffected: "teams", recordId: team.id, details: { name: team.name, sport: team.sport } })
    revalidatePath("/manager-fotbal")
    revalidatePath("/manager-fotbal/echipe")
}

export async function updateTeam(id: number, data: {
    name: string
    stadium?: string
    county?: string
    country: string
    continent: string
}) {
    const { session, assignedCountry } = await requireFootballManagerAssignment()
    validateAssignedTeamLocation(data, assignedCountry)

    const existingTeam = await prisma.team.findFirst({
        where: { id, sport: 'fotbal', country: assignedCountry },
        select: { id: true },
    })

    if (!existingTeam) {
        throw new Error('Poti modifica doar echipe din tara ta.')
    }

    const team = await prisma.team.update({
        where: { id },
        data: {
            name: data.name.trim(),
            stadium: data.stadium?.trim() || null,
            county: data.county?.trim() || null,
            country: assignedCountry,
            continent: data.continent.trim()
        }
    })
    
    await logAudit({ userId: session.user.id, action: "update", tableAffected: "teams", recordId: team.id, details: { name: team.name, sport: team.sport } })
    revalidatePath("/manager-fotbal")
    revalidatePath("/manager-fotbal/echipe")
}

export async function deleteTeam(id: number) {
    const { session, assignedCountry } = await requireFootballManagerAssignment()

    const existingTeam = await prisma.team.findFirst({
        where: { id, sport: 'fotbal', country: assignedCountry },
        select: { id: true },
    })

    if (!existingTeam) {
        throw new Error('Poti sterge doar echipe din tara ta.')
    }

    const team = await prisma.team.delete({
        where: { id }
    })
    
    await logAudit({ userId: session.user.id, action: "delete", tableAffected: "teams", recordId: team.id, details: { name: team.name, sport: team.sport } })
    revalidatePath("/manager-fotbal")
    revalidatePath("/manager-fotbal/echipe")
}

export type TeamImportInput = {
    name: string
    stadium?: string | null
    county?: string | null
    continent: string
}

export type TeamImportResult = {
    row: number
    name: string
    success: boolean
    id?: number
    error?: string
}

function normalizeTeamImport(row: TeamImportInput) {
    const name = row.name.trim()
    const stadium = row.stadium?.trim() || null
    const county = row.county?.trim() || null
    const continent = row.continent.trim()

    if (!name) throw new Error("Numele echipei este obligatoriu.")
    if (!continent) throw new Error("Liga este obligatorie.")

    return { name, stadium, county, continent }
}

export async function importTeams(rows: TeamImportInput[]) {
    const { session, assignedCountry } = await requireFootballManagerAssignment()
    if (!Array.isArray(rows) || rows.length === 0) return { results: [] as TeamImportResult[] }
    if (rows.length > 250) throw new Error("Un import poate contine maximum 250 de echipe.")

    const leagues = await prisma.competition.findMany({
        where: { sport: "fotbal", country: assignedCountry },
        select: { name: true },
    })
    const leagueByKey = new Map(leagues.map(league => [normalizeFootballLeagueName(league.name), league.name.trim()]))

    const results: TeamImportResult[] = []
    for (const [index, row] of rows.entries()) {
        const line = index + 2
        try {
            const teamData = normalizeTeamImport(row)
            const matchedLeague = leagueByKey.get(normalizeFootballLeagueName(teamData.continent)) ?? teamData.continent

            const team = await prisma.team.create({
                data: {
                    name: teamData.name,
                    stadium: teamData.stadium,
                    county: teamData.county,
                    sport: "fotbal",
                    country: assignedCountry,
                    continent: matchedLeague,
                },
                select: { id: true, name: true, sport: true },
            })

            await logAudit({
                userId: session.user.id,
                action: "create",
                tableAffected: "teams",
                recordId: team.id,
                details: { name: team.name, sport: team.sport, source: "team_csv_import" },
            })

            results.push({ row: line, name: team.name, success: true, id: team.id })
        } catch (error) {
            results.push({ row: line, name: row.name?.trim() || "", success: false, error: error instanceof Error ? error.message : "Randul nu a putut fi importat." })
        }
    }

    if (results.some(result => result.success)) {
        revalidatePath("/manager-fotbal")
        revalidatePath("/manager-fotbal/echipe")
    }

    return { results }
}
export async function assignAntrenorToTeam(userId: number, teamId: string | null) {
    const { session, assignedCountry } = await requireFootballManagerAssignment()

    const staffUser = await prisma.user.findFirst({
        where: {
            id: userId,
            role: { in: ["antrenor_fotbal", "antrenor_fitness", "medic", "atlet_fotbal"] },
        },
        select: {
            id: true,
            email: true,
            role: true,
            profile: { select: { id: true, teamId: true } },
        },
    })

    if (!staffUser) {
        throw new Error("Contul de staff nu a fost gasit.")
    }

    const resolvedTeamId = teamId ? Number(teamId) : null
    if (resolvedTeamId !== null && (!Number.isInteger(resolvedTeamId) || resolvedTeamId <= 0)) {
        throw new Error("Echipa selectata nu este valida.")
    }

    if (resolvedTeamId !== null) {
        const team = await prisma.team.findFirst({
            where: { id: resolvedTeamId, sport: "fotbal", country: assignedCountry },
            select: { id: true },
        })

        if (!team) {
            throw new Error("Poti aloca staff doar la echipe din tara ta.")
        }
    }

    let profileId = staffUser.profile?.id

    if (!profileId) {
        const newProfile = await prisma.profile.create({
            data: {
                userId: staffUser.id,
                firstName: staffUser.email.split("@")[0],
                lastName: "",
                teamId: resolvedTeamId,
            },
            select: { id: true, teamId: true },
        })
        profileId = newProfile.id
        
        await logAudit({
            userId: session.user.id,
            action: "create",
            tableAffected: "profiles",
            recordId: profileId,
            details: {
                assignedUserId: userId,
                assignedRole: staffUser.role,
                teamId: newProfile.teamId,
                note: "Profile created automatically during team assignment"
            },
        })
    } else {
        const profile = await prisma.profile.update({
            where: { id: profileId },
            data: { teamId: resolvedTeamId },
            select: { id: true, teamId: true },
        })

        await logAudit({
            userId: session.user.id,
            action: "update",
            tableAffected: "profiles",
            recordId: profile.id,
            details: {
                assignedUserId: userId,
                assignedRole: staffUser.role,
                teamId: profile.teamId,
            },
        })
    }

    revalidatePath("/manager-fotbal")
    revalidatePath("/manager-fotbal/antrenori")
}

export async function assignPlayerToTeam(userId: number, teamId: string | null) {
    await assignAntrenorToTeam(userId, teamId)
    revalidatePath("/manager-fotbal/invitatii")
}








export type MatchImportInput = {
    league: string
    teamHome: string
    teamAway: string
    matchDate: string
    location: string
    stage?: string | null
    score?: string | null
}

export type MatchImportResult = {
    row: number
    match: string
    success: boolean
    id?: number
    error?: string
}

function normalizeMatchImportName(value: string) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toLowerCase()
}

export async function importMatches(rows: MatchImportInput[]) {
    const { session, assignedCountry } = await requireFootballManagerAssignment()
    if (!Array.isArray(rows) || rows.length === 0) return { results: [] as MatchImportResult[] }
    if (rows.length > 310) throw new Error("Un import poate contine maximum 310 meciuri.")

    const [competitions, teams] = await Promise.all([
        prisma.competition.findMany({
            where: { sport: "fotbal", country: assignedCountry },
            select: { id: true, name: true },
        }),
        prisma.team.findMany({
            where: { sport: "fotbal", country: assignedCountry },
            select: { id: true, name: true, continent: true },
        }),
    ])
    const competitionByLeague = new Map(competitions.map(competition => [normalizeFootballLeagueName(competition.name), competition]))
    const results: MatchImportResult[] = []

    for (const [index, row] of rows.entries()) {
        const line = index + 2
        const matchLabel = `${row.teamHome?.trim() || "-"} - ${row.teamAway?.trim() || "-"}`

        try {
            const league = row.league?.trim()
            const teamHomeName = row.teamHome?.trim()
            const teamAwayName = row.teamAway?.trim()
            const location = row.location?.trim()
            const matchDate = new Date(row.matchDate)
            const score = row.score?.trim()
            let scoreHome: number | null = null
            let scoreAway: number | null = null

            if (!league) throw new Error("Liga este obligatorie.")
            if (!teamHomeName || !teamAwayName) throw new Error("Ambele echipe sunt obligatorii.")
            if (!row.matchDate?.trim() || Number.isNaN(matchDate.getTime())) throw new Error("Data si ora meciului nu sunt valide.")
            if (!location) throw new Error("Stadionul este obligatoriu.")

            if (score) {
                const scoreMatch = score.match(/^(\d+)\s*[-:]\s*(\d+)$/)
                if (!scoreMatch) throw new Error("Scorul trebuie sa aiba formatul 2-1 sau 2:1.")
                scoreHome = Number(scoreMatch[1])
                scoreAway = Number(scoreMatch[2])
            }
            const competition = competitionByLeague.get(normalizeFootballLeagueName(league))
            if (!competition) throw new Error("Liga nu exista pentru tara managerului.")

            const leagueKey = normalizeFootballLeagueName(competition.name)
            const leagueTeams = teams.filter(team => normalizeFootballLeagueName(team.continent) === leagueKey)
            const homeTeam = leagueTeams.find(team => normalizeMatchImportName(team.name) === normalizeMatchImportName(teamHomeName))
            const awayTeam = leagueTeams.find(team => normalizeMatchImportName(team.name) === normalizeMatchImportName(teamAwayName))

            if (!homeTeam) throw new Error("Echipa gazda nu exista in liga selectata.")
            if (!awayTeam) throw new Error("Echipa oaspete nu exista in liga selectata.")
            if (homeTeam.id === awayTeam.id) throw new Error("Echipa gazda si echipa oaspete trebuie sa fie diferite.")

            const match = await prisma.footballMatch.create({
                data: {
                    teamHomeId: homeTeam.id,
                    teamAwayId: awayTeam.id,
                    matchDate,
                    location,
                    stage: row.stage?.trim() || null,
                    competitionId: competition.id,
                    scoreHome,
                    scoreAway,
                },
                select: { id: true, location: true, matchDate: true },
            })

            await logAudit({
                userId: session.user.id,
                action: "create",
                tableAffected: "football_matches",
                recordId: match.id,
                details: { location: match.location, matchDate: match.matchDate.toISOString(), source: "match_csv_import" },
            })
            results.push({ row: line, match: matchLabel, success: true, id: match.id })
        } catch (error) {
            results.push({ row: line, match: matchLabel, success: false, error: error instanceof Error ? error.message : "Randul nu a putut fi importat." })
        }
    }

    if (results.some(result => result.success)) {
        revalidatePath("/manager-fotbal")
        revalidatePath("/manager-fotbal/meciuri")
    }

    return { results }
}

"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logAudit } from "@/lib/audit"

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

    if (homeTeam.continent !== competition.name || awayTeam.continent !== competition.name) {
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
    scoreHome?: string
    scoreAway?: string
}) {
    const { session, assignedCountry } = await requireFootballManagerAssignment()
    const { teamHomeId, teamAwayId, competitionId } = await validateMatchSelection(data, assignedCountry)

    const match = await prisma.footballMatch.create({
        data: {
            teamHomeId,
            teamAwayId,
            matchDate: new Date(data.matchDate),
            location: data.location,
            competitionId,
            scoreHome: data.scoreHome ? parseInt(data.scoreHome) : null,
            scoreAway: data.scoreAway ? parseInt(data.scoreAway) : null,
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
    scoreHome?: string
    scoreAway?: string
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
            competitionId,
            scoreHome: data.scoreHome !== undefined && data.scoreHome !== "" ? parseInt(data.scoreHome) : null,
            scoreAway: data.scoreAway !== undefined && data.scoreAway !== "" ? parseInt(data.scoreAway) : null,
        }
    })
    
    await logAudit({ userId: session.user.id, action: "update", tableAffected: "football_matches", recordId: match.id, details: { location: match.location, matchDate: match.matchDate.toISOString() } })
    revalidatePath("/manager-fotbal")
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
    country: string
    continent: string
}) {
    const { session, assignedCountry } = await requireFootballManagerAssignment()
    validateAssignedTeamLocation(data, assignedCountry)

    const team = await prisma.team.create({
        data: {
            name: data.name.trim(),
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

async function assignUserProfileToTeam(userId: number, teamId: string | null) {
    const { session, assignedCountry } = await requireFootballManagerAssignment()

    const tId = teamId ? parseInt(teamId) : null;

    if (tId !== null) {
        const team = await prisma.team.findFirst({
            where: { id: tId, sport: 'fotbal', country: assignedCountry },
            select: { id: true },
        })

        if (!team) {
            throw new Error('Poti aloca utilizatori doar la echipe din tara ta.')
        }
    }

    const profile = await prisma.profile.findUnique({ where: { userId } })

    if (profile) {
        await prisma.profile.update({
            where: { id: profile.id },
            data: { teamId: tId }
        })
    } else {
        const user = await prisma.user.findUnique({ where: { id: userId } })
        await prisma.profile.create({
            data: {
                userId,
                firstName: user?.email.split('@')[0] || "Anonim",
                lastName: "",
                teamId: tId
            }
        })
    }
    
    await logAudit({ userId: session.user.id, action: "update", tableAffected: "profiles", recordId: profile?.id ?? userId, details: { targetUserId: userId, teamId: tId } })
    revalidatePath("/manager-fotbal")
    revalidatePath("/manager-fotbal/antrenori")
}

export async function assignPlayerToTeam(userId: number, teamId: string | null) {
    await assignUserProfileToTeam(userId, teamId)
}

export async function assignAntrenorToTeam(userId: number, teamId: string | null) {
    await assignUserProfileToTeam(userId, teamId)
}

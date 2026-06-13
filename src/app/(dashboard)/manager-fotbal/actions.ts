"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function createMatch(data: {
    teamHomeId: string
    teamAwayId: string
    matchDate: string
    location: string
    competitionId: string
    scoreHome?: string
    scoreAway?: string
}) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "manager_fotbal") {
        throw new Error("Unauthorized")
    }

    await prisma.footballMatch.create({
        data: {
            teamHomeId: parseInt(data.teamHomeId),
            teamAwayId: parseInt(data.teamAwayId),
            matchDate: new Date(data.matchDate),
            location: data.location,
            competitionId: parseInt(data.competitionId),
            scoreHome: data.scoreHome ? parseInt(data.scoreHome) : null,
            scoreAway: data.scoreAway ? parseInt(data.scoreAway) : null,
        }
    })
    
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
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "manager_fotbal") {
        throw new Error("Unauthorized")
    }

    await prisma.footballMatch.update({
        where: { id },
        data: {
            teamHomeId: parseInt(data.teamHomeId),
            teamAwayId: parseInt(data.teamAwayId),
            matchDate: new Date(data.matchDate),
            location: data.location,
            competitionId: parseInt(data.competitionId),
            scoreHome: data.scoreHome !== undefined && data.scoreHome !== "" ? parseInt(data.scoreHome) : null,
            scoreAway: data.scoreAway !== undefined && data.scoreAway !== "" ? parseInt(data.scoreAway) : null,
        }
    })
    
    revalidatePath("/manager-fotbal")
}

export async function deleteMatch(id: number) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "manager_fotbal") {
        throw new Error("Unauthorized")
    }

    await prisma.footballMatch.delete({
        where: { id }
    })
    
    revalidatePath("/manager-fotbal")
}

export async function createTeam(data: {
    name: string
    country: string
    continent: string
}) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "manager_fotbal") {
        throw new Error("Unauthorized")
    }

    await prisma.team.create({
        data: {
            name: data.name,
            sport: "fotbal",
            country: data.country,
            continent: data.continent
        }
    })
    
    revalidatePath("/manager-fotbal")
}

export async function updateTeam(id: number, data: {
    name: string
    country: string
    continent: string
}) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "manager_fotbal") {
        throw new Error("Unauthorized")
    }

    await prisma.team.update({
        where: { id },
        data: {
            name: data.name,
            country: data.country,
            continent: data.continent
        }
    })
    
    revalidatePath("/manager-fotbal")
}

export async function deleteTeam(id: number) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "manager_fotbal") {
        throw new Error("Unauthorized")
    }

    await prisma.team.delete({
        where: { id }
    })
    
    revalidatePath("/manager-fotbal")
}

export async function assignPlayerToTeam(userId: number, teamId: string | null) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "manager_fotbal") {
        throw new Error("Unauthorized")
    }

    const tId = teamId ? parseInt(teamId) : null;

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
    
    revalidatePath("/manager-fotbal")
}

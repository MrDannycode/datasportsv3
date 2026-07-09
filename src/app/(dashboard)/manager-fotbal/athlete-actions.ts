"use server"

import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import type { Position, PreferredFoot } from "@prisma/client"
import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

const POSITIONS = new Set<Position>(["portar", "fundas", "mijlocas", "atacant"])
const PREFERRED_FEET = new Set<PreferredFoot>(["stanga", "dreapta", "ambele"])

export type AthleteInviteInput = {
    email: string
    firstName: string
    lastName: string
    position: string
    preferredFoot: string
    teamId?: string | null
    jerseyNumber?: string | number | null
}

export type AthleteInviteResult = {
    row?: number
    email: string
    success: boolean
    temporaryPassword?: string
    error?: string
}

async function requireFootballManagerAssignment() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "manager_fotbal") {
        throw new Error("Nu ai permisiunea de a administra atleti.")
    }

    const assignment = await prisma.managerAssignment.findUnique({
        where: { userId: Number(session.user.id) },
        select: { country: true, continent: true },
    })

    if (!assignment?.country || !assignment.continent) {
        throw new Error("Managerul nu are o tara si un continent asignata.")
    }

    return { session, assignment }
}

function normalizeInvite(data: AthleteInviteInput) {
    const email = data.email.trim().toLowerCase()
    const firstName = data.firstName.trim()
    const lastName = data.lastName.trim()
    const position = data.position.trim().toLowerCase() as Position
    const preferredFoot = data.preferredFoot.trim().toLowerCase() as PreferredFoot
    const teamId = data.teamId ? Number(data.teamId) : null
    const jerseyNumber = data.jerseyNumber === "" || data.jerseyNumber == null ? null : Number(data.jerseyNumber)

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Adresa de email nu este valida.")
    if (!firstName || !lastName) throw new Error("Prenumele si numele sunt obligatorii.")
    if (!POSITIONS.has(position)) throw new Error("Pozitia nu este valida.")
    if (!PREFERRED_FEET.has(preferredFoot)) throw new Error("Piciorul preferat nu este valid.")
    if (teamId !== null && (!Number.isInteger(teamId) || teamId <= 0)) throw new Error("Echipa nu este valida.")
    if (jerseyNumber !== null && (!Number.isInteger(jerseyNumber) || jerseyNumber < 1 || jerseyNumber > 99)) {
        throw new Error("Numarul de tricou trebuie sa fie intre 1 si 99.")
    }

    return { email, firstName, lastName, position, preferredFoot, teamId, jerseyNumber }
}

async function createAthlete(data: AthleteInviteInput, createdByUserId: string | number, assignment: { country: string; continent: string }): Promise<AthleteInviteResult> {
    const athlete = normalizeInvite(data)
    if (await prisma.user.findUnique({ where: { email: athlete.email }, select: { id: true } })) {
        return { email: athlete.email, success: false, error: "Email-ul este deja inregistrat." }
    }

    if (athlete.teamId !== null) {
        const team = await prisma.team.findFirst({
            where: {
                id: athlete.teamId,
                sport: "fotbal",
                country: assignment.country,
            },
            select: { id: true },
        })
        if (!team) return { email: athlete.email, success: false, error: "Echipa nu exista in tara managerului." }
    }

    const temporaryPassword = `Ds!${randomBytes(6).toString("base64url")}`
    const user = await prisma.user.create({
        data: {
            email: athlete.email,
            passwordHash: await bcrypt.hash(temporaryPassword, 10),
            role: "atlet_fotbal",
            profile: { create: { firstName: athlete.firstName, lastName: athlete.lastName, teamId: athlete.teamId } },
            footballAthlete: { create: { position: athlete.position, preferredFoot: athlete.preferredFoot, jerseyNumber: athlete.jerseyNumber } },
        },
    })

    await logAudit({
        userId: createdByUserId,
        action: "create",
        tableAffected: "users",
        recordId: user.id,
        details: { email: user.email, role: user.role, source: "athlete_invite" },
    })

    return { email: athlete.email, success: true, temporaryPassword }
}

export type FootballPlayerUpdateInput = {
    firstName: string
    lastName: string
    position: string
    teamId?: string | null
}

async function requireManagedFootballPlayer(userId: number, assignedCountry: string) {
    const player = await prisma.user.findFirst({
        where: { id: userId, role: "atlet_fotbal" },
        select: {
            id: true,
            email: true,
            profile: { select: { id: true, firstName: true, lastName: true, teamId: true, team: { select: { id: true, country: true, sport: true } } } },
            footballAthlete: { select: { id: true, position: true } },
        },
    })

    if (!player?.profile || !player.footballAthlete) {
        throw new Error("Jucatorul selectat nu exista.")
    }

    const profile = player.profile
    const footballAthlete = player.footballAthlete
    const team = profile.team
    if (!team || team.country !== assignedCountry || team.sport !== "fotbal") {
        throw new Error("Poti administra doar jucatori din tara la care ai fost asignat.")
    }

    return { ...player, profile, footballAthlete }
}

function normalizePlayerUpdate(data: FootballPlayerUpdateInput) {
    const firstName = data.firstName.trim()
    const lastName = data.lastName.trim()
    const position = data.position.trim().toLowerCase() as Position
    const teamId = data.teamId ? Number(data.teamId) : null

    if (!firstName || !lastName) throw new Error("Prenumele si numele sunt obligatorii.")
    if (!POSITIONS.has(position)) throw new Error("Pozitia nu este valida.")
    if (teamId !== null && (!Number.isInteger(teamId) || teamId <= 0)) throw new Error("Echipa nu este valida.")

    return { firstName, lastName, position, teamId }
}

export async function updateFootballPlayer(userId: number, data: FootballPlayerUpdateInput) {
    const { session, assignment } = await requireFootballManagerAssignment()
    const player = await requireManagedFootballPlayer(userId, assignment.country)
    const update = normalizePlayerUpdate(data)

    if (update.teamId !== null) {
        const team = await prisma.team.findFirst({
            where: { id: update.teamId, sport: "fotbal", country: assignment.country },
            select: { id: true },
        })

        if (!team) throw new Error("Echipa selectata nu exista in tara managerului.")
    }

    await prisma.$transaction([
        prisma.profile.update({
            where: { id: player.profile.id },
            data: { firstName: update.firstName, lastName: update.lastName, teamId: update.teamId },
        }),
        prisma.footballAthlete.update({
            where: { id: player.footballAthlete.id },
            data: { position: update.position },
        }),
    ])

    await logAudit({
        userId: session.user.id,
        action: "update",
        tableAffected: "users",
        recordId: player.id,
        details: { email: player.email, role: "atlet_fotbal", source: "player_management", teamId: update.teamId, position: update.position },
    })

    revalidatePath("/manager-fotbal")
    revalidatePath("/manager-fotbal/invitatii")
}

export async function deleteFootballPlayer(userId: number) {
    const { session, assignment } = await requireFootballManagerAssignment()
    const player = await requireManagedFootballPlayer(userId, assignment.country)

    try {
        await prisma.$transaction([
            prisma.profile.delete({ where: { id: player.profile.id } }),
            prisma.footballAthlete.delete({ where: { id: player.footballAthlete.id } }),
            prisma.user.delete({ where: { id: player.id } }),
        ])
    } catch {
        throw new Error("Jucatorul nu poate fi sters deoarece are date asociate in sistem.")
    }

    await logAudit({
        userId: session.user.id,
        action: "delete",
        tableAffected: "users",
        recordId: player.id,
        details: { email: player.email, role: "atlet_fotbal", source: "player_management" },
    })

    revalidatePath("/manager-fotbal")
    revalidatePath("/manager-fotbal/invitatii")
}
export async function inviteAthlete(data: AthleteInviteInput): Promise<AthleteInviteResult> {
    const { session, assignment } = await requireFootballManagerAssignment()
    try {
        const result = await createAthlete(data, session.user.id, assignment)
        if (result.success) revalidatePath("/manager-fotbal")
        return result
    } catch (error) {
        return { email: data.email.trim().toLowerCase(), success: false, error: error instanceof Error ? error.message : "Invitatia nu a putut fi creata." }
    }
}

export async function importAthletes(rows: AthleteInviteInput[]) {
    const { session, assignment } = await requireFootballManagerAssignment()
    if (!Array.isArray(rows) || rows.length === 0) return { results: [] as AthleteInviteResult[] }
    if (rows.length > 250) throw new Error("Un import poate contine maximum 250 de atleti.")

    const results: AthleteInviteResult[] = []
    for (const [index, row] of rows.entries()) {
        try {
            results.push({ ...await createAthlete(row, session.user.id, assignment), row: index + 2 })
        } catch (error) {
            results.push({ row: index + 2, email: row.email?.trim().toLowerCase() || "", success: false, error: error instanceof Error ? error.message : "Randul nu a putut fi importat." })
        }
    }

    if (results.some(result => result.success)) revalidatePath("/manager-fotbal")
    return { results }
}


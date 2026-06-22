"use server"

import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import type { Position, PreferredFoot } from "@prisma/client"
import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

async function requireFootballManager() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "manager_fotbal") {
        throw new Error("Nu ai permisiunea de a administra atleți.")
    }
}

function normalizeInvite(data: AthleteInviteInput) {
    const email = data.email.trim().toLowerCase()
    const firstName = data.firstName.trim()
    const lastName = data.lastName.trim()
    const position = data.position.trim().toLowerCase() as Position
    const preferredFoot = data.preferredFoot.trim().toLowerCase() as PreferredFoot
    const teamId = data.teamId ? Number(data.teamId) : null
    const jerseyNumber = data.jerseyNumber === "" || data.jerseyNumber == null ? null : Number(data.jerseyNumber)

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Adresa de email nu este validă.")
    if (!firstName || !lastName) throw new Error("Prenumele și numele sunt obligatorii.")
    if (!POSITIONS.has(position)) throw new Error("Poziția nu este validă.")
    if (!PREFERRED_FEET.has(preferredFoot)) throw new Error("Piciorul preferat nu este valid.")
    if (teamId !== null && (!Number.isInteger(teamId) || teamId <= 0)) throw new Error("Echipa nu este validă.")
    if (jerseyNumber !== null && (!Number.isInteger(jerseyNumber) || jerseyNumber < 1 || jerseyNumber > 99)) {
        throw new Error("Numărul de tricou trebuie să fie între 1 și 99.")
    }
    return { email, firstName, lastName, position, preferredFoot, teamId, jerseyNumber }
}

async function createAthlete(data: AthleteInviteInput): Promise<AthleteInviteResult> {
    const athlete = normalizeInvite(data)
    if (await prisma.user.findUnique({ where: { email: athlete.email }, select: { id: true } })) {
        return { email: athlete.email, success: false, error: "Email-ul este deja înregistrat." }
    }
    if (athlete.teamId !== null) {
        const team = await prisma.team.findFirst({ where: { id: athlete.teamId, sport: "fotbal" }, select: { id: true } })
        if (!team) return { email: athlete.email, success: false, error: "Echipa nu există sau nu este de fotbal." }
    }

    const temporaryPassword = `Ds!${randomBytes(6).toString("base64url")}`
    await prisma.user.create({
        data: {
            email: athlete.email,
            passwordHash: await bcrypt.hash(temporaryPassword, 10),
            role: "atlet_fotbal",
            profile: { create: { firstName: athlete.firstName, lastName: athlete.lastName, teamId: athlete.teamId } },
            footballAthlete: { create: { position: athlete.position, preferredFoot: athlete.preferredFoot, jerseyNumber: athlete.jerseyNumber } },
        },
    })
    return { email: athlete.email, success: true, temporaryPassword }
}

export async function inviteAthlete(data: AthleteInviteInput): Promise<AthleteInviteResult> {
    await requireFootballManager()
    try {
        const result = await createAthlete(data)
        if (result.success) revalidatePath("/manager-fotbal")
        return result
    } catch (error) {
        return { email: data.email.trim().toLowerCase(), success: false, error: error instanceof Error ? error.message : "Invitația nu a putut fi creată." }
    }
}

export async function importAthletes(rows: AthleteInviteInput[]) {
    await requireFootballManager()
    if (!Array.isArray(rows) || rows.length === 0) return { results: [] as AthleteInviteResult[] }
    if (rows.length > 250) throw new Error("Un import poate conține maximum 250 de atleți.")

    const results: AthleteInviteResult[] = []
    for (const [index, row] of rows.entries()) {
        try {
            results.push({ ...await createAthlete(row), row: index + 2 })
        } catch (error) {
            results.push({ row: index + 2, email: row.email?.trim().toLowerCase() || "", success: false, error: error instanceof Error ? error.message : "Rândul nu a putut fi importat." })
        }
    }
    if (results.some(result => result.success)) revalidatePath("/manager-fotbal")
    return { results }
}

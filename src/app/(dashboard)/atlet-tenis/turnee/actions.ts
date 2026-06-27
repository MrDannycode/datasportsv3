"use server"

import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function registerForTournament(tournamentId: number) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "atlet_tenis") {
        return { ok: false, message: "Nu esti autentificat ca atlet de tenis." }
    }

    const parsedTournamentId = Number(tournamentId)
    if (!Number.isInteger(parsedTournamentId) || parsedTournamentId <= 0) {
        return { ok: false, message: "Turneul selectat nu este valid." }
    }

    const athlete = await prisma.tennisAthlete.findUnique({
        where: { userId: Number(session.user.id) },
        select: { id: true },
    })

    if (!athlete) {
        return { ok: false, message: "Completeaza mai intai Profilul meu pentru tenis." }
    }

    const tournament = await prisma.tournament.findUnique({
        where: { id: parsedTournamentId },
        select: { id: true, startDate: true },
    })

    if (!tournament) {
        return { ok: false, message: "Turneul nu mai exista." }
    }

    if (tournament.startDate < new Date()) {
        return { ok: false, message: "Nu te poti inscrie la un turneu inceput deja." }
    }

    await prisma.tournamentRegistration.upsert({
        where: {
            tournamentId_athleteId: {
                tournamentId: tournament.id,
                athleteId: athlete.id,
            },
        },
        update: { status: "inscris" },
        create: {
            tournamentId: tournament.id,
            athleteId: athlete.id,
            status: "inscris",
        },
    })

    revalidatePath("/atlet-tenis/turnee")

    return { ok: true, message: "Te-ai inscris la turneu." }
}

export async function withdrawFromTournament(tournamentId: number) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "atlet_tenis") {
        return { ok: false, message: "Nu esti autentificat ca atlet de tenis." }
    }

    const parsedTournamentId = Number(tournamentId)
    if (!Number.isInteger(parsedTournamentId) || parsedTournamentId <= 0) {
        return { ok: false, message: "Turneul selectat nu este valid." }
    }

    const athlete = await prisma.tennisAthlete.findUnique({
        where: { userId: Number(session.user.id) },
        select: { id: true },
    })

    if (!athlete) {
        return { ok: false, message: "Completeaza mai intai Profilul meu pentru tenis." }
    }

    const registration = await prisma.tournamentRegistration.findUnique({
        where: {
            tournamentId_athleteId: {
                tournamentId: parsedTournamentId,
                athleteId: athlete.id,
            },
        },
        select: { id: true },
    })

    if (!registration) {
        return { ok: false, message: "Nu esti inscris la acest turneu." }
    }

    await prisma.tournamentRegistration.update({
        where: { id: registration.id },
        data: { status: "retras" },
    })

    revalidatePath("/atlet-tenis/turnee")
    revalidatePath("/atlet-tenis/turnee/inscrieri")

    return { ok: true, message: "Te-ai retras de la turneu." }
}

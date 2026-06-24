"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

type CompetitionPayload = {
    name: string
    sport: "fotbal" | "tenis"
    startDate?: string
    endDate?: string
}

function parseCompetitionDates(data: CompetitionPayload) {
    const hasStartDate = Boolean(data.startDate)
    const hasEndDate = Boolean(data.endDate)

    if (hasStartDate && !hasEndDate) {
        throw new Error("Completeaza atat data de inceput, cat si data de final.")
    }

    if (!hasStartDate && hasEndDate) {
        throw new Error("Completeaza atat data de inceput, cat si data de final.")
    }

    if (!hasStartDate || !hasEndDate) {
        return { startDate: null, endDate: null }
    }

    const startDate = new Date(`${data.startDate}T00:00:00`)
    const endDate = new Date(`${data.endDate}T00:00:00`)

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        throw new Error("Datele calendarului nu sunt valide.")
    }

    if (startDate > endDate) {
        throw new Error("Data de inceput trebuie sa fie inainte de data de final.")
    }

    return { startDate, endDate }
}

export async function createCompetition(data: CompetitionPayload) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin_global") {
        throw new Error("Unauthorized")
    }

    if (!data.name || !data.sport) {
        throw new Error("Numele si sportul sunt obligatorii.")
    }

    const { startDate, endDate } = parseCompetitionDates(data)

    try {
        const comp = await prisma.competition.create({
            data: {
                name: data.name,
                sport: data.sport,
                startDate,
                endDate,
            }
        })

        await prisma.auditLog.create({
            data: {
                userId: Number(session.user.id),
                action: "create",
                tableAffected: "competitions",
                recordId: comp.id,
                details: { name: comp.name, sport: comp.sport, startDate: comp.startDate, endDate: comp.endDate },
            },
        })

        revalidatePath("/admin/competitions")
        revalidatePath("/admin/audituri")
        return { competition: comp }
    } catch (e: unknown) {
        if (typeof e === "object" && e !== null && "code" in e && e.code === "P2002") {
            throw new Error("O competitie cu acest nume exista deja.")
        }
        throw e
    }
}

export async function updateCompetition(id: number, data: CompetitionPayload) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin_global") {
        throw new Error("Unauthorized")
    }

    if (!data.name || !data.sport) {
        throw new Error("Numele si sportul sunt obligatorii.")
    }

    const { startDate, endDate } = parseCompetitionDates(data)

    try {
        const competition = await prisma.competition.update({
            where: { id },
            data: {
                name: data.name,
                sport: data.sport,
                startDate,
                endDate,
            },
        })

        await prisma.auditLog.create({
            data: {
                userId: Number(session.user.id),
                action: "update",
                tableAffected: "competitions",
                recordId: competition.id,
                details: { name: competition.name, sport: competition.sport, startDate: competition.startDate, endDate: competition.endDate },
            },
        })

        revalidatePath("/admin/competitions")
        revalidatePath("/admin/audituri")
        return { competition }
    } catch (e: unknown) {
        if (typeof e === "object" && e !== null && "code" in e && e.code === "P2025") {
            throw new Error("Competitia nu a fost gasita.")
        }
        throw e
    }
}

export async function deleteCompetition(id: number) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin_global") {
        throw new Error("Unauthorized")
    }

    try {
        const deletedCompetition = await prisma.competition.delete({
            where: { id }
        })

        await prisma.auditLog.create({
            data: {
                userId: Number(session.user.id),
                action: "delete",
                tableAffected: "competitions",
                recordId: deletedCompetition.id,
                details: { name: deletedCompetition.name, sport: deletedCompetition.sport, startDate: deletedCompetition.startDate, endDate: deletedCompetition.endDate },
            },
        })

        revalidatePath("/admin/competitions")
        revalidatePath("/admin/audituri")
    } catch (e: unknown) {
        if (typeof e === "object" && e !== null && "code" in e && e.code === "P2003") {
            throw new Error("Nu se poate sterge competitia pentru ca exista meciuri asociate.")
        }
        throw e
    }
}

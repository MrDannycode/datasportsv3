"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function createCompetition(data: { name: string, sport: "fotbal" | "tenis" }) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin_global") {
        throw new Error("Unauthorized")
    }

    if (!data.name || !data.sport) {
        throw new Error("Numele și sportul sunt obligatorii.")
    }

    try {
        const comp = await prisma.competition.create({
            data: {
                name: data.name,
                sport: data.sport,
            }
        })

        await prisma.auditLog.create({
            data: {
                userId: Number(session.user.id),
                action: "create",
                tableAffected: "competitions",
                recordId: comp.id,
                details: { name: comp.name, sport: comp.sport },
            },
        })

        revalidatePath("/admin/competitions")
        revalidatePath("/admin/audituri")
        return { competition: comp }
    } catch (e: unknown) {
        if (typeof e === "object" && e !== null && "code" in e && e.code === 'P2002') {
            throw new Error("O competiție cu acest nume există deja.")
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
                details: { name: deletedCompetition.name, sport: deletedCompetition.sport },
            },
        })

        revalidatePath("/admin/competitions")
        revalidatePath("/admin/audituri")
    } catch (e: unknown) {
        if (typeof e === "object" && e !== null && "code" in e && e.code === 'P2003') {
            throw new Error("Nu se poate șterge competiția pentru că există meciuri asociate.")
        }
        throw e
    }
}

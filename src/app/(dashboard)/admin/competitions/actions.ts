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
        await prisma.competition.create({
            data: {
                name: data.name,
                sport: data.sport,
            }
        })
        revalidatePath("/admin/competitions")
    } catch (e: any) {
        if (e.code === 'P2002') {
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
        await prisma.competition.delete({
            where: { id }
        })
        revalidatePath("/admin/competitions")
    } catch (e: any) {
        if (e.code === 'P2003') {
            throw new Error("Nu se poate șterge competiția pentru că există meciuri asociate.")
        }
        throw e
    }
}

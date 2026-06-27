"use server"

import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isValidManagerLocation } from "@/lib/manager-locations"

export async function assignFootballManagerLocation(data: {
    managerId: number
    country: string
    continent: string
}) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin_global") {
        return { error: "Unauthorized" }
    }

    const managerId = Number(data.managerId)
    const country = data.country.trim()
    const continent = data.continent.trim()

    if (!Number.isInteger(managerId) || managerId <= 0) {
        return { error: "Manager invalid." }
    }

    if (!country || !continent) {
        return { error: "Selecteaza tara si continent pentru manager." }
    }

    if (!isValidManagerLocation(country, continent)) {
        return { error: "Selecteaza o tara si un continent valide." }
    }

    const manager = await prisma.user.findFirst({
        where: { id: managerId, role: "manager_fotbal" },
        select: { id: true, email: true },
    })

    if (!manager) {
        return { error: "Managerul de fotbal nu exista." }
    }

    const assignment = await prisma.managerAssignment.upsert({
        where: { userId: manager.id },
        update: { country, continent },
        create: { userId: manager.id, country, continent },
        select: { id: true, country: true, continent: true },
    })

    await prisma.auditLog.create({
        data: {
            userId: Number(session.user.id),
            action: "update",
            tableAffected: "manager_assignments",
            recordId: assignment.id,
            details: {
                targetUserId: manager.id,
                email: manager.email,
                role: "manager_fotbal",
                country: assignment.country,
                continent: assignment.continent,
            },
        },
    })

    revalidatePath("/admin/manageri")
    revalidatePath("/admin/users")
    revalidatePath("/admin/audituri")

    return {
        manager: {
            id: manager.id,
            country: assignment.country,
            continent: assignment.continent,
        },
    }
}

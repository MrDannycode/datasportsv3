"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function createUser(data: { email: string; password: string; role: string }) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin_global") {
        return { error: "Unauthorized" }
    }

    const { email, password, role } = data
    const adminUserId = Number(session.user.id)

    if (!email || !password || !role) {
        return { error: "Email, parolă și rol sunt obligatorii" }
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
        return { error: "Email-ul este deja înregistrat" }
    }

    if (!Object.values(Role).includes(role as Role)) {
        return { error: "Rol invalid" }
    }

    const parsedRole = role as Role
    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
        data: { email, passwordHash, role: parsedRole },
        select: { id: true, email: true, role: true, createdAt: true },
    })

    await prisma.auditLog.create({
        data: {
            userId: adminUserId,
            action: "create",
            tableAffected: "users",
            recordId: user.id,
            details: { email: user.email, role: user.role },
        },
    })

    revalidatePath("/admin/users")
    revalidatePath("/admin/audituri")
    return { user }
}

export async function deleteUser(id: number) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin_global") {
        return { error: "Unauthorized" }
    }

    if (String(id) === session.user.id) {
        return { error: "Nu te poți șterge pe tine însuți" }
    }

    try {
        const deletedUser = await prisma.user.delete({
            where: { id },
            select: { id: true, email: true, role: true },
        })

        await prisma.auditLog.create({
            data: {
                userId: Number(session.user.id),
                action: "delete",
                tableAffected: "users",
                recordId: deletedUser.id,
                details: { email: deletedUser.email, role: deletedUser.role },
            },
        })

        revalidatePath("/admin/users")
        revalidatePath("/admin/audituri")
        return { success: true }
    } catch {
        return { error: "Utilizatorul nu a fost găsit sau a apărut o eroare" }
    }
}

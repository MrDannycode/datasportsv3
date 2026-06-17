"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function createUser(data: { email: string; password: string; role: string }) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin_global") {
        return { error: "Unauthorized" }
    }

    const { email, password, role } = data

    if (!email || !password || !role) {
        return { error: "Email, parolă și rol sunt obligatorii" }
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
        return { error: "Email-ul este deja înregistrat" }
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
        data: { email, passwordHash, role },
        select: { id: true, email: true, role: true, createdAt: true },
    })

    revalidatePath("/admin/users")
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
        await prisma.user.delete({ where: { id } })
        revalidatePath("/admin/users")
        return { success: true }
    } catch {
        return { error: "Utilizatorul nu a fost găsit sau a apărut o eroare" }
    }
}

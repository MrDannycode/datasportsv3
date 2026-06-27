"use server"

import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export type AccountSettingsResult =
    | { success: true; email: string }
    | { success: false; error: string }

function getValue(formData: FormData, key: string) {
    const value = formData.get(key)
    return typeof value === "string" ? value.trim() : ""
}

export async function updateAccountSettings(formData: FormData): Promise<AccountSettingsResult> {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return { success: false, error: "Neautorizat" }
    }

    const userId = Number(session.user.id)
    const firstName = getValue(formData, "firstName")
    const lastName = getValue(formData, "lastName")
    const email = getValue(formData, "email").toLowerCase()
    const phone = getValue(formData, "phone")
    const newPassword = getValue(formData, "newPassword")
    const confirmPassword = getValue(formData, "confirmPassword")

    if (!firstName || !lastName || !email) {
        return { success: false, error: "Nume, prenume si email sunt obligatorii" }
    }

    if (!email.includes("@")) {
        return { success: false, error: "Email invalid" }
    }

    if (newPassword || confirmPassword) {
        if (newPassword.length < 6) {
            return { success: false, error: "Parola noua trebuie sa aiba minim 6 caractere" }
        }

        if (newPassword !== confirmPassword) {
            return { success: false, error: "Parolele nu coincid" }
        }
    }

    const existingEmail = await prisma.user.findFirst({
        where: {
            email,
            NOT: { id: userId },
        },
        select: { id: true },
    })

    if (existingEmail) {
        return { success: false, error: "Email-ul este deja inregistrat" }
    }

    const updateData: { email: string; passwordHash?: string } = { email }
    if (newPassword) {
        updateData.passwordHash = await bcrypt.hash(newPassword, 10)
    }

    try {
        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: updateData,
            })

            await tx.profile.upsert({
                where: { userId },
                update: {
                    firstName,
                    lastName,
                    phone: phone || null,
                },
                create: {
                    userId,
                    firstName,
                    lastName,
                    phone: phone || null,
                },
            })

            await tx.auditLog.create({
                data: {
                    userId,
                    action: "update",
                    tableAffected: "users",
                    recordId: userId,
                    details: { email, profileUpdated: true, passwordChanged: Boolean(newPassword) },
                },
            })
        })

        revalidatePath("/")
        return { success: true, email }
    } catch (error) {
        console.error("Eroare update account settings:", error)
        return { success: false, error: "A aparut o eroare la salvarea contului" }
    }
}

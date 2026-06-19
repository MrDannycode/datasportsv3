"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

type PlanType = "forta" | "rezistenta" | "vitezare" | "flexibilitate" | "coordonare"


interface PlanPayload {
    title: string
    description: string
    type: PlanType
    date: string // YYYY-MM-DD
}

// ── Creare plan ────────────────────────────────────────────────────────────────
export async function createPlan(payload: PlanPayload) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "antrenor_fitness") {
        redirect("/login")
    }

    const { title, description, type, date } = payload

    if (!title?.trim()) {
        return { error: "Titlul este obligatoriu." }
    }

    const plan = await prisma.fitnessPlan.create({
        data: {
            title: title.trim(),
            description: description?.trim() || null,
            type,
            date: new Date(date),
            createdBy: Number(session.user.id),
        },
    })

    revalidatePath("/antrenor-fitness/trainfit")
    return { plan }
}

// ── Actualizare plan ───────────────────────────────────────────────────────────
export async function updatePlan(id: number, payload: PlanPayload) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "antrenor_fitness") {
        redirect("/login")
    }

    const existing = await prisma.fitnessPlan.findUnique({ where: { id } })

    if (!existing) {
        return { error: "Planul nu există." }
    }

    if (existing.createdBy !== Number(session.user.id)) {
        return { error: "Nu ai permisiunea să modifici acest plan." }
    }

    const { title, description, type, date } = payload

    if (!title?.trim()) {
        return { error: "Titlul este obligatoriu." }
    }

    const plan = await prisma.fitnessPlan.update({
        where: { id },
        data: {
            title: title.trim(),
            description: description?.trim() || null,
            type,
            date: new Date(date),
        },
    })

    revalidatePath("/antrenor-fitness/trainfit")
    return { plan }
}

// ── Ștergere plan ──────────────────────────────────────────────────────────────
export async function deletePlan(id: number) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "antrenor_fitness") {
        redirect("/login")
    }

    const existing = await prisma.fitnessPlan.findUnique({ where: { id } })

    if (!existing) {
        return { error: "Planul nu există." }
    }

    if (existing.createdBy !== Number(session.user.id)) {
        return { error: "Nu ai permisiunea să ștergi acest plan." }
    }

    await prisma.fitnessPlan.delete({ where: { id } })

    revalidatePath("/antrenor-fitness/trainfit")
    return { success: true }
}

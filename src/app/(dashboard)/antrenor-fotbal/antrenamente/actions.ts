"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

type PlanType = "tehnic" | "fizic" | "tactic"

interface PlanPayload {
    teamId: number
    title: string
    description: string
    type: PlanType
    date: string // YYYY-MM-DD
}

// ── Creare plan ────────────────────────────────────────────────────────────────
export async function createPlan(payload: PlanPayload) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "antrenor_fotbal") {
        redirect("/login")
    }

    const { teamId, title, description, type, date } = payload

    if (!title?.trim()) {
        return { error: "Titlul este obligatoriu." }
    }

    const plan = await prisma.trainingPlan.create({
        data: {
            teamId,
            title: title.trim(),
            description: description?.trim() || null,
            type,
            date: new Date(date),
            createdBy: Number(session.user.id),
        },
    })

    revalidatePath("/antrenor-fotbal/antrenamente")
    return { plan }
}

// ── Actualizare plan ───────────────────────────────────────────────────────────
export async function updatePlan(id: number, payload: PlanPayload) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "antrenor_fotbal") {
        redirect("/login")
    }

    const existing = await prisma.trainingPlan.findUnique({ where: { id } })

    if (!existing) {
        return { error: "Planul nu există." }
    }

    if (existing.createdBy !== Number(session.user.id)) {
        return { error: "Nu ai permisiunea să modifici acest plan." }
    }

    const { teamId, title, description, type, date } = payload

    if (!title?.trim()) {
        return { error: "Titlul este obligatoriu." }
    }

    const plan = await prisma.trainingPlan.update({
        where: { id },
        data: {
            teamId,
            title: title.trim(),
            description: description?.trim() || null,
            type,
            date: new Date(date),
        },
    })

    revalidatePath("/antrenor-fotbal/antrenamente")
    return { plan }
}

// ── Ștergere plan ──────────────────────────────────────────────────────────────
export async function deletePlan(id: number) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "antrenor_fotbal") {
        redirect("/login")
    }

    const existing = await prisma.trainingPlan.findUnique({ where: { id } })

    if (!existing) {
        return { error: "Planul nu există." }
    }

    if (existing.createdBy !== Number(session.user.id)) {
        return { error: "Nu ai permisiunea să ștergi acest plan." }
    }

    await prisma.trainingPlan.delete({ where: { id } })

    revalidatePath("/antrenor-fotbal/antrenamente")
    return { success: true }
}

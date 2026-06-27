"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { logAudit } from "@/lib/audit"

type PlanType = "tehnic" | "fizic" | "tactic"

interface PlanPayload {
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

    const { title, description, type, date } = payload

    if (!title?.trim()) {
        return { error: "Titlul este obligatoriu." }
    }

    const plan = await prisma.trainingPlan.create({
        data: {
            title: title.trim(),
            description: description?.trim() || null,
            type,
            date: new Date(date),
            createdBy: Number(session.user.id),
        },
    })

    await logAudit({ userId: session.user.id, action: "create", tableAffected: "training_plans", recordId: plan.id, details: { title: plan.title, type: plan.type, date: plan.date.toISOString() } })

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

    const { title, description, type, date } = payload

    if (!title?.trim()) {
        return { error: "Titlul este obligatoriu." }
    }

    const plan = await prisma.trainingPlan.update({
        where: { id },
        data: {
            title: title.trim(),
            description: description?.trim() || null,
            type,
            date: new Date(date),
        },
    })

    await logAudit({ userId: session.user.id, action: "update", tableAffected: "training_plans", recordId: plan.id, details: { title: plan.title, type: plan.type, date: plan.date.toISOString() } })

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

    await logAudit({ userId: session.user.id, action: "delete", tableAffected: "training_plans", recordId: existing.id, details: { title: existing.title, type: existing.type, date: existing.date.toISOString() } })

    revalidatePath("/antrenor-fotbal/antrenamente")
    return { success: true }
}

import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

// PUT /api/antrenor-fotbal/antrenamente/[id] — actualizează un plan
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token || token.role !== "antrenor_fotbal") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const planId = Number(params.id)
    const existing = await prisma.trainingPlan.findUnique({ where: { id: planId } })

    if (!existing) {
        return NextResponse.json({ error: "Plan negăsit" }, { status: 404 })
    }

    if (existing.createdBy !== Number(token.id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, type, date } = body

    const updated = await prisma.trainingPlan.update({
        where: { id: planId },
        data: {
            title: title ?? undefined,
            description: description ?? null,
            type: type ?? undefined,
            date: date ? new Date(date) : undefined,
        },
    })

    return NextResponse.json(updated)
}

// DELETE /api/antrenor-fotbal/antrenamente/[id] — șterge un plan
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token || token.role !== "antrenor_fotbal") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const planId = Number(params.id)
    const existing = await prisma.trainingPlan.findUnique({ where: { id: planId } })

    if (!existing) {
        return NextResponse.json({ error: "Plan negăsit" }, { status: 404 })
    }

    if (existing.createdBy !== Number(token.id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.trainingPlan.delete({ where: { id: planId } })

    return NextResponse.json({ success: true })
}

// GET /api/antrenor-fotbal/antrenamente/[id] — detalii plan
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token || token.role !== "antrenor_fotbal") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const planId = Number(params.id)
    const plan = await prisma.trainingPlan.findUnique({
        where: { id: planId },
        include: {
            fitnessSessions: {
                include: {
                    athlete: {
                        include: {
                            user: {
                                select: {
                                    profile: { select: { firstName: true, lastName: true } },
                                },
                            },
                        },
                    },
                },
                orderBy: { date: "desc" },
            },
        },
    })

    if (!plan) {
        return NextResponse.json({ error: "Plan negăsit" }, { status: 404 })
    }

    if (plan.createdBy !== Number(token.id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(plan)
}

import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

// GET /api/antrenor-fotbal/antrenamente — lista planurilor de antrenament
export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token || token.role !== "antrenor_fotbal") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const plans = await prisma.trainingPlan.findMany({
        where: { createdBy: Number(token.id) },
        include: {
            team: { select: { id: true, name: true } },
            creator: {
                select: {
                    id: true,
                    email: true,
                    profile: { select: { firstName: true, lastName: true } },
                },
            },
        },
        orderBy: { date: "desc" },
    })

    return NextResponse.json(plans)
}

// POST /api/antrenor-fotbal/antrenamente — crează un plan de antrenament
export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token || token.role !== "antrenor_fotbal") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { teamId, title, description, type, date } = body

    if (!teamId || !title || !type || !date) {
        return NextResponse.json(
            { error: "teamId, title, type și date sunt obligatorii" },
            { status: 400 }
        )
    }

    const plan = await prisma.trainingPlan.create({
        data: {
            teamId: Number(teamId),
            createdBy: Number(token.id),
            title,
            description: description ?? null,
            type,
            date: new Date(date),
        },
        include: {
            team: { select: { id: true, name: true } },
        },
    })

    return NextResponse.json(plan, { status: 201 })
}

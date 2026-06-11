import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// GET /api/admin/users — list all users
export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token || token.role !== "admin_global") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const users = await prisma.user.findMany({
        select: { id: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(users)
}

// POST /api/admin/users — create a new user
export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token || token.role !== "admin_global") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { email, password, role } = body

    if (!email || !password || !role) {
        return NextResponse.json({ error: "Email, parolă și rol sunt obligatorii" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
        return NextResponse.json({ error: "Email-ul este deja înregistrat" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
        data: { email, passwordHash, role },
        select: { id: true, email: true, role: true, createdAt: true },
    })

    return NextResponse.json(user, { status: 201 })
}

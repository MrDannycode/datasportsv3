import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"
import { deleteUserAccount } from "@/lib/user-deletion"

// DELETE /api/admin/users/[id]
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token || token.role !== "admin_global") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const userId = parseInt(id)

    if (isNaN(userId)) {
        return NextResponse.json({ error: "ID invalid" }, { status: 400 })
    }

    // Prevent admin from deleting themselves
    if (String(userId) === token.id) {
        return NextResponse.json({ error: "Nu te poți șterge pe tine însuți" }, { status: 400 })
    }

    try {
        await prisma.$transaction(async (tx) => {
            const user = await deleteUserAccount(tx, userId)
            if (!user) throw new Error("Utilizatorul nu a fost gasit")
            return user
        })
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: "Utilizatorul nu poate fi sters deoarece are date asociate in sistem" }, { status: 409 })
    }
}

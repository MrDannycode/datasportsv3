import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import UsersManager from "./UsersManager"
import Link from "next/link"

interface AdminUsersPageProps {
    searchParams?: Promise<{ open?: string }>
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin_global") {
        redirect("/login")
    }

    const resolvedSearchParams = searchParams ? await searchParams : undefined

    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            profile: {
                select: {
                    team: {
                        select: { country: true, continent: true },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    })

    const usersWithLocation = users.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        country: user.profile?.team?.country ?? null,
        continent: user.profile?.team?.continent ?? null,
    }))

    return (
        <main>
            <div className="sd-page-title" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <Link href="/admin" style={{ color: "#0070f3", textDecoration: "none", fontSize: "14px", fontWeight: "bold" }}>
                    ← Inapoi la Dashboard
                </Link>
                <h1 style={{ margin: 0 }}>Gestionare Utilizatori</h1>
            </div>

            <UsersManager
                initialUsers={usersWithLocation}
                shouldOpenNewUserModal={resolvedSearchParams?.open === "new"}
            />
        </main>
    )
}
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import UsersManager from "./UsersManager"
import Link from "next/link"

interface AdminUsersPageProps {
    searchParams?: Promise<{ open?: string; role?: string }>
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
            managerAssignment: {
                select: { country: true, continent: true },
            },
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
        country: user.role === "manager_fotbal" ? user.managerAssignment?.country ?? null : user.profile?.team?.country ?? null,
        continent: user.role === "manager_fotbal" ? user.managerAssignment?.continent ?? null : user.profile?.team?.continent ?? null,
    }))

    return (
        <main>
            <div className="sd-box">
                <div className="sd-box-header">
                    <Link href="/admin" className="sd-btn-secondary sd-btn-back">Inapoi</Link>
                    <h2 className="flex-1 text-center">Gestionare Utilizatori</h2>
                    <div className="sd-btn-secondary sd-btn-back invisiblex">Inapoi</div>
                </div>
                
                <div className="sd-box-content">

                    <UsersManager
                        initialUsers={usersWithLocation}
                        shouldOpenNewUserModal={resolvedSearchParams?.open === "new"}
                        initialRoleFilter={resolvedSearchParams?.role}
                    />
                </div>
            </div>
        </main>
    )
}
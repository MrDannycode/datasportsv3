import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import AntrenorManager from "../AntrenorManager"

interface AntrenoriPageProps {
    searchParams?: Promise<{ open?: string }>
}

export default async function AntrenoriPage({ searchParams }: AntrenoriPageProps) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "manager_fotbal") {
        redirect("/login")
    }

    const resolvedSearchParams = searchParams ? await searchParams : undefined
    const managerAssignment = await prisma.managerAssignment.findUnique({
        where: { userId: Number(session.user.id) },
        select: { country: true, continent: true },
    })

    const [teams, users] = await Promise.all([
        prisma.team.findMany({
            where: managerAssignment
                ? { sport: "fotbal", country: managerAssignment.country }
                : { sport: "fotbal", id: -1 },
            select: { id: true, name: true, country: true, continent: true },
            orderBy: { name: "asc" },
        }),
        prisma.user.findMany({
            where: { role: { in: ["antrenor_fotbal", "antrenor_fitness", "medic"] } },
            include: { profile: { include: { team: true } } },
            orderBy: { email: "asc" },
        }),
    ])

    const antrenori = users.map((user) => ({
        id: user.id,
        firstName: user.profile?.firstName || user.email.split("@")[0],
        lastName: user.profile?.lastName || "",
        role: user.role,
        teamId: user.profile?.teamId || null,
        team: user.profile?.team || null,
        hasProfile: !!user.profile,
    }))

    return (
        <main>
            <div className="sd-box">
                <div className="sd-box-header">
                    <Link href="/manager-fotbal" className="sd-btn-secondary">Inapoi</Link>
                    <h2 className="flex-1 text-center">Gestionare Staff Fotbal</h2>
                    <div className="sd-btn-secondary invisible">Inapoi</div>
                </div>
                <div className="sd-box-content">
                    <AntrenorManager antrenori={antrenori} teams={teams} shouldOpenCoachModal={resolvedSearchParams?.open === "coaches"} />
                </div>
            </div>
        </main>
    )
}

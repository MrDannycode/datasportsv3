import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import AthleteInviteManager from "../AthleteInviteManager"
import PlayerManager from "../PlayerManager"

interface InvitatiiPageProps {
    searchParams?: Promise<{ open?: string }>
}

export default async function InvitatiiPage({ searchParams }: InvitatiiPageProps) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "manager_fotbal") {
        redirect("/login")
    }

    const resolvedSearchParams = searchParams ? await searchParams : undefined
    const managerAssignment = await prisma.managerAssignment.findUnique({
        where: { userId: Number(session.user.id) },
        select: { id: true, country: true, continent: true },
    })

    const teams = await prisma.team.findMany({
        where: managerAssignment
            ? { sport: "fotbal", country: managerAssignment.country }
            : { sport: "fotbal", id: -1 },
        select: { id: true, name: true, country: true, continent: true },
        orderBy: { name: "asc" },
    })

    const users = managerAssignment
        ? await prisma.user.findMany({
            where: {
                role: "atlet_fotbal",
                OR: [
                    {
                        profile: {
                            is: {
                                team: {
                                    is: { sport: "fotbal", country: managerAssignment.country },
                                },
                            },
                        },
                    },
                    { footballAthlete: { is: { managerAssignmentId: managerAssignment.id } } },
                ],
            },
            include: { profile: { include: { team: true } }, footballAthlete: true },
            orderBy: { email: "asc" },
        })
        : []

    const players = users.map((user) => ({
        id: user.id,
        firstName: user.profile?.firstName || user.email.split("@")[0],
        lastName: user.profile?.lastName || "",
        teamId: user.profile?.teamId || null,
        position: user.footballAthlete?.position || "mijlocas",
        team: user.profile?.team || null,
        hasProfile: !!user.profile,
    }))

    return (
        <main>
            <div className="sd-box">
                <div className="sd-box-header">
                    <Link href="/manager-fotbal" className="sd-btn-secondary sd-btn-back">Inapoi</Link>
                    <h2 className="flex-1 text-center">Gestionare Atleti Fotbal</h2>
                    <div className="sd-btn-secondary invisible">Inapoi</div>
                </div>
                <div className="sd-box-content">
                    <AthleteInviteManager shouldOpenInviteModal={resolvedSearchParams?.open === "new"} teams={teams} />
                    <PlayerManager key={players.map(player => player.id).join(",")} players={players} teams={teams} />
                </div>
            </div>
        </main>
    )
}


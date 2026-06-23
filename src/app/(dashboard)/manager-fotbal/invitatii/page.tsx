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

    const teams = await prisma.team.findMany({
        where: { sport: "fotbal" },
        select: { id: true, name: true, country: true, continent: true },
        orderBy: { name: "asc" },
    })

    const users = await prisma.user.findMany({
        where: { role: "atlet_fotbal" },
        include: { profile: { include: { team: true } } },
        orderBy: { email: "asc" },
    })

    const players = users.map((user) => ({
        id: user.id,
        firstName: user.profile?.firstName || user.email.split("@")[0],
        lastName: user.profile?.lastName || "",
        teamId: user.profile?.teamId || null,
        team: user.profile?.team || null,
        hasProfile: !!user.profile,
    }))

    return (
        <main>
            <div className="sd-page-title" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <Link href="/manager-fotbal" className="sd-btn-secondary">Inapoi</Link>
                <h1>Invitatii atleti fotbal</h1>
            </div>
            <div className="sd-panels" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <AthleteInviteManager teams={teams} shouldOpenInviteModal={resolvedSearchParams?.open === "new"} />
                <PlayerManager players={players} teams={teams} />
            </div>
        </main>
    )
}

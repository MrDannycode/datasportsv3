import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import MatchManager from "../MatchManager"

interface MeciuriPageProps {
    searchParams?: Promise<{ open?: string }>
}

export default async function MeciuriPage({ searchParams }: MeciuriPageProps) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "manager_fotbal") {
        redirect("/login")
    }

    const resolvedSearchParams = searchParams ? await searchParams : undefined

    const [teams, competitions, matches] = await Promise.all([
        prisma.team.findMany({
            where: { sport: "fotbal" },
            select: { id: true, name: true, country: true },
            orderBy: { name: "asc" },
        }),
        prisma.competition.findMany({
            where: { sport: "fotbal" },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
        prisma.footballMatch.findMany({
            include: {
                teamHome: { select: { id: true, name: true, country: true } },
                teamAway: { select: { id: true, name: true, country: true } },
                competition: { select: { id: true, name: true } },
            },
            orderBy: { matchDate: "desc" },
        }),
    ])

    return (
        <main>
            <div className="sd-page-title" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <Link href="/manager-fotbal" className="sd-btn-secondary">Inapoi</Link>
                <h1>Meciuri fotbal</h1>
            </div>
            <MatchManager initialMatches={matches} teams={teams} competitions={competitions} shouldOpenMatchModal={resolvedSearchParams?.open === "match"} />
        </main>
    )
}

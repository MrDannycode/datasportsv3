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
    const managerAssignment = await prisma.managerAssignment.findUnique({
        where: { userId: Number(session.user.id) },
        select: { country: true, continent: true },
    })

    const [teams, competitions, matches] = await Promise.all([
        prisma.team.findMany({
            where: managerAssignment
                ? { sport: "fotbal", country: managerAssignment.country }
                : { sport: "fotbal", id: -1 },
            select: { id: true, name: true, country: true },
            orderBy: { name: "asc" },
        }),
        prisma.competition.findMany({
            where: managerAssignment
                ? { sport: "fotbal", country: managerAssignment.country }
                : { sport: "fotbal", id: -1 },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
        prisma.footballMatch.findMany({
            where: managerAssignment
                ? {
                    OR: [
                        { teamHome: { country: managerAssignment.country } },
                        { teamAway: { country: managerAssignment.country } },
                        { competition: { country: managerAssignment.country } },
                    ],
                }
                : { id: -1 },
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
            <div className="sd-box">
                <div className="sd-box-header">
                    <Link href="/manager-fotbal" className="sd-btn-secondary">Inapoi</Link>
                    <h2 className="flex-1 text-center">Gestionare Meciuri Fotbal</h2>
                    <div className="sd-btn-secondary invisible">Inapoi</div>
                </div>
                <div className="sd-box-content">
                    <MatchManager initialMatches={matches} teams={teams} competitions={competitions} shouldOpenMatchModal={resolvedSearchParams?.open === "match"} />
                </div>
            </div>
        </main>
    )
}

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import TeamManager from "../TeamManager"

export default async function EchipePage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "manager_fotbal") {
        redirect("/login")
    }

    const managerAssignment = await prisma.managerAssignment.findUnique({
        where: { userId: Number(session.user.id) },
        select: { country: true, continent: true },
    })

    const assignedCountry = managerAssignment?.country ?? null
    const assignedContinent = managerAssignment?.continent ?? null

    const [teams, leagues] = assignedCountry && assignedContinent
        ? await Promise.all([
            prisma.team.findMany({
                where: { sport: 'fotbal', country: assignedCountry },
                select: { id: true, name: true, stadium: true, county: true, country: true, continent: true },
                orderBy: { name: 'asc' },
            }),
            prisma.competition.findMany({
                where: { sport: 'fotbal', country: assignedCountry },
                select: { id: true, name: true },
                orderBy: { name: 'asc' },
            }),
        ])
        : [[], []]


    return (
        <main>
            <div className="sd-box">
                <div className="sd-box-header">
                    <Link href="/manager-fotbal" className="sd-btn-secondary">Inapoi</Link>
                    <h2 className="flex-1 text-center">Gestionare Echipe Fotbal</h2>
                    <div className="sd-btn-secondary invisible">Inapoi</div>
                </div>
                <div className="sd-box-content">
                    <TeamManager initialTeams={teams} leagues={leagues} assignedCountry={assignedCountry} assignedContinent={null} />
                </div>
            </div>
        </main>
    )
}


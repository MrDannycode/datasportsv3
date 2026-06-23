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

    const teams = await prisma.team.findMany({
        where: { sport: "fotbal" },
        select: { id: true, name: true, country: true, continent: true },
        orderBy: { name: "asc" },
    })

    return (
        <main>
            <div className="sd-page-title" style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <Link href="/manager-fotbal" className="sd-btn-secondary">Inapoi</Link>
                <h1>Echipe fotbal</h1>
            </div>
            <TeamManager initialTeams={teams} />
        </main>
    )
}

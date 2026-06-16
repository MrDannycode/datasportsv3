import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import PlanFormClient from "../PlanFormClient"

export default async function NouAntrenamentPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "antrenor_fotbal") {
        redirect("/login")
    }

    // Încarcă toate echipele de fotbal
    const teams = await prisma.team.findMany({
        where: { sport: "fotbal" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    })

    return (
        <main>
            <div className="sd-page-title">
                <h1>Adaugă plan de antrenament</h1>
            </div>

            <PlanFormClient teams={teams} mode="create" />
        </main>
    )
}

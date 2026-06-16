import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import PlanFormClient from "../../PlanFormClient"

interface Props {
    params: { id: string }
}

export default async function EditAntrenamentPage({ params }: Props) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "antrenor_fotbal") {
        redirect("/login")
    }

    const planId = Number(params.id)

    const [plan, teams] = await Promise.all([
        prisma.trainingPlan.findUnique({
            where: { id: planId },
            include: { team: { select: { id: true, name: true } } },
        }),
        prisma.team.findMany({
            where: { sport: "fotbal" },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
    ])

    if (!plan) return notFound()

    if (plan.createdBy !== Number(session.user.id)) {
        redirect("/antrenor-fotbal/antrenamente")
    }

    const initialData = {
        id: plan.id,
        teamId: plan.teamId,
        title: plan.title,
        description: plan.description ?? "",
        type: plan.type as "tehnic" | "fizic" | "tactic",
        date: plan.date.toISOString().split("T")[0], // YYYY-MM-DD
    }

    return (
        <main>
            <div className="sd-page-title">
                <h1>Editează plan de antrenament</h1>
            </div>

            <PlanFormClient teams={teams} mode="edit" initialData={initialData} />
        </main>
    )
}

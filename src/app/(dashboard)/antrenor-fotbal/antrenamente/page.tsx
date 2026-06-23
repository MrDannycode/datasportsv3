import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import AntrenamenteManager from "./AntrenamenteManager"

interface AntrenamentePageProps {
    searchParams?: Promise<{ open?: string }>
}

export default async function AntrenamentePage({ searchParams }: AntrenamentePageProps) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "antrenor_fotbal") {
        redirect("/login")
    }

    const resolvedSearchParams = searchParams ? await searchParams : undefined

    const plans = await prisma.trainingPlan.findMany({
        where: { createdBy: Number(session.user.id) },
        orderBy: { date: "desc" },
    })

    const serializedPlans = plans.map((plan) => ({
        ...plan,
        date: plan.date.toISOString(),
        createdAt: plan.createdAt.toISOString(),
    }))

    return (
        <main>
            <div className="sd-page-title">
                <h1>Planuri de antrenament</h1>
            </div>

            <AntrenamenteManager initialPlans={serializedPlans} shouldOpenNewPlanModal={resolvedSearchParams?.open === "plan"} />
        </main>
    )
}
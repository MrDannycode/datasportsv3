import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import TrainfitManager from "./TrainfitManager"

interface TrainfitPageProps {
    searchParams?: Promise<{ open?: string }>
}

export default async function TrainfitPage({ searchParams }: TrainfitPageProps) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "antrenor_fitness") {
        redirect("/login")
    }

    const resolvedSearchParams = searchParams ? await searchParams : undefined

    const plans = await prisma.fitnessPlan.findMany({
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
                <h1>Planuri de fitness</h1>
            </div>

            <TrainfitManager initialPlans={serializedPlans} shouldOpenNewPlanModal={resolvedSearchParams?.open === "new"} />
        </main>
    )
}
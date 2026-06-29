import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import TrainfitManager from "./TrainfitManager"
import Link from "next/link"

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
            <div className="sd-box">
                <div className="sd-box-header">
                    <Link href="/admin" className="sd-btn-secondary">Inapoi</Link>
                    <h2 className="flex-1 text-center">Gestionare Planuri Fitness</h2>
                    <div className="sd-btn-secondary invisible">Inapoi</div>
                </div>
                <div className="sd-box-content">
                    <TrainfitManager initialPlans={serializedPlans} shouldOpenNewPlanModal={resolvedSearchParams?.open === "new"} />
                </div>
            </div >
        </main >
    )
}
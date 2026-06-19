import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import TrainfitManager from "./TrainfitManager"

export default async function TrainfitPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "antrenor_fitness") {
        redirect("/login")
    }

    const plans = await prisma.fitnessPlan.findMany({
        where: { createdBy: Number(session.user.id) },
        orderBy: { date: "desc" },
    })

    const serializedPlans = plans.map((p) => ({
        ...p,
        date: p.date.toISOString(),
        createdAt: p.createdAt.toISOString(),
    }))

    return (
        <main>
            <div className="sd-page-title">
                <h1>Planuri de fitness</h1>
            </div>

            <TrainfitManager initialPlans={serializedPlans} />
        </main>
    )
}

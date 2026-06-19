import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import AntrenamenteManager from "./AntrenamenteManager"

export default async function AntrenamentePage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "antrenor_fotbal") {
        redirect("/login")
    }

    const plans = await prisma.trainingPlan.findMany({
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
                <h1>Planuri de antrenament</h1>
            </div>

            <AntrenamenteManager initialPlans={serializedPlans} />
        </main>
    )
}

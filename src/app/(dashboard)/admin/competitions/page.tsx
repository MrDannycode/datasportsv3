import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import CompetitionsManager from "./CompetitionsManager"
import Link from "next/link"

interface AdminCompetitionsPageProps {
    searchParams?: Promise<{ open?: string; sport?: string; continent?: string }>
}

export default async function AdminCompetitionsPage({ searchParams }: AdminCompetitionsPageProps) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin_global") {
        redirect("/login")
    }

    const resolvedSearchParams = searchParams ? await searchParams : undefined

    const competitions = await prisma.competition.findMany({
        orderBy: { createdAt: "desc" }
    })

    return (
        <main>
            <div className="sd-box">
                                <div className="sd-box-header">
                    <Link href="/admin" className="sd-btn-secondary sd-btn-back">Inapoi</Link>
                    <h2 className="flex-1 text-center">Gestionare Competitii</h2>
                    <div className="sd-btn-secondary sd-btn-back invisible">Inapoi</div>
                </div>
                <div className="sd-box-content">

                    <CompetitionsManager
                        initialCompetitions={competitions}
                        shouldOpenNewCompetitionModal={resolvedSearchParams?.open === "new"}
                        initialSportFilter={resolvedSearchParams?.sport}
                        initialContinentFilter={resolvedSearchParams?.continent}
                    />
                </div>
            </div>
        </main>
    )
}
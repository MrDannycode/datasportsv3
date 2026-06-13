import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import CompetitionsManager from "./CompetitionsManager"
import Link from "next/link"

export default async function AdminCompetitionsPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin_global") {
        redirect("/login")
    }

    const competitions = await prisma.competition.findMany({
        orderBy: { createdAt: "desc" }
    })

    return (
        <main>
            <div className="sd-page-title" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Link href="/admin" style={{ color: '#0070f3', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>
                    ← Înapoi la Dashboard
                </Link>
                <h1 style={{ margin: 0 }}>Gestionare Competiții</h1>
            </div>
            
            <CompetitionsManager initialCompetitions={competitions} />
        </main>
    )
}

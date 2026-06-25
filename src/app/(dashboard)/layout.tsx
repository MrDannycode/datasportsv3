import "../dashboard.css"
import DashboardHeader from "@/components/layout/DashboardHeader"
import DashboardSidebar from "@/components/layout/DashboardSidebar"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const rolesWithoutSidebar = new Set([
    "admin_global",
    "manager_fotbal",
    "manager_tenis",
    "atlet_tenis",
])

async function getSidebarPlayers(userId?: string) {
    const parsedUserId = Number(userId)
    if (!Number.isInteger(parsedUserId)) return []

    const profile = await prisma.profile.findUnique({
        where: { userId: parsedUserId },
        select: { teamId: true },
    })

    if (!profile?.teamId) return []

    const athletes = await prisma.footballAthlete.findMany({
        where: {
            user: {
                profile: {
                    teamId: profile.teamId,
                },
            },
        },
        select: {
            id: true,

            user: {
                select: {
                    profile: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            team: {
                                select: {
                                    name: true,
                                },
                            },
                            dailyLoads: {
                                orderBy: { date: "desc" },
                                take: 1,
                                select: {
                                    atl: true,
                                    tsb: true,
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: [
            { user: { profile: { lastName: "asc" } } },
            { user: { profile: { firstName: "asc" } } },
        ],
    })

    return athletes
        .map((athlete) => {
            const profile = athlete.user.profile
            const latestLoad = profile?.dailyLoads[0]

            return {
                id: athlete.id,
                name: profile ? profile.firstName + " " + profile.lastName : "Jucator fara profil",
                team: profile?.team?.name ?? "-",
                atl: latestLoad?.atl ?? null,
                tsb: latestLoad?.tsb ?? null,
            }
        })
        .sort((a, b) => (b.atl ?? -Infinity) - (a.atl ?? -Infinity) || a.name.localeCompare(b.name))
}

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)
    const showSidebar = !session?.user.role || !rolesWithoutSidebar.has(session.user.role)
    const sidebarPlayers = showSidebar ? await getSidebarPlayers(session?.user.id) : []

    return (
        <div className="sd-container">
            <div className="sd-inner">
                <DashboardHeader activeHref="#" />
                <div className="sd-with-sidebar">
                    <div className="sd-main-content">
                        {children}
                    </div>
                    {showSidebar && <DashboardSidebar players={sidebarPlayers} />}
                </div>
            </div>
        </div>
    )
}
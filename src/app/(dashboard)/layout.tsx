import "../dashboard.css"
import DashboardHeader from "@/components/layout/DashboardHeader"
import DashboardSidebar from "@/components/layout/DashboardSidebar"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const rolesWithoutSidebar = new Set([
    "admin_global",
    "manager_fotbal",
    "manager_tenis",
    "atlet_tenis",
])

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)
    const showSidebar = !session?.user.role || !rolesWithoutSidebar.has(session.user.role)

    return (
        <div className="sd-container">
            <div className="sd-inner">
                <DashboardHeader activeHref="#" />
                <div className="sd-with-sidebar">
                    <div className="sd-main-content">
                        {children}
                    </div>
                    {showSidebar && <DashboardSidebar />}
                </div>
            </div>
        </div>
    )
}
import "../dashboard.css"
import DashboardHeader from "@/components/layout/DashboardHeader"
import DashboardSidebar from "@/components/layout/DashboardSidebar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="sd-container">
            <div className="sd-inner">
                <DashboardHeader activeHref="#" />
                <div className="sd-with-sidebar">
                    <div className="sd-main-content">
                        {children}
                    </div>
                    <DashboardSidebar />
                </div>
            </div>
        </div>
    )
}
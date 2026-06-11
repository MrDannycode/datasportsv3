import "../dashboard.css"
import DashboardHeader from "@/components/layout/DashboardHeader"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="sd-container">
            <div className="sd-inner">
                <DashboardHeader activeHref="#" />
                {children}
            </div>
        </div>
    )
}
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import ManagerAssignmentManager from "./ManagerAssignmentManager"
import { MANAGER_LOCATION_OPTIONS } from "@/lib/manager-locations"

export default async function AdminManageriPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin_global") {
        redirect("/login")
    }

    const managerUsers = await prisma.user.findMany({
        where: { role: "manager_fotbal" },
        select: {
            id: true,
            email: true,
            managerAssignment: {
                select: {
                    country: true,
                    continent: true,
                },
            },
            profile: {
                select: {
                    firstName: true,
                    lastName: true,
                },
            },
        },
        orderBy: { email: "asc" },
    })

    const managers = managerUsers.map(manager => ({
        id: manager.id,
        email: manager.email,
        firstName: manager.profile?.firstName || manager.email.split("@")[0],
        lastName: manager.profile?.lastName || "",
        country: manager.managerAssignment?.country ?? null,
        continent: manager.managerAssignment?.continent ?? null,
    }))

    return (
        <main>
            <div className="sd-box">
                <div className="sd-box-header">
                    <Link href="/admin" className="sd-btn-secondary sd-btn-back">Inapoi</Link>
                    <h2 className="flex-1 text-center">Gestiune Manageri</h2>
                    <div className="sd-btn-secondary sd-btn-back invisible">Inapoi</div>
                </div>
                <div className="sd-box-content">

                    <ManagerAssignmentManager initialManagers={managers} locationOptions={MANAGER_LOCATION_OPTIONS} />
                </div>
            </div>
        </main>
    )
}

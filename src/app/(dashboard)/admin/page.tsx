import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin_global") {
        redirect("/login")
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800">
                Dashboard Admin Global
            </h1>
            <p className="text-gray-500 mt-2">
                Bun venit, {session.user.email}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-700">Utilizatori</h2>
                    <p className="text-4xl font-bold text-blue-600 mt-2">—</p>
                </div>
                <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-700">Echipe</h2>
                    <p className="text-4xl font-bold text-blue-600 mt-2">—</p>
                </div>
                <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-700">Audituri</h2>
                    <p className="text-4xl font-bold text-blue-600 mt-2">—</p>
                </div>
            </div>
        </div>
    )
}
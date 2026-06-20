import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import DosarManager from "./DosarManager"
import { getMedicalRecords, getFootballAthletes } from "./actions"

export default async function DosarMedicalPage() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "medic") {
        redirect("/login")
    }

    const records = await getMedicalRecords()
    const athletes = await getFootballAthletes()

    return (
        <main>
            <div className="sd-page-title" style={{ marginBottom: '24px' }}>
                <h1>Dosar Medical</h1>
                <p style={{ color: '#666' }}>Gestionează dosarele medicale și accidentările atleților de fotbal.</p>
            </div>

            <DosarManager 
                initialRecords={records} 
                athletes={athletes} 
            />
        </main>
    )
}

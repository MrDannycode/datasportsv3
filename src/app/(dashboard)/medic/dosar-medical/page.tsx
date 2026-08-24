import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DosarManager from "./DosarManager";
import { getMedicalRecords, getFootballAthletes } from "./actions";
import Link from "next/link"

interface DosarMedicalPageProps {
    searchParams?: Promise<{ open?: string }>;
}

export default async function DosarMedicalPage({ searchParams }: DosarMedicalPageProps) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "medic") {
        redirect("/login");
    }

    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const records = await getMedicalRecords();
    const athletes = await getFootballAthletes();

    return (
        <main>
            <div className="sd-box">
                <div className="sd-box-header">
                    <Link href="/medic" className="sd-btn-secondary sd-btn-back">Inapoi</Link>
                    <h2 className="flex-1 text-center">Gestionare Dosare Medicale</h2>
                    <div className="sd-btn-secondary invisible">Inapoi</div>
                </div>
                <div className="sd-box-content">
                    <DosarManager
                        initialRecords={records}
                        athletes={athletes}
                        shouldOpenNewRecordModal={resolvedSearchParams?.open === "new"}
                    />
                </div>
            </div>
        </main>
    );
}
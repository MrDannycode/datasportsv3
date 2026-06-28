import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { TableModeToggle } from "@/components/table-mode-toggle"
import AddMedicalRecordNavButton from "@/components/layout/AddMedicalRecordNavButton"
import AddInjuryNavButton from "@/components/layout/AddInjuryNavButton"
import AddUserNavButton from "@/components/layout/AddUserNavButton"
import AddCompetitionNavButton from "@/components/layout/AddCompetitionNavButton"
import AddAthleteNavButton from "@/components/layout/AddAthleteNavButton"
import CoachManagementNavButton from "@/components/layout/CoachManagementNavButton"
import AddMatchNavButton from "@/components/layout/AddMatchNavButton"
import AddTrainingNavButton from "@/components/layout/AddTrainingNavButton"
import AddFitnessSessionNavButton from "@/components/layout/AddFitnessSessionNavButton"
import AddActivityNavButton from "@/components/layout/AddActivityNavButton"
import TeamAthletesNavButton, { type TeamAthlete } from "@/components/layout/TeamAthletesNavButton"
import MedicalRecordNavButton, { type AthleteMedicalRecord } from "@/components/layout/MedicalRecordNavButton"
import ExportAuditNavButton from "@/components/layout/ExportAuditNavButton"
import MyProfileNavButton from "@/components/layout/MyProfileNavButton"
import AccountSettingsButton from "@/components/layout/AccountSettingsButton"
import { prisma } from "@/lib/prisma"

interface NavItem {
    label: string
    href: string
}

type BasicTeam = { id: number; name: string; country: string }
type BasicCoach = { id: number; firstName: string; lastName: string; role: string; teamId: number | null; team: BasicTeam | null }
type BasicCompetition = { id: number; name: string }
type AccountSettingsData = {
    firstName: string
    lastName: string
    email: string
    phone: string
}

type ProfileNavData = {
    firstName: string
    lastName: string
    dateOfBirth: string | null
    phone: string | null
    restingHeartRate: number | null
    maxHeartRate: number | null
    gender: "MALE" | "FEMALE" | null
    heightCm?: number | null
    weightKg?: number | null
    preferredFoot?: string | null
    preferredHand?: string | null
    atpWtaRanking?: number | null
    sportType?: "fotbal" | "tenis" | null
}

interface DashboardHeaderProps {
    navItems?: NavItem[]
    activeHref?: string
}

const defaultNavItems: NavItem[] = [
    { label: "Adauga Utilizator", href: "#" },
    { label: "Gestiune Manageri", href: "/admin/manageri" },
    { label: "Adauga Competitie", href: "#" },
    { label: "Export Audit Curent", href: "#" },
    { label: "Adauga Atleti", href: "#" },
    { label: "Gestiune Antrenori", href: "#" },
    { label: "Adauga Meci", href: "#" },
    { label: "Adauga antrenament", href: "/antrenor-fotbal/antrenamente" },
    { label: "Adauga Sesiune Fitness", href: "/antrenor-fitness/trainfit?open=new" },
    { label: "Gestioneaza Sesiune Fitness", href: "/antrenor-fitness/trainfit" },
    { label: "Adauga Dosar", href: "/medic/dosar-medical?open=new" },
    { label: "Adauga Accidentare", href: "#" },
    { label: "Dosar Medical", href: "#" },
    { label: "Adauga Activitate", href: "/atlet-fotbal/activity?open=new" },
    { label: "Profil Sportiv", href: "#" },
    { label: "Toti Atletii", href: "#" },
    { label: "Turnee Tenis", href: "/atlet-tenis/turnee" },
    { label: "Turneele mele", href: "/atlet-tenis/turnee/inscrieri" },
]

export default async function DashboardHeader({
    navItems = defaultNavItems,
    activeHref = "#",
}: DashboardHeaderProps) {
    const session = await getServerSession(authOptions)
    const teamAthleteRoles = ["antrenor_fotbal", "antrenor_fitness", "medic", "atlet_fotbal"]
    const canViewTeamAthletes = teamAthleteRoles.includes(session?.user?.role ?? "")
    let teamName: string | null = null
    let teamAthletes: TeamAthlete[] = []
    let footballTeams: BasicTeam[] = []
    let footballCoaches: BasicCoach[] = []
    let footballCompetitions: BasicCompetition[] = []
    let athleteMedicalRecords: AthleteMedicalRecord[] = []
    let athleteHasCardiacData = false
    let myProfileData: ProfileNavData | null = null
    let accountSettingsData: AccountSettingsData | null = null

    if (session?.user?.id) {
        const accountUser = await prisma.user.findUnique({
            where: { id: Number(session.user.id) },
            select: {
                email: true,
                profile: {
                    select: { firstName: true, lastName: true, phone: true },
                },
            },
        })

        const fallbackName = accountUser?.email.split("@")[0] ?? ""
        accountSettingsData = {
            firstName: accountUser?.profile?.firstName ?? fallbackName,
            lastName: accountUser?.profile?.lastName ?? "",
            email: accountUser?.email ?? session.user.email ?? "",
            phone: accountUser?.profile?.phone ?? "",
        }
    }

    if (session?.user?.role === "manager_fotbal") {
        const managerAssignment = await prisma.managerAssignment.findUnique({
            where: { userId: Number(session.user.id) },
            select: { country: true, continent: true },
        })

        footballTeams = await prisma.team.findMany({
            where: managerAssignment
                ? { sport: "fotbal", country: managerAssignment.country }
                : { sport: "fotbal", id: -1 },
            select: { id: true, name: true, country: true },
            orderBy: { name: "asc" },
        })

        footballCompetitions = await prisma.competition.findMany({
            where: managerAssignment
                ? { sport: "fotbal", country: managerAssignment.country }
                : { sport: "fotbal", id: -1 },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        })

        const coachUsers = await prisma.user.findMany({
            where: { role: "antrenor_fotbal" },
            include: {
                profile: {
                    include: { team: { select: { id: true, name: true, country: true } } },
                },
            },
            orderBy: { email: "asc" },
        })

        footballCoaches = coachUsers.map((user) => ({
            id: user.id,
            role: user.role,
            firstName: user.profile?.firstName || user.email.split("@")[0],
            lastName: user.profile?.lastName || "",
            teamId: user.profile?.teamId || null,
            team: user.profile?.team || null,
        }))
    }

    if (session?.user?.id && canViewTeamAthletes) {
        const profile = await prisma.profile.findUnique({
            where: { userId: Number(session.user.id) },
            select: {
                team: {
                    select: {
                        name: true,
                        profiles: {
                            where: { user: { footballAthlete: { isNot: null } } },
                            select: {
                                firstName: true,
                                lastName: true,
                                user: {
                                    select: {
                                        email: true,
                                        footballAthlete: {
                                            select: {
                                                id: true,
                                                position: true,
                                                jerseyNumber: true,
                                                medicalRecords: {
                                                    where: { isAvailable: false },
                                                    select: { id: true },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
                        },
                    },
                },
            },
        })

        teamName = profile?.team?.name ?? null
        teamAthletes = profile?.team?.profiles.flatMap((athleteProfile) => {
            const footballAthlete = athleteProfile.user.footballAthlete
            if (!footballAthlete) return []

            return [{
                id: footballAthlete.id,
                firstName: athleteProfile.firstName,
                lastName: athleteProfile.lastName,
                email: athleteProfile.user.email,
                position: footballAthlete.position,
                jerseyNumber: footballAthlete.jerseyNumber,
                isAvailable: footballAthlete.medicalRecords.length === 0,
            }]
        }) ?? []
    }

    if (session?.user?.role === "atlet_fotbal") {
        const records = await prisma.medicalRecord.findMany({
            where: { athlete: { userId: Number(session.user.id) } },
            include: {
                injuries: true,
                medic: {
                    select: {
                        email: true,
                        profile: { select: { firstName: true, lastName: true } },
                    },
                },
            },
            orderBy: { startDate: "desc" },
        })

        athleteMedicalRecords = records.map((record) => {
            const medicProfile = record.medic.profile
            const medicName = medicProfile
                ? `${medicProfile.firstName} ${medicProfile.lastName}`
                : record.medic.email

            return {
                id: record.id,
                diagnosis: record.diagnosis,
                treatment: record.treatment,
                startDate: record.startDate.toISOString(),
                endDate: record.endDate?.toISOString() ?? null,
                isAvailable: record.isAvailable,
                medicName,
                injuries: record.injuries.map((injury) => ({
                    id: injury.id,
                    injuryType: injury.injuryType,
                    bodyPart: injury.bodyPart,
                    severity: injury.severity,
                    recoveryDays: injury.recoveryDays,
                    notes: injury.notes,
                })),
            }
        })
    }

    if (["atlet_fotbal", "atlet_tenis"].includes(session?.user?.role ?? "")) {
        const athleteUser = await prisma.user.findUnique({
            where: { id: Number(session?.user?.id) },
            select: { 
                email: true,
                profile: {
                    select: {
                        firstName: true, lastName: true, phone: true, dateOfBirth: true, gender: true,
                        restingHeartRate: true, maxHeartRate: true,
                    },
                },
                footballAthlete: {
                    select: { heightCm: true, weightKg: true, preferredFoot: true }
                },
                tennisAthlete: {
                    select: { heightCm: true, weightKg: true, preferredHand: true, atpWtaRanking: true }
                },
            },
        })

        const athleteProfile = athleteUser?.profile
        athleteHasCardiacData = !!(athleteProfile?.restingHeartRate && athleteProfile?.maxHeartRate)
        
        if (athleteUser) {
           const fallbackName = athleteUser.email.split("@")[0]
           myProfileData = {
              firstName: athleteProfile?.firstName ?? fallbackName,
              lastName: athleteProfile?.lastName ?? "",
              dateOfBirth: athleteProfile?.dateOfBirth?.toISOString() || null,
              phone: athleteProfile?.phone ?? null,
              restingHeartRate: athleteProfile?.restingHeartRate ?? null,
              maxHeartRate: athleteProfile?.maxHeartRate ?? null,
              gender: athleteProfile?.gender ?? null,
              heightCm: athleteUser.footballAthlete?.heightCm || athleteUser.tennisAthlete?.heightCm || null,
              weightKg: athleteUser.footballAthlete?.weightKg || athleteUser.tennisAthlete?.weightKg || null,
              preferredFoot: athleteUser.footballAthlete?.preferredFoot || null,
              preferredHand: athleteUser.tennisAthlete?.preferredHand || null,
              atpWtaRanking: athleteUser.tennisAthlete?.atpWtaRanking ?? null,
              sportType: session?.user?.role === "atlet_fotbal" ? "fotbal" : session?.user?.role === "atlet_tenis" ? "tenis" : athleteUser.footballAthlete ? "fotbal" : athleteUser.tennisAthlete ? "tenis" : null
           }
        }
    }

    const visibleNavItems = navItems.filter((item) =>
        item.label === "Toti Atletii"
            ? canViewTeamAthletes
            : ["Adauga Utilizator", "Gestiune Manageri", "Adauga Competitie", "Export Audit Curent"].includes(item.label)
                ? session?.user?.role === "admin_global"
                : ["Adauga Atleti", "Gestiune Antrenori", "Adauga Meci"].includes(item.label)
                    ? session?.user?.role === "manager_fotbal"
                    : ["Adauga antrenament"].includes(item.label)
                        ? session?.user?.role === "antrenor_fotbal"
                        : ["Adauga Sesiune Fitness", "Gestioneaza Sesiune Fitness"].includes(item.label)
                            ? session?.user?.role === "antrenor_fitness"
                            : ["Adauga Dosar", "Adauga Accidentare"].includes(item.label)
                                ? session?.user?.role === "medic"
                                : item.label === "Dosar Medical"
                                    ? session?.user?.role === "atlet_fotbal"
                                    : item.label === "Adauga Activitate"
                                        ? ["atlet_fotbal", "atlet_tenis"].includes(session?.user?.role ?? "")
                                    : item.label === "Profil Sportiv"
                                        ? ["atlet_fotbal", "atlet_tenis"].includes(session?.user?.role ?? "")
                                    : ["Turnee Tenis", "Turneele mele"].includes(item.label)
                                        ? session?.user?.role === "atlet_tenis"
                                        : true
    )

    return (
        <header className="sd-header">
            <div className="sd-header-row sd-header-top">
                <div className="sd-logo">
                    <strong>SportsData</strong>
                </div>

                <div className="sd-user-info">
                    {session?.user ? (
                        <>
                            <span>Bine ai venit <strong>{accountSettingsData?.email ?? session.user.email}</strong></span>
                            {accountSettingsData && <AccountSettingsButton account={accountSettingsData} />}
                            <Link href="/signout">Logout</Link>
                        </>
                    ) : (
                        <Link href="/login">Login</Link>
                    )}
                </div>
            </div>

            <div className="sd-header-row sd-header-bottom">
                <div className="sd-header-toggles">
                    <ThemeToggle />
                    <TableModeToggle />
                </div>

                <nav className="sd-nav">
                    {visibleNavItems.map((item) => {
                        if (item.label === "Adauga Utilizator") {
                            return <AddUserNavButton key={item.href + item.label} label={item.label} isActive={item.href === activeHref} />
                        }

                        if (item.label === "Adauga Competitie") {
                            return <AddCompetitionNavButton key={item.href + item.label} label={item.label} isActive={item.href === activeHref} />
                        }

                        if (item.label === "Export Audit Curent") {
                            return <ExportAuditNavButton key={item.href + item.label} label={item.label} isActive={item.href === activeHref} ignoreFilters={true} />
                        }

                        if (item.label === "Adauga Atleti") {
                            return <AddAthleteNavButton key={item.href + item.label} label={item.label} teams={footballTeams} isActive={item.href === activeHref} />
                        }

                        if (item.label === "Gestiune Antrenori") {
                            return <CoachManagementNavButton key={item.href + item.label} label={item.label} antrenori={footballCoaches} teams={footballTeams} isActive={item.href === activeHref} />
                        }

                        if (item.label === "Adauga Meci") {
                            return <AddMatchNavButton key={item.href + item.label} label={item.label} teams={footballTeams} competitions={footballCompetitions} isActive={item.href === activeHref} />
                        }

                        if (item.label === "Adauga antrenament") {
                            return <AddTrainingNavButton key={item.href + item.label} label={item.label} isActive={item.href === activeHref} />
                        }

                        if (item.label === "Adauga Sesiune Fitness") {
                            return <AddFitnessSessionNavButton key={item.href + item.label} label={item.label} isActive={item.href === activeHref} />
                        }

                        if (item.label === "Adauga Dosar") {
                            return <AddMedicalRecordNavButton key={item.href + item.label} label={item.label} isActive={item.href === activeHref} />
                        }

                        if (item.label === "Adauga Accidentare") {
                            return <AddInjuryNavButton key={item.href + item.label} label={item.label} isActive={item.href === activeHref} />
                        }

                        if (item.label === "Adauga Activitate") {
                            return <AddActivityNavButton key={item.href + item.label} label={item.label} isActive={item.href === activeHref} hasCardiacData={athleteHasCardiacData} defaultSport={session?.user?.role === "atlet_tenis" ? "tenis" : "fotbal"} />
                        }

                        if (item.label === "Toti Atletii") {
                            return <TeamAthletesNavButton key={item.href + item.label} label={item.label} teamName={teamName} athletes={teamAthletes} />
                        }

                        if (item.label === "Dosar Medical") {
                            return <MedicalRecordNavButton key={item.href + item.label} label={item.label} records={athleteMedicalRecords} />
                        }

                        if (item.label === "Profil Sportiv" && myProfileData) {
                            return <MyProfileNavButton key={item.href + item.label} label={item.label} isActive={item.href === activeHref} initialData={myProfileData} />
                        }

                        return (
                            <Link key={item.href + item.label} href={item.href} className={item.href === activeHref ? "active" : ""}>
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>
            </div>
        </header>
    )
}









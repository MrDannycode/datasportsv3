import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import AddMedicalRecordNavButton from "@/components/layout/AddMedicalRecordNavButton"
import AddInjuryNavButton from "@/components/layout/AddInjuryNavButton"
import AddUserNavButton from "@/components/layout/AddUserNavButton"
import AddCompetitionNavButton from "@/components/layout/AddCompetitionNavButton"
import AddAthleteNavButton from "@/components/layout/AddAthleteNavButton"
import CoachManagementNavButton from "@/components/layout/CoachManagementNavButton"
import AddMatchNavButton from "@/components/layout/AddMatchNavButton"
import AddTrainingNavButton from "@/components/layout/AddTrainingNavButton"
import AddFitnessSessionNavButton from "@/components/layout/AddFitnessSessionNavButton"
import TeamAthletesNavButton, { type TeamAthlete } from "@/components/layout/TeamAthletesNavButton"
import MedicalRecordNavButton, { type AthleteMedicalRecord } from "@/components/layout/MedicalRecordNavButton"
import ExportAuditNavButton from "@/components/layout/ExportAuditNavButton"
import { prisma } from "@/lib/prisma"

interface NavItem {
    label: string
    href: string
}

type BasicTeam = { id: number; name: string }
type BasicCoach = { id: number; firstName: string; lastName: string; teamId: number | null; team: BasicTeam | null }
type BasicCompetition = { id: number; name: string }

interface DashboardHeaderProps {
    navItems?: NavItem[]
    activeHref?: string
}

const defaultNavItems: NavItem[] = [
    { label: "Adauga Utilizator", href: "#" },
    { label: "Adauga Competitie", href: "#" },
    { label: "Export Audit Curent", href: "#"},
    { label: "Adauga Atleti", href: "#" },
    { label: "Gestiune Antrenori", href: "#" },
    { label: "Adauga Meci", href: "#" },
    { label: "Adauga antrenament", href: "/antrenor-fotbal/antrenamente" },
    { label: "Rapoarte Fitness", href: "#" },
    { label: "Adauga Sesiune Fitness", href: "/antrenor-fitness/trainfit?open=new" },
    { label: "Adauga Sesiune Recuperare", href: "#" },
    { label: "Adauga Dosar", href: "/medic/dosar-medical?open=new" },
    { label: "Adauga Accidentare", href: "#" },
    { label: "Disponibilitate atleti", href: "#" },
    { label: "Istoric Accidentari", href: "#" },
    { label: "Dosar Medical", href: "#" },
    { label: "Adauga Activitate", href: "#" },
    { label: "Feedback Daily", href: "#" },
    { label: "Toti Atletii", href: "#" },
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

    if (session?.user?.role === "manager_fotbal") {
        footballTeams = await prisma.team.findMany({
            where: { sport: "fotbal" },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        })

        footballCompetitions = await prisma.competition.findMany({
            where: { sport: "fotbal" },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        })

        const coachUsers = await prisma.user.findMany({
            where: { role: "antrenor_fotbal" },
            include: {
                profile: {
                    include: { team: { select: { id: true, name: true } } },
                },
            },
            orderBy: { email: "asc" },
        })

        footballCoaches = coachUsers.map((user) => ({
            id: user.id,
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
                                            select: { id: true, position: true, jerseyNumber: true },
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
    const visibleNavItems = navItems.filter((item) =>
        item.label === "Toti Atletii"
            ? canViewTeamAthletes
            : ["Adauga Utilizator", "Adauga Competitie", "Export Audit Curent"].includes(item.label)
                ? session?.user?.role === "admin_global"
                : ["Adauga Atleti", "Gestiune Antrenori", "Adauga Meci"].includes(item.label)
                    ? session?.user?.role === "manager_fotbal"
                    : ["Adauga antrenament", "Rapoarte Fitness"].includes(item.label)
                        ? session?.user?.role === "antrenor_fotbal"
                        : ["Adauga Sesiune Fitness", "Adauga Sesiune Recuperare"].includes(item.label)
                            ? session?.user?.role === "antrenor_fitness"
                            : ["Adauga Dosar", "Adauga Accidentare", "Disponibilitate atleti", "Istoric Accidentari"].includes(item.label)
                                ? session?.user?.role === "medic"
                                : ["Dosar Medical", "Adauga Activitate", "Feedback Daily"].includes(item.label)
                                    ? session?.user?.role === "atlet_fotbal"
                                    : true
    )

    return (
        <header className="sd-header">
            <div className="sd-logo">
                <strong>SportsData</strong>
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

                    if (item.label === "Toti Atletii") {
                        return <TeamAthletesNavButton key={item.href + item.label} label={item.label} teamName={teamName} athletes={teamAthletes} />
                    }

                    if (item.label === "Dosar Medical") {
                        return <MedicalRecordNavButton key={item.href + item.label} label={item.label} records={athleteMedicalRecords} />
                    }

                    return (
                        <Link key={item.href + item.label} href={item.href} className={item.href === activeHref ? "active" : ""}>
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            <div className="sd-user-info" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <ThemeToggle />
                {session?.user ? (
                    <>
                        Logged in as{" "}
                        <strong>{session.user.email}</strong>
                        {" | "}
                        <Link href="/api/auth/signout">Logout</Link>
                        {" "}
                        <Link href="#">Account settings</Link>
                    </>
                ) : (
                    <Link href="/login">Login</Link>
                )}
            </div>
        </header>
    )
}



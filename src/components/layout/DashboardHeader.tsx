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
import AddMatchResultNavButton from "@/components/layout/AddMatchResultNavButton"
import AddTrainingNavButton from "@/components/layout/AddTrainingNavButton"
import AddFitnessSessionNavButton from "@/components/layout/AddFitnessSessionNavButton"
import AddActivityNavButton from "@/components/layout/AddActivityNavButton"
import AddTrainingResultNavButton, { type TrainingResultPlanOption } from "@/components/layout/AddTrainingResultNavButton"
import TeamAthletesNavButton, { type TeamAthlete } from "@/components/layout/TeamAthletesNavButton"
import CoachAthleteManagementNavButton from "@/components/layout/CoachAthleteManagementNavButton"
import MedicalRecordNavButton, { type AthleteMedicalRecord } from "@/components/layout/MedicalRecordNavButton"
import InjuryHistoryNavButton, { type MedicInjuryHistoryItem } from "@/components/layout/InjuryHistoryNavButton"
import ExportAuditNavButton from "@/components/layout/ExportAuditNavButton"
import MyProfileNavButton from "@/components/layout/MyProfileNavButton"
import AccountSettingsButton from "@/components/layout/AccountSettingsButton"
import FitnessWeeklyGoalNavButton from "@/components/layout/FitnessWeeklyGoalNavButton"
import FootballWeeklyGoalNavButton from "@/components/layout/FootballWeeklyGoalNavButton"
import NextMatchAnalysisNavButton from "@/components/layout/NextMatchAnalysisNavButton"
import { prisma } from "@/lib/prisma"
import type { SidebarWeeklyGoal } from "@/components/layout/DashboardLeftSidebar"

interface NavItem {
    label: string
    href: string
}

type BasicTeam = { id: number; name: string; stadium: string | null; country: string; continent: string }
type BasicCoach = { id: number; firstName: string; lastName: string; role: string; teamId: number | null; team: BasicTeam | null }
type BasicCompetition = { id: number; name: string }
type BasicFootballMatch = {
    id: number
    competitionId: number
    competition: { name: string }
    stage: string | null
    scoreHome: number | null
    scoreAway: number | null
    teamHome: { name: string }
    teamAway: { name: string }
}
type TrainingResultTrainingType = "fitness" | "fotbal"
type MatchDifficultyValue = "usor" | "mediu" | "greu"
type TeamFormationValue = "4-3-3" | "4-4-2" | "4-2-3-1" | "3-5-2" | "3-4-3" | "5-3-2"
function hasPostgresCode(error: unknown, code: string) {
    if (typeof error !== "object" || error === null) return false

    const directCode = "code" in error ? error.code : null
    const meta = "meta" in error ? error.meta : null
    const metaCode = typeof meta === "object" && meta !== null && "code" in meta ? meta.code : null

    return directCode === code || metaCode === code
}

const FOOTBALL_TRAINING_TYPE_LABELS: Record<string, string> = {
    tehnic: "Tehnic",
    fizic: "Fizic",
    tactic: "Tactic",
}

const FITNESS_TRAINING_TYPE_LABELS: Record<string, string> = {
    forta: "Forta",
    rezistenta: "Rezistenta",
    vitezare: "Viteza",
    flexibilitate: "Flexibilitate",
    coordonare: "Coordonare",
}

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
    weeklyGoal?: SidebarWeeklyGoal | null
    footballWeeklyGoal?: SidebarWeeklyGoal | null
}

const defaultNavItems: NavItem[] = [
    { label: "Adauga Utilizator", href: "#" },
    { label: "Gestiune Manageri", href: "/admin/manageri" },
    { label: "Adauga Competitie", href: "#" },
    { label: "Export Audit Curent", href: "#" },
    { label: "Gestioneaza Echipe", href: "manager-fotbal/echipe" },
    { label: "Gestioneaza Staff Echipe", href: "manager-fotbal/antrenori" },
    { label: "Gestioneaza Atleti", href: "manager-fotbal/invitatii" },
    { label: "Gestioneaza Meciuri", href: "manager-fotbal/meciuri" },
    { label: "Adauga Meci", href: "#" },
    { label: "Adauga rezultat Meci", href: "#" },
    { label: "Next Match Analysis", href: "/antrenor-fotbal" },
    { label: "Adauga antrenament", href: "/antrenor-fotbal/antrenamente" },
    { label: "Gestioneaza Antrenamente", href: "/antrenor-fotbal/antrenamente" },
    { label: "Gestioneaza Atletii", href: "#" },
    { label: "Fotbal Training Weekly Goal", href: "#" },
    { label: "Adauga Sesiune Fitness", href: "/antrenor-fitness/trainfit?open=new" },
    { label: "Gestioneaza Sesiune Fitness", href: "/antrenor-fitness/trainfit" },
    { label: "Fitness Weekly Goal", href: "#" },
    { label: "Adauga Dosar", href: "/medic/dosar-medical?open=new" },
    { label: "Gestioneaza Dosare Medicale", href: "/medic/dosar-medical" },
    { label: "Adauga Accidentare", href: "#" },
    { label: "Istoric Accidentari", href: "#" },
    { label: "Dosar Medical", href: "#" },
    { label: "Adauga Activitate", href: "/atlet-fotbal/activity?open=new" },
    { label: "+ Rezultat Antrenament", href: "" },
    { label: "Gestioneaza Activitati", href: "/atlet-fotbal/activity" },
    { label: "Profil Sportiv", href: "#" },
    { label: "Toti Atletii", href: "#" },
    { label: "Gestioneaza Activitati", href: "/atlet-tenis/activity" },
    { label: "Turnee Tenis", href: "/atlet-tenis/turnee" },
    { label: "Turneele mele", href: "/atlet-tenis/turnee/inscrieri" },
]

export default async function DashboardHeader({
    navItems = defaultNavItems,
    activeHref,
    weeklyGoal,
    footballWeeklyGoal,
}: DashboardHeaderProps) {
    const session = await getServerSession(authOptions)
    const teamAthleteRoles = ["antrenor_fotbal", "antrenor_fitness", "medic", "atlet_fotbal"]
    const canViewTeamAthletes = teamAthleteRoles.includes(session?.user?.role ?? "")
    let teamName: string | null = null
    let teamAthletes: TeamAthlete[] = []
    let footballTeams: BasicTeam[] = []
    let footballCoaches: BasicCoach[] = []
    let footballCompetitions: BasicCompetition[] = []
    let footballMatches: BasicFootballMatch[] = []
    let athleteMedicalRecords: AthleteMedicalRecord[] = []
    let medicInjuryHistory: MedicInjuryHistoryItem[] = []
    let athleteHasCardiacData = false
    let myProfileData: ProfileNavData | null = null
    let trainingResultPlans: TrainingResultPlanOption[] = []
    let accountSettingsData: AccountSettingsData | null = null
    let nextMatchAnalysisMatch = "Nu exista meci programat"
    let nextMatchAnalysisMatchId: number | null = null
    let nextMatchAnalysisDifficulty: MatchDifficultyValue = "mediu"
    let nextMatchAnalysisFormation: TeamFormationValue = "4-3-3"

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
            select: { id: true, name: true, stadium: true, country: true, continent: true },
            orderBy: { name: "asc" },
        })

        footballCompetitions = await prisma.competition.findMany({
            where: managerAssignment
                ? { sport: "fotbal", country: managerAssignment.country }
                : { sport: "fotbal", id: -1 },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        })

        footballMatches = await prisma.footballMatch.findMany({
            where: managerAssignment
                ? {
                    OR: [
                        { teamHome: { country: managerAssignment.country } },
                        { teamAway: { country: managerAssignment.country } },
                        { competition: { country: managerAssignment.country } },
                    ],
                }
                : { id: -1 },
            select: {
                id: true,
                competitionId: true,
                competition: { select: { name: true } },
                stage: true,
                scoreHome: true,
                scoreAway: true,
                teamHome: { select: { name: true } },
                teamAway: { select: { name: true } },
            },
            orderBy: { matchDate: "desc" },
        })

        const coachUsers = await prisma.user.findMany({
            where: { role: "antrenor_fotbal" },
            include: {
                profile: {
                    include: { team: { select: { id: true, name: true, stadium: true, country: true, continent: true } } },
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
                        id: true,
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

        if (session.user.role === "antrenor_fotbal" && profile?.team?.id) {
            const nextMatch = await prisma.footballMatch.findFirst({
                where: {
                    OR: [
                        { teamHomeId: profile.team.id },
                        { teamAwayId: profile.team.id },
                    ],
                    matchDate: {
                        gte: new Date(),
                    },
                },
                include: {
                    teamHome: true,
                    teamAway: true,
                },
                orderBy: {
                    matchDate: "asc",
                },
            })

            nextMatchAnalysisMatch = nextMatch
                ? nextMatch.teamHome.name + " vs " + nextMatch.teamAway.name
                : "Nu exista meci programat"
            nextMatchAnalysisMatchId = nextMatch?.id ?? null

            if (nextMatch) {
                try {
                    const analysisRows = await prisma.$queryRaw<{ match_difficulty: string | null; team_formation: string | null }[]>`
                        SELECT match_difficulty, team_formation
                        FROM football_matches
                        WHERE id = ${nextMatch.id}
                        LIMIT 1
                    `
                    const analysis = analysisRows[0]

                    if (analysis?.match_difficulty === "usor" || analysis?.match_difficulty === "mediu" || analysis?.match_difficulty === "greu") {
                        nextMatchAnalysisDifficulty = analysis.match_difficulty
                    }

                    if (
                        analysis?.team_formation === "4-3-3" ||
                        analysis?.team_formation === "4-4-2" ||
                        analysis?.team_formation === "4-2-3-1" ||
                        analysis?.team_formation === "3-5-2" ||
                        analysis?.team_formation === "3-4-3" ||
                        analysis?.team_formation === "5-3-2"
                    ) {
                        nextMatchAnalysisFormation = analysis.team_formation
                    }
                } catch (error) {
                    if (!hasPostgresCode(error, "42703")) throw error
                }
            }
        }
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

    if (session?.user?.role === "medic") {
        const medicProfile = await prisma.profile.findUnique({
            where: { userId: Number(session.user.id) },
            select: { teamId: true },
        })

        const records = await prisma.medicalRecord.findMany({
            where: medicProfile?.teamId
                ? {
                    athlete: {
                        user: {
                            profile: {
                                is: { teamId: medicProfile.teamId },
                            },
                        },
                    },
                }
                : { medicId: Number(session.user.id) },
            include: {
                athlete: {
                    include: {
                        user: {
                            include: {
                                profile: true,
                            },
                        },
                    },
                },
                injuries: true,
            },
            orderBy: { startDate: "desc" },
            take: 100,
        })

        medicInjuryHistory = records.flatMap((record) => {
            const athleteName = ((record.athlete.user.profile?.firstName ?? "") + " " + (record.athlete.user.profile?.lastName ?? "")).trim()
                || record.athlete.user.email

            return record.injuries.map((injury) => ({
                id: injury.id,
                athleteName,
                diagnosis: record.diagnosis,
                startDate: record.startDate.toISOString(),
                endDate: record.endDate?.toISOString() ?? null,
                isAvailable: record.isAvailable,
                injuryType: injury.injuryType,
                bodyPart: injury.bodyPart,
                severity: injury.severity,
                recoveryDays: injury.recoveryDays,
                notes: injury.notes,
            }))
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
                        restingHeartRate: true, maxHeartRate: true, teamId: true,
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
        if (session?.user?.role === "atlet_fotbal" && athleteProfile?.teamId) {
            const [footballTrainingPlans, fitnessTrainingPlans] = await Promise.all([
                prisma.trainingPlan.findMany({
                    where: {
                        creator: {
                            role: "antrenor_fotbal",
                            profile: { is: { teamId: athleteProfile.teamId } },
                        },
                    },
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        date: true,
                        creator: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
                    },
                    orderBy: { date: "desc" },
                    take: 100,
                }),
                prisma.fitnessPlan.findMany({
                    where: {
                        creator: {
                            role: "antrenor_fitness",
                            profile: { is: { teamId: athleteProfile.teamId } },
                        },
                    },
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        date: true,
                        creator: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
                    },
                    orderBy: { date: "desc" },
                    take: 100,
                }),
            ])

            const toCoachName = (creator: { email: string; profile: { firstName: string; lastName: string } | null }) => creator.profile
                ? `${creator.profile.firstName} ${creator.profile.lastName}`.trim()
                : creator.email
            const toPlanOption = (trainingType: TrainingResultTrainingType, plan: { id: number; title: string; type: string; date: Date; creator: { email: string; profile: { firstName: string; lastName: string } | null } }): TrainingResultPlanOption => ({
                id: plan.id,
                trainingType,
                title: plan.title,
                typeLabel: trainingType === "fotbal"
                    ? FOOTBALL_TRAINING_TYPE_LABELS[plan.type] ?? plan.type
                    : FITNESS_TRAINING_TYPE_LABELS[plan.type] ?? plan.type,
                date: plan.date.toISOString(),
                coachName: toCoachName(plan.creator),
            })

            trainingResultPlans = [
                ...fitnessTrainingPlans.map((plan) => toPlanOption("fitness", { ...plan, type: String(plan.type) })),
                ...footballTrainingPlans.map((plan) => toPlanOption("fotbal", { ...plan, type: String(plan.type) })),
            ]
        }
    }

    const isItemActive = (href: string) => Boolean(activeHref) && href !== "#" && href === activeHref

    const visibleNavItems = navItems.filter((item) =>
        item.label === "Toti Atletii"
            ? canViewTeamAthletes
            : ["Adauga Utilizator", "Gestiune Manageri", "Adauga Competitie", "Export Audit Curent"].includes(item.label)
                ? session?.user?.role === "admin_global"
                : ["Gestioneaza Echipe", "Gestioneaza Staff Echipe", "Gestioneaza Atleti", "Gestioneaza Meciuri", "Adauga Meci", "Adauga rezultat Meci"].includes(item.label)
                    ? session?.user?.role === "manager_fotbal"
                    : ["Next Match Analysis", "Adauga antrenament", "Gestioneaza Antrenamente", "Gestioneaza Atletii", "Fotbal Training Weekly Goal"].includes(item.label)
                        ? session?.user?.role === "antrenor_fotbal"
                        : ["Adauga Sesiune Fitness", "Gestioneaza Sesiune Fitness"].includes(item.label)
                            ? session?.user?.role === "antrenor_fitness"
                            : ["Fitness Weekly Goal"].includes(item.label)
                                ? session?.user?.role === "antrenor_fitness"
                                : ["Adauga Dosar", "Adauga Accidentare", "Istoric Accidentari", "Gestioneaza Dosare Medicale"].includes(item.label)
                                    ? session?.user?.role === "medic"
                                    : item.label === "Dosar Medical"
                                        ? session?.user?.role === "atlet_fotbal"
                                        : item.label === "Adauga Activitate"
                                            ? ["atlet_fotbal", "atlet_tenis"].includes(session?.user?.role ?? "")
                                            : item.label === "Gestioneaza Activitati"
                                                ? (session?.user?.role === "atlet_fotbal" && item.href.includes("atlet-fotbal")) || (session?.user?.role === "atlet_tenis" && item.href.includes("atlet-tenis"))
                                                : item.label === "+ Rezultat Antrenament"
                                                    ? session?.user?.role === "atlet_fotbal"
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
                            return <AddUserNavButton key={item.href + item.label} label={item.label} isActive={isItemActive(item.href)} />
                        }

                        if (item.label === "Adauga Competitie") {
                            return <AddCompetitionNavButton key={item.href + item.label} label={item.label} isActive={isItemActive(item.href)} />
                        }

                        if (item.label === "Export Audit Curent") {
                            return <ExportAuditNavButton key={item.href + item.label} label={item.label} isActive={isItemActive(item.href)} ignoreFilters={true} />
                        }

                        if (item.label === "Adauga Atleti") {
                            return <AddAthleteNavButton key={item.href + item.label} label={item.label} teams={footballTeams} isActive={isItemActive(item.href)} />
                        }

                        if (item.label === "Gestiune Antrenori") {
                            return <CoachManagementNavButton key={item.href + item.label} label={item.label} antrenori={footballCoaches} teams={footballTeams} isActive={isItemActive(item.href)} />
                        }

                        if (item.label === "Adauga Meci") {
                            return <AddMatchNavButton key={item.href + item.label} label={item.label} teams={footballTeams} competitions={footballCompetitions} isActive={isItemActive(item.href)} />
                        }


                        if (item.label === "Adauga rezultat Meci") {
                            return <AddMatchResultNavButton key={item.href + item.label} label={item.label} matches={footballMatches} isActive={isItemActive(item.href)} />
                        }
                        if (item.label === "Next Match Analysis") {
                            return <NextMatchAnalysisNavButton key={item.href + item.label} label={item.label} isActive={isItemActive(item.href)} nextMatch={nextMatchAnalysisMatch} nextMatchId={nextMatchAnalysisMatchId} initialMatchDifficulty={nextMatchAnalysisDifficulty} initialTeamFormation={nextMatchAnalysisFormation} />
                        }

                        if (item.label === "Adauga antrenament") {
                            return <AddTrainingNavButton key={item.href + item.label} label={item.label} isActive={isItemActive(item.href)} />
                        }

                        if (item.label === "Fotbal Training Weekly Goal") {
                            return <FootballWeeklyGoalNavButton key={item.href + item.label} label={item.label} isActive={isItemActive(item.href)} weekStart={footballWeeklyGoal?.weekStart} weekLabel={footballWeeklyGoal?.weekLabel} targetTrimp={footballWeeklyGoal?.targetTrimp} />
                        }

                        if (item.label === "Adauga Sesiune Fitness") {
                            return <AddFitnessSessionNavButton key={item.href + item.label} label={item.label} isActive={isItemActive(item.href)} />
                        }

                        if (item.label === "Fitness Weekly Goal") {
                            return <FitnessWeeklyGoalNavButton key={item.href + item.label} label={item.label} isActive={isItemActive(item.href)} weekStart={weeklyGoal?.weekStart} weekLabel={weeklyGoal?.weekLabel} targetTrimp={weeklyGoal?.targetTrimp} />
                        }

                        if (item.label === "Adauga Dosar") {
                            return <AddMedicalRecordNavButton key={item.href + item.label} label={item.label} isActive={isItemActive(item.href)} />
                        }

                        if (item.label === "Adauga Accidentare") {
                            return <AddInjuryNavButton key={item.href + item.label} label={item.label} isActive={isItemActive(item.href)} />
                        }

                        if (item.label === "Istoric Accidentari") {
                            return <InjuryHistoryNavButton key={item.href + item.label} label={item.label} records={medicInjuryHistory} />
                        }

                        if (item.label === "Adauga Activitate") {
                            return <AddActivityNavButton key={item.href + item.label} label={item.label} isActive={isItemActive(item.href)} hasCardiacData={athleteHasCardiacData} defaultSport={session?.user?.role === "atlet_tenis" ? "tenis" : "fotbal"} />
                        }

                        if (item.label === "+ Rezultat Antrenament") {
                            return <AddTrainingResultNavButton key={item.href + item.label} label={item.label} plans={trainingResultPlans} hasCardiacData={athleteHasCardiacData} isActive={isItemActive(item.href)} />
                        }

                        if (item.label === "Toti Atletii") {
                            return <TeamAthletesNavButton key={item.href + item.label} label={item.label} teamName={teamName} athletes={teamAthletes} />
                        }

                        if (item.label === "Gestioneaza Atletii") {
                            return <CoachAthleteManagementNavButton key={item.href + item.label} label={item.label} teamName={teamName} athletes={teamAthletes} />
                        }

                        if (item.label === "Dosar Medical") {
                            return <MedicalRecordNavButton key={item.href + item.label} label={item.label} records={athleteMedicalRecords} />
                        }

                        if (item.label === "Profil Sportiv" && myProfileData) {
                            return <MyProfileNavButton key={item.href + item.label} label={item.label} isActive={isItemActive(item.href)} initialData={myProfileData} />
                        }

                        return (
                            <Link key={item.href + item.label} href={item.href} className={isItemActive(item.href) ? "active" : ""}>
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>
            </div>
        </header>
    )
}




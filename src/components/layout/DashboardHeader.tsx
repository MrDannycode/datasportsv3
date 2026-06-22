import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import AddMedicalRecordNavButton from "@/components/layout/AddMedicalRecordNavButton"
import AddInjuryNavButton from "@/components/layout/AddInjuryNavButton"

interface NavItem {
    label: string
    href: string
}

interface DashboardHeaderProps {
    navItems?: NavItem[]
    activeHref?: string
}

const defaultNavItems: NavItem[] = [
    { label: "Adauga Utilizator", href: "#" },              //admin_global
    { label: "Adauga Competitie", href: "#" },
    { label: "Importa Atleti", href: "#" },                 //manager_fotbal
    { label: "Gestiune Antrenori", href: "#" },
    { label: "Adauga Meci", href: "#" },
    { label: "Adauga antrenament", href: "/antrenor-fotbal/antrenamente" }, //antrenor_fotbal
    { label: "Rapoarte Fitness", href: "#" },
    { label: "Adauga Sesiune Fitness", href: "#" },         //antrenor_fitness
    { label: "Adauga Sesiune Recuperare", href: "#" },
    { label: "Adauga Dosar", href: "/medic/dosar-medical?open=new" }, //medic
    { label: "Adauga Accidentare", href: "#" },
    { label: "Disponibilitate atleti", href: "#" },
    { label: "Istoric Accidentari", href: "#" },
    { label: "Dosar Medical", href: "#" },                  //atlet_fotbal
    { label: "Adauga Activitate", href: "#" },
    { label: "Feedback Daily", href: "#" },
    { label: "Toti Atletii", href: "#" },                   //la mai multe conturi
]

export default async function DashboardHeader({
    navItems = defaultNavItems,
    activeHref = "#",
}: DashboardHeaderProps) {
    const session = await getServerSession(authOptions)
    const visibleNavItems = navItems.filter((item) =>
        item.label === "Toti Atletii"
            ? ["antrenor_fotbal", "antrenor_fitness", "medic", "atlet_fotbal"].includes(session?.user?.role ?? "")
            :
        ["Adauga Utilizator", "Adauga Competitie"].includes(item.label)
            ? session?.user?.role === "admin_global"
            :
        ["Importa Atleti", "Gestiune Antrenori", "Adauga Meci"].includes(item.label)
            ? session?.user?.role === "manager_fotbal"
            :
        ["Adauga antrenament", "Rapoarte Fitness"].includes(item.label)
            ? session?.user?.role === "antrenor_fotbal"
            :
        ["Adauga Sesiune Fitness", "Adauga Sesiune Recuperare"].includes(item.label)
            ? session?.user?.role === "antrenor_fitness"
            :
        ["Adauga Dosar", "Adauga Accidentare", "Disponibilitate atleti", "Istoric Accidentari"].includes(item.label)
            ? session?.user?.role === "medic"
            :
        ["Dosar Medical", "Adauga Activitate", "Feedback Daily"].includes(item.label)
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
                    if (item.label === "Adauga Dosar") {
                        return (
                            <AddMedicalRecordNavButton
                                key={item.href + item.label}
                                label={item.label}
                                isActive={item.href === activeHref}
                            />
                        )
                    }

                    if (item.label === "Adauga Accidentare") {
                        return (
                            <AddInjuryNavButton
                                key={item.href + item.label}
                                label={item.label}
                                isActive={item.href === activeHref}
                            />
                        )
                    }

                    return (
                        <Link
                            key={item.href + item.label}
                            href={item.href}
                            className={item.href === activeHref ? "active" : ""}
                        >
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


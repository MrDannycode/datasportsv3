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
    { label: "Toti Atletii", href: "#" },
    { label: "Adauga Dosar", href: "/medic/dosar-medical?open=new" },
    { label: "Adauga Accidentare", href: "#" },
    { label: "Disponibilitate atleti", href: "#" },
    { label: "Istoric Accidentari", href: "#" },
]

export default async function DashboardHeader({
    navItems = defaultNavItems,
    activeHref = "#",
}: DashboardHeaderProps) {
    const session = await getServerSession(authOptions)
    const visibleNavItems = navItems.filter((item) =>
        ["Adauga Dosar", "Adauga Accidentare", "Disponibilitate atleti", "Istoric Accidentari"].includes(item.label)
            ? session?.user?.role === "medic"
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

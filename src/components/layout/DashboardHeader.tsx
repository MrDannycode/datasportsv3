import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Link from "next/link"

interface NavItem {
    label: string
    href: string
}

interface DashboardHeaderProps {
    navItems?: NavItem[]
    activeHref?: string
}

const defaultNavItems: NavItem[] = [
    { label: "Health info", href: "#" },
    { label: "Activities", href: "#" },
    { label: "Statistics", href: "#" },
    { label: "+ Add new activity", href: "#" },
    { label: "Health feedback", href: "#" },
]

export default async function DashboardHeader({
    navItems = defaultNavItems,
    activeHref = "#",
}: DashboardHeaderProps) {
    const session = await getServerSession(authOptions)

    return (
        <header className="sd-header">
            <div className="sd-logo">
                <strong>SportsData</strong>
            </div>

            <nav className="sd-nav">
                {navItems.map((item) => (
                    <Link
                        key={item.href + item.label}
                        href={item.href}
                        className={item.href === activeHref ? "active" : ""}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="sd-user-info">
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

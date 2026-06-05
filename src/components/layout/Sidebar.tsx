"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    LayoutDashboard,
    Users,
    Shield,
    ClipboardList,
    Swords,
    Dumbbell,
    BarChart2,
    HeartPulse,
    Bandage,
    UserCircle,
    LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

type Role = "ADMIN" | "MANAGER" | "ANTRENOR" | "MEDIC" | "ATLET";

type NavItem = {
    label: string;
    href: string;
    icon: React.ReactNode;
};

const navByRole: Record<Role, NavItem[]> = {
    ADMIN: [
        { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
        { label: "Utilizatori", href: "/dashboard/utilizatori", icon: <Users size={18} /> },
        { label: "Echipe", href: "/dashboard/echipe", icon: <Shield size={18} /> },
        { label: "Audit Logs", href: "/dashboard/audit", icon: <ClipboardList size={18} /> },
    ],
    MANAGER: [
        { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
        { label: "Echipe", href: "/dashboard/echipe", icon: <Shield size={18} /> },
        { label: "Meciuri", href: "/dashboard/meciuri", icon: <Swords size={18} /> },
    ],
    ANTRENOR: [
        { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
        { label: "Antrenamente", href: "/dashboard/antrenamente", icon: <Dumbbell size={18} /> },
        { label: "Statistici", href: "/dashboard/statistici", icon: <BarChart2 size={18} /> },
    ],
    MEDIC: [
        { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
        { label: "Dosare Medicale", href: "/dashboard/dosare", icon: <HeartPulse size={18} /> },
        { label: "Accidentări", href: "/dashboard/accidentari", icon: <Bandage size={18} /> },
    ],
    ATLET: [
        { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
        { label: "Statistici", href: "/dashboard/statistici", icon: <BarChart2 size={18} /> },
        { label: "Profil", href: "/dashboard/profil", icon: <UserCircle size={18} /> },
    ],
};

export function Sidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();

    const role = session?.user?.role as Role | undefined;
    const items = role ? (navByRole[role] || []) : [];

    return (
        <aside className="flex h-screen w-56 flex-col border-r border-gray-200 bg-white">
            {/* Logo */}
            <div className="border-b border-gray-200 px-5 py-4">
                <span className="text-sm font-semibold text-gray-900">SportApp</span>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="space-y-1">
                    {items.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive
                                            ? "bg-gray-100 font-medium text-gray-900"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* User + Logout */}
            <div className="border-t border-gray-200 px-3 py-4">
                <div className="mb-3 px-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                    <LogOut size={18} />
                    Deconectare
                </button>
            </div>
        </aside>
    );
}
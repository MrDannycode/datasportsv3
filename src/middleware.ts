import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const roleRoutes: Record<string, string> = {
    admin_global: "/admin",
    manager_fotbal: "/manager-fotbal",
    manager_tenis: "/manager-tenis",
    antrenor_fotbal: "/antrenor-fotbal",
    antrenor_fitness: "/antrenor-fitness",
    medic: "/medic",
    atlet_fotbal: "/atlet-fotbal",
    atlet_tenis: "/atlet-tenis",
}

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const { pathname } = req.nextUrl

    // Nerautentificat → redirect la login
    if (!token && pathname !== "/login") {
        return NextResponse.redirect(new URL("/login", req.url))
    }

    // Autentificat pe /login → redirect la dashboard-ul rolului
    if (token && pathname === "/login") {
        const role = token.role as string
        const destination = roleRoutes[role] ?? "/login"
        return NextResponse.redirect(new URL(destination, req.url))
    }

    // Autentificat pe rută greșită → redirect la dashboard-ul propriu
    if (token) {
        const role = token.role as string
        const allowedPrefix = roleRoutes[role]
        if (allowedPrefix && !pathname.startsWith(allowedPrefix)) {
            return NextResponse.redirect(new URL(allowedPrefix, req.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/((?!api|_next|fonts|icons|favicon.ico).*)"],
}
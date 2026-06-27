import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Parola", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                })

                if (!user) return null

                const passwordMatch = await bcrypt.compare(
                    credentials.password,
                    user.passwordHash
                )

                if (!passwordMatch) return null

                await prisma.auditLog.create({
                    data: {
                        userId: user.id,
                        action: "login",
                        tableAffected: "users",
                        recordId: user.id,
                        details: { email: user.email, role: user.role },
                    },
                })

                return {
                    id: String(user.id),
                    email: user.email,
                    role: user.role,
                }
            },
        }),
    ],
    events: {
        async signOut(message) {
            if (!("token" in message) || !message.token?.id) {
                return
            }

            const userId = Number(message.token.id)
            if (!Number.isFinite(userId)) {
                return
            }

            await prisma.auditLog.create({
                data: {
                    userId,
                    action: "logout",
                    tableAffected: "users",
                    recordId: userId,
                    details: { email: message.token.email ?? null, role: message.token.role ?? null },
                },
            })
        },
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string
                session.user.role = token.role as string
            }
            return session
        },
    },
}
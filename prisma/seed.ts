import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    const hash = await bcrypt.hash("parola123", 10)

    await prisma.user.upsert({
        where: { email: "admin@test.com" },
        update: {},
        create: {
            email: "admin@test.com",
            passwordHash: hash,
            role: "admin_global",
        },
    })

    await prisma.user.upsert({
        where: { email: "atlet@test.com" },
        update: {},
        create: {
            email: "atlet@test.com",
            passwordHash: hash,
            role: "atlet_fotbal",
        },
    })

    console.log("Useri creati cu succes!")
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
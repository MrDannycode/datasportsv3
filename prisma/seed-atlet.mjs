// One-time script to add atlet_fotbal user
// Run with: node prisma/seed-atlet.mjs
import { createRequire } from "module"
const require = createRequire(import.meta.url)

const { Pool } = require("pg")
const bcrypt = require("bcryptjs")
import("dotenv/config").catch(() => {})

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
    const hash = await bcrypt.hash("parola123", 10)

    // Upsert atlet_fotbal user
    await pool.query(
        `INSERT INTO "User" (email, "passwordHash", role)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO NOTHING`,
        ["atlet@test.com", hash, "atlet_fotbal"]
    )

    console.log("atlet@test.com / parola123 created with role atlet_fotbal")
    await pool.end()
}

main().catch(e => { console.error(e); process.exit(1) })

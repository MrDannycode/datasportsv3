const { Pool } = require("pg")
const bcrypt = require("bcryptjs")
require("dotenv").config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
    const hash = await bcrypt.hash("parola123", 10)

    const result = await pool.query(
        `INSERT INTO users (email, password_hash, role, updated_at)
         VALUES ($1, $2, $3::\"Role\", NOW())
         ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, password_hash = EXCLUDED.password_hash, updated_at = NOW()
         RETURNING id, email, role`,
        ["atlet@test.com", hash, "atlet_fotbal"]
    )

    console.log("Done:", result.rows[0])
    await pool.end()
}

main().catch(e => { console.error(e); process.exit(1) })

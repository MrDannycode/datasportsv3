/**
 * prisma/seed-useri-main.ts
 *
 * Creeaza / Actualizeaza conturile de test specificate, fiecare cu parola proprie.
 *
 * Rulare directa (necesita ts-node):
 *   npx ts-node prisma/seed-useri-main.ts
 *
 * Sau integrat cu Prisma, in package.json:
 *   "prisma": { "seed": "ts-node prisma/seed-useri-main.ts" }
 * si ruleaza cu:
 *   npx prisma db seed
 */
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

interface TestUser {
  email: string;
  role: Role;
  password: string;
}

const testUsers: TestUser[] = [
  {
    email: 'AdminGlobal@datasports.test',
    role: Role.admin_global,
    password: 'adminglobal',
  },
  {
    email: 'MngFtbRomania@datasports.test',
    role: Role.manager_fotbal,
    password: 'mngftbromania',
  },
  {
    email: 'DorinelMunteanu@datasports.test',
    role: Role.antrenor_fotbal,
    password: 'dorinelmunteanuog',
  },
  {
    email: 'FitnesOtelGl@datasports.test',
    role: Role.antrenor_fitness,
    password: 'fitnesotelgl',
  },
  {
    email: 'MedicOtelGl@datasports.test',
    role: Role.medic,
    password: 'medicotelgl',
  },
];

async function main(): Promise<void> {
  console.log('Incep seed-ul pentru conturile de test...\n');

  for (const u of testUsers) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const cleanEmail = u.email.trim();

    const existing = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          email: cleanEmail,
          passwordHash,
          role: u.role,
        },
      });
      console.log(`UPDATED - ${updated.email} (rol: ${u.role}, id=${updated.id})`);
    } else {
      const created = await prisma.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          role: u.role,
        },
      });
      console.log(`OK      - ${created.email} (rol: ${u.role}, id=${created.id})`);
    }
  }

  console.log('\nGata.');
}

main()
  .catch((err) => {
    console.error('Eroare la seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
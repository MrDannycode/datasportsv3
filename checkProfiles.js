require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const users = await prisma.user.findMany({ 
    where: { role: 'atlet_fotbal' }, 
    include: { profile: true } 
  });
  console.log(JSON.stringify(users, null, 2));

  // If the test user doesn't have a profile, create one
  for (const u of users) {
    if (!u.profile) {
      console.log(`Creating profile for user ${u.email}`);
      await prisma.profile.create({
        data: {
            userId: u.id,
            firstName: "Test",
            lastName: "Atlet"
        }
      });
      console.log(`Created profile for user ${u.email}`);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());

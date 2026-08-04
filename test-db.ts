import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
    const teams = await prisma.team.findMany({distinct: ['continent'], select: {continent: true}});
    const competitions = await prisma.competition.findMany({distinct: ['name'], select: {name: true}});
    console.log('Teams continents:', teams);
    console.log('Competitions names:', competitions);
}

main().finally(() => prisma.$disconnect());

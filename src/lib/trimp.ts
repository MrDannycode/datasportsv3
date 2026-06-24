/**
 * trimp.ts — Librărie de calcul Training Load
 */

import { PrismaClient, Gender } from "@prisma/client";

const TAU_ATL = 7;
const TAU_CTL = 42;
const K_ATL = 1 - Math.exp(-1 / TAU_ATL);
const K_CTL = 1 - Math.exp(-1 / TAU_CTL);

export function calculateTRIMP(
  durationMin: number,
  avgHR: number | null | undefined,
  restHR: number | null | undefined,
  maxHR: number | null | undefined,
  gender: Gender | null | undefined
): number | null {
  if (!avgHR || !restHR || !maxHR) return null;
  if (maxHR <= restHR) return null;
  if (avgHR < restHR || avgHR > maxHR) return null;

  const hrr = (avgHR - restHR) / (maxHR - restHR);
  const y = gender === "FEMALE" ? 1.92 : 1.67;
  const trimp = durationMin * hrr * 0.64 * Math.exp(y * hrr);

  return Math.round(trimp * 100) / 100;
}

export function calculateEWMA(
  prevEWMA: number,
  newValue: number,
  k: number
): number {
  const result = prevEWMA + k * (newValue - prevEWMA);
  return Math.round(result * 10000) / 10000;
}

export function calculateMonotony(trimpValues: number[]): number | null {
  if (trimpValues.length < 2) return null;

  const avg = trimpValues.reduce((a, b) => a + b, 0) / trimpValues.length;
  const variance =
    trimpValues.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) /
    trimpValues.length;
  const stddev = Math.sqrt(variance);

  if (stddev === 0) return null;

  return Math.round((avg / stddev) * 10000) / 10000;
}

export async function recalculateDailyLoads(
  prisma: PrismaClient,
  athleteId: number,
  fromDate: Date
): Promise<void> {
  const startDate = new Date(fromDate);
  startDate.setUTCHours(0, 0, 0, 0);

  const today = new Date();
  today.setUTCHours(23, 59, 59, 999);

  const dayBeforeStart = new Date(startDate);
  dayBeforeStart.setUTCDate(dayBeforeStart.getUTCDate() - 1);

  const seedLoad = await prisma.dailyLoad.findFirst({
    where: {
      athleteId,
      date: { lte: dayBeforeStart },
    },
    orderBy: { date: "desc" },
  });

  let prevATL = seedLoad?.atl ?? 0;
  let prevCTL = seedLoad?.ctl ?? 0;

  const activities = await prisma.activity.findMany({
    where: {
      athleteId,
      date: { gte: startDate, lte: today },
    },
    orderBy: { date: "asc" },
  });

  const trimpByDay = new Map<string, number>();
  for (const act of activities) {
    if (act.trimp == null) continue;
    const key = act.date.toISOString().slice(0, 10);
    trimpByDay.set(key, (trimpByDay.get(key) ?? 0) + act.trimp);
  }

  const endDate = new Date(today);
  endDate.setUTCHours(0, 0, 0, 0);

  const last7: number[] = [];

  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const key = cursor.toISOString().slice(0, 10);
    const dayTRIMP = trimpByDay.get(key) ?? 0;

    const atl = calculateEWMA(prevATL, dayTRIMP, K_ATL);
    const ctl = calculateEWMA(prevCTL, dayTRIMP, K_CTL);
    const tsb = ctl - atl;
    const acRatio = ctl > 0 ? Math.round((atl / ctl) * 10000) / 10000 : 0;

    last7.push(dayTRIMP);
    if (last7.length > 7) last7.shift();

    const monotony = calculateMonotony(last7);
    const strain =
      monotony != null
        ? Math.round(last7.reduce((a, b) => a + b, 0) * monotony * 100) / 100
        : null;

    const dateOnly = new Date(cursor);
    await prisma.dailyLoad.upsert({
      where: {
        athleteId_date: {
          athleteId,
          date: dateOnly,
        },
      },
      create: {
        athleteId,
        date: dateOnly,
        trimp: dayTRIMP,
        atl,
        ctl,
        tsb,
        acRatio,
        monotony,
        strain,
      },
      update: {
        trimp: dayTRIMP,
        atl,
        ctl,
        tsb,
        acRatio,
        monotony,
        strain,
      },
    });

    prevATL = atl;
    prevCTL = ctl;

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
}

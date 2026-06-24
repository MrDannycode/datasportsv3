import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const athleteIdParam = searchParams.get("athleteId");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const limitParam = searchParams.get("limit");

  if (!athleteIdParam) {
    return NextResponse.json(
      { error: "Parametru obligatoriu lipsă: athleteId" },
      { status: 400 }
    );
  }

  const athleteId = parseInt(athleteIdParam, 10);
  if (isNaN(athleteId)) {
    return NextResponse.json({ error: "athleteId invalid" }, { status: 400 });
  }

  const defaultFrom = new Date();
  defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 90);
  defaultFrom.setUTCHours(0, 0, 0, 0);

  const defaultTo = new Date();
  defaultTo.setUTCHours(23, 59, 59, 999);

  const fromDate = fromParam ? new Date(fromParam) : defaultFrom;
  const toDate = toParam ? new Date(toParam) : defaultTo;

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return NextResponse.json(
      { error: "Format dată invalid. Folosiți ISO 8601 (ex: 2024-01-15)" },
      { status: 400 }
    );
  }

  if (fromDate > toDate) {
    return NextResponse.json(
      { error: "'from' trebuie să fie anterior sau egal cu 'to'" },
      { status: 400 }
    );
  }

  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 500) : 100;

  const profile = await prisma.profile.findUnique({
    where: { id: athleteId },
    select: { id: true, firstName: true, lastName: true },
  });

  if (!profile) {
    return NextResponse.json(
      { error: `Profilul cu id=${athleteId} nu există` },
      { status: 404 }
    );
  }

  const dailyLoads = await prisma.dailyLoad.findMany({
    where: {
      athleteId,
      date: {
        gte: fromDate,
        lte: toDate,
      },
    },
    orderBy: { date: "asc" },
    take: limit,
  });

  const lastLoad = dailyLoads[dailyLoads.length - 1] ?? null;

  return NextResponse.json({
    athlete: {
      id: profile.id,
      name: `${profile.firstName} ${profile.lastName}`,
    },
    period: {
      from: fromDate.toISOString().slice(0, 10),
      to: toDate.toISOString().slice(0, 10),
    },
    summary: lastLoad
      ? {
          latestDate: lastLoad.date,
          atl: lastLoad.atl,
          ctl: lastLoad.ctl,
          tsb: lastLoad.tsb,
          acRatio: lastLoad.acRatio,
          monotony: lastLoad.monotony,
          strain: lastLoad.strain,
          formStatus:
            lastLoad.tsb > 10
              ? "fresh"
              : lastLoad.tsb > -10
                ? "optimal"
                : lastLoad.tsb > -30
                  ? "fatigued"
                  : "overreached",
          workloadRisk:
            lastLoad.acRatio < 0.8
              ? "detraining"
              : lastLoad.acRatio <= 1.3
                ? "safe"
                : lastLoad.acRatio <= 1.5
                  ? "caution"
                  : "high_risk",
        }
      : null,
    dailyLoads,
    count: dailyLoads.length,
  });
}

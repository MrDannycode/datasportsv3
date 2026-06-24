import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateTRIMP, recalculateDailyLoads } from "@/lib/trimp";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const allowedRoles = ["admin_global", "antrenor_fitness", "antrenor_fotbal"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Acces interzis" }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalid" }, { status: 400 });
  }

  const { athleteId, date, durationMin, avgHeartRate, sport, notes } = body;

  if (!athleteId || !date || !durationMin) {
    return NextResponse.json(
      { error: "Câmpuri obligatorii lipsă: athleteId, date, durationMin" },
      { status: 400 }
    );
  }

  if (durationMin <= 0) {
    return NextResponse.json(
      { error: "durationMin trebuie să fie pozitiv" },
      { status: 400 }
    );
  }

  const profile = await prisma.profile.findUnique({
    where: { id: athleteId },
    select: {
      id: true,
      restingHeartRate: true,
      maxHeartRate: true,
      gender: true,
    },
  });

  if (!profile) {
    return NextResponse.json(
      { error: `Profilul cu id=${athleteId} nu există` },
      { status: 404 }
    );
  }

  const trimp = calculateTRIMP(
    durationMin,
    avgHeartRate ?? null,
    profile.restingHeartRate,
    profile.maxHeartRate,
    profile.gender
  );

  const activityDate = new Date(date);

  const activity = await prisma.activity.create({
    data: {
      athleteId,
      date: activityDate,
      durationMin,
      avgHeartRate: avgHeartRate ?? null,
      sport: sport ?? null,
      notes: notes ?? null,
      trimp,
    },
  });

  await recalculateDailyLoads(prisma, athleteId, activityDate);

  return NextResponse.json(
    {
      activity,
      trimpCalculated: trimp !== null,
    },
    { status: 201 }
  );
}

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

  const where: any = { athleteId };

  if (fromParam || toParam) {
    where.date = {};
    if (fromParam) where.date.gte = new Date(fromParam);
    if (toParam) where.date.lte = new Date(toParam);
  }

  const limit = limitParam ? parseInt(limitParam, 10) : 100;

  const activities = await prisma.activity.findMany({
    where,
    orderBy: { date: "desc" },
    take: Math.min(limit, 500),
  });

  return NextResponse.json({ activities, count: activities.length });
}

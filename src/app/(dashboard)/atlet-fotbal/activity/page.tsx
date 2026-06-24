import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import ActivityManager from "./ActivityManager"

interface ActivityPageProps {
  searchParams?: Promise<{ open?: string }>
}

export default async function ActivityPage({ searchParams }: ActivityPageProps) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "atlet_fotbal") {
    redirect("/login")
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const userId = Number(session.user.id)

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      restingHeartRate: true,
      maxHeartRate: true,
      gender: true,
    },
  })

  if (!profile) redirect("/login")

  const activities = await prisma.activity.findMany({
    where: { athleteId: profile.id },
    orderBy: { date: "desc" },
    take: 50,
    select: {
      id: true,
      date: true,
      durationMin: true,
      avgHeartRate: true,
      sport: true,
      notes: true,
      trimp: true,
    },
  })

  const latestLoad = await prisma.dailyLoad.findFirst({
    where: { athleteId: profile.id },
    orderBy: { date: "desc" },
    select: {
      id: true,
      date: true,
      trimp: true,
      atl: true,
      ctl: true,
      tsb: true,
      acRatio: true,
      monotony: true,
      strain: true,
    },
  })

  return (
    <main>
      <div className="sd-page-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1>Activitatile mele</h1>
          <p style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
            {profile.firstName} {profile.lastName} - Training Load Dashboard
          </p>
        </div>
        <Link
          href="/atlet-fotbal"
          style={{
            fontSize: "13px",
            color: "#0056b3",
            textDecoration: "none",
            border: "1px solid #0056b3",
            padding: "6px 14px",
          }}
        >
          Inapoi la Dashboard
        </Link>
      </div>

      <ActivityManager
        initialActivities={activities.map((activity) => ({
          ...activity,
          date: activity.date.toISOString(),
          avgHeartRate: activity.avgHeartRate ?? null,
        }))}
        latestLoad={
          latestLoad
            ? {
                ...latestLoad,
                date: latestLoad.date.toISOString(),
              }
            : null
        }
        profile={{
          restingHeartRate: profile.restingHeartRate ?? null,
          maxHeartRate: profile.maxHeartRate ?? null,
          gender: profile.gender ?? null,
        }}
        shouldOpenNewActivityModal={resolvedSearchParams?.open === "new"}
      />
    </main>
  )
}
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import ActivityManager from "@/app/(dashboard)/atlet-fotbal/activity/ActivityManager"

interface ActivityPageProps {
  searchParams?: Promise<{ open?: string }>
}

export default async function ActivityPage({ searchParams }: ActivityPageProps) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "atlet_tenis") {
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
      <div className="sd-box">
        <div className="sd-box-header">
          <Link href="/atlet-tenis" className="sd-btn-secondary">Inapoi</Link>
          <h2 className="flex-1 text-center">Gestioneaza Activitati</h2>
          <div className="sd-btn-secondary invisible">Inapoi</div>
        </div>
        <div className="sd-box-content">

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
        </div>
      </div>
    </main>
  )
}

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { matchesTournamentDate, matchesTournamentRegion, normalizeTournamentFilters } from "@/lib/tournament-filters"
import { matchesTournamentGender, matchesTournamentSource } from "@/lib/tournament-gender"
import {
    buildTournamentSourceUrl,
    getItfAcceptanceList,
    getItfCalendar,
    ItfApiError,
    mapSurface,
} from "@/lib/itf-tournaments"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !["atlet_tenis", "admin_global"].includes(session.user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    try {
        const body = await request.json().catch(() => ({}))
        const filters = normalizeTournamentFilters({
            country: typeof body?.country === "string" ? body.country : "",
            continent: typeof body?.continent === "string" ? body.continent : "",
            dateFrom: typeof body?.dateFrom === "string" ? body.dateFrom : "",
        })

        let athleteGender: "MALE" | "FEMALE" | null = null

        if (session.user.role === "atlet_tenis") {
            const profile = await prisma.profile.findUnique({
                where: { userId: Number(session.user.id) },
                select: { gender: true },
            })

            athleteGender = profile?.gender ?? null
        }

        const calendarItems = await getItfCalendar(athleteGender, filters)
        const tournamentsToSync = calendarItems.filter((tournament) =>
            matchesTournamentGender({ externalId: tournament.tournamentKey }, athleteGender) &&
            matchesTournamentRegion({ location: `${tournament.location}, ${tournament.hostNation}` }, filters) &&
            matchesTournamentDate({ startDate: tournament.startDate }, filters.dateFrom)
        )

        let synced = 0
        let playersUpserted = 0
        const skippedTournaments: string[] = []

        for (const tournamentItem of tournamentsToSync) {
            try {
                const acceptancePlayers = await getItfAcceptanceList(
                    tournamentItem.tournamentKey,
                    tournamentItem.tennisCategoryCode
                )

                const tournament = await prisma.tournament.upsert({
                    where: { externalId: tournamentItem.tournamentKey },
                    update: {
                        name: tournamentItem.tournamentName,
                        location: `${tournamentItem.location}, ${tournamentItem.hostNation}`,
                        surface: mapSurface(tournamentItem.surfaceCode),
                        startDate: new Date(tournamentItem.startDate),
                        endDate: tournamentItem.endDate ? new Date(tournamentItem.endDate) : null,
                        sourceUrl: buildTournamentSourceUrl(tournamentItem.tournamentLink),
                        lastSyncAt: new Date(),
                    },
                    create: {
                        externalId: tournamentItem.tournamentKey,
                        name: tournamentItem.tournamentName,
                        location: `${tournamentItem.location}, ${tournamentItem.hostNation}`,
                        surface: mapSurface(tournamentItem.surfaceCode),
                        startDate: new Date(tournamentItem.startDate),
                        endDate: tournamentItem.endDate ? new Date(tournamentItem.endDate) : null,
                        sourceUrl: buildTournamentSourceUrl(tournamentItem.tournamentLink),
                        lastSyncAt: new Date(),
                    },
                })

                await prisma.tournamentPlayer.deleteMany({
                    where: { tournamentId: tournament.id },
                })

                if (acceptancePlayers.length > 0) {
                    await prisma.tournamentPlayer.createMany({
                        data: acceptancePlayers.map((player) => ({
                            tournamentId: tournament.id,
                            playerName: player.playerName,
                            atpWtaRanking: player.atpWtaRanking,
                            nationality: player.nationality,
                        })),
                    })
                }

                playersUpserted += acceptancePlayers.length
                synced += 1
            } catch (error) {
                skippedTournaments.push(tournamentItem.tournamentName)
                console.error("[tournaments/sync] skipped tournament", {
                    tournamentKey: tournamentItem.tournamentKey,
                    tournamentName: tournamentItem.tournamentName,
                    error,
                })
            }
        }

        const adminCompetitions = await prisma.competition.findMany({
            where: { sport: "tenis" }
        })

        for (const comp of adminCompetitions) {
            const startDate = comp.startDate ?? new Date()
            const location = `${comp.country}, ${comp.continent}`

            if (
                matchesTournamentRegion({ location }, filters) &&
                matchesTournamentDate({ startDate }, filters.dateFrom)
            ) {
                const externalId = `comp-${comp.id}`
                try {
                    await prisma.tournament.upsert({
                        where: { externalId },
                        update: {
                            name: comp.name,
                            location,
                            startDate,
                            endDate: comp.endDate,
                            sourceUrl: "platforma web",
                            lastSyncAt: new Date(),
                        },
                        create: {
                            externalId,
                            name: comp.name,
                            location,
                            startDate,
                            endDate: comp.endDate,
                            sourceUrl: "platforma web",
                            lastSyncAt: new Date(),
                        }
                    })
                    synced += 1
                } catch (error) {
                    skippedTournaments.push(comp.name)
                    console.error("[tournaments/sync] skipped admin competition", { id: comp.id, error })
                }
            }
        }

        return NextResponse.json({
            success: true,
            tourneeSincronizate: synced,
            jucatoriActualizati: playersUpserted,
            timestamp: new Date().toISOString(),
            source: "itftennis.com",
            onlyItf: tournamentsToSync.every((tournament) =>
                matchesTournamentSource({ sourceUrl: buildTournamentSourceUrl(tournament.tournamentLink) })
            ),
            skippedTournaments,
        })
    } catch (error) {
        console.error("[tournaments/sync] sync failed", error)

        if (error instanceof ItfApiError) {
            return NextResponse.json(
                {
                    error: "ITF a returnat un raspuns invalid. Incearca din nou peste cateva minute.",
                    details: {
                        status: error.status ?? null,
                        responseType: error.responseType ?? null,
                    },
                },
                { status: 502 }
            )
        }

        return NextResponse.json(
            { error: "Sincronizarea turneelor a esuat temporar." },
            { status: 500 }
        )
    }
}


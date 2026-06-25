import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

/**
 * Mock data realistă cu turnee ATP/WTA 2025.
 * Structura este identică cu ce ar returna un pipeline real
 * (RapidAPI Tennis + scraping + Claude LLM).
 * Pentru conectarea la API-uri reale, înlocuieste această funcție
 * cu apeluri reale și păstrează același tip de date returnat.
 */
type MockTournament = {
    externalId: string
    name: string
    location: string
    surface: "zgura" | "iarba" | "hard"
    startDate: Date
    endDate: Date
    sourceUrl: string
    players: { playerName: string; atpWtaRanking: number; nationality: string }[]
}

function getMockTournaments(): MockTournament[] {
    const now = new Date()
    const addDays = (d: Date, n: number) => {
        const r = new Date(d)
        r.setDate(r.getDate() + n)
        return r
    }

    return [
        // ---- GREU: turneu cu jucători de elită (media ranking ≤ 50) ----
        {
            externalId: "wimbledon-2025",
            name: "Wimbledon 2025",
            location: "Londra, Marea Britanie",
            surface: "iarba",
            startDate: addDays(now, 14),
            endDate: addDays(now, 28),
            sourceUrl: "https://www.wimbledon.com",
            players: [
                { playerName: "Jannik Sinner", atpWtaRanking: 1, nationality: "ITA" },
                { playerName: "Carlos Alcaraz", atpWtaRanking: 2, nationality: "ESP" },
                { playerName: "Novak Djokovic", atpWtaRanking: 7, nationality: "SRB" },
                { playerName: "Alexander Zverev", atpWtaRanking: 3, nationality: "GER" },
                { playerName: "Daniil Medvedev", atpWtaRanking: 5, nationality: "RUS" },
                { playerName: "Andrey Rublev", atpWtaRanking: 8, nationality: "RUS" },
                { playerName: "Hubert Hurkacz", atpWtaRanking: 10, nationality: "POL" },
                { playerName: "Casper Ruud", atpWtaRanking: 9, nationality: "NOR" },
            ],
        },
        // ---- GREU: Grand Slam cu jucătoare de top WTA ----
        {
            externalId: "us-open-2025",
            name: "US Open 2025",
            location: "New York, SUA",
            surface: "hard",
            startDate: addDays(now, 45),
            endDate: addDays(now, 59),
            sourceUrl: "https://www.usopen.org",
            players: [
                { playerName: "Aryna Sabalenka", atpWtaRanking: 1, nationality: "BLR" },
                { playerName: "Iga Świątek", atpWtaRanking: 2, nationality: "POL" },
                { playerName: "Coco Gauff", atpWtaRanking: 3, nationality: "USA" },
                { playerName: "Elena Rybakina", atpWtaRanking: 4, nationality: "KAZ" },
                { playerName: "Jessica Pegula", atpWtaRanking: 5, nationality: "USA" },
                { playerName: "Jasmine Paolini", atpWtaRanking: 6, nationality: "ITA" },
                { playerName: "Mirra Andreeva", atpWtaRanking: 17, nationality: "RUS" },
                { playerName: "Karolina Muchova", atpWtaRanking: 19, nationality: "CZE" },
            ],
        },
        // ---- MEDIU: ATP 500 cu jucători 40-150 ----
        {
            externalId: "atp500-hamburg-2025",
            name: "Hamburg European Open 2025",
            location: "Hamburg, Germania",
            surface: "zgura",
            startDate: addDays(now, 7),
            endDate: addDays(now, 14),
            sourceUrl: "https://www.hamburgopen.de",
            players: [
                { playerName: "Francisco Cerundolo", atpWtaRanking: 22, nationality: "ARG" },
                { playerName: "Nicolas Jarry", atpWtaRanking: 38, nationality: "CHI" },
                { playerName: "Sebastian Baez", atpWtaRanking: 40, nationality: "ARG" },
                { playerName: "Alejandro Davidovich Fokina", atpWtaRanking: 45, nationality: "ESP" },
                { playerName: "Tomas Martin Etcheverry", atpWtaRanking: 60, nationality: "ARG" },
                { playerName: "Roberto Carballes Baena", atpWtaRanking: 82, nationality: "ESP" },
                { playerName: "Pedro Cachin", atpWtaRanking: 95, nationality: "ARG" },
                { playerName: "Yannick Hanfmann", atpWtaRanking: 130, nationality: "GER" },
            ],
        },
        // ---- USOR: Challenger cu jucători 150-400 ----
        {
            externalId: "challenger-geneva-2025",
            name: "Geneva Challenger 2025",
            location: "Geneva, Elveția",
            surface: "zgura",
            startDate: addDays(now, 21),
            endDate: addDays(now, 28),
            sourceUrl: "https://www.atpchallengergeneva.com",
            players: [
                { playerName: "Luca Van Assche", atpWtaRanking: 155, nationality: "FRA" },
                { playerName: "Dominic Stricker", atpWtaRanking: 180, nationality: "SUI" },
                { playerName: "Jesper de Jong", atpWtaRanking: 210, nationality: "NED" },
                { playerName: "Antoine Escoffier", atpWtaRanking: 250, nationality: "FRA" },
                { playerName: "Ivan Gakhov", atpWtaRanking: 280, nationality: "RUS" },
                { playerName: "Matteo Gigante", atpWtaRanking: 315, nationality: "ITA" },
                { playerName: "Harold Mayot", atpWtaRanking: 360, nationality: "FRA" },
                { playerName: "Tristan Lamasine", atpWtaRanking: 400, nationality: "FRA" },
            ],
        },
        // ---- MEDIU: WTA 250 ----
        {
            externalId: "wta250-budapest-2025",
            name: "Magyar Open Budapest 2025",
            location: "Budapesta, Ungaria",
            surface: "zgura",
            startDate: addDays(now, 35),
            endDate: addDays(now, 42),
            sourceUrl: "https://www.magyaropen.com",
            players: [
                { playerName: "Elina Svitolina", atpWtaRanking: 30, nationality: "UKR" },
                { playerName: "Aliaksandra Sasnovich", atpWtaRanking: 58, nationality: "BLR" },
                { playerName: "Viktoriya Tomova", atpWtaRanking: 75, nationality: "BUL" },
                { playerName: "Anna Bondar", atpWtaRanking: 90, nationality: "HUN" },
                { playerName: "Panna Udvardy", atpWtaRanking: 120, nationality: "HUN" },
                { playerName: "Dalma Galfi", atpWtaRanking: 145, nationality: "HUN" },
                { playerName: "Reka Luca Jani", atpWtaRanking: 160, nationality: "HUN" },
                { playerName: "Tamara Korpatsch", atpWtaRanking: 138, nationality: "GER" },
            ],
        },
    ]
}

export async function POST() {
    const session = await getServerSession(authOptions)
    if (
        !session ||
        !["manager_tenis", "admin_global"].includes(session.user.role)
    ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const mockTournaments = getMockTournaments()
    let synced = 0
    let playersUpserted = 0

    for (const t of mockTournaments) {
        // Upsert turneu (pe baza externalId)
        const tournament = await prisma.tournament.upsert({
            where: { externalId: t.externalId },
            update: {
                name: t.name,
                location: t.location,
                surface: t.surface,
                startDate: t.startDate,
                endDate: t.endDate,
                sourceUrl: t.sourceUrl,
                lastSyncAt: new Date(),
            },
            create: {
                externalId: t.externalId,
                name: t.name,
                location: t.location,
                surface: t.surface,
                startDate: t.startDate,
                endDate: t.endDate,
                sourceUrl: t.sourceUrl,
                lastSyncAt: new Date(),
            },
        })

        // Ştergem jucătorii existenţi şi reînscriem (listă fresh)
        await prisma.tournamentPlayer.deleteMany({
            where: { tournamentId: tournament.id },
        })

        await prisma.tournamentPlayer.createMany({
            data: t.players.map((p) => ({
                tournamentId: tournament.id,
                playerName: p.playerName,
                atpWtaRanking: p.atpWtaRanking,
                nationality: p.nationality,
            })),
        })

        playersUpserted += t.players.length
        synced++
    }

    return NextResponse.json({
        success: true,
        tourneeSincronizate: synced,
        jucatoriActualizati: playersUpserted,
        timestamp: new Date().toISOString(),
    })
}

import type { Gender, Surface } from "@prisma/client"

const ITF_BASE_URL = "https://www.itftennis.com"
const DEFAULT_WINDOW_DAYS = 120
const MAX_ACCEPTANCE_PLAYERS = 30

export class ItfApiError extends Error {
  status?: number
  responseType?: string
  responsePreview?: string

  constructor(message: string, options?: { status?: number; responseType?: string; responsePreview?: string }) {
    super(message)
    this.name = "ItfApiError"
    this.status = options?.status
    this.responseType = options?.responseType
    this.responsePreview = options?.responsePreview
  }
}

export type ItfCalendarItem = {
  category: string
  hostNation: string
  hostNationCode: string
  location: string
  name: string
  startDate: string
  endDate: string
  surfaceCode: string
  tennisCategoryCode: string
  tournamentKey: string
  tournamentLink: string
  tournamentName: string
}

type ItfAcceptancePlayer = {
  nationality?: string
  nationalityCode?: string
  givenName?: string
  familyName?: string
  atpWtaRank?: string | null
  itfWorldTennisRanking?: string | null
}

type ItfAcceptanceEntry = {
  players?: ItfAcceptancePlayer[] | null
}

type ItfAcceptanceClassification = {
  entries?: ItfAcceptanceEntry[] | null
}

type ItfAcceptanceGroup = {
  entries?: ItfAcceptanceEntry[] | null
  entryClassifications?: ItfAcceptanceClassification[] | null
}

type ItfCalendarFiltersResponse = {
  Nations?: Array<{ name: string; code: string }>
  Regions?: Array<{ name: string; code: string }>
}

export type ItfCalendarFilterOption = {
  label: string
  value: string
}

export type ItfCalendarOptions = {
  countries: ItfCalendarFilterOption[]
  continents: ItfCalendarFilterOption[]
}

function normalizeText(value?: string | null) {
  return value?.trim().toLocaleLowerCase() || ""
}

function buildDateRange(dateFrom?: string) {
  const start = dateFrom ? new Date(`${dateFrom}T00:00:00`) : new Date()
  const end = new Date(start)
  end.setDate(end.getDate() + DEFAULT_WINDOW_DAYS)

  return {
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: end.toISOString().slice(0, 10),
  }
}

function getCircuitCodes(gender: Gender | null | undefined) {
  if (gender === "MALE") return ["MT"]
  if (gender === "FEMALE") return ["WT"]
  return ["MT", "WT"]
}

function getCountryAliases() {
  return new Map<string, string>([
    ["belgia", "Belgium"],
    ["brazilia", "Brazil"],
    ["cehia", "Czechia"],
    ["danemarca", "Denmark"],
    ["elvetia", "Switzerland"],
    ["finlanda", "Finland"],
    ["franta", "France"],
    ["germania", "Germany"],
    ["indonezia", "Indonesia"],
    ["irlanda", "Ireland"],
    ["italia", "Italy"],
    ["japonia", "Japan"],
    ["kazahstan", "Kazakhstan"],
    ["marea britanie", "Great Britain"],
    ["maroc", "Morocco"],
    ["mexic", "Mexico"],
    ["norvegia", "Norway"],
    ["olanda", "Netherlands"],
    ["polonia", "Poland"],
    ["portugalia", "Portugal"],
    ["romania", "Romania"],
    ["spain", "Spain"],
    ["spania", "Spain"],
    ["suedia", "Sweden"],
    ["sua", "USA"],
    ["thailanda", "Thailand"],
    ["turcia", "Turkiye"],
    ["tunisia", "Tunisia"],
    ["ungaria", "Hungary"],
  ])
}

function getContinentAliases() {
  return new Map<string, string>([
    ["africa", "AFR"],
    ["asia", "ASI"],
    ["europa", "EUR"],
    ["europe", "EUR"],
    ["america de nord", "NA"],
    ["north america", "NA"],
    ["oceania", "OCE"],
    ["america de sud", "SAM"],
    ["south america", "SAM"],
    ["america centrala si caraibe", "CAC"],
    ["central america & caribbean", "CAC"],
  ])
}

async function fetchJson<T>(path: string) {
  const response = await fetch(`${ITF_BASE_URL}${path}`, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    },
    cache: "no-store",
  })

  const responseType = response.headers.get("content-type") ?? ""
  const rawBody = await response.text()

  if (!response.ok) {
    throw new ItfApiError(`ITF request failed: ${response.status} ${response.statusText}`, {
      status: response.status,
      responseType,
      responsePreview: rawBody.slice(0, 200),
    })
  }

  if (!responseType.toLocaleLowerCase().includes("application/json")) {
    throw new ItfApiError("ITF returned non-JSON content", {
      status: response.status,
      responseType,
      responsePreview: rawBody.slice(0, 200),
    })
  }

  try {
    return JSON.parse(rawBody) as T
  } catch {
    throw new ItfApiError("ITF returned invalid JSON", {
      status: response.status,
      responseType,
      responsePreview: rawBody.slice(0, 200),
    })
  }
}

function parseRanking(player: ItfAcceptancePlayer) {
  const candidates = [player.atpWtaRank, player.itfWorldTennisRanking]

  for (const candidate of candidates) {
    if (!candidate) continue
    const parsed = Number.parseInt(candidate, 10)
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed
    }
  }

  return null
}

export function mapSurface(surfaceCode?: string | null): Surface | null {
  switch ((surfaceCode ?? "").toUpperCase()) {
    case "C":
      return "zgura"
    case "G":
      return "iarba"
    case "H":
    case "A":
      return "hard"
    default:
      return null
  }
}

export function buildTournamentSourceUrl(tournamentLink: string) {
  const normalizedLink = tournamentLink.endsWith("/") ? tournamentLink : `${tournamentLink}/`
  return `${ITF_BASE_URL}${normalizedLink}acceptance-list/`
}

async function getRawCalendarFilters(gender: Gender | null | undefined, dateFrom?: string) {
  const circuits = getCircuitCodes(gender)
  const range = buildDateRange(dateFrom)
  const nations = new Map<string, { name: string; code: string }>()
  const regions = new Map<string, { name: string; code: string }>()

  for (const circuitCode of circuits) {
    const params = new URLSearchParams({
      circuitCode,
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
    })

    const data = await fetchJson<ItfCalendarFiltersResponse>(`/tennis/api/TournamentApi/GetCalendarFilters?${params.toString()}`)

    for (const nation of data.Nations ?? []) {
      if (!nations.has(nation.code)) {
        nations.set(nation.code, nation)
      }
    }

    for (const region of data.Regions ?? []) {
      if (!regions.has(region.code)) {
        regions.set(region.code, region)
      }
    }
  }

  return {
    nations: Array.from(nations.values()),
    regions: Array.from(regions.values()),
  }
}

export async function getItfCalendarOptions(gender: Gender | null | undefined, dateFrom?: string) {
  const data = await getRawCalendarFilters(gender, dateFrom)

  return {
    countries: data.nations
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((nation) => ({ label: nation.name, value: nation.name })),
    continents: data.regions
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((region) => ({ label: region.name, value: region.name })),
  } satisfies ItfCalendarOptions
}

export async function getItfNationAndRegionCodes(
  gender: Gender | null | undefined,
  filters: { country?: string; continent?: string; dateFrom?: string }
) {
  const data = await getRawCalendarFilters(gender, filters.dateFrom)
  const aliases = getCountryAliases()
  const continentAliases = getContinentAliases()
  const normalizedCountry = normalizeText(filters.country)
  const normalizedContinent = normalizeText(filters.continent)
  const canonicalCountry = aliases.get(normalizedCountry) ?? filters.country?.trim() ?? ""

  const nationCode = normalizedCountry
    ? data.nations.find((nation) => normalizeText(nation.name) === normalizeText(canonicalCountry))?.code ?? ""
    : ""

  const regionCode = normalizedContinent ? continentAliases.get(normalizedContinent) ?? "" : ""

  return {
    nationCode,
    regionCode,
  }
}

export async function getItfCalendar(
  gender: Gender | null | undefined,
  filters: { country?: string; continent?: string; dateFrom?: string }
) {
  const circuits = getCircuitCodes(gender)
  const range = buildDateRange(filters.dateFrom)
  const { nationCode, regionCode } = await getItfNationAndRegionCodes(gender, filters)
  const items: ItfCalendarItem[] = []

  for (const circuitCode of circuits) {
    const params = new URLSearchParams({
      circuitCode,
      searchString: "",
      skip: "0",
      take: "250",
      nationCodes: nationCode,
      zoneCodes: regionCode,
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
      indoorOutdoor: "",
      categories: "",
      isOrderAscending: "true",
      orderField: "",
      surfaceCodes: "",
      singlesDrawFormat: "",
    })

    const response = await fetchJson<{ items?: ItfCalendarItem[] }>(`/tennis/api/TournamentApi/GetCalendar?${params.toString()}`)
    items.push(...(response.items ?? []))
  }

  return items
}

export async function getItfAcceptanceList(tournamentKey: string, circuitCode: string) {
  const params = new URLSearchParams({
    tournamentKey: tournamentKey.toLowerCase(),
    circuitCode,
  })

  const groups = await fetchJson<ItfAcceptanceGroup[]>(`/tennis/api/TournamentApi/GetAcceptanceList?${params.toString()}`)
  const players = new Map<string, { playerName: string; atpWtaRanking: number | null; nationality: string | null }>()

  for (const group of groups) {
    const entries = [
      ...(group.entries ?? []),
      ...(group.entryClassifications ?? []).flatMap((classification) => classification.entries ?? []),
    ]

    for (const entry of entries) {
      for (const player of entry.players ?? []) {
        const playerName = `${player.givenName ?? ""} ${player.familyName ?? ""}`.trim()
        if (!playerName) continue

        const key = `${playerName}|${player.nationalityCode ?? player.nationality ?? ""}`
        if (!players.has(key)) {
          players.set(key, {
            playerName,
            atpWtaRanking: parseRanking(player),
            nationality: player.nationalityCode ?? player.nationality ?? null,
          })
        }
      }
    }
  }

  return Array.from(players.values()).slice(0, MAX_ACCEPTANCE_PLAYERS)
}


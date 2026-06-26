const COUNTRY_TO_CONTINENT: Record<string, string> = {
  Argentina: "South America",
  Armenia: "Europe",
  Australia: "Oceania",
  Austria: "Europe",
  Belgium: "Europe",
  BosniaAndHerzegovina: "Europe",
  Brazil: "South America",
  Canada: "North America",
  ChinaPR: "Asia",
  Croatia: "Europe",
  Czechia: "Europe",
  Denmark: "Europe",
  Finland: "Europe",
  France: "Europe",
  Germany: "Europe",
  GreatBritain: "Europe",
  Guam: "Oceania",
  Hungary: "Europe",
  Indonesia: "Asia",
  Ireland: "Europe",
  Italy: "Europe",
  Japan: "Asia",
  Kazakhstan: "Asia",
  Mexico: "Central America & Caribbean",
  Morocco: "Africa",
  Netherlands: "Europe",
  NorthMacedonia: "Europe",
  Norway: "Europe",
  Poland: "Europe",
  Portugal: "Europe",
  Romania: "Europe",
  Serbia: "Europe",
  Slovenia: "Europe",
  SouthAfrica: "Africa",
  Spain: "Europe",
  Sweden: "Europe",
  Switzerland: "Europe",
  Thailand: "Asia",
  Tunisia: "Africa",
  Turkiye: "Europe",
  Turkey: "Europe",
  USA: "North America",
  UnitedStates: "North America",
}

const COUNTRY_ALIASES: Record<string, string> = {
  argentina: "Argentina",
  armenia: "Armenia",
  australia: "Australia",
  austria: "Austria",
  belgia: "Belgium",
  belgium: "Belgium",
  "bosnia and herzegovina": "Bosnia and Herzegovina",
  brazilia: "Brazil",
  brazil: "Brazil",
  canada: "Canada",
  china: "China, P.R.",
  "china, p.r.": "China, P.R.",
  croatia: "Croatia",
  cehia: "Czechia",
  czechia: "Czechia",
  denmark: "Denmark",
  danemarca: "Denmark",
  finlanda: "Finland",
  finland: "Finland",
  franta: "France",
  france: "France",
  germania: "Germany",
  germany: "Germany",
  "great britain": "Great Britain",
  "marea britanie": "Great Britain",
  guam: "Guam",
  ungaria: "Hungary",
  hungary: "Hungary",
  indonezia: "Indonesia",
  indonesia: "Indonesia",
  irlanda: "Ireland",
  ireland: "Ireland",
  italia: "Italy",
  italy: "Italy",
  japonia: "Japan",
  japan: "Japan",
  kazakhstan: "Kazakhstan",
  kazahstan: "Kazakhstan",
  mexic: "Mexico",
  mexico: "Mexico",
  maroc: "Morocco",
  morocco: "Morocco",
  olanda: "Netherlands",
  netherlands: "Netherlands",
  macedonia: "North Macedonia",
  "north macedonia": "North Macedonia",
  norvegia: "Norway",
  norway: "Norway",
  polonia: "Poland",
  poland: "Poland",
  portugalia: "Portugal",
  portugal: "Portugal",
  romania: "Romania",
  serbia: "Serbia",
  slovenia: "Slovenia",
  "africa de sud": "South Africa",
  "south africa": "South Africa",
  spania: "Spain",
  spain: "Spain",
  suedia: "Sweden",
  sweden: "Sweden",
  elvetia: "Switzerland",
  switzerland: "Switzerland",
  thailanda: "Thailand",
  thailand: "Thailand",
  tunisia: "Tunisia",
  turcia: "Turkiye",
  turkiye: "Turkiye",
  turkey: "Turkiye",
  sua: "USA",
  usa: "USA",
  "united states": "USA",
}

const CONTINENT_ALIASES: Record<string, string> = {
  africa: "Africa",
  asia: "Asia",
  europa: "Europe",
  europe: "Europe",
  oceania: "Oceania",
  "america de nord": "North America",
  "north america": "North America",
  "america de sud": "South America",
  "south america": "South America",
  "america centrala si caraibe": "Central America & Caribbean",
  "central america & caribbean": "Central America & Caribbean",
}

type TournamentFilterSource = {
  location?: string | null
  startDate?: Date | string | null
}

export type TournamentFilterInput = {
  country?: string | null
  continent?: string | null
  dateFrom?: string | null
}

function compactKey(value: string) {
  return value.replace(/[^a-z]/gi, "")
}

function normalizeText(value?: string | null) {
  return value?.trim().toLocaleLowerCase() || ""
}

function normalizeCountryName(value?: string | null) {
  const normalized = normalizeText(value)
  return COUNTRY_ALIASES[normalized] ?? value?.trim() ?? ""
}

function normalizeContinentName(value?: string | null) {
  const normalized = normalizeText(value)
  return CONTINENT_ALIASES[normalized] ?? value?.trim() ?? ""
}

export function normalizeTournamentFilters(filters: TournamentFilterInput) {
  return {
    country: filters.country?.trim() || "",
    continent: filters.continent?.trim() || "",
    dateFrom: filters.dateFrom?.trim() || "",
  }
}

export function getTournamentCountry(source: TournamentFilterSource) {
  const location = source.location?.trim()
  if (!location) return ""

  const segments = location.split(",").map((segment) => segment.trim()).filter(Boolean)
  return segments[segments.length - 1] ?? ""
}

export function getTournamentContinent(source: TournamentFilterSource) {
  const country = normalizeCountryName(getTournamentCountry(source))
  return COUNTRY_TO_CONTINENT[compactKey(country)] ?? ""
}

export function matchesTournamentRegion(source: TournamentFilterSource, filters: TournamentFilterInput) {
  const normalized = normalizeTournamentFilters(filters)
  const country = normalizeCountryName(getTournamentCountry(source))
  const continent = normalizeContinentName(getTournamentContinent(source))
  const requestedCountry = normalizeCountryName(normalized.country)
  const requestedContinent = normalizeContinentName(normalized.continent)

  if (requestedCountry && normalizeText(country) !== normalizeText(requestedCountry)) {
    return false
  }

  if (requestedContinent && normalizeText(continent) !== normalizeText(requestedContinent)) {
    return false
  }

  return true
}

export function matchesTournamentDate(source: TournamentFilterSource, dateFrom?: string | null) {
  const normalizedDate = dateFrom?.trim()
  if (!normalizedDate) return true
  if (!source.startDate) return false

  const tournamentDate = new Date(source.startDate)
  const minDate = new Date(`${normalizedDate}T00:00:00`)

  return tournamentDate >= minDate
}

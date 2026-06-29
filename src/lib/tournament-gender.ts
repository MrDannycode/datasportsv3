import type { Gender } from "@prisma/client"

type TournamentGenderSource = {
  externalId?: string | null
}

export function getTournamentGender(source: TournamentGenderSource): Gender | null {
  const externalId = source.externalId?.toLowerCase() ?? ""

  if (!externalId) return null
  if (externalId.startsWith("m-itf-")) {
    return "MALE"
  }

  if (externalId.startsWith("w-itf-")) {
    return "FEMALE"
  }

  if (externalId === "us-open-2025" || externalId.startsWith("wta")) {
    return "FEMALE"
  }

  if (
    externalId === "wimbledon-2025" ||
    externalId.startsWith("atp") ||
    externalId.startsWith("challenger")
  ) {
    return "MALE"
  }

  return null
}

export function matchesTournamentGender(source: TournamentGenderSource, gender: Gender | null | undefined) {
  if (!gender) return true

  const tournamentGender = getTournamentGender(source)
  if (!tournamentGender) return true

  return tournamentGender === gender
}

export function matchesTournamentSource(source: { sourceUrl?: string | null }) {
  const sourceUrl = source.sourceUrl?.toLowerCase() ?? ""

  return sourceUrl.includes("itftennis.com") || sourceUrl === "platforma web"
}
/**
 * Calcul dinamic al dificultatii turneului pe baza mediei
 * rankingului ATP/WTA al jucatorilor inscrisi.
 *
 * Conventie ATP/WTA: ranking 1 = cel mai bun jucator.
 * Ranking mic -> concurenta mai puternica -> dificultate mai mare.
 */

export type Difficulty = "usor" | "mediu" | "greu"

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
    greu: "Greu",
    mediu: "Mediu",
    usor: "Usor",
}

export const DIFFICULTY_THRESHOLDS = {
    ELITE: 50,
    MID: 150,
} as const

function normalizeCategorySource(categorySource?: string | null) {
    return categorySource?.trim().toUpperCase() ?? ""
}

export function estimateDifficultyFromCategory(categorySource?: string | null): Difficulty | null {
    const value = normalizeCategorySource(categorySource)
    const match = value.match(/([MW])(\d{2,3})/)

    if (!match) return null

    const amount = Number.parseInt(match[2], 10)
    if (!Number.isFinite(amount)) return null

    if (amount >= 60) return "greu"
    if (amount >= 25) return "mediu"
    return "usor"
}

export function calculateDifficulty(
    rankings: (number | null | undefined)[],
    categorySource?: string | null,
    userRanking?: number | null
): Difficulty | null {
    const valid = rankings.filter(
        (r): r is number => typeof r === "number" && r > 0
    )

    if (valid.length === 0) {
        return estimateDifficultyFromCategory(categorySource)
    }

    const avg = valid.reduce((sum, r) => sum + r, 0) / valid.length

    if (userRanking && userRanking > 0) {
        if (avg < userRanking - 300) return "greu"
        if (avg > userRanking + 300) return "usor"
        return "mediu"
    }

    if (avg <= DIFFICULTY_THRESHOLDS.ELITE) return "greu"
    if (avg <= DIFFICULTY_THRESHOLDS.MID) return "mediu"
    return "usor"
}

/**
 * Calcul dinamic al dificultăţii turneului pe baza mediei
 * rankingului ATP/WTA al jucătorilor înscrişi.
 *
 * Convenţie ATP/WTA: ranking 1 = cel mai bun jucător.
 * Ranking mic → concurenţă mai puternică → dificultate mai mare.
 *
 * Praguri justificate academic:
 *  ≤ 50  → "greu"  (jucători de elită mondială, Top 50)
 *  ≤ 150 → "mediu" (jucători profesionişti, Top 50–150)
 *  > 150 → "usor"  (jucători challenger / futures)
 */

export type Difficulty = "usor" | "mediu" | "greu"

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
    greu: "Greu",
    mediu: "Mediu",
    usor: "Ușor",
}

export const DIFFICULTY_THRESHOLDS = {
    ELITE: 50,   // ≤ 50  → greu
    MID: 150,    // ≤ 150 → mediu
} as const

/**
 * Calculează dificultatea unui turneu pe baza rankingurilor jucătorilor.
 * Returnează `null` dacă nu există jucători cu ranking cunoscut.
 */
export function calculateDifficulty(rankings: (number | null | undefined)[]): Difficulty | null {
    const valid = rankings.filter(
        (r): r is number => typeof r === "number" && r > 0
    )
    if (valid.length === 0) return null

    const avg = valid.reduce((sum, r) => sum + r, 0) / valid.length

    if (avg <= DIFFICULTY_THRESHOLDS.ELITE) return "greu"
    if (avg <= DIFFICULTY_THRESHOLDS.MID) return "mediu"
    return "usor"
}

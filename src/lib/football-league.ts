const ROMAN_NUMERAL_BY_WORD = new Map([
    ["i", "1"],
    ["ii", "2"],
    ["iii", "3"],
    ["iv", "4"],
    ["v", "5"],
])

export function normalizeFootballLeagueName(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[._-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .map(word => ROMAN_NUMERAL_BY_WORD.get(word) ?? word)
        .join(" ")
}

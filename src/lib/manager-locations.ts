export const MANAGER_LOCATION_OPTIONS = [
    { continent: "Europa", country: "Moldova" },
    { continent: "Europa", country: "Romania" },
    { continent: "Europa", country: "Spania" },
    { continent: "Europa", country: "Anglia" },
    { continent: "Europa", country: "Italia" },
    { continent: "Europa", country: "Germania" },
    { continent: "Europa", country: "Franta" },
    { continent: "America de Nord", country: "SUA" },
    { continent: "America de Sud", country: "Argentina" },
    { continent: "America de Sud", country: "Brazilia" },
    { continent: "Africa", country: "Maroc" },
    { continent: "Africa", country: "Nigeria" },
    { continent: "Asia", country: "Japonia" },
    { continent: "Asia", country: "Coreea de Sud" },
    { continent: "Oceania", country: "Australia" },
]

export function isValidManagerLocation(country: string, continent: string) {
    return MANAGER_LOCATION_OPTIONS.some((option) => (
        option.country === country && option.continent === continent
    ))
}

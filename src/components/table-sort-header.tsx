"use client"

export type SortDirection = "asc" | "desc"

const buttonStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "none",
    border: 0,
    padding: 0,
    color: "inherit",
    font: "inherit",
    fontWeight: 700,
    cursor: "pointer",
}

const triangleBase = {
    width: 0,
    height: 0,
    borderLeft: "4px solid transparent",
    borderRight: "4px solid transparent",
}

const ACTIVE_ARROW_OPACITY = 1
const INACTIVE_ARROW_OPACITY = 0.3

/**
 * Valoarea pentru atributul aria-sort al celulei <th> care conține header-ul.
 */
export function sortAriaValue(active: boolean, direction: SortDirection) {
    if (!active) {
        return "none" as const
    }

    return direction === "asc" ? "ascending" as const : "descending" as const
}

interface Props {
    label: string
    ariaLabel: string
    /** true daca tabelul este sortat chiar dupa aceasta coloana */
    active: boolean
    /** directia curenta de sortare a tabelului */
    direction: SortDirection
    onSort: () => void
    /** pentru header-e secundare, mai mici (implicit moștenește fontul din <th>) */
    fontSize?: string
}

export default function TableSortHeader({ label, ariaLabel, active, direction, onSort, fontSize }: Props) {
    return (
        <button
            type="button"
            onClick={onSort}
            aria-label={ariaLabel}
            style={fontSize ? { ...buttonStyle, fontSize } : buttonStyle}
        >
            {label}
            <span aria-hidden="true" style={{ display: "inline-flex", flexDirection: "column", gap: "2px", lineHeight: 0 }}>
                <span style={{
                    ...triangleBase,
                    borderBottom: "5px solid currentColor",
                    opacity: active && direction === "asc" ? ACTIVE_ARROW_OPACITY : INACTIVE_ARROW_OPACITY,
                }} />
                <span style={{
                    ...triangleBase,
                    borderTop: "5px solid currentColor",
                    opacity: active && direction === "desc" ? ACTIVE_ARROW_OPACITY : INACTIVE_ARROW_OPACITY,
                }} />
            </span>
        </button>
    )
}

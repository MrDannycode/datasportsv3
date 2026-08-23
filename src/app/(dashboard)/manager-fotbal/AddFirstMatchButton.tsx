"use client"

import { useRouter } from "next/navigation"
import { useTableMode } from "@/components/table-mode-provider"

const normalCreateSubmitStyle = {
    padding: "9px 20px",
    background: "#0070f3",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
} as const

export default function AddFirstMatchButton() {
    const router = useRouter()
    const { tableMode } = useTableMode()
    const isNormalMode = tableMode === "normal"

    return (
        <button
            type="button"
            onClick={() => router.push("/manager-fotbal/meciuri?open=match")}
            className={isNormalMode ? undefined : "sd-btn-primary"}
            style={isNormalMode ? normalCreateSubmitStyle : { borderRadius: "0" }}
        >
            Adauga primul meci
        </button>
    )
}

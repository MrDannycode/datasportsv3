"use client"

import { useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

interface Props {
    label: string
    isActive?: boolean
}

function filenameFromDisposition(disposition: string | null) {
    const match = disposition?.match(/filename="?([^";]+)"?/)
    return match?.[1] ?? `audituri-${new Date().toISOString().slice(0, 10)}.xlsx`
}

export default function ExportAuditNavButton({ label, isActive = false }: Props) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isExporting, setIsExporting] = useState(false)

    const buildExportHref = () => {
        const exportParams = new URLSearchParams()

        if (pathname === "/admin/audituri") {
            for (const key of ["action", "table", "userId"]) {
                const value = searchParams.get(key)
                if (value) {
                    exportParams.set(key, value)
                }
            }
        }

        const queryString = exportParams.toString()
        return queryString ? `/api/admin/audituri/export?${queryString}` : "/api/admin/audituri/export"
    }

    const handleExport = async () => {
        setIsExporting(true)

        try {
            const response = await fetch(buildExportHref(), { cache: "no-store" })

            if (!response.ok) {
                throw new Error("Exportul a esuat.")
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = filenameFromDisposition(response.headers.get("Content-Disposition"))
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            alert(error instanceof Error ? error.message : "Exportul a esuat.")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className={isActive ? "active" : ""}
            style={{
                margin: "0 10px",
                fontWeight: "bold",
                color: "#555",
                fontSize: "14px",
                background: "none",
                border: "none",
                padding: 0,
                cursor: isExporting ? "wait" : "pointer",
            }}
        >
            {isExporting ? "Se exporta..." : label}
        </button>
    )
}
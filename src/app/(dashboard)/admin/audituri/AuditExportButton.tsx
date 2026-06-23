"use client"

import { useState } from "react"

interface Props {
    href: string
    label: string
    className?: string
}

function filenameFromDisposition(disposition: string | null) {
    const match = disposition?.match(/filename="?([^";]+)"?/)
    return match?.[1] ?? `audituri-${new Date().toISOString().slice(0, 10)}.xlsx`
}

export default function AuditExportButton({ href, label, className }: Props) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        setIsExporting(true)

        try {
            const response = await fetch(href, { cache: "no-store" })

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
        <button type="button" onClick={handleExport} disabled={isExporting} className={className}>
            {isExporting ? "Se exporta..." : label}
        </button>
    )
}

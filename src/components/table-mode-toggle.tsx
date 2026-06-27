"use client";

import { Focus, Table2 } from "lucide-react";
import { useTableMode } from "@/components/table-mode-provider";

export function TableModeToggle() {
    const { tableMode, toggleTableMode } = useTableMode();
    const isNormal = tableMode === "normal";

    return (
        <button
            onClick={toggleTableMode}
            aria-label={isNormal ? "Comuta la modul focus pentru tabele" : "Comuta la modul normal pentru tabele"}
            title={isNormal ? "Tabele: Normal" : "Tabele: Focus"}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 6,
                border: "1px solid var(--sd-border, #ccc)",
                background: isNormal ? "rgba(0, 86, 179, 0.08)" : "transparent",
                cursor: "pointer",
                color: "inherit",
            }}
        >
            {isNormal ? <Table2 size={16} /> : <Focus size={16} />}
        </button>
    );
}

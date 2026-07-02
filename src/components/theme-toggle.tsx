"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const isDark = theme === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Comuta tema"
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 6,
                border: "1px solid var(--sd-border, #ccc)",
                background: "transparent",
                cursor: "pointer",
                color: "inherit",
            }}
        >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
    );
}

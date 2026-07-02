"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
};

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    attribute?: "class";
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
};

const STORAGE_KEY = "theme";
const THEME_CHANGE_EVENT = "sd-theme-change";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(fallback: Theme): Theme {
    if (typeof window === "undefined") return fallback;

    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    return storedTheme === "light" || storedTheme === "dark" ? storedTheme : fallback;
}

function applyTheme(theme: Theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
}

function subscribeToThemeChanges(onStoreChange: () => void) {
    window.addEventListener("storage", onStoreChange);
    window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);

    return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
    };
}

export function ThemeProvider({
    children,
    defaultTheme = "dark",
}: ThemeProviderProps) {
    const theme = useSyncExternalStore(
        subscribeToThemeChanges,
        () => readStoredTheme(defaultTheme),
        () => defaultTheme
    );

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const value = useMemo<ThemeContextValue>(() => ({
        theme,
        setTheme: (nextTheme) => {
            window.localStorage.setItem(STORAGE_KEY, nextTheme);
            window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
        },
    }), [theme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const value = useContext(ThemeContext);
    if (!value) {
        throw new Error("useTheme must be used within ThemeProvider");
    }

    return value;
}

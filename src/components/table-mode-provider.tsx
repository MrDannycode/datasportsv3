"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

type TableMode = "focus" | "normal";

type TableModeContextValue = {
    tableMode: TableMode;
    toggleTableMode: () => void;
};

const TABLE_MODE_STORAGE_KEY = "sd-table-mode";
const NORMAL_MODE_CLASS = "sd-table-mode-normal";
const TABLE_MODE_CHANGE_EVENT = "sd-table-mode-change";

const TableModeContext = createContext<TableModeContextValue | null>(null);

function getStoredTableMode(): TableMode {
    if (typeof window === "undefined") return "focus";

    const storedMode = window.localStorage.getItem(TABLE_MODE_STORAGE_KEY);
    return storedMode === "normal" || storedMode === "focus" ? storedMode : "focus";
}

function subscribeToTableModeChanges(onStoreChange: () => void) {
    window.addEventListener("storage", onStoreChange);
    window.addEventListener(TABLE_MODE_CHANGE_EVENT, onStoreChange);

    return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(TABLE_MODE_CHANGE_EVENT, onStoreChange);
    };
}

function setStoredTableMode(mode: TableMode) {
    window.localStorage.setItem(TABLE_MODE_STORAGE_KEY, mode);
    window.dispatchEvent(new Event(TABLE_MODE_CHANGE_EVENT));
}

export function TableModeProvider({ children }: { children: React.ReactNode }) {
    const tableMode = useSyncExternalStore(subscribeToTableModeChanges, getStoredTableMode, () => "focus" as TableMode);

    useEffect(() => {
        document.documentElement.classList.toggle(NORMAL_MODE_CLASS, tableMode === "normal");
    }, [tableMode]);

    const value = useMemo<TableModeContextValue>(
        () => ({
            tableMode,
            toggleTableMode: () => setStoredTableMode(tableMode === "normal" ? "focus" : "normal"),
        }),
        [tableMode]
    );

    return <TableModeContext.Provider value={value}>{children}</TableModeContext.Provider>;
}

export function useTableMode() {
    const value = useContext(TableModeContext);
    if (!value) {
        throw new Error("useTableMode must be used within TableModeProvider");
    }

    return value;
}

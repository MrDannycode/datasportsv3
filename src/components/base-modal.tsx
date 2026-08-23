"use client"

import type { ReactNode, CSSProperties } from "react"
import { useTableMode } from "@/components/table-mode-provider"

/* ── Shared style tokens (exported for children) ── */

export const modalInputStyle: CSSProperties = {
    border: "1px solid var(--sd-border)",
    backgroundColor: "var(--sd-box-bg)",
    color: "var(--sd-text)",
    padding: "10px 12px",
    fontSize: "13px",
    borderRadius: "var(--sd-modal-radius, 4px)",
}

export const modalLabelStyle: CSSProperties = {
    fontSize: "12px",
    fontWeight: "bold",
    color: "var(--sd-text)",
    display: "block",
    marginBottom: "4px",
}

export const modalFieldStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
}

export const modalSecondaryBtnStyle: CSSProperties = {
    fontSize: "13px",
    border: "1px solid var(--sd-border)",
    color: "var(--sd-text)",
    backgroundColor: "var(--sd-box-bg)",
    padding: "7px 20px",
    fontWeight: "bold",
    cursor: "pointer",
    borderRadius: "var(--sd-modal-radius, 4px)",
}

const normalPrimaryBtnStyle: CSSProperties = {
    padding: "9px 20px",
    background: "#0070f3",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    borderRadius: "var(--sd-modal-radius, 4px)",
}

/* ── Props ── */

interface BaseModalProps {
    /** Unique id for aria-labelledby */
    modalId: string
    /** Main heading */
    title: string
    /** Optional subtitle shown below the title */
    subtitle?: string
    /** Maximum width of the modal panel (default "760px") */
    maxWidth?: string
    /** Called when overlay or close-button is clicked */
    onClose: () => void
    /** The body (form, table, etc.) rendered inside the modal */
    children: ReactNode
}

/* ── Component ── */

export default function BaseModal({
    modalId,
    title,
    subtitle,
    maxWidth = "760px",
    onClose,
    children,
}: BaseModalProps) {
    const { tableMode } = useTableMode()
    const isNormalMode = tableMode === "normal"

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalId}
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                zIndex: 1000,
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: "100%",
                    maxWidth,
                    backgroundColor: "var(--sd-box-bg)",
                    color: "var(--sd-text)",
                    border: "1px solid var(--sd-border)",
                    borderRadius: isNormalMode ? "8px" : "0",
                    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.18)",
                    overflow: "hidden",
                    "--sd-modal-radius": isNormalMode ? "4px" : "0",
                } as CSSProperties}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "18px 22px",
                        borderBottom: "1px solid var(--sd-border)",
                    }}
                >
                    <div>
                        <h2 id={modalId} style={{ margin: 0 }}>{title}</h2>
                        {subtitle && (
                            <p style={{ margin: "6px 0 0", color: "color-mix(in srgb, var(--sd-text) 68%, transparent)", fontSize: "13px" }}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ border: "none", background: "transparent", fontSize: "24px", lineHeight: 1, cursor: "pointer", color: "var(--sd-text)" }}
                        aria-label="Inchide"
                    >
                        x
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: "22px" }}>
                    {children}
                </div>
            </div>
        </div>
    )
}

/* ── Utility sub-components ── */

/** Standard modal action-bar (Cancel + Submit) */
export function ModalActions({
    onClose,
    loading,
    submitLabel,
    loadingLabel,
    submitId,
    cancelLabel = "Anuleaza",
    extraButtons,
}: {
    onClose: () => void
    loading: boolean
    submitLabel: string
    loadingLabel: string
    submitId?: string
    cancelLabel?: string
    extraButtons?: ReactNode
}) {
    const { tableMode } = useTableMode()
    const isNormalMode = tableMode === "normal"

    return (
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", width: "100%", marginTop: "8px" }}>
            {extraButtons}
            <button
                type="button"
                onClick={onClose}
                style={modalSecondaryBtnStyle}
            >
                {cancelLabel}
            </button>
            <button
                id={submitId}
                type="submit"
                disabled={loading}
                className={isNormalMode ? undefined : "sd-btn-primary"}
                style={isNormalMode ? normalPrimaryBtnStyle : { borderRadius: "var(--sd-modal-radius, 4px)" }}
            >
                {loading ? loadingLabel : submitLabel}
            </button>
        </div>
    )
}

/** Standard error / success messages below a form */
export function ModalFeedback({ error, success }: { error?: string; success?: string }) {
    return (
        <>
            {error && <p style={{ color: "#f87171", fontSize: "12px", marginTop: "10px" }}>{error}</p>}
            {success && <p style={{ color: "#22c55e", fontSize: "12px", marginTop: "10px" }}>{success}</p>}
        </>
    )
}

/**
 * Returns the correct `borderRadius` value based on table mode.
 * Use inside `style={{ ...modalInputStyle, borderRadius: modalRadius }}`
 */
export function useModalRadius() {
    const { tableMode } = useTableMode()
    return tableMode === "normal" ? "4px" : "0"
}

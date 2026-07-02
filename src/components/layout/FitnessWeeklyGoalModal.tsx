"use client"

type FitnessWeeklyGoalModalProps = {
    targetTrimp: string
    weekLabel?: string
    title?: string
    description?: string
    inputLabel?: string
    formLoading: boolean
    formError: string
    onTargetTrimpChange: (value: string) => void
    onClose: () => void
    onSubmit: (event: React.FormEvent) => Promise<void>
}

const INPUT_STYLE = {
    border: "1px solid var(--sd-border)",
    backgroundColor: "var(--sd-box-bg)",
    color: "var(--sd-text)",
    padding: "8px 10px",
    fontSize: "13px",
} as const

export default function FitnessWeeklyGoalModal({
    targetTrimp,
    weekLabel,
    title = "Fitness Weekly Goal",
    description = "Seteaza targetul TRIMP pentru echipa in saptamana curenta.",
    inputLabel = "Target TRIMP echipa",
    formLoading,
    formError,
    onTargetTrimpChange,
    onClose,
    onSubmit,
}: FitnessWeeklyGoalModalProps) {
    return (
        <div
            className="sd-modal-overlay"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose()
            }}
        >
            <section
                className="sd-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="fitness-weekly-goal-title"
                style={{ maxWidth: 480 }}
            >
                <h3 id="fitness-weekly-goal-title">{title}</h3>
                <p>{description}</p>

                <form onSubmit={onSubmit} style={{ display: "grid", gap: "14px" }}>
                    {weekLabel && (
                        <div>
                            <div className="sd-metric-title">Saptamana</div>
                            <strong>{weekLabel}</strong>
                        </div>
                    )}

                    <label style={{ display: "grid", gap: "6px", fontSize: "12px", fontWeight: "bold" }}>
                        {inputLabel}
                        <input
                            type="number"
                            value={targetTrimp}
                            onChange={(event) => onTargetTrimpChange(event.target.value)}
                            min="1"
                            step="1"
                            required
                            style={INPUT_STYLE}
                        />
                    </label>

                    {formError && <p style={{ margin: 0, color: "#f87171" }}>{formError}</p>}

                    <div className="sd-modal-actions">
                        <button type="button" className="sd-btn-secondary" onClick={onClose}>
                            Inchide
                        </button>
                        <button type="submit" className="sd-btn" disabled={formLoading}>
                            {formLoading ? "Se salveaza..." : "Salveaza"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    )
}

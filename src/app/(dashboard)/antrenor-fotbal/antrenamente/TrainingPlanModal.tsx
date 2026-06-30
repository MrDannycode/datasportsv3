"use client"

type PlanType = "tehnic" | "fizic" | "tactic"

interface Props {
    editMode: boolean
    title: string
    description: string
    type: PlanType
    date: string
    formLoading: boolean
    formError: string
    formSuccess: string
    onTitleChange: (value: string) => void
    onDescriptionChange: (value: string) => void
    onTypeChange: (value: PlanType) => void
    onDateChange: (value: string) => void
    onCancelEdit: () => void
    onClose: () => void
    onSubmit: (e: React.FormEvent) => Promise<void>
}

const INPUT_STYLE = { border: "1px solid var(--sd-border)", backgroundColor: "var(--sd-box-bg)", color: "var(--sd-text)", padding: "8px 10px", fontSize: "13px" } as const
const LABEL_STYLE = { fontSize: "12px", fontWeight: "bold" } as const
const FIELD_STYLE = { display: "flex", flexDirection: "column" as const, gap: "4px" }
const SECONDARY_BUTTON_STYLE = {
    fontSize: "13px",
    border: "1px solid var(--sd-border)",
    color: "var(--sd-text)",
    backgroundColor: "var(--sd-box-bg)",
    padding: "7px 20px",
    fontWeight: "bold",
    cursor: "pointer",
} as const

export default function TrainingPlanModal({
    editMode,
    title,
    description,
    type,
    date,
    formLoading,
    formError,
    formSuccess,
    onTitleChange,
    onDescriptionChange,
    onTypeChange,
    onDateChange,
    onCancelEdit,
    onClose,
    onSubmit,
}: Props) {
    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="training-plan-modal-title"
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
                    maxWidth: "900px",
                    backgroundColor: "var(--sd-box-bg)",
                    color: "var(--sd-text)",
                    border: "1px solid var(--sd-border)",
                    borderRadius: "8px",
                    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.18)",
                    overflow: "hidden",
                }}
            >
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
                        <h2 id="training-plan-modal-title" style={{ margin: 0 }}>{editMode ? "Editeaza plan" : "Adauga plan nou"}</h2>
                        <p style={{ margin: "6px 0 0", color: "color-mix(in srgb, var(--sd-text) 68%, transparent)", fontSize: "13px" }}>
                            Configureaza rapid un plan nou de antrenament.
                        </p>
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

                <div style={{ padding: "22px" }}>
                    <form onSubmit={onSubmit} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
                        <div style={{ ...FIELD_STYLE, flex: "1 1 180px" }}>
                            <label htmlFor="training-plan-title" style={LABEL_STYLE}>Titlu</label>
                            <input
                                id="training-plan-title"
                                type="text"
                                value={title}
                                onChange={(e) => onTitleChange(e.target.value)}
                                required
                                maxLength={200}
                                placeholder="ex. Antrenament tactic ofensiv"
                                style={INPUT_STYLE}
                            />
                        </div>

                        <div style={{ ...FIELD_STYLE, flex: "1 1 140px" }}>
                            <label htmlFor="training-plan-type" style={LABEL_STYLE}>Tip</label>
                            <select
                                id="training-plan-type"
                                value={type}
                                onChange={(e) => onTypeChange(e.target.value as PlanType)}
                                required
                                style={INPUT_STYLE}
                            >
                                <option value="tehnic">Tehnic</option>
                                <option value="fizic">Fizic</option>
                                <option value="tactic">Tactic</option>
                            </select>
                        </div>

                        <div style={{ ...FIELD_STYLE, flex: "1 1 140px" }}>
                            <label htmlFor="training-plan-date" style={LABEL_STYLE}>Data</label>
                            <input
                                id="training-plan-date"
                                type="date"
                                value={date}
                                onChange={(e) => onDateChange(e.target.value)}
                                required
                                style={INPUT_STYLE}
                            />
                        </div>

                        <div style={{ ...FIELD_STYLE, flex: "1 1 100%", width: "100%" }}>
                            <label htmlFor="training-plan-description" style={LABEL_STYLE}>Descriere</label>
                            <textarea
                                id="training-plan-description"
                                value={description}
                                onChange={(e) => onDescriptionChange(e.target.value)}
                                rows={3}
                                maxLength={1000}
                                placeholder="Detalii despre antrenament (optional)"
                                style={{ ...INPUT_STYLE, width: "100%", resize: "vertical" }}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", width: "100%", marginTop: "8px" }}>
                            {editMode && (
                                <button
                                    type="button"
                                    onClick={onCancelEdit}
                                    style={SECONDARY_BUTTON_STYLE}
                                >
                                    Anuleaza editarea
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                style={SECONDARY_BUTTON_STYLE}
                            >
                                Inchide
                            </button>
                            <button
                                id="training-plan-submit"
                                type="submit"
                                disabled={formLoading}
                                style={{ backgroundColor: formLoading ? "#aaa" : "#0056b3", color: "#fff", border: "none", padding: "7px 20px", fontSize: "13px", fontWeight: "bold", cursor: formLoading ? "not-allowed" : "pointer" }}
                            >
                                {formLoading ? "Se salveaza..." : editMode ? "Salveaza modificarile" : "Creeaza plan"}
                            </button>
                        </div>
                    </form>

                    {formError && <p style={{ color: "#f87171", fontSize: "12px", marginTop: "10px" }}>{formError}</p>}
                    {formSuccess && <p style={{ color: "#22c55e", fontSize: "12px", marginTop: "10px" }}>{formSuccess}</p>}
                </div>
            </div>
        </div>
    )
}

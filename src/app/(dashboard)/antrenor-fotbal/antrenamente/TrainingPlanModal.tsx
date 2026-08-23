"use client"

import BaseModal, { ModalActions, ModalFeedback, modalInputStyle, modalSecondaryBtnStyle } from "@/components/base-modal"

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

const INPUT_STYLE = { ...modalInputStyle } as const
const LABEL_STYLE = { fontSize: "12px", fontWeight: "bold" } as const
const FIELD_STYLE = { display: "flex", flexDirection: "column" as const, gap: "4px" }

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
        <BaseModal
            modalId="training-plan-modal-title"
            title={editMode ? "Editeaza plan" : "Adauga plan nou"}
            subtitle="Configureaza rapid un plan nou de antrenament."
            maxWidth="900px"
            onClose={onClose}
        >
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

                <ModalActions
                    onClose={onClose}
                    loading={formLoading}
                    submitLabel={editMode ? "Salveaza modificarile" : "Creeaza plan"}
                    loadingLabel="Se salveaza..."
                    submitId="training-plan-submit"
                    cancelLabel="Inchide"
                    extraButtons={editMode ? (
                        <button
                            type="button"
                            onClick={onCancelEdit}
                            style={modalSecondaryBtnStyle}
                        >
                            Anuleaza editarea
                        </button>
                    ) : undefined}
                />
            </form>

            <ModalFeedback error={formError} success={formSuccess} />
        </BaseModal>
    )
}

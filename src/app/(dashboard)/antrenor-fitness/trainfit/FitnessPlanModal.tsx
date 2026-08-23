"use client"

import BaseModal, { ModalActions, ModalFeedback, modalInputStyle, modalSecondaryBtnStyle } from "@/components/base-modal"

type PlanType = "forta" | "rezistenta" | "vitezare" | "flexibilitate" | "coordonare"

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

export default function FitnessPlanModal({
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
            modalId="fitness-plan-modal-title"
            title={editMode ? "Editeaza plan" : "Adauga plan nou"}
            subtitle="Configureaza rapid un plan nou de fitness."
            maxWidth="900px"
            onClose={onClose}
        >
            <form onSubmit={onSubmit} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ ...FIELD_STYLE, flex: "1 1 180px" }}>
                    <label htmlFor="fitness-plan-title" style={LABEL_STYLE}>Titlu</label>
                    <input
                        id="fitness-plan-title"
                        type="text"
                        value={title}
                        onChange={(e) => onTitleChange(e.target.value)}
                        required
                        maxLength={200}
                        placeholder="ex. Circuit forta tren inferior"
                        style={INPUT_STYLE}
                    />
                </div>

                <div style={{ ...FIELD_STYLE, flex: "1 1 160px" }}>
                    <label htmlFor="fitness-plan-type" style={LABEL_STYLE}>Tip</label>
                    <select
                        id="fitness-plan-type"
                        value={type}
                        onChange={(e) => onTypeChange(e.target.value as PlanType)}
                        required
                        style={INPUT_STYLE}
                    >
                        <option value="forta">Forta</option>
                        <option value="rezistenta">Rezistenta</option>
                        <option value="vitezare">Viteza</option>
                        <option value="flexibilitate">Flexibilitate</option>
                        <option value="coordonare">Coordonare</option>
                    </select>
                </div>

                <div style={{ ...FIELD_STYLE, flex: "1 1 140px" }}>
                    <label htmlFor="fitness-plan-date" style={LABEL_STYLE}>Data</label>
                    <input
                        id="fitness-plan-date"
                        type="date"
                        value={date}
                        onChange={(e) => onDateChange(e.target.value)}
                        required
                        style={INPUT_STYLE}
                    />
                </div>

                <div style={{ ...FIELD_STYLE, flex: "1 1 100%", width: "100%" }}>
                    <label htmlFor="fitness-plan-description" style={LABEL_STYLE}>Descriere</label>
                    <textarea
                        id="fitness-plan-description"
                        value={description}
                        onChange={(e) => onDescriptionChange(e.target.value)}
                        rows={3}
                        maxLength={1000}
                        placeholder="Detalii despre planul de fitness (optional)"
                        style={{ ...INPUT_STYLE, width: "100%", resize: "vertical" }}
                    />
                </div>

                <ModalActions
                    onClose={onClose}
                    loading={formLoading}
                    submitLabel={editMode ? "Salveaza modificarile" : "Creeaza plan"}
                    loadingLabel="Se salveaza..."
                    submitId="fitness-plan-submit"
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

"use client"

import BaseModal, { ModalActions, ModalFeedback, modalInputStyle, useModalRadius } from "@/components/base-modal"

const ALL_ROLES = [
    { value: "admin_global", label: "Admin Global" },
    { value: "manager_fotbal", label: "Manager Fotbal" },
    // { value: "manager_tenis", label: "Manager Tenis" },
    { value: "antrenor_fotbal", label: "Antrenor Fotbal" },
    { value: "antrenor_fitness", label: "Antrenor Fitness" },
    { value: "medic", label: "Medic" },
    { value: "atlet_fotbal", label: "Atlet Fotbal" },
    { value: "atlet_tenis", label: "Atlet Tenis" },
]

interface Props {
    email: string
    password: string
    role: string
    saving: boolean
    formError: string
    onEmailChange: (value: string) => void
    onPasswordChange: (value: string) => void
    onRoleChange: (value: string) => void
    onClose: () => void
    onSubmit: (e: React.FormEvent) => Promise<void>
}

export default function UserEditModal({
    email,
    password,
    role,
    saving,
    formError,
    onEmailChange,
    onPasswordChange,
    onRoleChange,
    onClose,
    onSubmit,
}: Props) {
    const radius = useModalRadius()

    return (
        <BaseModal
            modalId="edit-user-modal-title"
            title="Editeaza utilizator"
            subtitle="Actualizeaza emailul, rolul sau parola contului."
            onClose={onClose}
        >
            <form onSubmit={onSubmit} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 180px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "bold" }}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => onEmailChange(e.target.value)}
                        required
                        style={{ ...modalInputStyle, borderRadius: radius }}
                    />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 160px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "bold" }}>Parola noua</label>
                    <input
                        type="text"
                        value={password}
                        onChange={e => onPasswordChange(e.target.value)}
                        placeholder="lasa gol pentru neschimbata"
                        style={{ ...modalInputStyle, borderRadius: radius }}
                    />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 160px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "bold" }}>Rol</label>
                    <select
                        value={role}
                        onChange={e => onRoleChange(e.target.value)}
                        style={{ ...modalInputStyle, borderRadius: radius }}
                    >
                        {ALL_ROLES.map(currentRole => (
                            <option key={currentRole.value} value={currentRole.value}>{currentRole.label}</option>
                        ))}
                    </select>
                </div>

                <ModalActions
                    onClose={onClose}
                    loading={saving}
                    submitLabel="Salveaza"
                    loadingLabel="Se salveaza..."
                />
            </form>

            <ModalFeedback error={formError} />
        </BaseModal>
    )
}
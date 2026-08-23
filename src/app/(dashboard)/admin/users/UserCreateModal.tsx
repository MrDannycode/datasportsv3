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
    creating: boolean
    formError: string
    formSuccess: string
    onEmailChange: (value: string) => void
    onPasswordChange: (value: string) => void
    onRoleChange: (value: string) => void
    onClose: () => void
    onSubmit: (e: React.FormEvent) => Promise<void>
}

export default function UserCreateModal({
    email,
    password,
    role,
    creating,
    formError,
    formSuccess,
    onEmailChange,
    onPasswordChange,
    onRoleChange,
    onClose,
    onSubmit,
}: Props) {
    const radius = useModalRadius()

    return (
        <BaseModal
            modalId="new-user-modal-title"
            title="Adauga utilizator nou"
            subtitle="Completeaza datele de baza pentru contul nou."
            onClose={onClose}
        >
            <form onSubmit={onSubmit} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 180px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "bold" }}>Email</label>
                    <input
                        id="new-user-email"
                        type="email"
                        value={email}
                        onChange={e => onEmailChange(e.target.value)}
                        required
                        placeholder="user@example.com"
                        style={{ ...modalInputStyle, borderRadius: radius }}
                    />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 160px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "bold" }}>Parola</label>
                    <input
                        id="new-user-password"
                        type="text"
                        value={password}
                        onChange={e => onPasswordChange(e.target.value)}
                        required
                        placeholder="parola temporara"
                        style={{ ...modalInputStyle, borderRadius: radius }}
                    />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 160px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "bold" }}>Rol</label>
                    <select
                        id="new-user-role"
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
                    loading={creating}
                    submitLabel="Creeaza"
                    loadingLabel="Se creeaza..."
                    submitId="new-user-submit"
                />
            </form>

            <ModalFeedback error={formError} success={formSuccess} />
        </BaseModal>
    )
}

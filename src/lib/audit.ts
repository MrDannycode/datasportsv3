import { AuditAction, Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

type AuditInput = {
    userId: number | string
    action: AuditAction
    tableAffected: string
    recordId?: number | null
    details?: Prisma.InputJsonValue
}

export async function logAudit({ userId, action, tableAffected, recordId = null, details }: AuditInput) {
    const parsedUserId = Number(userId)

    if (!Number.isFinite(parsedUserId)) {
        return
    }

    await prisma.auditLog.create({
        data: {
            userId: parsedUserId,
            action,
            tableAffected,
            recordId,
            details: details ?? undefined,
        },
    })
}

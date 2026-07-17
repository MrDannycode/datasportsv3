import type { Prisma } from "@prisma/client"

export async function deleteUserAccount(tx: Prisma.TransactionClient, userId: number) {
    const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true },
    })

    if (!user) return null

    await tx.notification.deleteMany({ where: { userId } })
    await tx.auditLog.deleteMany({ where: { userId } })
    await tx.footballAthlete.deleteMany({ where: { userId } })
    await tx.tennisAthlete.deleteMany({ where: { userId } })
    await tx.profile.deleteMany({ where: { userId } })

    await tx.user.delete({ where: { id: userId } })
    return user
}

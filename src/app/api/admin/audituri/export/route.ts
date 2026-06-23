import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { AuditAction, Prisma } from "@prisma/client"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const EXPORT_LIMIT = 10000

type ZipEntry = {
    name: string
    content: Buffer
}

function firstValue(value: string | null) {
    return value && value.length > 0 ? value : undefined
}

function xmlEscape(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;")
}

function detailsToText(details: Prisma.JsonValue | null) {
    if (!details) {
        return ""
    }

    return typeof details === "string" ? details : JSON.stringify(details)
}

function columnName(index: number) {
    let name = ""
    let current = index

    while (current > 0) {
        const remainder = (current - 1) % 26
        name = String.fromCharCode(65 + remainder) + name
        current = Math.floor((current - 1) / 26)
    }

    return name
}

function sheetCell(rowIndex: number, columnIndex: number, value: string | number | null) {
    const reference = `${columnName(columnIndex)}${rowIndex}`

    if (typeof value === "number") {
        return `<c r="${reference}"><v>${value}</v></c>`
    }

    return `<c r="${reference}" t="inlineStr"><is><t>${xmlEscape(value ?? "")}</t></is></c>`
}

function sheetRow(rowIndex: number, values: Array<string | number | null>) {
    return `<row r="${rowIndex}">${values.map((value, index) => sheetCell(rowIndex, index + 1, value)).join("")}</row>`
}

function crc32(buffer: Buffer) {
    let crc = 0xffffffff

    for (const byte of buffer) {
        crc ^= byte
        for (let bit = 0; bit < 8; bit++) {
            crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
        }
    }

    return (crc ^ 0xffffffff) >>> 0
}

function createZip(entries: ZipEntry[]) {
    const fileParts: Buffer[] = []
    const centralParts: Buffer[] = []
    let offset = 0

    for (const entry of entries) {
        const name = Buffer.from(entry.name)
        const content = entry.content
        const checksum = crc32(content)

        const localHeader = Buffer.alloc(30)
        localHeader.writeUInt32LE(0x04034b50, 0)
        localHeader.writeUInt16LE(20, 4)
        localHeader.writeUInt16LE(0, 6)
        localHeader.writeUInt16LE(0, 8)
        localHeader.writeUInt16LE(0, 10)
        localHeader.writeUInt16LE(0, 12)
        localHeader.writeUInt32LE(checksum, 14)
        localHeader.writeUInt32LE(content.length, 18)
        localHeader.writeUInt32LE(content.length, 22)
        localHeader.writeUInt16LE(name.length, 26)
        localHeader.writeUInt16LE(0, 28)

        fileParts.push(localHeader, name, content)

        const centralHeader = Buffer.alloc(46)
        centralHeader.writeUInt32LE(0x02014b50, 0)
        centralHeader.writeUInt16LE(20, 4)
        centralHeader.writeUInt16LE(20, 6)
        centralHeader.writeUInt16LE(0, 8)
        centralHeader.writeUInt16LE(0, 10)
        centralHeader.writeUInt16LE(0, 12)
        centralHeader.writeUInt16LE(0, 14)
        centralHeader.writeUInt32LE(checksum, 16)
        centralHeader.writeUInt32LE(content.length, 20)
        centralHeader.writeUInt32LE(content.length, 24)
        centralHeader.writeUInt16LE(name.length, 28)
        centralHeader.writeUInt16LE(0, 30)
        centralHeader.writeUInt16LE(0, 32)
        centralHeader.writeUInt16LE(0, 34)
        centralHeader.writeUInt16LE(0, 36)
        centralHeader.writeUInt32LE(0, 38)
        centralHeader.writeUInt32LE(offset, 42)

        centralParts.push(centralHeader, name)
        offset += localHeader.length + name.length + content.length
    }

    const centralDirectory = Buffer.concat(centralParts)
    const end = Buffer.alloc(22)
    end.writeUInt32LE(0x06054b50, 0)
    end.writeUInt16LE(0, 4)
    end.writeUInt16LE(0, 6)
    end.writeUInt16LE(entries.length, 8)
    end.writeUInt16LE(entries.length, 10)
    end.writeUInt32LE(centralDirectory.length, 12)
    end.writeUInt32LE(offset, 16)
    end.writeUInt16LE(0, 20)

    return Buffer.concat([...fileParts, centralDirectory, end])
}

function createWorkbook(rows: Array<Array<string | number | null>>) {
    const sheetRows = rows.map((row, index) => sheetRow(index + 1, row)).join("")
    const lastColumn = columnName(rows[0]?.length ?? 1)
    const lastRow = Math.max(rows.length, 1)

    const worksheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><dimension ref="A1:${lastColumn}${lastRow}"/><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols><col min="1" max="1" width="10" customWidth="1"/><col min="2" max="2" width="22" customWidth="1"/><col min="3" max="3" width="36" customWidth="1"/><col min="4" max="6" width="16" customWidth="1"/><col min="7" max="7" width="64" customWidth="1"/></cols><sheetData>${sheetRows}</sheetData></worksheet>`

    const entries: ZipEntry[] = [
        {
            name: "[Content_Types].xml",
            content: Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`),
        },
        {
            name: "_rels/.rels",
            content: Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
        },
        {
            name: "xl/workbook.xml",
            content: Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Audituri" sheetId="1" r:id="rId1"/></sheets></workbook>`),
        },
        {
            name: "xl/_rels/workbook.xml.rels",
            content: Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
        },
        {
            name: "xl/styles.xml",
            content: Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>`),
        },
        {
            name: "xl/worksheets/sheet1.xml",
            content: Buffer.from(worksheet),
        },
    ]

    return createZip(entries)
}

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin_global") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const selectedAction = firstValue(request.nextUrl.searchParams.get("action"))
    const selectedTable = firstValue(request.nextUrl.searchParams.get("table"))
    const selectedUserId = firstValue(request.nextUrl.searchParams.get("userId"))
    const validAction = Object.values(AuditAction).includes(selectedAction as AuditAction)
        ? selectedAction as AuditAction
        : undefined
    const userId = selectedUserId ? Number(selectedUserId) : undefined

    const where: Prisma.AuditLogWhereInput = {
        ...(validAction ? { action: validAction } : {}),
        ...(selectedTable ? { tableAffected: selectedTable } : {}),
        ...(userId ? { userId } : {}),
    }

    const auditLogs = await prisma.auditLog.findMany({
        where,
        include: {
            user: {
                select: {
                    email: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
        take: EXPORT_LIMIT,
    })

    await prisma.auditLog.create({
        data: {
            userId: Number(session.user.id),
            action: "create",
            tableAffected: "audit_logs_export",
            details: {
                filters: { action: validAction ?? null, table: selectedTable ?? null, userId: userId ?? null },
                exportedRows: auditLogs.length,
                limit: EXPORT_LIMIT,
            },
        },
    })

    const rows: Array<Array<string | number | null>> = [
        ["ID", "Data", "Utilizator", "Actiune", "Tabel", "Record", "Detalii"],
        ...auditLogs.map(log => [
            log.id,
            log.createdAt.toISOString(),
            log.user.email,
            log.action,
            log.tableAffected,
            log.recordId,
            detailsToText(log.details),
        ]),
    ]

    const workbook = createWorkbook(rows)
    const fileName = `audituri-${new Date().toISOString().slice(0, 10)}.xlsx`

    return new NextResponse(workbook, {
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${fileName}"`,
            "Cache-Control": "no-store",
        },
    })
}

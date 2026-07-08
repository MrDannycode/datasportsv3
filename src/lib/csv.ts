export function parseCsv(text: string) {
    const records: string[][] = []
    let record: string[] = []
    let field = ""
    let quoted = false

    for (let i = 0; i < text.length; i++) {
        const char = text[i]
        if (char === '"') {
            if (quoted && text[i + 1] === '"') {
                field += '"'
                i++
            } else {
                quoted = !quoted
            }
        } else if (char === "," && !quoted) {
            record.push(field.trim())
            field = ""
        } else if ((char === "\n" || char === "\r") && !quoted) {
            if (char === "\r" && text[i + 1] === "\n") i++
            record.push(field.trim())
            if (record.some(Boolean)) records.push(record)
            record = []
            field = ""
        } else {
            field += char
        }
    }

    record.push(field.trim())
    if (record.some(Boolean)) records.push(record)
    return records
}

import Database from "better-sqlite3"
import path from "node:path"
import fs from "node:fs"

export const db: any = new Database('bot.db')
db.pragma('journal_mode = WAL')
db.defaultSafeIntegers()

export function updateDatabase(dirname: any) {
    const userVersion = parseInt(db.pragma('user_version', { simple: true }))
    const migrateFolder = path.join(dirname, "migrate")
    if (!fs.existsSync(migrateFolder)) return
    let updating = true
    let nextVersion = userVersion
    while (updating) {
        nextVersion = nextVersion + 1
        const nextVersionFile = path.join(migrateFolder, `${nextVersion}.sql`)
        if (!fs.existsSync(nextVersionFile)) {
            updating = false
            break
        }
        db.exec(fs.readFileSync(nextVersionFile, {encoding: "utf-8"}))
        db.pragma(`user_version = ${nextVersion}`)
    }
}
import Database from "better-sqlite3"

export const db: any = new Database('bot.db')
db.pragma('journal_mode = WAL')
db.defaultSafeIntegers()
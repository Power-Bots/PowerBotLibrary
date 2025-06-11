import path from "node:path"
import fs from "node:fs"
import { bot } from "../main"
import { Knex } from "knex"

export let knex: Knex
let rawDb: any
export async function setupDatabase(){
    knex = require("knex")({
        client: 'better-sqlite3',
        connection: {
            filename: path.join(bot.dirname, '../bot.db')
        },
        useNullAsDefault: true,
        pool: {
            afterCreate: (conn: any, done: any) => {
                rawDb = conn
                conn.pragma('journal_mode = WAL');
                done(null, conn);
            }
        }
    })
}

export async function updateDatabase() {
    const userVersion = (await knex.raw("PRAGMA user_version;"))[0].user_version
    const migrateFolder = path.join(bot.dirname, "migrate")
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
        await rawDb.exec(fs.readFileSync(nextVersionFile, {encoding: "utf-8"}))
        rawDb.pragma(`user_version = ${nextVersion}`)
    }
}
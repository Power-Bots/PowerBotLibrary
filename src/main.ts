import { Bot } from "./lib/bot"

export { knex } from "./lib/db"
export { Config, ConfigTypes } from "./lib/config"
export { Lang, reply } from "./lib/lang"

export const bot = new Bot()
import { Bot } from "./bot"

export { knex } from "./db"
export { Config, ConfigTypes } from "./config"

export const bot = new Bot()
import { Snowflake } from "discord.js";
import { knex } from "../main";

export enum ConfigTypes {
    Guild = "guild",
    User = "user"
}

export class Config {
    static setEvents: Map<string, Function> = new Map<string, Function>();
    static async getRaw(scope: ConfigTypes, id: Snowflake | string | number, key: string): Promise<any> {
        const valueRaw = await knex("config").where({
            scope: scope,
            id: id,
            key: key
        }).first()
        return valueRaw
    }
    static async get(scope: ConfigTypes, id: Snowflake | string | number, key: string): Promise<any> {
        const valueRaw = await this.getRaw(scope, id, key)
        const value = valueRaw?.value
        if (!value) return null
        return value
    }
    static async set(scope: ConfigTypes, id: Snowflake | string | number, key: string, value: string) {
        const valueRaw = await this.getRaw(scope, id, key)
        if (valueRaw){
            await knex("config").where({
                scope: scope,
                id: id,
                key: key
            }).update({
                value: value
            })
            return
        }
        await knex("config").insert({
            scope: scope,
            id: id,
            key: key,
            value: value
        })
        const event = this.setEvents.get(key)
        if (event) await event({
            scope: scope,
            id: id,
            key: key,
            value: value
        })
    }
    static async onSet(key: string, func: Function){
        this.setEvents.set(key, func)
    }
}
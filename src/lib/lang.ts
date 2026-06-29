import path from "path"
import fs from "fs"
import { bot } from "../main"
import { CommandInteraction, MessageFlags } from "discord.js"

async function localize(obj: any, lang: Lang, args?: Record<string, any>): Promise<any>{
    if (typeof obj === "string") {
        if (obj.startsWith("$")) {
            const spaceIndex = obj.indexOf(" ");
            const endIndex = spaceIndex === -1 ? obj.length : spaceIndex;
            const keyPart = obj.slice(0, endIndex);
            const key = keyPart.slice(1);
            let replacement = await lang.get(key, args);
            if (key.startsWith("emoji.")) {
                replacement = await bot.getEmoji(key.slice(6))
            }
            if (replacement !== undefined) {
                return obj.replace(keyPart, replacement);
            }
        }
        return obj;
    }

    if (Array.isArray(obj)) {
        let results = []
        for (const item of obj){
            results.push(await localize(item, lang, args))
        }
        return results
    }

    if (typeof obj === "object" && obj !== null) {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
            if (key === "options") break
            result[key] = await localize(value, lang, args);
        }
        return result;
    }

    return obj;
}

export async function embedLocalize(embedName: string, args?: Record<string, any>, excludeFooter: boolean = false){
    const embed = await Lang.embed.get(embedName)
    var newEmbed = await localize(embed, Lang.en, args)
    var newEmbed = await localize(newEmbed, Lang.global, args)
    if (!excludeFooter) {
        newEmbed.footer = {
            "text": bot.info.name,
            "icon_url": bot.info.icon
        }
        newEmbed.timestamp = new Date().toISOString()
    }
    return { embeds: [newEmbed] }
}

export async function reply(interaction: CommandInteraction, text: string, args?: Record<string, any>){
    let flags: any[] = []
    let embed = (await embedLocalize(text, args)).embeds[0]
    if (embed?.options?.ephemeral) flags.push(MessageFlags.Ephemeral)
    await interaction.reply({ embeds: [embed], flags: flags })
}

export class Lang {
    texts: any
    static global: Lang
    static en: Lang
    static embed: Lang
    constructor(lang: string){
        this.texts = {}
        const langFileLocation = path.join(Lang.folder, `${lang}.json`)

        if (fs.existsSync(langFileLocation)){
            const data = fs.readFileSync(langFileLocation, {encoding: "utf-8"})
            this.texts = JSON.parse(data)
        }
    }
    static get folder(){
        return path.join(bot.dirname, "lang")
    }
    static async setup(){
        Lang.global = new Lang("global")
        Lang.embed = new Lang("embed")
        Lang.en = new Lang("en")
    }
    async get(text: string, args?: Record<string, any>): Promise<any> {
        let newText = this.texts[text]
        if (newText === undefined && Lang.global){
            newText = Lang.global.texts[text]
        }
        if (typeof newText === "string"){
            if (args){
                for (const [name, value] of Object.entries(args)){
                    newText = newText.replace(`{{${name}}}`, value)
                }
            }
        }
        return newText
    }
}
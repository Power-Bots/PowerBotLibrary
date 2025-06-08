import path from "path"
import fs from "fs"
import { bot } from "./main"
import { CommandInteraction } from "discord.js"

async function localize(obj: any, lang: Lang, args?: Record<string, any>): Promise<any>{
    if (typeof obj === "string") {
        if (obj.startsWith("$")) return lang.get(obj.replace("$",""), args) || obj;
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(async item => await localize(item, lang, args));
    }

    if (typeof obj === "object" && obj !== null) {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = await localize(value, lang, args);
        }
        return result;
    }

    return obj;
}

export async function reply(interaction: CommandInteraction, text: string, args?: Record<string, any>){
    const embed = await Lang.embed.get(text)
    const newEmbed = await localize(embed, Lang.en, args)
    await interaction.reply({ embeds: [newEmbed]})
}

export class Lang {
    texts: any
    static en: Lang
    static embed: Lang
    constructor(lang: string){
        const langFileLocation = path.join(Lang.folder, `${lang}.json`)

        if (fs.existsSync(langFileLocation)){
            fs.readFile(langFileLocation, {encoding: "utf-8"}, (err: any, data: any) => {
                this.texts = JSON.parse(data)
                return
            })
        }
        this.texts = null
    }
    static get folder(){
        return path.join(bot.dirname, "lang")
    }
    static async setup(){
        Lang.embed = new Lang("embed")
        Lang.en = new Lang("en")
    }
    async get(text: string, args?: Record<string, any>): Promise<any> {
        const rawText = this.texts[text]
        let newText = rawText
        if (args){
            for (const [name, value] of Object.entries(args)){
                newText = newText.replace(`{{${name}}}`, value)
            }
        }
        return newText
    }
}
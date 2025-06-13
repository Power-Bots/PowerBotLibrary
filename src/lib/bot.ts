import dotenv from 'dotenv';
dotenv.config();
import fs from 'node:fs';
import path from 'node:path';
import { Client, Collection, Events, GatewayIntentBits, Routes, REST, MessageFlags, Snowflake, Guild, Role, GuildBasedChannel } from 'discord.js';
import { Log } from "./log"
import { setupDatabase, updateDatabase } from './db';
import { Lang } from './lang';
import { knex } from "./db"
export { knex } from "./db"
export { Config, ConfigTypes } from "./config"

export class Bot {
    log: any;
    client: any;
    commands: any
    commandsArray: any
    dirname: any
    info: any = {}
    async setup(dirname: any){
        this.dirname = dirname
        await setupDatabase()
        await updateDatabase()
        await Lang.setup()
    }
    async run(){
        process.stdin.on('data', async (dataRaw) => {
            if (dataRaw.toString().trim() === "q") {
                await knex.destroy()
                await this.client.destroy()
                process.exit()
            }
        });

        this.log = new Log()

        if (!this.dirname){
            this.log.error(`Bot was not setup.`);
            process.exit();
        }

        this.log.info("Press Q+Return to stop the bot");

        // ENVIROMENT VARS
        if (!fs.existsSync(".env")){
            this.log.error(`No .env file is in the directory. Please add one`);
            process.exit();
        };
        const botToken = process.env.DISCORD_TOKEN;
        if (botToken == undefined){
            this.log.error(`The \"DISCORD_TOKEN\" wasn't found in the .env file.\nIt can be added with: \"DISCORD_TOKEN=mytokenhere\"`);
            process.exit();
        };

        // READ BOT.JSON
        const botJsonLocation = path.join(this.dirname, "bot.json")
        if (fs.existsSync(botJsonLocation)){
            fs.readFile(botJsonLocation, {encoding: "utf-8"}, (err: any, data: any) => {
                this.info = JSON.parse(data)
            })
        }

        // CREATE CLIENT
        this.client = new Client({intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent
        ]});

        // IMPORT COMMANDS
        this.commands = new Collection();
        this.commandsArray = [];
        
        await this.importFolder('commands',
            (data: any) => this.commandImporter(data)
        )
        await this.importFolder('events',
            (data: any) => this.eventImporter(data)
        )

        // LOGIN CLIENT
        this.client.once(Events.ClientReady, (readyClient: any) => {
            this.log.info(`Logged in as ${readyClient.user.tag}`);
            
            // REGISTER COMMANDS
            if (this.commandsArray.length === 0) return
            const rest = new REST().setToken(botToken);
            
            (async () => {
                try {
                    this.log.info(`Started refreshing ${this.commandsArray.length} application (/) commands.`);
                    const data: any = await rest.put(
                        Routes.applicationCommands(readyClient.user.id),
                        { body: this.commandsArray },
                    );
            
                    this.log.info(`Successfully reloaded ${data.length} application (/) commands.`);
                } catch (error) {
                    this.log.error(`${error}`);
                };
            })();
        });

        this.log.info("Logging in");
        this.client.login(botToken);

        // RECEIVE COMMANDS
        this.client.on(Events.InteractionCreate, async (interaction: any) => {
            try {
                if (interaction.isChatInputCommand()){
                    const command: any = this.commands.get(interaction.commandName);

                    if (!command) {
                        this.log.error(`No command matching ${interaction.commandName} was found.`);
                        return;
                    };
                    await command.execute(interaction);
                    return;
                };
            } catch (error) {
                this.log.error(`${error}`);
                const errorMessage = { content: 'There was an error while executing this command!', flags: [MessageFlags.Ephemeral]}
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                };
            };
            return;
        });
    }

    async scanFolder(folder: string): Promise<string[]> {
        let results = []
        if (fs.existsSync(folder)){
            const folderContents = fs.readdirSync(folder)
            for (const file of folderContents){
                const fullPath = path.join(folder, file)
                const stats = fs.lstatSync(fullPath)
                if (stats.isDirectory()) results.push(...await this.scanFolder(fullPath))
                if (stats.isFile()) results.push(fullPath)
            }
        } 
        return results
    }

    async importFolder(folder: string, func: Function, requiredData: string[] = []) {
        await this._importFolder(path.join(this.dirname, folder), func, requiredData)
        await this._importFolder(path.join(__dirname, "..", folder), func, requiredData)
    }

    async _importFolder(folder: string, func: Function, requiredData: string[] = []) {
        for (const file of await this.scanFolder(folder)) {
            const data = require(file)
            for (const required of requiredData) if (!data[required]) continue
            if (file.endsWith(".js")) await func(data)
        }
    }

    async commandImporter(command: any){
        this.commands.set(command.data.name, command);
        this.commandsArray.push(command.data.toJSON());
    }
    
    async eventImporter(data: any){
        this.client.on(data.event, data.execute)
    }

    async resolveGuild(guild: Guild | Snowflake): Promise<Guild | null> {
        let _guild: Guild | null
        if (typeof guild === "string") {
            _guild = await this.getGuild(guild)
        } else {
            _guild = guild
        }
        if (!_guild) return null
        return _guild
    }

    async getGuild(id: Snowflake): Promise<Guild | null> {
        try {
            return await this.client.guilds.fetch(id)
        } catch {
            return null
        }
    }
    
    async getRole(id: Snowflake, guild: Guild | Snowflake): Promise<Role | null> {
        let _guild = await this.resolveGuild(guild)
        if (!_guild) return null
        try {
            return await _guild.roles.fetch(id)
        } catch {
            return null
        }
    }
    
    async getGuildChannel(id: Snowflake, guild: Guild | Snowflake): Promise<GuildBasedChannel | null> {
        let _guild = await this.resolveGuild(guild)
        if (!_guild) return null
        try {
            return await _guild.channels.fetch(id)
        } catch {
            return null
        }
    }
}
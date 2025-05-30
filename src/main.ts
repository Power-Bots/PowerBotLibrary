// IMPORTS
import dotenv from 'dotenv';
dotenv.config();
import fs from 'node:fs';
import path from 'node:path';
import { Client, Collection, Events, GatewayIntentBits, Routes, REST } from 'discord.js';
import { Log } from "./log"

export { db } from "./db";

export class Bot {
    log: any;
    client: any;
    constructor(__dirname: any){
        this.log = new Log()

        this.log.info("Press Control+C to stop the bot");

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

        // CREATE CLIENT
        this.client = new Client({intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent
        ]});

        // IMPORT COMMANDS
        let commands: Collection<String, any> = new Collection();
        let commandsArray : string[] = [];

        const foldersPath = path.join(__dirname, 'commands');
        const commandFolders = fs.readdirSync(foldersPath);

        for (const folder of commandFolders) {
            const commandsPath = path.join(foldersPath, folder);
            let commandFiles;
            if (fs.statSync(commandsPath).isDirectory()){
                commandFiles = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith('.js'));
            } else {
                commandFiles = [""]
            }
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);
                if ('data' in command && 'execute' in command) {
                    this.log.info(`"${command.data.name}" command was imported from ${filePath}`);
                    commands.set(command.data.name, command);
                    commandsArray.push(command.data.toJSON());
                } else {
                    this.log.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
                };
            };
        };

        // LOGIN CLIENT
        this.client.once(Events.ClientReady, (readyClient: any) => {
            this.log.info(`Logged in as ${readyClient.user.tag}`);
            
            // REGISTER COMMANDS
            const rest = new REST().setToken(botToken);
            
            (async () => {
                try {
                    this.log.info(`Started refreshing ${commandsArray.length} application (/) commands.`);
                    const data: any = await rest.put(
                        Routes.applicationCommands(readyClient.user.id),
                        { body: commandsArray },
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
                    const command: any = commands.get(interaction.commandName);

                    if (!command) {
                        this.log.error(`No command matching ${interaction.commandName} was found.`);
                        return;
                    };
                    await command.execute(interaction);
                    return;
                };
            } catch (error) {
                this.log.error(`${error}`);
                const errorMessage = { content: 'There was an error while executing this command!', ephemeral: true }
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                };
            };
            return;
        });
    }
}
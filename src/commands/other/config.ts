import { SlashCommandBuilder } from 'discord.js';
import { bot } from '../../main';
import { Config, ConfigTypes } from '../../config';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('config')
		.setDescription('Manage config')
        .addSubcommand(subcommand => subcommand
            .setName("set")
            .setDescription("Set config for a server or yourself (user)")
            .addStringOption(option => option
                .setName("setting")
                .setDescription("The setting to set")
                .setRequired(true)
            )
            .addStringOption(option => option
                .setName("value")
                .setDescription("The value of setting")
                .setRequired(true)
            )
        ),
	async execute(interaction: any) {
        const subCommand = interaction.options.getSubcommand();
        switch (subCommand) {
            case "set":
                const key = interaction.options.getString("setting");
                const keyShort = key.substring(key.indexOf(".") + 1);
                const value = interaction.options.getString("value");
                const botConfigValues = bot.info?.configs
                const scope = key.split(".")[0]
                if (
                    !scope ||
                    !botConfigValues ||
                    !(botConfigValues[scope]?.includes(keyShort))
                ) return await interaction.reply({content: `❌ Invalid Setting`});
                let id
                switch (scope){
                    case ConfigTypes.Guild:
                        id = interaction.guildId
                        break
                    case ConfigTypes.User:
                        id = interaction.user.id
                        break
                }
                Config.set(scope, id, key, value)
                await interaction.reply({content: `✅ Set \`${key}\` to \`${value}\``});
                break;
            default:
                break;
        }
	},
};
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { bot } from '../../main';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('Quick info about this bot'),
	async execute(interaction: any) {
		let embed = new EmbedBuilder()
			.setTitle(bot.info?.name ?? null)
			.setThumbnail(bot.info?.icon ?? "")
			.setDescription(bot.info?.description ?? null)
			.addFields(
				{
					name: "Repository", value: bot.info?.repo ?? "undefined"
				}
			)
		await interaction.reply({embeds: [embed]})
	},
};
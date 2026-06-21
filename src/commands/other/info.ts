import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { bot } from '../../main';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('Quick info about this bot'),
	async execute(interaction: any) {
		bot.log.info("hello")
		bot.log.info(bot.info)
		let embed = new EmbedBuilder()
			.setTitle(bot.info?.name ?? null)
			.setThumbnail(bot.info?.icon ?? "")
			.setDescription(bot.info?.description ?? null)
			.addFields(
				{
					name: "Repository", value: bot.info?.repo ?? "undefined"
				}
			)
		bot.log.info(embed.toJSON())
		await interaction.reply({embeds: [embed]})
	},
};
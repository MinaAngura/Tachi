import { InteractionReplyOptions, MessageActionRow, MessageEmbed, MessagePayload, MessageSelectMenu } from "discord.js";
import { Game, Playtypes } from "tachi-common";
import { LoggerLayers } from "../config";
import { validSelectCustomIdPrefaces } from "../interactionHandlers/selectMenu/handleIsSelectMenu";
import { createLayeredLogger } from "../utils/logger";
import { getGameImage } from "../utils/utils";
import { getDetailedChartData, SongSearchResult } from "./chartSearch";

const logger = createLayeredLogger(LoggerLayers.buildChartEmbed);

export const buildChartsSelect = <T extends Game>(charts: SongSearchResult[], playtype: Playtypes[T], game: Game) => {
	return new MessageActionRow().addComponents(
		new MessageSelectMenu()
			.setCustomId(validSelectCustomIdPrefaces.SelectChartForSearch)
			.setPlaceholder("Select Chart")
			.addOptions(
				charts.map((chart) => {
					return {
						label: `${chart.title} - ${chart.artist}`,
						value: `${chart.id}:${playtype}:${game}`
					};
				})
			)
	);
};

export const buildChartEmbed = async <T extends Game>(args: {
	searchResults?: SongSearchResult[];
	songId?: string;
	playtype: Playtypes[T];
	game: Game;
}): Promise<InteractionReplyOptions | MessagePayload> => {
	try {
		const { searchResults, songId, playtype, game } = args;

		const embed = new MessageEmbed().setColor("#cc527a");

		if (!songId && searchResults) {
			embed.addField(`${searchResults.length} potential results found`, "Select from the dropdown");
			return { embeds: [embed], components: [buildChartsSelect(searchResults, playtype, game)] };
		} else if (songId) {
			const details = await getDetailedChartData(songId, playtype, game);
			embed.addField(details.song.title || "Chart", details.song.artist || "Artist");
			embed.setThumbnail(getGameImage(details.song.firstVersion || "0", game));

			const sortedCharts = details.charts.sort((a, b) => a.levelNum - b.levelNum);

			sortedCharts.forEach((chart) => {
				embed.addField(`${chart.difficulty} (${chart.level})`, "Parse relevant data here", true);
			});

			return { embeds: [embed] };
		} else {
			throw new Error("Invalid call to buildChartEmbed");
		}
	} catch (e) {
		logger.error(e);

		throw new Error("Error building chart embed");
	}
};

import {
	InternalFailure,
	SongOrChartNotFoundFailure,
} from "lib/score-import/framework/common/converter-failures";
import { GenericGetGradeAndPercent } from "lib/score-import/framework/common/score-utils";
import { FindSDVXChartOnInGameIDVersion } from "utils/queries/charts";
import { FindSongOnID } from "utils/queries/songs";
import type { ConverterFunction } from "../../common/types";
import type { KsHookSV6CContext, KsHookSV6CScore } from "./types";
import type { DryScore } from "lib/score-import/framework/common/types";
import type { Lamps } from "tachi-common";

export const ConverterIRKsHookSV6C: ConverterFunction<KsHookSV6CScore, KsHookSV6CContext> = async (
	data,
	context,
	importType,
	logger
) => {
	const diff = SV6CConvertDifficulty(data.difficulty);

	const chart = await FindSDVXChartOnInGameIDVersion(data.music_id, diff, "konaste");

	if (!chart) {
		throw new SongOrChartNotFoundFailure(
			`Could not find chart with songID ${data.music_id} (${diff} for Konaste).`,
			importType,
			data,
			context
		);
	}

	const song = await FindSongOnID("sdvx", chart.songID);

	if (!song) {
		logger.severe(`Song ${chart.songID} (sdvx) has no parent song?`);
		throw new InternalFailure(`Song ${chart.songID} (sdvx) has no parent song?`);
	}

	const { percent, grade } = GenericGetGradeAndPercent("sdvx", data.score, chart);

	const dryScore: DryScore<"sdvx:Single"> = {
		game: "sdvx",
		service: "kshook SV6C",
		comment: null,
		importType: "ir/kshook-sv6c",
		timeAchieved: context.timeReceived,
		scoreData: {
			score: data.score,
			percent,
			grade,
			lamp: SV6CConvertLamp(data.clear),
			judgements: {
				critical: data.critical,
				near: data.near,
				miss: data.error,
			},
			optional: {
				gauge: data.gauge / 100,
				maxCombo: data.max_chain,
				exScore: data.ex_score,
			},
		},
		scoreMeta: {},
	};

	return { song, chart, dryScore };
};

export function SV6CConvertLamp(clear: KsHookSV6CScore["clear"]): GetEnumValue<"sdvx:Single", "lamp"> {
	if (clear === "CLEAR_PLAYED") {
		return "FAILED";
	} else if (clear === "CLEAR_EFFECTIVE") {
		return "CLEAR";
	} else if (clear === "CLEAR_EXCESSIVE") {
		return "EXCESSIVE CLEAR";
	} else if (clear === "CLEAR_ULTIMATE_CHAIN") {
		return "ULTIMATE CHAIN";
	}

	return "PERFECT ULTIMATE CHAIN";
}

export function SV6CConvertDifficulty(
	diff: KsHookSV6CScore["difficulty"]
): "ADV" | "ANY_INF" | "EXH" | "MXM" | "NOV" {
	if (diff === "DIFFICULTY_NOVICE") {
		return "NOV";
	} else if (diff === "DIFFICULTY_ADVANCED") {
		return "ADV";
	} else if (diff === "DIFFICULTY_EXHAUST") {
		return "EXH";
	} else if (diff === "DIFFICULTY_INFINITE") {
		return "ANY_INF";
	}

	return "MXM";
}

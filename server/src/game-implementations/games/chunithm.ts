import { GoalFmtScore, GoalOutOfFmtScore, GradeGoalFormatter } from "./_common";
import { CreatePBMergeFor } from "game-implementations/utils/pb-merge";
import { ProfileAvgBestN } from "game-implementations/utils/profile-calc";
import { SessionAvgBest10For } from "game-implementations/utils/session-calc";
import { CHUNITHMRating } from "rg-stats";
import { CHUNITHM_GBOUNDARIES, FmtNum, GetGrade } from "tachi-common";
import { IsNullish } from "utils/misc";
import type { GPTServerImplementation } from "game-implementations/types";

export const CHUNITHM_IMPL: GPTServerImplementation<"chunithm:Single"> = {
	validators: {},
	derivers: {
		grade: ({ score }) => GetGrade(CHUNITHM_GBOUNDARIES, score),
	},
	scoreCalcs: {
		rating: (scoreData, chart) => CHUNITHMRating.calculate(scoreData.score, chart.levelNum),
	},
	sessionCalcs: { naiveRating: SessionAvgBest10For("rating") },
	profileCalcs: { naiveRating: ProfileAvgBestN("rating", 20) },
	classDerivers: {
		colour: (ratings) => {
			const rating = ratings.naiveRating;

			if (IsNullish(rating)) {
				return null;
			}

			if (rating >= 15) {
				return "RAINBOW";
			} else if (rating >= 14.5) {
				return "PLATINUM";
			} else if (rating >= 14) {
				return "GOLD";
			} else if (rating >= 13) {
				return "SILVER";
			} else if (rating >= 12) {
				return "COPPER";
			} else if (rating >= 10) {
				return "PURPLE";
			} else if (rating >= 7) {
				return "RED";
			} else if (rating >= 4) {
				return "ORANGE";
			} else if (rating >= 2) {
				return "GREEN";
			}

			return "BLUE";
		},
	},
	goalCriteriaFormatters: {
		score: GoalFmtScore,
	},
	goalProgressFormatters: {
		grade: (pb, gradeIndex) =>
			GradeGoalFormatter(
				CHUNITHM_GBOUNDARIES,
				pb.scoreData.grade,
				pb.scoreData.score,
				CHUNITHM_GBOUNDARIES[gradeIndex]!.name
			),

		lamp: (pb) => pb.scoreData.lamp,
		score: (pb) => FmtNum(pb.scoreData.score),
	},
	goalOutOfFormatters: {
		score: GoalOutOfFmtScore,
	},
	pbMergeFunctions: [
		CreatePBMergeFor("largest", "enumIndexes.lamp", "Best Lamp", (base, score) => {
			base.scoreData.lamp = score.scoreData.lamp;
		}),
	],
	defaultMergeRefName: "Best Score",
};
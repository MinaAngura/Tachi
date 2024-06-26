import { TachiScoreDataToBeatorajaFormat } from "./convert-scores";
import { Router } from "express";
import db from "external/mongo/db";
import { SYMBOL_TACHI_API_AUTH } from "lib/constants/tachi";
import CreateLogCtx from "lib/logger/logger";
import { AssignToReqTachiData, GetTachiData } from "utils/req-tachi-data";
import type { RequestHandler } from "express";
import type { ChartDocument, integer, PBScoreDocument, UserDocument } from "tachi-common";

const router: Router = Router({ mergeParams: true });

const logger = CreateLogCtx(__filename);

const GetChartDocument: RequestHandler = async (req, res, next) => {
	let chart: ChartDocument<"bms:7K" | "bms:14K" | "pms:Controller" | "pms:Keyboard"> | null =
		(await db.charts.bms.findOne({
			"data.hashSHA256": req.params.chartSHA256,
		})) as ChartDocument<"bms:7K" | "bms:14K"> | null;

	// if we dont find the chart in bms,
	// it's probably a pms chart.
	if (!chart) {
		chart = (await db.charts.pms.findOne({
			"data.hashSHA256": req.params.chartSHA256,
		})) as ChartDocument<"pms:Controller" | "pms:Keyboard"> | null;
	}

	// if we still haven't found it, we've got nothin.
	if (!chart) {
		return res.status(404).json({
			success: false,
			description: `Chart does not exist on IR yet.`,
		});
	}

	AssignToReqTachiData(req, { beatorajaChartDoc: chart });

	next();
};

router.use(GetChartDocument);

/**
 * Retrieves scores for the given chart.
 *
 * @name GET /ir/beatoraja/charts/:chartSHA256/scores
 */
router.get("/scores", async (req, res) => {
	const chart = GetTachiData(req, "beatorajaChartDoc");
	const requestingUserID = req[SYMBOL_TACHI_API_AUTH].userID;

	const scores = (await db["personal-bests"].find({
		chartID: chart.chartID,
	})) as Array<PBScoreDocument<"bms:7K" | "bms:14K" | "pms:Controller" | "pms:Keyboard">>;

	const userDocs = await db.users.find(
		{
			id: { $in: scores.map((e) => e.userID) },
		},
		{
			projection: {
				id: 1,
				username: 1,
			},
		}
	);
	const userMap = new Map<integer, UserDocument>();

	for (const user of userDocs) {
		userMap.set(user.id, user);
	}

	const beatorajaScores = [];

	for (const score of scores) {
		const username = userMap.get(score.userID)?.username;

		if (!username) {
			logger.warn(
				`A PB on ${score.chartID} refers to user ${score.userID}, who apparantly doesn't exist? Skipping for beatoraja score returns, but this might be severe!`
			);
			continue;
		}

		beatorajaScores.push(
			TachiScoreDataToBeatorajaFormat(
				score,
				chart.data.hashSHA256,
				score.userID === requestingUserID ? "" : username,
				chart.data.notecount,

				// Playcount is always 0 at the moment due to performance concerns.
				0
			)
		);
	}

	return res.status(200).json({
		success: true,
		description: `Successfully returned ${beatorajaScores.length}`,
		body: beatorajaScores,
	});
});

export default router;

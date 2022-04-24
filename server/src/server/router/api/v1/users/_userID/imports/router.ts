import { Router } from "express";
import db from "external/mongo/db";
import { SYMBOL_TachiAPIAuth } from "lib/constants/tachi";
import prValidate from "server/middleware/prudence-validate";
import { HyperAggressiveRateLimitMiddleware } from "server/middleware/rate-limiter";

const router: Router = Router({ mergeParams: true });

/**
 * Return minimal information about up to 500 of this user's most recent imports.
 * To control where that 500 starts from, pass the timeFinished param.
 *
 * This endpoint only returns importID, game, timeStarted/finished, userIntent
 * and import method.
 *
 * The reason this endpoint omits fields is to keep the size of the return fairly
 * low, and reduce bandwidth on the server.
 *
 * This endpoint is intended to be used by developers to triage certain bugs.
 *
 * @param timeFinished - Where to start counting this users 500 imports from, this
 * should be a string that is parsable into a date via. Date.Parse.
 *
 * @name GET /api/v1/users/:userID/imports
 */
router.get("/", prValidate({ timeFinished: "*string" }), async (req, res) => {
	const userID = req[SYMBOL_TachiAPIAuth]!.userID!;

	let timeFinished = Infinity;

	if (req.query.timeFinished) {
		timeFinished = Date.parse(req.query.timeFinished as string);

		if (Number.isNaN(timeFinished)) {
			return res.status(400).json({
				success: false,
				description: `Couldn't parse timeFinished into a date.`,
			});
		}
	}

	const imports = await db.imports.find(
		{
			userID,
			timeFinished: { $lt: timeFinished },
		},
		{
			projection: {
				importID: 1,
				importType: 1,
				game: 1,
				userIntent: 1,
				timeStarted: 1,
				timeFinished: 1,
			},
			limit: 500,
			sort: { timeFinished: -1 },
		}
	);

	return res.status(200).json({
		success: true,
		description: `Found ${imports.length} imports.`,
		body: imports,
	});
});

/**
 * Return all of this user's imports that were made with user intent.
 *
 * Note that we can safely do this without rate limiting, because an import with
 * userIntent implies that the user uploaded a file or something similar. Intent
 * Imports are not vulnerable to being brutalised by every fervidex upload or similar.
 *
 * @name GET /api/v1/users/:userID/imports/with-user-intent
 */
router.get("/with-user-intent", async (req, res) => {
	const userID = req[SYMBOL_TachiAPIAuth]!.userID!;

	const importsWithIntent = await db.imports.find({
		userID,
		userIntent: true,
	});

	return res.status(200).json({
		success: true,
		description: `Found ${importsWithIntent.length} imports that were made with user-intent.`,
		body: importsWithIntent,
	});
});

export default router;

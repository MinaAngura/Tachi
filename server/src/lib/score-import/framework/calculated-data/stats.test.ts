import { CalculateKTLampRatingIIDXDP, CalculateKTLampRatingIIDXSP } from "./stats";
import deepmerge from "deepmerge";
import t from "tap";
import { Testing511SPA, TestingIIDXSPDryScore } from "test-utils/test-data";
import type { DryScore } from "../common/types";
import type { ChartDocument, Lamps } from "tachi-common";

t.test("#CalculateKTLampRatingIIDXSP", (t) => {
	function c(
		nc: number | null,
		hc: number | null,
		exhc: number | null
	): ChartDocument<"iidx:SP"> {
		const tierlistInfo: ChartDocument<"iidx:SP">["tierlistInfo"] = {};

		if (exhc !== null) {
			tierlistInfo["kt-EXHC"] = {
				value: exhc,
				text: `EXHC ${exhc}`,
			};
		}

		if (hc !== null) {
			tierlistInfo["kt-HC"] = {
				value: hc,
				text: `HC ${hc}`,
			};
		}

		if (nc !== null) {
			tierlistInfo["kt-NC"] = {
				value: nc,
				text: `HC ${nc}`,
			};
		}

		return {
			...Testing511SPA,
			tierlistInfo,
		};
	}

	function s(lamp: Lamps["iidx:DP" | "iidx:SP"]): DryScore<"iidx:DP" | "iidx:SP"> {
		return deepmerge(TestingIIDXSPDryScore, {
			scoreData: {
				lamp,
			},
		});
	}

	t.equal(
		CalculateKTLampRatingIIDXSP(s("CLEAR"), c(10.5, 10.6, 10.7)),
		10.5,
		"Should return NC if the score was NC."
	);

	t.equal(
		CalculateKTLampRatingIIDXSP(s("HARD CLEAR"), c(10.5, 10.6, 10.7)),
		10.6,
		"Should return HC if the score was HC."
	);

	t.equal(
		CalculateKTLampRatingIIDXSP(s("EX HARD CLEAR"), c(10.5, 10.6, 10.7)),
		10.7,
		"Should return EXHC if the score was EXHC."
	);

	t.equal(
		CalculateKTLampRatingIIDXSP(s("CLEAR"), c(null, 10.6, 10.7)),
		0,
		"Should return 0 if the score was NC but no NC was available."
	);

	t.equal(
		CalculateKTLampRatingIIDXSP(s("HARD CLEAR"), c(null, null, 10.7)),
		0,
		"Should return 0 if the score was HC but no HC or NC was available."
	);

	t.equal(
		CalculateKTLampRatingIIDXSP(s("HARD CLEAR"), c(10.5, null, 10.7)),
		10.5,
		"Should return NC if the score was HC but no HC was available."
	);

	t.equal(
		CalculateKTLampRatingIIDXSP(s("HARD CLEAR"), c(10.9, 10.5, 10.7)),
		10.9,
		"Should return NC if the score was HC but NC was worth more."
	);

	t.equal(
		CalculateKTLampRatingIIDXSP(s("EX HARD CLEAR"), c(10.9, 10.5, 10.7)),
		10.9,
		"Should return NC if the score was EXHC but NC was worth more."
	);

	t.equal(
		CalculateKTLampRatingIIDXSP(s("EX HARD CLEAR"), c(10.4, 10.9, 10.7)),
		10.9,
		"Should return HC if the score was EXHC but HC was worth more."
	);

	t.equal(
		CalculateKTLampRatingIIDXSP(s("CLEAR"), c(null, null, null)),
		10,
		"Should return chart level if the chart has no tierlist data."
	);

	t.end();
});

t.test("#CalculateKTLampRatingIIDXDP", (t) => {
	function c(dpTier: number | null): ChartDocument<"iidx:DP"> {
		return {
			...Testing511SPA,
			playtype: "DP",
			tierlistInfo: {
				"dp-tier": {
					value: dpTier,
				},
			},

			// hack over-assert this type, since we're merging the SPA into being
			// a DPA.
		} as unknown as ChartDocument<"iidx:DP">;
	}

	function s(lamp: Lamps["iidx:DP" | "iidx:SP"]): DryScore<"iidx:DP" | "iidx:SP"> {
		return deepmerge(TestingIIDXSPDryScore, {
			scoreData: {
				lamp,
			},
		});
	}

	t.equal(
		CalculateKTLampRatingIIDXDP(s("CLEAR"), c(10.4)),
		10.4,
		"Should return 10.4 if chart has tierlist value of 10.4 and was clear."
	);

	t.equal(
		CalculateKTLampRatingIIDXDP(s("FAILED"), c(10.4)),
		0,
		"Should return 0 if chart has tierlist value of 10.4 and was not cleared."
	);

	t.equal(
		CalculateKTLampRatingIIDXDP(s("CLEAR"), c(null)),
		10,
		"Should return chart level if the chart has no tierlist data."
	);

	t.equal(
		CalculateKTLampRatingIIDXDP(s("FAILED"), c(null)),
		0,
		"Should return 0 if the chart has no tierlist data and was failed."
	);

	t.end();
});

t.skip("#CalculateKTRating", (t) => {
	// t.test("Should call the success calculator if percent > pivotPercent", async (t) => {
	// 	const r = await CalculateKTRating(
	// 		deepmerge(TestingIIDXSPDryScore, { scoreData: { percent: 80 } }),
	// 		"iidx",
	// 		"SP",
	// 		Testing511SPA,
	// 		logger
	// 	);

	// 	t.ok(r > 10, "Should return rating greater than the levelNum of the chart.");

	// 	t.end();
	// });

	// t.test("Should call the fail calculator if percent > pivotPercent", async (t) => {
	// 	const r = await CalculateKTRating(
	// 		TestingIIDXSPDryScore,
	// 		"iidx",
	// 		"SP",
	// 		Testing511SPA,
	// 		logger
	// 	);

	// 	t.ok(r < 10, "Should return rating less than the levelNum of the chart.");

	// 	t.end();
	// });

	// t.test("Should call levelNum if percent === pivotPercent", async (t) => {
	// 	const r = await CalculateKTRating(
	// 		deepmerge(TestingIIDXSPDryScore, { scoreData: { percent: 77.7777 } }),
	// 		"iidx",
	// 		"SP",
	// 		Testing511SPA,
	// 		logger
	// 	);

	// 	t.equal(
	// 		// hack for approximate tests
	// 		parseFloat(r.toFixed(2)),
	// 		10,
	// 		"Should return rating exactly that of the levelNum of the chart."
	// 	);

	// 	t.end();
	// });

	// t.test(
	// 	"Should trigger safety if completely invalid percent somehow gets through",
	// 	async (t) => {
	// 		let r = await CalculateKTRating(
	// 			deepmerge(TestingIIDXSPDryScore, { scoreData: { percent: 1000000000 } }),
	// 			"iidx",
	// 			"SP",
	// 			Testing511SPA,
	// 			logger
	// 		);

	// 		t.equal(r, 0, "Should safely return 0 and log a warning.");

	// 		r = await CalculateKTRating(
	// 			// not high enough to be non-finite but high enough to be > 1000
	// 			deepmerge(TestingIIDXSPDryScore, { scoreData: { percent: 200 } }),
	// 			"iidx",
	// 			"SP",
	// 			Testing511SPA,
	// 			logger
	// 		);

	// 		t.equal(r, 0, "Should safely return 0 and log a warning.");

	// 		t.end();
	// 	}
	// );

	t.end();
});

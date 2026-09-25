import assert from "node:assert/strict";
import { test } from "node:test";
import { drawPairs } from "../src/features/games/drawing.ts";

test("pure draw gives each participant one other recipient", () => {
	const roster = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
	const pairs = drawPairs(roster, () => 0);
	assert.equal(pairs.length, roster.length);
	assert.deepEqual(
		new Set(pairs.map(({ giver }) => giver.id)),
		new Set(roster.map(({ id }) => id)),
	);
	assert.deepEqual(
		new Set(pairs.map(({ receiver }) => receiver.id)),
		new Set(roster.map(({ id }) => id)),
	);
	assert.ok(pairs.every(({ giver, receiver }) => giver.id !== receiver.id));
	assert.deepEqual(
		roster.map(({ id }) => id),
		[1, 2, 3, 4],
	);
});

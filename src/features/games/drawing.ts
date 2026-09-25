/** Builds a single shuffled cycle, assigning each participant exactly one other recipient. */
export function drawPairs<T extends { id: number }>(
	participants: readonly T[],
	pick: (upperBound: number) => number,
) {
	if (participants.length < 3)
		throw new Error("At least three participants required");
	const shuffled = [...participants];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = pick(i + 1);
		const left = shuffled[i];
		const right = shuffled[j];
		if (!left || !right) throw new Error("Invalid draw roster");
		[shuffled[i], shuffled[j]] = [right, left];
	}
	return shuffled.map((giver, i) => {
		const receiver = shuffled[(i + 1) % shuffled.length];
		if (!receiver) throw new Error("Invalid draw roster");
		return { giver, receiver };
	});
}

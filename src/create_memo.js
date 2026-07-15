import { create_signal } from "./create_signal.js";

/**
 * A memo is simply a readonly signal.
 */
export const create_memo = (initial) => {
	const signal = create_signal(initial);
	const memo = (s) => signal(s);

	return memo;
};

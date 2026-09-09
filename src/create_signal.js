import { create_signal_raw } from "./create_signal_raw.js";

const error_value = () => {
	throw new Error("Signal value must be a reactive function. Wrap the value in either `() =>` or `(s) =>` depending on whether or not the current value should be reactive, beyond the mere reactivity of the signal.");
}

/**
 * A signal is a value-based sink. Each update is a new value. If the value does not change, subscribers are not notified.
 */
export const create_signal = (initial) => {
	if (initial === undefined) {
		initial = () => undefined;
	}
	
	if (typeof initial !== "function") {
		error_value();
	}
	
	const raw = create_signal_raw(
		{ retrieve: initial },
		Object.is,
		(value) => value.retrieve(),
	);
	
	const result = (self) => {
		return raw(self).retrieve();
	};

	result.set = (value) => {
		if (typeof value !== "function") {
			error_value();
		}
		
		raw.set({
			retrieve: value,
		});
	};

	return result;
};

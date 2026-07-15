export const create_signal_raw = (initial) => {
	let value = initial;
	
	const subscribers = new Set();

	const get = (self) => {
		if (self?._run_effect) {
			subscribers.add(self._run_effect);
		}
		
		return value;
	};

	const set = (new_value) => {
		value = new_value;

		for (const effect of subscribers) {
			effect();
		}
	};
	
	get.set = set;

	return get;
};

export const create_signal_raw = (initial, is_equal, get_snapshot) => {
	is_equal ??= Object.is;
	get_snapshot ??= (v) => v;
	
	let value = initial;
	let snapshot = undefined;
	
	const subscribers = new Set();

	const get = (self) => {
		if (self?._run_effect) {
			if (subscribers.size === 0) {
				snapshot = get_snapshot(value);
			}
			
			subscribers.add(self._run_effect);
		}
		
		return value;
	};

	const set = (new_value) => {
		if (subscribers.size === 0) {
			// Signals are lazy. We are not permitted to invoke `is_equal` or `get_snapshot` if there are no subscribers.
			
			value = new_value;
			
			return;
		}
		
		const new_snapshot = get_snapshot(new_value);
		
		if (is_equal(snapshot, new_snapshot)) {
			// Must still assign, as underlying value may become different in the future.
			
			value = new_value;
			
			return;
		}
		
		value = new_value;
		snapshot = new_snapshot;

		for (const effect of subscribers) {
			effect();
		}
	};
	
	get.set = set;

	return get;
};

import { create_signal } from "./create_signal.js";

export const stream_latest = (stream, initial) => {
	const signal = create_signal(() => initial);

	let upstream = undefined;
	const registered = new Set();

	const consider_acquiring = () => {
		if (upstream !== undefined) {
			return;
		}
		
		upstream = stream.subscribe((calldata) => {
			signal.set(() => calldata);
		});
	};

	const consider_releasing = () => {
		if (registered.size !== 0) {
			return;
		}
		
		upstream.unsubscribe();
		upstream = undefined;
	};

	return (self) => {
		if (self._is_effectfully_useful() && !registered.has(self)) {
			registered.add(self);
			consider_acquiring();
			
			self.on_dispose(() => {
				registered.delete(self);
				consider_releasing();
			});
		}

		return signal(self);
	};
};

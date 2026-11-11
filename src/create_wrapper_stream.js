export const create_wrapper_stream = (stream, handle) => {
	const result = {};

	const subscriptions = new Set();

	let upstream;

	result.subscribe = (handler) => {
		subscriptions.add(handler);

		if (upstream === undefined) {
			upstream = stream.subscribe((calldata) => {
				handle(calldata, (new_calldata) => {
					for (const handler of subscriptions) {
						handler(new_calldata);
					}
				});
			});
		}

		const unsubscribe = () => {
			if (subscriptions.size === 1) {
				upstream.unsubscribe();
				upstream = undefined;
			}

			subscriptions.delete(handler);
		};

		return { unsubscribe };
	};

	return result;
};

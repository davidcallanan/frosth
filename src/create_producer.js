export const create_producer = () => {
	const result = {};
	
	const subscriptions = new Set();
	
	const create_stream = () => {
		const result = {};	
		
		result.subscribe = (handler) => {
			subscriptions.add(handler);
			
			const unsubscribe = () => {
				subscriptions.delete(handler);
			};
			
			return { unsubscribe };
		};
		
		return result;
	};
	
	result.emit = (message) => {
		return result.emit_many([message]);
	};
	
	result.emit_many = (messages) => {
		for (const message of messages) {
			for (const handler of subscriptions) {
				handler(message);
			}
		}
	};
	
	result.stream = create_stream();
	
	return result;
};

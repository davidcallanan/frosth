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
	
	result.emit = (calldata) => {
		return result.emit_many([calldata]);
	};
	
	result.emit_many = (calldatas) => {
		for (const calldata of calldatas) {
			for (const handler of subscriptions) {
				handler(calldata);
			}
		}
	};
	
	result.stream = create_stream();
	
	return result;
};

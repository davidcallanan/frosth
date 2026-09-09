/**
 * A beacon is a valueless-sink. The output is a stable interface as provided on creation. Subscribers are notified whenever the beacon is fired.
 */
export const create_beacon = (intf) => {
	let next_version = 0n;
	
	const version_signal = create_signal(((version) => () => version)(next_version++));
	
	const result = (self) => {
		version_signal(self);
		
		return intf;
	};
	
	result.fire = () => {
		version_signal.set(((version) => () => version)(next_version++));
	};
	
	return result;
};

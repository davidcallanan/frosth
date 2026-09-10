import { create_beacon } from "./create_beacon.js";

export const create_stream = () => {
	// activity: content-agnostic term for a payload in a stream, whether that be an event or an action.
	let activity_seq = 0;
	
	let outstanding_activities = [];
	
	const drain = () => {
		const activities = outstanding_activities;
		
		outstanding_activities = [];
		
		return activities;
	};
	
	const reader = {
		drain,
	};
	
	const beacon = create_beacon(reader);
	
	const result = (s) => beacon(s);
	
	result.emit = (body) => {
		const activity = {
			seq: activity_seq++,
			body,
		};
		
		outstanding_activities.push(activity);
		
		beacon.fire();
	};
	
	return result;
};

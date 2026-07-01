import { MARK_INSTALLABLE } from "./constants.js";
import { create_fragment } from "./create_fragment.js";
import { create_self } from "./create_self.js";

const render_diff = (s, prev, next, target) => {
	const prev_map = new Map(prev.map((p) => [p.item, p]));
	const next_set = new Set(next);

	for (const p of prev) {
		if (!next_set.has(p.item)) {
			p.item_self[Symbol.dispose]();
			p.fragment.clear();
			p.fragment.start.remove();
			p.fragment.end.remove();
		}
	}

	const next_slots = next.map((item) => {
		if (prev_map.has(item)) {
			return prev_map.get(item);
		}

		const item_self = create_self(s);
		const fragment = create_fragment(target);
		const new_state = { prev: [] };
		
		render(item_self, fragment, item(item_self), new_state);
		
		return { item, item_self, fragment, state: new_state };
	});

	return next_slots;
};

export const render = async (s, target, installed, state) => {
	console.log("rendering", installed);
	
	if (Array.isArray(installed)) {
		if (state.prev.length === 0) {
			target.innerHTML = "";
		}
		
		state.prev = render_diff(s, state.prev, installed, target);
		
		return;
	}
	
	target.innerHTML = "Loading...";
	
	if (installed === undefined) {
		return;
	}

	state.prev = [];

	if (installed instanceof HTMLElement) {
		if (s.is_disposed) {
			return;
		}
		
		target.innerHTML = "";
		target.appendChild(installed);

		return;
	}
	
	const installable = await installed.installable;
	
	if (installable === undefined) {
		if (s.is_disposed) {
			return;
		}
		
		console.log("have", await installed, installable);
		console.error("Tried to render 'undefined'.");
		target.innerHTML = "Error (tried to render 'undefined')";
		
		return;
	}
	
	if (installable[MARK_INSTALLABLE] !== true) {
		if (s.is_disposed) {
			return;
		}
		
		console.warn("Encountered bizarre object to render:", installed);
		target.innerHTML = "Error (encountered bizzare object to render)";

		return;
	}
	
	if (s.is_disposed) {
		return;
	}
	
	target.innerHTML = "";
	const fragment = create_fragment(target);
	
	const new_state = { prev: [] };
	
	s.create_effect((s) => {
		const installed = installable.installed(s);
		render(s, fragment, installed, new_state);		
	});
};

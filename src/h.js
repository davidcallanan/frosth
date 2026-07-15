import { create_fragment } from "./create_fragment.js";
import { outstanding_mount_checks } from "./mount_checks.js";
import { render } from "./render.js";

export const h = (s, tag, props, children) => {
	const el = document.createElement(tag);
	
	for (const key of Object.keys(props)) {
		if (key.startsWith("on")) {
			const event = key.slice(2);
			let prev;
			
			s.create_effect(() => {
				const handler = props[key](s);
				
				if (prev) {
					el.removeEventListener(event, prev);
				}
				
				el.addEventListener(event, handler);
				
				prev = handler;
			});
		} else if (key === "ref") {
			if (typeof props[key] === "function") {
				console.warn("[Frosth] Deprecated: Instead of `ref: () => signal.set`, use `ref: [\"on_create\", signal.set]`");
					
				s.create_effect(() => {
					const ref_set = props[key](s);
					ref_set(() => el);
				});
			} else {
				if (!Array.isArray(props[key])) {
					throw new Error("[Frosth] Ref must be an array, either `[\"on_create\", signal.set]` or `[\"on_mount\", signal.set]`");
				}
				
				const [when, ref_set] = props[key];
				
				if (when === "on_create") {
					ref_set(() => el);
				} else if (when === "on_mount") {
					outstanding_mount_checks.set(el, () => ref_set(() => el));
				} else {
					throw new Error(`[Frosth] Invalid ref strategy "${when}"`);
				}
			}
		} else {
			s.create_effect((s) => {
				const prop$ = props[key](s);
				
				if (prop$ === undefined) {
					el.removeAttribute(key);					
					return;
				}
				
				el.setAttribute(key, prop$);
			});
		}
	}

	if (children !== undefined) {
		const fragment = create_fragment(el);
		const state = { prev: [] };
		render(s, fragment, children, state);
	}
	
	return el;
};

import { create_fragment } from "./create_fragment.js";
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
			s.create_effect(() => {
				const ref_fn = props[key](s);
				ref_fn(() => el);
			});
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

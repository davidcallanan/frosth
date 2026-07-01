import { unsuspended_promise, create_unsuspended_promise } from "unsuspended-promise";
import { create_fragment } from "./create_fragment.js";
import { create_self } from "./create_self.js";
import { create_signal } from "./create_signal.js";
import { h } from "./h.js";
import { render } from "./render.js";
import { MARK_INSTALLABLE } from "./constants.js";

export { create_self };
export { create_signal };
export { h };

export const installarea = (s) => {
	const storage = s.create_housed_signal(() => undefined);
	
	const inferred = (s) => {
		const func_or_array = storage(s);
		
		if (func_or_array === undefined) {
			return undefined;
		}
		
		if (!Array.isArray(func_or_array)) {
			const func = func_or_array;
			
			return [func];
		}
		
		const array = func_or_array;
		
		return array;
	};
	
	const installed = (s) => inferred(s);
	installed.set = (value) => storage.set(value);
	
	const installable = {
		[MARK_INSTALLABLE]: true,
		installed: (s) => inferred(s),
	};
	
	return [installed, installable];
};

const DIFFED = Symbol("diffed");

export const create_install = (parent) => {
	const install = (children) => {
		parent.innerHTML = "";
		
		if (!Array.isArray(children)) {
			children = [children];
		}
			
		for (const child of children) {
			if (child instanceof HTMLElement) {
				parent.appendChild(child);	
			} else if (typeof child === "function") {
				const fragment = create_fragment(parent);
				
				fragment.innerText = "Loading...";
		
				child({
					install: create_install(fragment),
				});
			} else {
				console.error("Tried to install nonsensical element", child);
			}
		}
	};

	install.diffed = (compute) => ({ [DIFFED]: compute });

	return install;
};

export const mount = async (target, create) => {
	const s = create_self(undefined, undefined, {
		supress_static_lifetime: true,
	});
	
	const app = create({
		s,
	});
	
	target.innerHTML = "Loading...";
	
	const installable = await app.installable;
	
	target.innerHTML = "";
	
	if (installable === undefined) {
		console.error("Component that is mounted must expose an 'installable' property for inclusion in the DOM. Use `t.installable = installable;`");		
		
		return;
	}
	
	const state = { prev: [] };
	
	s.create_effect((s) => {
		const installed = installable.installed(s);
		render(s, target, installed, state);
	});
};

export const obtain_component = (factory) => {
	return ({ s, ...rest }) => {
		const child_self = create_self(s);
	 	
		return factory({
			s: child_self,
			...rest,
		});
	};
};

export const extract_installable = (factory) => {
	let uly_install = undefined;
	let queued_installables = undefined;
	
	const install = (installables) => {
		if (uly_install === undefined) {
			queued_installables = installables;
			return;
		}
		
		uly_install(installables);
	};
	
	return [
		factory({
			install,
		}),
		({ install }) => {
			uly_install = install;
			
			if (queued_installables) {
				uly_install(queued_installables);
				queued_installables = undefined;
			}
		},
	];
};

const fancy_wrap = (create) => {
	return (kwargs) => {
		const sym_promise = Symbol("[t.Promise]");
		const sym_rej = Symbol("[t.Rej]");
		
		const basket = new Map();
		
		const t = new Proxy({}, {
			get: (_, prop) => {
				if (prop === "Promise") {
					return sym_promise;
				}
				
				if (prop === "Rej") {
					throw new Error("todo");
				}
				
				return final[prop];
			},
			set: (_, prop, value) => {
				if (value === sym_promise) {
					const [promise, res, rej] = create_unsuspended_promise();
					
					basket.set(prop, [promise, res, rej]);
					
					return true;
				}
				
				const [__, res, rej] = basket.get(prop) ?? [];
				
				basket.set(prop, [value]);
				
				if (res !== undefined) {
					res(value);
				}
				
				return true;
			},
		});
		
		create({
			...kwargs,
			t,
		});
		
		const final = new Proxy({}, {
			get: (target, prop) => {
				if (basket.has(prop)) {
					return basket.get(prop)[0];
				}
				
				return target[prop];
			},
		});
		
		return final;
	};
};

export const obtain = (create_component) => {
	return obtain_component(unsuspended_promise(fancy_wrap(create_component)));
};

export const path = create_signal();

path.set(() => window.location.pathname);

window.addEventListener("popstate", () => {
	path.set(() => window.location.pathname);
});

export const A = obtain(async ({ t, s, href, children, ...props }) => {
	const [installed, installable] = installarea(s);

	t.installable = installable;

	installed.set(() => [
		(s) => s.$a({
			...props,
			href: () => href,
			onclick: () => (e) => {
				if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
					return;
				}
				
				e.preventDefault();
				window.history.pushState(null, "", href);
				path.set(() => href);
			},
		}, children),
	]);
});

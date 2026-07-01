import { create_signal } from "./create_signal.js";
import { h } from "./h.js";

class Self {
	constructor(parent, run_effect, options) {
		options ??= {};
		
		this._parent = parent;
		this._children = new Set();
		this._is_disposed = false;
		this._run_effect = run_effect;
		this._dispose_handlers = [];
		this._abort_controller = new AbortController();
		
		if (this._parent !== undefined) {
			this._parent._children.add(this);
		}
		
		if (this._parent === undefined && options.supress_static_lifetime !== true) {
			console.warn("Created top-level self which will never be disposed (static lifetime).");
		}
	}
	
	create_effect(callback) {
		let child;
		
		const run = () => {
			if (child._is_disposed) {
				return;
			}
			
			callback(child);
		};
		
		child = create_self(this, run);
		
		run();
	}
	
	
	/**
	 * One can use a housed signal if a component should be reconstructed fresh when a dependency changes.
	 * 
	 * Any dependencies that should participate in this tracking must simply be read immediately, with a fixed value passed, inside the housed signal value function.
	 */
	create_housed_signal(initial) {
		const signal = create_signal(() => ({
			self: undefined,
			value: initial,
		}));

		const housed = (self) => signal(self).value;

		housed.set = (get_value) => {
			const prev_self = signal().self;
			
			if (prev_self !== undefined && typeof prev_self[Symbol.dispose] === "function") {
				prev_self[Symbol.dispose]();
			}
			
			// Intentionally not implementing async-dispose, it serves no purpose in JavaScript from my preliminary analysis.
			// If you are familiar with unsuspended promises, you will see why.
			
			const new_self = create_self(this);
			
			signal.set(() => ({
				self: new_self,
				value: get_value(new_self),
			}));
		};

		return housed;
	}
	
	get is_disposed() {
		return this._is_disposed;
	}

	get abort_signal() {
		return this._abort_controller.signal;
	}

	on_dispose(handler) {
		this._dispose_handlers.push(handler);
	}
	
	[Symbol.dispose]() {
		if (this._is_disposed) {
			return;
		}
		
		this._is_disposed = true;
		this._abort_controller.abort();

		for (const child of this._children) {
			child[Symbol.dispose]();
		}
		
		this._children.clear();

		if (this._parent !== undefined) {
			this._parent._children.delete(this);
		}
		
		for (const handle_dispose of this._dispose_handlers) {
			handle_dispose();
		}
	}
}

/**
 * Creates a reactivity context that must be passed around explicitely.
*/
export const create_self = (parent, run_effect, options) => {
	return new Proxy(
		new Self(parent, run_effect, options),
		{
			get: (target, prop, receiver) => {
				if (typeof prop === "string" && prop.startsWith("$")) {
					return (...rest) => h(target, prop.substring(1), ...rest);
				}
				
				return Reflect.get(target, prop, receiver);	
			},
		}
	);
}

# Frosth - Yet another UI framework

**Latest version**: v1.0.3

## Motivation

Frontend component frameworks are still a mess (controversial, I know).
I remember switching to Svelte before React hooks were released. I then switched to Solid before Svelte had its chance to shine.
When building production-grade tools that prioritize reliability and UX over aesthetics, I found that 50% of my development time was spent fighting with these component frameworks.
That's why I built Frosth. It's not meant for all apps yet. It only supports client-side rendering. It's best suited for internal tools or dashboards where interaction desync is a big no-no.
- Async first: Not in a hacked way by slapping Suspense all over the codebase. Initialization is gradual at the state-management level, not bolted onto the UI later.
- Developers are treated with respect: The process of good software architecture is a solved problem - coming from experience and wisdom. A component framework that forces the "right" architecture is like telling junior developers that they will never be trusted to learn by failing.
- CRUD-last: Encapsulation is a solved problem. Sometimes code should be kept CRUD-like, sometimes behaviour and state should be encapsulated. An experienced developer is already trained to organize code effectively. Component frameworks don't need something new. Imagine a codebase where for every argument in the constructor, you must attach a getter and setter. You would be shocked! But this is effectively what React enforces for every component, the props are required to be changeable as the lifetime of the component progresses. Solid.js makes it easier to have read-only props, but is still inherently CRUD-based, not behaviour-based.

## Setup

**Quickstart:** `npx degit davidcallanan/frosth-template`.

**Manual:**

- `pnpm add -D vite`
- `pnpm add @davidcal/frosth`
- `import { mount, obtain, installarea } from "@davidcal/frosth";`
- `window.addEventListener("load", () => mount(document.getElementById("app"), App));`
- Start dev server: `vite`

## Examples

Hello, world:

```
import { mount, obtain, installarea } from "@davidcal/frosth";

const App = obtain(async ({ t, s }) => {
	const [installed, installable] = installarea(s);
	
	t.installable = installable;

	installed.set(() => [
		(s) => s.$h1({}, "Hello, world!"),
	]);
});

window.addEventListener("load", () => mount(document.getElementById("app"), App));
```

Signals are the most basic reactive primitive.

```
import { create_self, create_signal } from "@davidcal/frosth";

const name = create_signal(() => "John"); // signal values must be functions

name.set(() => "Mary");

console.log(name()); // read non-reactively

const s = create_self();

s.create_effect((s) => {
	console.log(name(s)); // read reactively by passing the reactive scope `s`
});
```

Signal values can themselves be reactive, so you can freely mix and match declarative and imperative logic:

```
const first_name = create_signal(() => "John");
const last_name = create_signal(() => "Doe");

const display_name = create_signal(first_name);

display_name.set((s) => `${first_name(s)} ${last_name(s)}`); // all signals expose a reactive scope
```

Create a component using `obtain`, and make it renderable using `installarea`.

```
import { obtain, installarea } from "@davidcal/forsth";

const Component = obtain(async ({ t, s }) => {
	const [installed, installable] = installarea(s);
	
	t.installable = installable; // Components do not need UI associated with them. To attach UI, you simply implement the installable interface.
	
	await new Promise((res) => setTimeout(res, 1000)); // Any component can be async
	
	installed.set(() => s.$h1({}, "Analyzing data...")); // Components can have multiple loading steps using sequential initialization
	
	await new Promise((res) => setTimeout(res, 1000));
	
	installed.set(() => s.$h1({ class: () => "bg-green-100" }, "Welcome to my app!"));
});
```

Data can be loaded in parallel:

```
const Component = obtain(async ({ t, s }) => {
	t.videos = t.Promise; // `t` is the equivalent of `this`
	t.friends = t.Promise; // Promises should be declared in the first microtask
	
	// (a) Using async-await 
	
	(async () => {
		const response = await fetch(`https://youtube.com/?user=${await t.friends[0]}`);
		const data = await response.json();
		t.videos = data.myVideos;
	})();
	
	// (b) Using then-chaining
	
	fetch("https://facemash.com/")
		.then(response => response.json())
		.then(data => t.friends = data.myFriends)
	;
});

const instance = Component({ s });

instance.friends.then(console.log);
instance.videos.then(console.log);
```

Attach cleanup code to any reactive scope using `on_dispose`:

```
const Component = obtain(async ({ t, s }) => {
	const count = create_signal(() => 0);
	
	const interval = setInterval(() => {
		count.set(() => count() + 1);
	}, 1000);
	
	s.on_dispose(() => {
		clearInterval(interval);
	});
	
	s.create_effect((s) => {
		const count$ = count(s);
		const controller = new AbortController();
		
		const timeout = setTimeout(() => {
			fetch(`https://monitoring.com/api/log?count=${count$}`, { signal: controller.signal });
		}, Math.random() * 2000);
		
		s.on_dispose(() => {
			clearTimeout(timeout);
			controller.abort();
		});
	});
});
```

Multiple installables are keyed by reference to the wrapper `(s) => ...`:

```
const TodoItem = obtain(async ({ t, s }) => {
	const [installed, installable] = installarea(s);
	
	t.installable = installable;
	
	installed.set(() => s.$h2({
		class: () => "bg-blue-100 m-2",
	}, "Todo: buy coffee"));
});

const Component = obtain(async ({ t, s }) => {
	const [installed, installable] = installarea(s);
	
	t.installable = installable;
	
	installed.set(() => [
		(s) => s.$div({}, "Click the button to add a new todo item"),
		(s) => s.$button({
			class: () => "border-gray border-2 cursor-pointer",
			onclick: () => () => { // Take care to use two functions here
				const prev = installed() ?? [];
				
				installed.set(() => [
					...prev,
					(s) => TodoItem({ s }),
				]);
			},
		}, "Add item!"),
	]);
});

```

Refs are just signals:

```
const Component = obtain(async ({ t, s }) => {
	const [installed, installable] = installarea(s);
	
	t.installable = installable;
	
	const ref_text = create_signal();
	
	installed.set(() => [
		(s) => s.$h1({
			ref: () => ref_text.set,
		}, "Click the button to change my color"),
		(s) => s.$button({
			onclick: () => () => {
				if (ref_text() === undefined) {
					return;
				}
				
				ref_text().style.color = "blue";
				ref_text().style.backgroundColor = "black";
			},
		}, "Change color of text"),
	]);
});
```

Client-side routing is easy:

```
import { A, path } from "@davidcal/frosth";

const Nav = obtain(async ({ t, s }) => {
	const [installed, installable] = installarea(s);
	
	t.installable = installable;

	installed.set(() => [
		(s) => A({ s, href: "/", children: "Home" }),
		(s) => A({ s, href: "/about", children: "About" }),
	]);
});

const App = obtain(async ({ t, s }) => {
	const [installed, installable] = installarea(s);
	
	t.installable = installable;

	installed.set(() => [
		(s) => Nav({ s }),
		obtain(async ({ t, s }) => {
			const [installed, installable] = installarea(s);
	
			t.installable = installable;
	
			s.create_effect((s) => {
				const path$ = path(s);
				
				if (current_path === "/") {
					installed.set(() => Home);
					return;
				}
				
				if (current.path === "/about) {
					installed.set(() => About);
					return;
				}
				
				installed.set(() => (s) => s.$h1({}, "404"));
			});
		}),
	]);
});
```

Ensure to wrap children in an array if making it reactive, or alternatively pass in a component instance that is inherently reactive.

```
const my_text_constant = create_signal(() => "my text content");

installed.set(() => [
	(s) => s.$h1({}, [
		(s) => my_text_content(s),
	]),
])
```

export const outstanding_mount_checks = new Map();

const mutation_observer = new MutationObserver((mutations) => {
	for (const mutation of mutations) {
		for (const node of mutation.addedNodes) {
			if (!outstanding_mount_checks.has(node)) {
				continue;
			}
			
			outstanding_mount_checks.get(node)();
			outstanding_mount_checks.delete(node);
		}
	}
});

if (typeof document !== "undefined") {
	mutation_observer.observe(document, {
		childList: true,
		subtree: true,
	});
}

setInterval(() => {
	if (outstanding_mount_checks.size === 0) {
		return;
	}
	
	console.warn(`[Frosth] One or more (${outstanding_mount_checks.size}) element(s) were created but not mounted. At least one \`ref: ["on_mount", ...]\` was never fired as a result.`);
	outstanding_mount_checks.clear();
}, 0);

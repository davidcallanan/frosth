class Fragment {
	constructor(parent) {
		this.start = document.createComment("fragment");
		this.end = document.createComment("/fragment");
		parent.appendChild(this.start);
		parent.appendChild(this.end);
	}

	clear() {
		while (this.start.nextSibling && this.start.nextSibling !== this.end) {
			this.start.nextSibling.remove();
		}
	}

	appendChild(child) {
		this.end.parentNode.insertBefore(child, this.end);
	}
	
	set innerHTML(html) {
		this.clear();
		
		if (html === "") {
			return;
		}
		
		const temp = document.createElement("template");
		temp.innerHTML = html;
		
		for (const node of temp.content.childNodes) {
			this.appendChild(node.cloneNode(true));
		}
	}

	set innerText(text) {
		this.clear();
		this.appendChild(document.createTextNode(text));
	}
}

export const create_fragment = (parent) => new Fragment(parent);

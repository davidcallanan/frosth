import * as Immutable from "immutable";
import { create_producer } from "./create_producer.js";

const wrap = (initial_uly_list) => {
	let uly_list = initial_uly_list;

	const producer = create_producer();

	const contract = {
		stream: producer.stream,
		size: () => uly_list.size,
		get: (index) => uly_list.get(index),
		first: () => uly_list.first(),
		last: () => uly_list.last(),
		to_array: () => uly_list.toArray(),
		fresh: () => wrap(uly_list),
	};

	const perform_elementary = (method, args, new_list) => {
		const old_contract = wrap(uly_list);
		uly_list = new_list;
		const new_contract = wrap(uly_list);
		
		console.log("performing elementgary", method, args, new_contract, old_contract);

		producer.emit([{ method, args }, new_contract, old_contract]);
	};

	contract.mutate = ({ method, args }) => {
		switch (method) {
			case "insert": {
				const [index, value] = args;
				perform_elementary("insert", [index, value], uly_list.insert(index, value));
				return;
			}
			case "remove": {
				const [index] = args;
				perform_elementary("remove", [index], uly_list.remove(index));
				return;
			}
			case "push": {
				const [value] = args;
				contract.mutate({ method: "insert", args: [uly_list.size, value] });
				return;
			}
			case "unshift": {
				const [value] = args;
				contract.mutate({ method: "insert", args: [0, value] });
				return;
			}
			case "pop": {
				contract.mutate({ method: "remove", args: [uly_list.size - 1] });
				return;
			}
			case "shift": {
				contract.mutate({ method: "remove", args: [0] });
				return;
			}
			case "set": {
				const [index, value] = args;
				contract.mutate({ method: "remove", args: [index] });
				contract.mutate({ method: "insert", args: [index, value] });
				return;
			}
			case "update": {
				const [index, updater] = args;
				contract.mutate({ method: "set", args: [index, updater(uly_list.get(index))] });
				return;
			}
			case "clear": {
				while (uly_list.size > 0) {
					contract.mutate({ method: "remove", args: [uly_list.size - 1] });
				}
				return;
			}

			default:
				throw new Error(`Unknown method: ${method}`);
		}
	};

	contract.insert = (index, value) => contract.mutate({ method: "insert", args: [index, value] });
	contract.remove = (index) => contract.mutate({ method: "remove", args: [index] });
	contract.push = (value) => contract.mutate({ method: "push", args: [value] });
	contract.unshift = (value) => contract.mutate({ method: "unshift", args: [value] });
	contract.pop = () => contract.mutate({ method: "pop", args: [] });
	contract.shift = () => contract.mutate({ method: "shift", args: [] });
	contract.set = (index, value) => contract.mutate({ method: "set", args: [index, value] });
	contract.update = (index, updater) => contract.mutate({ method: "update", args: [index, updater] });
	contract.clear = () => contract.mutate({ method: "clear", args: [] });

	return contract;
};

export const create_array = (initial) => wrap(Immutable.List(initial ?? []));

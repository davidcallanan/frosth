import { create_wrapper_stream } from "./create_wrapper_stream.js";

export const stream_reduce = (stream, reducer, initial) => {
	let acc = initial;

	return create_wrapper_stream(stream, (calldata, emit) => {
		acc = reducer(acc, calldata);
		emit(acc);
	});
};

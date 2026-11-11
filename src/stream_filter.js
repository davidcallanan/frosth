import { create_wrapper_stream } from "./create_wrapper_stream.js";

export const stream_filter = (stream, predicate) =>
	create_wrapper_stream(stream, (calldata, emit) => {
		if (predicate(calldata)) {
			emit(calldata);
		}
	})
;

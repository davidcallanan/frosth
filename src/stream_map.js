import { create_wrapper_stream } from "./create_wrapper_stream.js";

export const stream_map = (stream, mapper) =>
	create_wrapper_stream(stream, (calldata, emit) => {
		emit(mapper(calldata));
	})
;

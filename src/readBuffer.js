export default function readBuffer(pipe, length, callback) {
  if (length === 0) {
    callback(null, new Buffer(0));
    return;
  }
  let terminated = false;
  let remainingLength = length;
  const buffers = [];
  const readChunk = () => {
    const onEnd = () => {
      if (terminated) {
        return;
      }
      terminated = true;
      const err = new Error(`Stream ended ${remainingLength.toString()} bytes prematurely`);
      err.name = 'EarlyEOFError';
      callback(err);
    };
    const onChunk = (arg) => {
      if (terminated) {
        return;
      }
      let chunk = arg;
      let overflow;
      if (chunk.length > remainingLength) {
        overflow = chunk.slice(remainingLength);
        chunk = chunk.slice(0, remainingLength);
        remainingLength = 0;
      } else {
        remainingLength -= chunk.length;
      }
      buffers.push(chunk);
      if (remainingLength === 0) {
        pipe.pause();
        pipe.removeListener('data', onChunk);
        pipe.removeListener('end', onEnd);
        if (overflow) {
          pipe.unshift(overflow);
        }
        terminated = true;
        callback(null, Buffer.concat(buffers, length));
      }
    };
    pipe.on('data', onChunk);
    pipe.on('end', onEnd);
    pipe.resume();
  };
  readChunk();
}

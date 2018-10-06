'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = readBuffer;
function readBuffer(pipe, length, callback) {
  if (length === 0) {
    callback(null, new Buffer(0));
    return;
  }
  var terminated = false;
  var remainingLength = length;
  var buffers = [];
  var readChunk = function readChunk() {
    var onEnd = function onEnd() {
      if (terminated) {
        return;
      }
      terminated = true;
      var err = new Error(`Stream ended ${remainingLength.toString()} bytes prematurely`);
      err.name = 'EarlyEOFError';
      callback(err);
    };
    var onChunk = function onChunk(arg) {
      if (terminated) {
        return;
      }
      var chunk = arg;
      var overflow = void 0;
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
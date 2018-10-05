const stream = require('stream');
const readBuffer = require('../dist/readBuffer');

test('data is read', (done) => {
  expect.assertions(3);
  let eventCount = 0;
  function read() {
    eventCount += 1;
    if (eventCount <= 8) {
      return this.push(Buffer.from(eventCount.toString()));
    }
    return this.push(null);
  }
  const mockEventStream = new stream.Readable({
    objectMode: true,
    read,
  });
  function cb(err, data) {
    expect(err).toBe(null);
    expect(data.length).toBe(8);
    expect(String.fromCharCode(data[0])).toBe('1');
    done();
  }
  readBuffer.default(mockEventStream, 8, cb);
});

test('EOF returned for early quit', (done) => {
  expect.assertions(2);
  let eventCount = 0;
  function read() {
    eventCount += 1;
    if (eventCount <= 5) {
      return this.push(Buffer.from(eventCount.toString()));
    }
    return this.push(null);
  }
  const mockEventStream = new stream.Readable({
    objectMode: true,
    read,
  });
  function cb(err) {
    expect(err.name).toBe('EarlyEOFError');
    expect(err.message).toBe('Stream ended 3 bytes prematurely');
    done();
  }
  readBuffer.default(mockEventStream, 8, cb);
});

test('no event emitter leak', (done) => {
  process.on('warning', (warning) => {
    expect(warning).toBe(null);
  });
  expect.assertions(20);
  let eventCount = 0;
  function read() {
    eventCount += 1;
    return this.push(Buffer.from(eventCount.toString()));
  }
  const mockEventStream = new stream.Readable({
    objectMode: true,
    read,
  });
  let count = 0;
  function readLoop() {
    if (count >= 20) {
      done();
      return;
    }
    readBuffer.default(mockEventStream, 8, (err) => {
      expect(err).toBe(null);
      count += 1;
      readLoop();
    });
  }
  readLoop();
});

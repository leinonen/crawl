var queue = [];
var processed = [];

function contains(q, url) {
  return q.indexOf(url) !== -1;
}

function enqueue(url) {
  if (!contains(queue, url) && !contains(processed, url)) {
    queue.push(url);
  }
}

function dequeue() {
  if (queue.length > 0) {
    var url = queue.pop();
    processed.push(url);
    return url;
  } else {
    return null;
  }
}

function size() {
  return queue.length;
}

function done() {
  return queue.length === 0;
}

function getProcessed() {
  return processed;
}

exports.enqueue = enqueue;
exports.dequeue = dequeue;
exports.done = done;
exports.processed = getProcessed;
exports.size = size;
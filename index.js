'use strict';

const
  events     = require('events'),
  bus        = new events.EventEmitter(),
  queue      = require('./queue'),
  crawler    = require('./crawler'),
  LinkParser = require('./linkparser');

const
  TIMEOUT_THRESHOLD = 10 * 1000,
  TIMEOUT_TIMER     = 1000,
  CONCURRENT        = 8;

const Events = {
  NEXT:    'crawl',
  CRAWL_ERROR:    'crawl.error',
  CRAWL_COMPLETE: 'crawl.complete',
  CRAWL_TIMEOUT:  'crawl.timeout',
//  ENQUEUE_DOMAIN: 'enqueue.domain',
  DONE:           'done'
};

var lastCrawlTime = new Date().getTime();
var activeRequests = 0;

const doCrawl = (url) => {
  const parser = (html, domainResponse) => {
    return {
      url: url,
      links: LinkParser(html, url) || [],
      domainResponse: domainResponse
    };
  };
  const onSuccess = (result) => {
    activeRequests = activeRequests - 1;
    lastCrawlTime = new Date().getTime();
    bus.emit(Events.CRAWL_COMPLETE, result);
  };
  const onError = (err) => {
    activeRequests = activeRequests - 1;
    lastCrawlTime = new Date().getTime();
    bus.emit(Events.NEXT);
  };
  crawler.crawl(url, parser, onSuccess, onError);
};

const next = () => {
  if (!queue.done()) {
    if (activeRequests <= CONCURRENT) {
      var numRequests = Math.min(CONCURRENT - activeRequests, queue.size());
      activeRequests = activeRequests + numRequests;
      for (var i=0; i<numRequests; i++) {
        doCrawl(queue.dequeue());
      }
    } else {
      console.log('%d requests already in progress', activeRequests);
    }
  } else {
    bus.emit(Events.DONE);
  }
};

const printStatus = () => {
  var domains = queue.processed().length;
  var left = queue.size();
  console.log('Crawled %d domains. Queue: %d, Active requests: %d', domains, left, activeRequests);
};

const crawlCompleted = (result) => {

  // TODO: Do something useful with the result (save to database)
  // result.url - the url that has been crawled
  // result.domainResponse.statusCode - 200, 404 etc..
  // result.domainResponse.headers - headers
  // result.links - page links

  // Add any new links to queue
  //result.links.forEach(domain => bus.emit(Events.ENQUEUE_DOMAIN, domain));
  result.links.forEach(domain => queue.enqueue(domain));

  printStatus();
  bus.emit(Events.NEXT);
};

const crawlTimeout = (ms) => {
  console.log('Crawl timed out. No data for', ms, 'ms');
  if (activeRequests > 0 && queue.size() > 0) {
    console.log('%d domains pending', queue.size());
  }
  bus.emit(Events.DONE);
};

const checkTimestamp = () => {
  var delta = new Date().getTime() - lastCrawlTime;
  if (delta > TIMEOUT_THRESHOLD) {
    bus.emit(Events.CRAWL_TIMEOUT, delta);
  }
};

const done =() => {
  printStatus();
  console.log('DONE! Cya!');
  process.exit(0);
};

bus.on(Events.NEXT, next);
bus.on(Events.CRAWL_COMPLETE, crawlCompleted);
bus.on(Events.CRAWL_TIMEOUT,  crawlTimeout);
bus.on(Events.DONE, done);

setInterval(checkTimestamp, TIMEOUT_TIMER);

queue.enqueue(process.argv[2]);
bus.emit(Events.NEXT); // Start crawling

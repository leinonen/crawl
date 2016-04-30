const request = require('request');

const crawl = (url, parser, successCallback, errorCallback) => {
  request(url, (err, response, html) => {
    if (!err) {
      console.log('GET', url, response.statusCode);

      var domainResponse = {
        statusCode: response.statusCode,
        headers: response.headers
        // TODO: extract more data later..
      };

      successCallback(parser(html, domainResponse));
    } else {
      console.log('ERROR: GET', url, err.code, err.syscall || '');
      errorCallback(err);
    }
  });
};

exports.crawl = crawl;
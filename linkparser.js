const cheerio = require('cheerio');
const parseDomain = require('parse-domain');

const extractLinks = (html) => {
  var $ = cheerio.load(html);
  var links = [];
  $('a').filter(function() {
    var href = $(this).attr('href');
    if (href !== undefined) {
      links.push(href);
    }
  });
  return links;
};

const isValidDomain = (parsedDomain) => parsedDomain !== null;

const buildUrlFromDomain = (parsedDomain) => {
  var arr = [];
  if (parsedDomain.subdomain.length > 0) {
    arr.push(parsedDomain.subdomain);
  }
  arr.push(parsedDomain.domain);
  arr.push(parsedDomain.tld);
  return 'http://' + arr.join('.');
};

const safeParseDomain = (link) => {
  var domain;
  try {
    domain = parseDomain(link);
  } catch (error) {
    // console.log('ERROR: Unable to parse url:', link);
    // Just skip it
    return null;
  }
  return domain;
};

const LinkParser = (html, rootUrl) => {

  const appendRoot = (link) => link.startsWith('/') ? rootUrl + link : link;

  return extractLinks(html)
    .map(appendRoot)
    .map(safeParseDomain)
    .filter(isValidDomain)
    .map(buildUrlFromDomain);
};

module.exports = LinkParser;
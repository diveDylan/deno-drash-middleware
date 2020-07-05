import { Drash, createEtag } from "./dep.ts";

export const setETag = (
  response: Drash.Http.Response,
  entity: string,
  weak?: boolean
):void => {
  response.headers.set('etag', createEtag(entity, { weak }));
};

export const getETag = ( header: Headers ): String | undefined => {
  return header.get('etag');
};

/**
 * @description 
 *    compare the request and response, check the status is fresh or not
 * @param request 
 * @param response 
 */
export const isFresh = (
  request: Drash.Http.Request,
  response: Drash.Http.Response
): Boolean => {
  const modifiedSince = request.headers.get("if-modified-since");
  const noneMatch = request.headers.get("if-none-match");
  if (!modifiedSince && !noneMatch) {
    return false;
  }
  const CACHE_CONTROL_NO_CACHE_REGEXP = /(?:^|,)\s*?no-cache\s*?(?:,|$)/;
  const cacheControl = request.headers.get("cache-control");

  // Always return stale when Cache-Control: no-cache
  // to support end-to-end reload requests
  // https://tools.ietf.org/html/rfc2616#section-14.9.4
  if (cacheControl && CACHE_CONTROL_NO_CACHE_REGEXP.test(cacheControl)) {
    return false;
  }
  
  // if-none-match
  if (noneMatch && noneMatch !== '*') {
    const etag = getETag(response.headers);

    if (!etag) {
      return false;
    }

    let etagStale = true;
    const matches = parseTokenList(noneMatch);
    for (let i = 0; i < matches.length; i++) {
      let match = matches[i];
      if (match === etag || match === 'W/' + etag || 'W/' + match === etag) {
        etagStale = false;
        break;
      }
    }

    if (etagStale) {
      return false;
    }
  }

  // if-modified-since
  if (modifiedSince) {
    const lastModified = response.headers.get('last-modified');
    const modifiedStale = !lastModified || !(parseHttpDate(lastModified) <= parseHttpDate(modifiedSince));

    if (modifiedStale) {
      return false;
    }
  }

  return true;
};


/**
 * Parse an HTTP Date into a number.
 *
 * @param {string} date
 * @private
 */

function parseHttpDate (date: any) {
  var timestamp = date && Date.parse(date);

  // istanbul ignore next: guard against date.js Date.parse patching
  return typeof timestamp === 'number'
    ? timestamp
    : NaN;
}

/**
 * Parse a HTTP token list.
 *
 * @param {string} str
 * @private
 */

function parseTokenList (str: string) {
  let end = 0
  let list = []
  let start = 0

  // gather tokens
  for (let i = 0, len = str.length; i < len; i++) {
    switch (str.charCodeAt(i)) {
      case 0x20: /*   */
        if (start === end) {
          start = end = i + 1;
        }
        break;
      case 0x2c: /* , */
        list.push(str.substring(start, end));
        start = end = i + 1;
        break;
      default:
        end = i + 1;
        break;
    }
  }

  // final token
  list.push(str.substring(start, end));

  return list;
}

/**
 * @description
 *    check the etag status and setting defaultly
 * @param request 
 * @param response 
 */
export const ETagMiddleware = (
  request: Drash.Http.Request,
  response: Drash.Http.Response
):any => {
  if (isFresh(request, response)) {
    response.status_code = 304;
    response.end();
    return
  }
  response.status_code = 200;
  return response.body;
};
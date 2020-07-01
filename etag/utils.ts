import { Drash, createEtag } from "./dep.ts";

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
  return true;
};

export const setETag = () => {};

export const getETag = ( header: Headers ) => {

};

/**
 * @description
 *    check the etag status and setting defaultly
 * @param request 
 * @param response 
 */
export const ETagMiddleware = (
  request: Drash.Http.Request,
  response: Drash.Http.Response
):void => {

};
import { type RestHandler, rest, setupWorker } from "msw";

import { PUBLIC_PATH } from "@app/publicPath";

import { config } from "./config";
import fullMock from "./full-mock";
import stubNewWork from "./stub-new-work";

/**
 * Handler to catch unhandled traffic to `/hub/*`, log it, and pass it through to the
 * server to handle.  This is useful to see traffic, in the console logs, that is not
 * being mocked elsewhere.
 */
const passthroughHandler: RestHandler = rest.all(
  `${PUBLIC_PATH.replace(/\/$/, "")}/hub/*`,
  (req) => {
    console.log(
      "%cmsw passthrough%c \u{1fa83} %s",
      "font-weight: bold",
      "font-weight: normal",
      req.url
    );
    return req.passthrough();
  }
);

const handlers = [
  ...(config.full ? fullMock : []),
  ...(config.full ? [] : stubNewWork),
  config.passthrough && passthroughHandler,
].filter(Boolean);

/**
 * A setup MSW browser service worker using the handlers configured in the MOCK env var.
 */
export const worker = setupWorker(...handlers);

export { config } from "./config";

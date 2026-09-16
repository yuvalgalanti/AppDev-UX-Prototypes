/**
 * Resolved public base path this app is served from, e.g. when hosted at a GitHub Pages
 * subpath like `/AppDev-UX-Prototypes/mta-agentic-migration/`.
 *
 * Baked in at build time from `PUBLIC_PATH` via a webpack `DefinePlugin` global
 * (see `config/webpack.common.ts`'s `__PUBLIC_PATH__` define and `output.publicPath`,
 * and `config/webpack.prod.ts`'s injected `<base href>`).
 * Always has a leading and trailing slash, e.g. "/" when unset/root-hosted.
 */

declare const __PUBLIC_PATH__: string | undefined;

export const PUBLIC_PATH: string = (() => {
  const raw =
    typeof __PUBLIC_PATH__ !== "undefined" ? __PUBLIC_PATH__ : "/";
  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
})();

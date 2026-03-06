import { lazy } from "react";

const LAZY_RELOAD_KEY = "prende:lazy-reload";
const RECOVERABLE_IMPORT_ERRORS = [
  "failed to fetch dynamically imported module",
  "importing a module script failed",
  "unable to preload css",
  "error loading dynamically imported module",
];

function shouldForceReload(error) {
  const message = [
    error?.message,
    error?.cause?.message,
    error?.stack,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return RECOVERABLE_IMPORT_ERRORS.some((snippet) => message.includes(snippet));
}

export function lazyWithRetry(importer) {
  return lazy(async () => {
    try {
      const module = await importer();
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(LAZY_RELOAD_KEY);
      }
      return module;
    } catch (error) {
      if (typeof window !== "undefined" && shouldForceReload(error)) {
        const alreadyReloaded = window.sessionStorage.getItem(LAZY_RELOAD_KEY) === "1";

        if (!alreadyReloaded) {
          window.sessionStorage.setItem(LAZY_RELOAD_KEY, "1");
          window.location.reload();
          return new Promise(() => {});
        }
      }

      throw error;
    }
  });
}

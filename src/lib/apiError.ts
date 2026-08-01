import { ApiError, REQUEST_TIMEOUT_MS } from "@/lib/api";

const TIMEOUT_SECONDS = Math.round(REQUEST_TIMEOUT_MS / 1000);

/**
 * Rider-facing description of a failed request. The health banner already
 * announces a backend that is down, so this only has to separate the
 * failures a retry might fix from the ones it won't.
 */
export function describeApiError(error: unknown): string {
  if (error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError")) {
    return `The search took longer than ${TIMEOUT_SECONDS} seconds and was cancelled. A cold backend cache is usually the cause — trying again is often faster.`;
  }
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return "Too many requests to the backend just now. Wait a moment and try again.";
    }
    if (error.status >= 500) {
      return `The backend failed while scoring these routes (HTTP ${error.status}).`;
    }
    return `The backend rejected the search (HTTP ${error.status}). Check the stops and travel date.`;
  }
  // fetch rejects with a TypeError when the request never reached a server
  if (error instanceof TypeError) {
    return "Couldn't reach the backend. It may be starting up or unreachable from this browser.";
  }
  return "Something went wrong fetching routes.";
}

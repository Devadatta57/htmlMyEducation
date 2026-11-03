/*
  Talks to the backend REST API (js/config.js → API_BASE_URL), and caches results so
  a list opened twice, or a PDF shown with its neighbours, is only fetched once.
*/
(function (MyEducation) {
  'use strict';

  const STALE_TIME_MS = 5 * 60 * 1000;
  const RETRY_DELAY_MS = 1000;

  class ApiError extends Error {
    constructor(message, status) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }

  const isNotFound = (error) => error instanceof ApiError && error.status === 404;

  /**
   * GET a JSON resource from the backend.
   * @param {string} path - path relative to the API base URL, e.g. "/pdfs"
   */
  async function apiGet(path) {
    const response = await fetch(`${MyEducation.config.apiBaseUrl}${path}`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new ApiError(`Request to ${path} failed with status ${response.status}`, response.status);
    }

    return response.json();
  }

  /** Accepts either a bare array/object or the common `{ data: ... }` envelope. */
  function unwrapData(payload) {
    return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
  }

  const clone = (value) =>
    typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));

  /** Resolves with a copy of `value` after a short delay, so sample data behaves like a network call. */
  function mockResponse(value, delayMs = 350) {
    return new Promise((resolve) => setTimeout(() => resolve(clone(value)), delayMs));
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const cache = new Map();

  /**
   * Runs `fetcher` once per `key` and shares its result for 5 minutes. A failed request is
   * retried once after a second (never a 404), and a final failure is not cached, so
   * "Try again" really asks the server again.
   * @template T
   * @param {string} key
   * @param {() => Promise<T>} fetcher
   * @returns {Promise<T>}
   */
  function cachedQuery(key, fetcher) {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.time < STALE_TIME_MS) return hit.promise;

    const promise = fetcher()
      .catch((error) => {
        if (isNotFound(error)) throw error;
        return wait(RETRY_DELAY_MS).then(fetcher);
      })
      .catch((error) => {
        cache.delete(key);
        throw error;
      });

    cache.set(key, { promise, time: Date.now() });
    return promise;
  }

  MyEducation.services = Object.assign(MyEducation.services || {}, {
    api: { ApiError, isNotFound, apiGet, unwrapData, mockResponse, cachedQuery },
  });
})((window.MyEducation = window.MyEducation || {}));

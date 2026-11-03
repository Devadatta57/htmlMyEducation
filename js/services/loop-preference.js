/*
  Remembers per video whether it should play on repeat. Shared by the "More videos" cards'
  Loop buttons and the player's loop control, and kept in sync across open tabs.
*/
(function (MyEducation) {
  'use strict';

  const STORAGE_PREFIX = 'myeducation:video-loop:';

  // In-memory copy so the toggle still works when localStorage is blocked (private mode).
  const memory = new Map();
  const listeners = new Set();

  const storageKey = (videoId) => `${STORAGE_PREFIX}${videoId}`;

  /** @returns {boolean} */
  function get(videoId) {
    const key = storageKey(videoId);
    if (memory.has(key)) return memory.get(key);
    try {
      return window.localStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  }

  function set(videoId, value) {
    const key = storageKey(videoId);
    memory.set(key, value);
    try {
      if (value) window.localStorage.setItem(key, '1');
      else window.localStorage.removeItem(key);
    } catch {
      // Storage unavailable: the in-memory value is used for this tab.
    }
    listeners.forEach((listener) => listener());
  }

  /**
   * Calls `listener` whenever any video's loop setting changes, here or in another tab.
   * @returns {() => void} unsubscribe
   */
  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  // A change made in another tab (e.g. the video page) arrives as a storage event.
  window.addEventListener('storage', (event) => {
    if (event.key) memory.delete(event.key);
    else memory.clear(); // storage was cleared
    listeners.forEach((listener) => listener());
  });

  MyEducation.services.loopPreference = { get, set, subscribe };
})((window.MyEducation = window.MyEducation || {}));

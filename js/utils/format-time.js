/* Time formatting for video lengths and the player clock. */
(function (MyEducation) {
  'use strict';

  /** Formats seconds as m:ss or h:mm:ss. */
  function formatTime(totalSeconds) {
    if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';

    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor((totalSeconds / 60) % 60);
    const hours = Math.floor(totalSeconds / 3600);
    const ss = String(seconds).padStart(2, '0');

    return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${ss}` : `${minutes}:${ss}`;
  }

  /** ISO 8601 duration for <time datetime>, e.g. 803 → "PT13M23S". */
  function toIsoDuration(totalSeconds) {
    const total = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    return `PT${hours ? `${hours}H` : ''}${minutes ? `${minutes}M` : ''}${seconds}S`;
  }

  MyEducation.utils = Object.assign(MyEducation.utils || {}, { formatTime, toIsoDuration });
})((window.MyEducation = window.MyEducation || {}));

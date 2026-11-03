/*
  Settings to change before going live. Loaded first on every page.
*/
(function (MyEducation) {
  'use strict';

  // Base URL of the backend REST API, without a trailing slash,
  // e.g. 'https://api.myeducation.in/api'.
  // Leave it empty to run with the built-in sample data (js/data/: 10 PDF parts and
  // 10 videos, titles only, no files) until the backend is ready.
  const API_BASE_URL = '';

  const apiBaseUrl = API_BASE_URL.trim().replace(/\/+$/, '');

  MyEducation.config = {
    appName: 'My Education',
    apiBaseUrl,
    /** When no backend URL is configured the pages use the sample data. */
    useMockApi: apiBaseUrl === '',
  };
})((window.MyEducation = window.MyEducation || {}));

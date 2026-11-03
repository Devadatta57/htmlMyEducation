/* Small DOM helpers shared by the components and pages. */
(function (MyEducation) {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  /** Makes text from the backend safe to put inside HTML markup or an attribute. */
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

  const SAFE_PROTOCOLS = ['http:', 'https:', 'blob:', 'file:'];

  /** The URL when it is a web, blob or local file address (never javascript: etc.), else null. */
  function safeUrl(url) {
    if (!url) return null;
    try {
      return SAFE_PROTOCOLS.includes(new URL(url, document.baseURI).protocol) ? String(url) : null;
    } catch {
      return null;
    }
  }

  /** Value of a query-string parameter of the current page, e.g. ?id=pdf-1 → 'pdf-1'. */
  const getQueryParam = (name) => new URLSearchParams(window.location.search).get(name);

  /** "Title · My Education", or just "My Education". */
  function setDocumentTitle(title) {
    const { appName } = MyEducation.config;
    document.title = title ? `${title} · ${appName}` : appName;
  }

  /** Sets an element's text only when it changed (keeps DOM mutations to a minimum). */
  function setText(element, text) {
    if (element.textContent !== text) element.textContent = text;
  }

  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  MyEducation.utils = Object.assign(MyEducation.utils || {}, {
    $,
    $$,
    escapeHtml,
    safeUrl,
    getQueryParam,
    setDocumentTitle,
    setText,
    prefersReducedMotion,
  });
})((window.MyEducation = window.MyEducation || {}));

/* Markup for the small shared pieces: buttons, the loading spinner and status messages. */
(function (MyEducation) {
  'use strict';

  const { escapeHtml, icon } = MyEducation.utils;

  /**
   * Pill button: an <a> when `href` is given, otherwise a <button>.
   * @param {{
   *   label: string,            - inner HTML (may contain an icon); escape any text from the backend
   *   variant?: 'primary' | 'secondary' | 'ghost',
   *   size?: 'md' | 'sm',
   *   href?: string,
   *   attributes?: string,      - extra attributes, e.g. 'data-action="retry"'
   * }} options
   */
  function button({ label, variant = 'primary', size = 'md', href, attributes = '' }) {
    const className = `btn btn--${variant} btn--${size}`;
    const extra = attributes ? ` ${attributes}` : '';

    return href
      ? `<a class="${className}" href="${escapeHtml(href)}"${extra}>${label}</a>`
      : `<button type="button" class="${className}"${extra}>${label}</button>`;
  }

  function spinner({ label = 'Loading', fullPage = false } = {}) {
    return `
      <div class="spinner${fullPage ? ' spinner--full-page' : ''}" role="status">
        <span class="spinner__ring" aria-hidden="true"></span>
        <span class="visually-hidden">${escapeHtml(label)}</span>
      </div>`;
  }

  /**
   * Friendly empty / error / info state with optional actions.
   * @param {{ tone?: 'info' | 'error', icon?: string, title: string, message?: string, actions?: string }} options
   */
  function statusMessage({ tone = 'info', icon: iconName, title, message, actions = '' }) {
    const isError = tone === 'error';
    const name = iconName ?? (isError ? 'circle-alert' : 'info');

    return `
      <div class="status${isError ? ' status--error' : ''}"${isError ? ' role="alert"' : ''}>
        <span class="status__icon" aria-hidden="true">${icon(name)}</span>
        <p class="status__title">${escapeHtml(title)}</p>
        ${message ? `<p class="status__message">${escapeHtml(message)}</p>` : ''}
        ${actions ? `<div class="status__actions">${actions}</div>` : ''}
      </div>`;
  }

  MyEducation.components = Object.assign(MyEducation.components || {}, {
    ui: { button, spinner, statusMessage },
  });
})((window.MyEducation = window.MyEducation || {}));

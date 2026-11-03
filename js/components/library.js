/*
  The white panel that a learning-path card's Explore button opens: a header with a count
  badge, then a spinner, an error with "Try again", an empty state or the list itself.
  pdf-library.js and video-library.js fill it with their own items.
*/
(function (MyEducation) {
  'use strict';

  const { $, escapeHtml } = MyEducation.utils;
  const { ui } = MyEducation.components;

  /**
   * Renders the panel into `container` and loads its items.
   * @param {HTMLElement} container
   * @param {{
   *   variant: 'pdfs' | 'videos',
   *   eyebrow: string, title: string, titleLang?: string, caption: string,
   *   load: () => Promise<any[]>,
   *   countLabel: (count: number) => string,           - badge text, e.g. "10 Parts"
   *   renderList: (items: any[]) => string,            - list markup
   *   afterRender?: (list: HTMLElement, items: any[]) => void,
   *   loadingLabel: string, errorTitle: string, emptyTitle: string, emptyMessage: string,
   * }} options
   */
  function mountLibrary(container, options) {
    const titleId = `${options.variant}-library-title`;
    const lang = options.titleLang ? ` lang="${options.titleLang}"` : '';

    container.innerHTML = `
      <section class="library library--${options.variant}" aria-labelledby="${titleId}" aria-busy="true">
        <header class="library__header">
          <div class="library__top-row">
            <p class="library__eyebrow">${escapeHtml(options.eyebrow)}</p>
            <span class="library__badge" hidden></span>
          </div>
          <h3 id="${titleId}" class="library__title"${lang}>${escapeHtml(options.title)}</h3>
          <p class="library__caption">${escapeHtml(options.caption)}</p>
        </header>
        <div class="library__body"></div>
      </section>`;

    const section = container.firstElementChild;
    const badge = $('.library__badge', section);
    const body = $('.library__body', section);

    async function load() {
      section.setAttribute('aria-busy', 'true');
      badge.hidden = true;
      body.innerHTML = ui.spinner({ label: options.loadingLabel });

      let items;
      try {
        items = await options.load();
      } catch {
        items = null;
      }
      // Explore may have switched to the other list (or closed it) while this one loaded.
      if (!section.isConnected) return;
      section.setAttribute('aria-busy', 'false');

      if (!items) {
        body.innerHTML = ui.statusMessage({
          tone: 'error',
          title: options.errorTitle,
          message: 'Please check your internet connection and try again.',
          actions: ui.button({ label: 'Try again', size: 'sm', attributes: 'data-action="retry"' }),
        });
        return;
      }

      badge.textContent = options.countLabel(items.length);
      badge.hidden = false;

      if (items.length === 0) {
        body.innerHTML = ui.statusMessage({ title: options.emptyTitle, message: options.emptyMessage });
        return;
      }

      body.innerHTML = options.renderList(items);
      options.afterRender?.(body.firstElementChild, items);
    }

    body.addEventListener('click', (event) => {
      if (event.target.closest('[data-action="retry"]')) load();
    });

    load();
  }

  MyEducation.components.mountLibrary = mountLibrary;
})((window.MyEducation = window.MyEducation || {}));

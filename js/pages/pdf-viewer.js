/*
  PDF viewer (pdf.html?id=…), opened in a new tab from the PDF list: shows one PDF inline,
  with Download / Open full screen and links to the previous and next part.
*/
(function (MyEducation) {
  'use strict';

  const { $, escapeHtml, safeUrl, icon, getQueryParam, setDocumentTitle } = MyEducation.utils;
  const { ui } = MyEducation.components;
  const { ApiError, isNotFound } = MyEducation.services.api;
  const { fetchPdfById, fetchPdfs } = MyEducation.services.pdfs;
  const { routes } = MyEducation;

  const pdfId = getQueryParam('id');

  const refs = {
    heading: $('#pdf-heading'),
    title: $('#pdf-title'),
    subtitle: $('#pdf-subtitle'),
    actions: $('#pdf-actions'),
    viewer: $('#pdf-viewer'),
    pager: $('#pdf-pager'),
  };

  function fileActions(fileUrl) {
    return (
      ui.button({
        variant: 'secondary',
        size: 'sm',
        href: fileUrl,
        attributes: 'download',
        label: `${icon('download')} Download`,
      }) +
      ui.button({
        size: 'sm',
        href: fileUrl,
        attributes: 'target="_blank" rel="noopener noreferrer"',
        label: `${icon('external-link')} Open full screen`,
      })
    );
  }

  function showPdf(pdf) {
    setDocumentTitle(pdf.title);
    refs.title.textContent = pdf.title;
    refs.subtitle.textContent = `Part ${pdf.partNumber} · Export Education`;
    refs.heading.hidden = false;

    const fileUrl = safeUrl(pdf.fileUrl);
    if (!fileUrl) {
      refs.viewer.innerHTML = ui.statusMessage({
        icon: 'file-text',
        title: 'Your PDF is here soon',
        message: `“${pdf.title}” will appear here as soon as it is uploaded.`,
      });
      return;
    }

    refs.actions.innerHTML = fileActions(fileUrl);
    refs.actions.hidden = false;
    // The message inside <object> only shows in browsers that can't display PDFs inline (most phones).
    refs.viewer.innerHTML = `
      <object class="pdf-page__frame" data="${escapeHtml(fileUrl)}" type="application/pdf"
        aria-label="${escapeHtml(pdf.title)}">
        ${ui.statusMessage({
          icon: 'file-text',
          title: 'Open this PDF to read it',
          message: "Your browser can't show the PDF on this page. Open or download it instead.",
          actions: fileActions(fileUrl),
        })}
      </object>`;
  }

  function showError(error) {
    const notFound = isNotFound(error);
    const retryButton = notFound ? '' : ui.button({ label: 'Try again', attributes: 'data-action="retry"' });

    refs.viewer.innerHTML = ui.statusMessage({
      tone: 'error',
      title: notFound ? 'PDF not found' : "Couldn't load this PDF",
      message: notFound
        ? 'This PDF may have been moved or removed.'
        : 'Please check your internet connection and try again.',
      actions: retryButton + ui.button({ variant: 'secondary', href: routes.home, label: 'Go to home' }),
    });
  }

  async function loadPdf() {
    refs.viewer.setAttribute('aria-busy', 'true');
    refs.viewer.innerHTML = ui.spinner({ label: 'Loading PDF' });

    try {
      if (!pdfId) throw new ApiError('No PDF id in the address', 404);
      showPdf(await fetchPdfById(pdfId));
    } catch (error) {
      showError(error);
    } finally {
      refs.viewer.setAttribute('aria-busy', 'false');
    }
  }

  function pagerLink(pdf, direction) {
    const isNext = direction === 'next';
    const arrow = icon(isNext ? 'chevron-right' : 'chevron-left');
    const text = `
      <span>
        <span class="pager__hint">Part ${pdf.partNumber}</span>
        <span class="pager__title">${escapeHtml(pdf.title)}</span>
      </span>`;

    return `
      <a class="pager__link${isNext ? ' pager__link--next' : ''}" href="${escapeHtml(routes.pdf(pdf.id))}">
        ${isNext ? text + arrow : arrow + text}
      </a>`;
  }

  /** Previous / next part. Optional: without the list there is simply no pager. */
  async function loadPager() {
    if (!pdfId) return;

    let pdfs;
    try {
      pdfs = await fetchPdfs();
    } catch {
      return;
    }

    const index = pdfs.findIndex((item) => item.id === pdfId);
    const previous = index > 0 ? pdfs[index - 1] : null;
    const next = index >= 0 && index < pdfs.length - 1 ? pdfs[index + 1] : null;
    if (!previous && !next) return;

    refs.pager.innerHTML = (previous ? pagerLink(previous, 'previous') : '<span></span>') + (next ? pagerLink(next, 'next') : '');
    refs.pager.hidden = false;
  }

  refs.viewer.addEventListener('click', (event) => {
    if (event.target.closest('[data-action="retry"]')) loadPdf();
  });

  loadPdf();
  loadPager();
})((window.MyEducation = window.MyEducation || {}));

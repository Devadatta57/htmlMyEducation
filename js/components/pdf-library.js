/* Curriculum list of PDFs. Renders however many PDFs the backend returns. */
(function (MyEducation) {
  'use strict';

  const { escapeHtml, icon } = MyEducation.utils;
  const { mountLibrary } = MyEducation.components;
  const { fetchPdfs } = MyEducation.services.pdfs;

  /** One curriculum row. The whole row is a link that opens the PDF viewer in a new tab. */
  function pdfItem(pdf) {
    const label = `View PDF – Part ${pdf.partNumber}: ${pdf.title} (opens in a new tab)`;

    return `
      <a class="pdf-item" href="${escapeHtml(MyEducation.routes.pdf(pdf.id))}" target="_blank"
        rel="noopener noreferrer" aria-label="${escapeHtml(label)}">
        <span class="pdf-item__number">${pdf.partNumber}</span>

        <span class="pdf-item__file-icon" aria-hidden="true">
          ${icon('file-text')}
          <span class="pdf-item__file-tag">PDF</span>
        </span>

        <span class="pdf-item__text">
          <span class="pdf-item__name">${escapeHtml(pdf.title)}</span>
          <span class="pdf-item__part">Part ${pdf.partNumber}</span>
        </span>

        <span class="pdf-item__action" aria-hidden="true">
          ${icon('eye')}
          <span class="pdf-item__action-label">View PDF</span>
          ${icon('external-link', { className: 'pdf-item__external' })}
        </span>
      </a>`;
  }

  /** @param {HTMLElement} container */
  function mount(container) {
    mountLibrary(container, {
      variant: 'pdfs',
      eyebrow: 'Export Education',
      title: 'పొలం నుంచి యూరప్ వరకు',
      titleLang: 'te',
      caption: 'Structured Learning Curriculum',
      load: fetchPdfs,
      countLabel: (count) => `${count} ${count === 1 ? 'Part' : 'Parts'}`,
      renderList: (pdfs) =>
        `<ol class="pdf-list">${pdfs.map((pdf) => `<li>${pdfItem(pdf)}</li>`).join('')}</ol>`,
      loadingLabel: 'Loading PDFs',
      errorTitle: "Couldn't load the PDFs",
      emptyTitle: 'No PDFs yet',
      emptyMessage: 'New parts will appear here as soon as they are uploaded.',
    });
  }

  MyEducation.components.pdfLibrary = { mount };
})((window.MyEducation = window.MyEducation || {}));

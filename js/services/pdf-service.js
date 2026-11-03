/* PDFs: the curriculum list and single PDFs, from the backend or the sample data. */
(function (MyEducation) {
  'use strict';

  const { ApiError, apiGet, unwrapData, mockResponse, cachedQuery } = MyEducation.services.api;

  /**
   * @typedef {Object} Pdf
   * @property {string} id
   * @property {string} title
   * @property {number} partNumber
   * @property {string | null} fileUrl - absolute or same-origin URL of the PDF file
   */

  /**
   * Maps a backend record to the shape the pages use.
   * If the backend names fields differently, adjust only this function.
   * @returns {Pdf}
   */
  function toPdf(raw) {
    return {
      id: String(raw.id ?? raw._id),
      title: raw.title ?? raw.name ?? '',
      partNumber: Number(raw.partNumber ?? raw.part ?? raw.order ?? 0),
      fileUrl: raw.fileUrl ?? raw.url ?? null,
    };
  }

  const byPartNumber = (a, b) => a.partNumber - b.partNumber;

  /** @returns {Promise<Pdf[]>} sorted by part number */
  function fetchPdfs() {
    return cachedQuery('pdfs', async () => {
      const records = MyEducation.config.useMockApi
        ? await mockResponse(MyEducation.data.mockPdfs)
        : unwrapData(await apiGet('/pdfs'));

      return (records ?? []).map(toPdf).sort(byPartNumber);
    });
  }

  /** @returns {Promise<Pdf>} rejects with ApiError 404 when there is no such PDF */
  function fetchPdfById(pdfId) {
    return cachedQuery(`pdfs/${pdfId}`, async () => {
      if (MyEducation.config.useMockApi) {
        const record = MyEducation.data.mockPdfs.find((pdf) => String(pdf.id) === String(pdfId));
        if (!record) throw new ApiError('PDF not found', 404);
        return toPdf(await mockResponse(record));
      }

      return toPdf(unwrapData(await apiGet(`/pdfs/${encodeURIComponent(pdfId)}`)));
    });
  }

  MyEducation.services.pdfs = { fetchPdfs, fetchPdfById };
})((window.MyEducation = window.MyEducation || {}));

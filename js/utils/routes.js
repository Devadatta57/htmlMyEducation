/*
  Page addresses. The PDF and video pages take the item's id as a query parameter
  (pdf.html?id=pdf-1), so they work from file:// and on any static host without
  server rewrites.
*/
(function (MyEducation) {
  'use strict';

  MyEducation.routes = {
    home: 'index.html',
    pdf: (pdfId) => `pdf.html?id=${encodeURIComponent(pdfId)}`,
    video: (videoId) => `video.html?id=${encodeURIComponent(videoId)}`,
  };
})((window.MyEducation = window.MyEducation || {}));

/*
  Sample data used until js/config.js points at the real backend.
  Shape mirrors what GET /pdfs is expected to return (see README → Backend API contract).
  `fileUrl` is null because the files themselves are uploaded by the backend.
*/
(function (MyEducation) {
  'use strict';

  const mockPdfs = [
    { id: 'pdf-1', partNumber: 1, title: 'ఎగుమతి ప్రపంచానికి పరిచయం', fileUrl: null },
    { id: 'pdf-2', partNumber: 2, title: 'పంట ఎంపిక నుంచి కోత వరకు', fileUrl: null },
    { id: 'pdf-3', partNumber: 3, title: 'కోత, గ్రేడింగ్, ప్యాకింగ్, నిల్వ', fileUrl: null },
    { id: 'pdf-4', partNumber: 4, title: 'భారత ప్రభుత్వ ఎగుమతి నమోదు వ్యవస్థ', fileUrl: null },
    { id: 'pdf-5', partNumber: 5, title: 'నాణ్యత పరీక్షలు మరియు సర్టిఫికెట్లు', fileUrl: null },
    { id: 'pdf-6', partNumber: 6, title: 'కొనుగోలుదారుల ఎంపిక మరియు ఒప్పందాలు', fileUrl: null },
    { id: 'pdf-7', partNumber: 7, title: 'బ్యాంకింగ్ మరియు ఆర్థిక వ్యవస్థ', fileUrl: null },
    { id: 'pdf-8', partNumber: 8, title: 'షిప్పింగ్ మరియు లాజిస్టిక్స్', fileUrl: null },
    { id: 'pdf-9', partNumber: 9, title: 'కస్టమ్స్ క్లియరెన్స్ మరియు డాక్యుమెంటేషన్', fileUrl: null },
    { id: 'pdf-10', partNumber: 10, title: 'యూరప్ మార్కెట్‌కు చేరుకోవడం', fileUrl: null },
  ];

  MyEducation.data = Object.assign(MyEducation.data || {}, { mockPdfs });
})((window.MyEducation = window.MyEducation || {}));

/*
  Sample data used until js/config.js points at the real backend.
  Shape mirrors what GET /videos is expected to return (see README → Backend API contract).
  `videoUrl` / `thumbnailUrl` are null because the files are stored by the backend;
  the durations are sample values so the card layout can be reviewed.
*/
(function (MyEducation) {
  'use strict';

  const SAMPLE_DURATIONS = [803, 615, 1122, 542, 1458, 731, 3735, 905, 1264, 688];

  const mockVideos = SAMPLE_DURATIONS.map((durationSeconds, index) => ({
    id: `video-${index + 1}`,
    title: `Video ${index + 1}`,
    description: `Description for Video ${index + 1} will appear here. It gives a quick overview of what you will learn in this lesson.`,
    thumbnailUrl: null,
    videoUrl: null,
    durationSeconds,
  }));

  MyEducation.data = Object.assign(MyEducation.data || {}, { mockVideos });
})((window.MyEducation = window.MyEducation || {}));

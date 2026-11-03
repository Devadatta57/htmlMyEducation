/*
  Video lessons shown as cards one below the other, without Loop buttons (looping is set
  on the video page). Renders however many videos the backend returns.
*/
(function (MyEducation) {
  'use strict';

  const { mountLibrary, videoCard } = MyEducation.components;
  const { fetchVideos } = MyEducation.services.videos;

  /** @param {HTMLElement} container */
  function mount(container) {
    mountLibrary(container, {
      variant: 'videos',
      eyebrow: 'Export Education',
      title: 'Video Lessons',
      caption: 'Watch, pause and replay at your own pace',
      load: fetchVideos,
      countLabel: (count) => `${count} ${count === 1 ? 'Video' : 'Videos'}`,
      renderList: (videos) =>
        `<ul class="video-list">${videos
          .map((video) => `<li>${videoCard.render(video, { showLoop: false })}</li>`)
          .join('')}</ul>`,
      afterRender: (list, videos) => videoCard.hydrate(list, videos),
      loadingLabel: 'Loading videos',
      errorTitle: "Couldn't load the videos",
      emptyTitle: 'No videos yet',
      emptyMessage: 'New videos will appear here as soon as they are uploaded.',
    });
  }

  MyEducation.components.videoLibrary = { mount };
})((window.MyEducation = window.MyEducation || {}));

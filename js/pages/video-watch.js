/*
  Video page (video.html?id=…), opened in a new tab from a video card: the player with the
  lesson's details and keyboard shortcuts, plus the other videos under "More videos".
*/
(function (MyEducation) {
  'use strict';

  const { $, getQueryParam, setDocumentTitle } = MyEducation.utils;
  const { ui, videoCard, createVideoPlayer } = MyEducation.components;
  const { ApiError, isNotFound } = MyEducation.services.api;
  const { fetchVideoById, fetchVideos } = MyEducation.services.videos;
  const { loopPreference } = MyEducation.services;
  const { routes } = MyEducation;

  const videoId = getQueryParam('id');

  const refs = {
    primary: $('#video-primary'),
    stage: $('#video-stage'),
    details: $('#video-details'),
    title: $('#video-title'),
    description: $('#video-description'),
    shortcuts: $('#video-shortcuts'),
    sidebar: $('#more-videos'),
    sidebarList: $('#more-videos-list'),
  };

  function showVideo(video) {
    setDocumentTitle(video.title);

    // The loop setting is saved per video and shared with the "More videos" cards and other tabs.
    const player = createVideoPlayer(refs.stage, {
      src: video.videoUrl,
      poster: video.thumbnailUrl,
      title: video.title,
      loop: loopPreference.get(video.id),
      onLoopChange: (isLooping) => loopPreference.set(video.id, isLooping),
    });
    loopPreference.subscribe(() => player.setLoop(loopPreference.get(video.id)));

    refs.title.textContent = video.title;
    refs.description.textContent = video.description ?? '';
    refs.description.hidden = !video.description;
    refs.details.hidden = false;
    refs.shortcuts.hidden = false;
  }

  function showError(error) {
    const notFound = isNotFound(error);
    const retryButton = notFound ? '' : ui.button({ label: 'Try again', attributes: 'data-action="retry"' });

    refs.stage.innerHTML = ui.statusMessage({
      tone: 'error',
      title: notFound ? 'Video not found' : "Couldn't load this video",
      message: notFound
        ? 'This video may have been moved or removed.'
        : 'Please check your internet connection and try again.',
      actions: retryButton + ui.button({ variant: 'secondary', href: routes.home, label: 'Go to home' }),
    });
  }

  async function loadVideo() {
    refs.primary.setAttribute('aria-busy', 'true');
    refs.stage.innerHTML = `<div class="watch-page__player-placeholder">${ui.spinner({ label: 'Loading video' })}</div>`;

    try {
      if (!videoId) throw new ApiError('No video id in the address', 404);
      showVideo(await fetchVideoById(videoId));
    } catch (error) {
      showError(error);
    } finally {
      refs.primary.setAttribute('aria-busy', 'false');
    }
  }

  /** "More videos": every other video, opening in this tab. Optional, like the PDF pager. */
  async function loadMoreVideos() {
    let videos;
    try {
      videos = await fetchVideos();
    } catch {
      return;
    }

    const otherVideos = videos.filter((item) => item.id !== videoId);
    if (otherVideos.length === 0) return;

    refs.sidebarList.innerHTML = otherVideos
      .map((item) => `<li>${videoCard.render(item, { compact: true, openInNewTab: false, titleTag: 'h3' })}</li>`)
      .join('');
    videoCard.hydrate(refs.sidebarList, otherVideos);
    refs.sidebar.hidden = false;
  }

  refs.stage.addEventListener('click', (event) => {
    if (event.target.closest('[data-action="retry"]')) loadVideo();
  });

  loadVideo();
  loadMoreVideos();
})((window.MyEducation = window.MyEducation || {}));

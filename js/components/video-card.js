/*
  Video card: thumbnail with the title, description, length and (unless showLoop is false)
  a Loop toggle beside it. The title link is stretched over the whole card, so clicking
  anywhere opens the video (in a new tab by default); the Loop button sits above that link.
*/
(function (MyEducation) {
  'use strict';

  const { $, $$, escapeHtml, safeUrl, icon, formatTime, toIsoDuration } = MyEducation.utils;
  const { loopPreference, videos: videoService } = MyEducation.services;

  /**
   * Card markup. Call hydrate() on the cards' container once they are in the page.
   * @param {import('../services/video-service.js').Video} video
   * @param {{ openInNewTab?: boolean, compact?: boolean, showLoop?: boolean, titleTag?: 'h3' | 'h4' }} [options]
   */
  function render(video, { openInNewTab = true, compact = false, showLoop = true, titleTag = 'h4' } = {}) {
    const title = escapeHtml(video.title);
    const thumbnailUrl = safeUrl(video.thumbnailUrl);
    const duration = video.durationSeconds;
    const linkTarget = openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';

    const loopButton = showLoop
      ? `
        <button type="button" class="video-card__loop-button" aria-pressed="false" title="Play ${title} on repeat">
          ${icon('repeat')}
          <span${compact ? ' class="visually-hidden"' : ''}>Loop</span>
          <span class="visually-hidden"> ${title}</span>
        </button>`
      : '';

    const thumbnail = thumbnailUrl
      ? `<img src="${escapeHtml(thumbnailUrl)}" alt="" loading="lazy" decoding="async" />`
      : `<span class="video-card__placeholder">
          <span class="video-card__placeholder-text">Your video is here</span>
        </span>`;

    const actions = compact
      ? ''
      : `
        <div class="video-card__actions">
          <span class="video-card__watch" aria-hidden="true">
            ${icon('play', { fill: 'currentColor' })}
            <span>Watch<span class="video-card__watch-extra"> video</span></span>
            ${openInNewTab ? icon('external-link', { className: 'video-card__external' }) : ''}
          </span>
          ${loopButton}
        </div>`;

    return `
      <article class="video-card${compact ? ' video-card--compact' : ''}" data-video-id="${escapeHtml(video.id)}">
        <div class="video-card__thumbnail" aria-hidden="true">
          ${thumbnail}
          <span class="video-card__play-badge">${icon('play', { fill: 'currentColor' })}</span>
          ${showLoop ? `<span class="video-card__loop-badge" hidden>${icon('repeat')} Loop</span>` : ''}
          <span class="video-card__duration-badge"${duration ? '' : ' hidden'}>${duration ? formatTime(duration) : ''}</span>
        </div>

        <div class="video-card__body">
          <${titleTag} class="video-card__title">
            <a class="video-card__link" href="${escapeHtml(MyEducation.routes.video(video.id))}"${linkTarget}>${title}${
              openInNewTab ? '<span class="visually-hidden"> (opens in a new tab)</span>' : ''
            }</a>
          </${titleTag}>

          ${!compact && video.description ? `<p class="video-card__description">${escapeHtml(video.description)}</p>` : ''}

          <div class="video-card__meta">
            <span class="video-card__duration"${duration ? '' : ' hidden'}>
              ${icon('clock')}
              <span class="visually-hidden">Duration: </span>
              <time${duration ? ` datetime="${toIsoDuration(duration)}"` : ''}>${duration ? formatTime(duration) : ''}</time>
            </span>
            ${compact ? loopButton : ''}
          </div>
          ${actions}
        </div>
      </article>`;
  }

  /** Shows a length read from the video file (the backend didn't send one). */
  function showDuration(card, seconds) {
    const badge = $('.video-card__duration-badge', card);
    const pill = $('.video-card__duration', card);
    const time = $('time', pill);

    badge.textContent = formatTime(seconds);
    time.textContent = formatTime(seconds);
    time.dateTime = toIsoDuration(seconds);
    badge.hidden = false;
    pill.hidden = false;
  }

  function syncLoop(card, video) {
    const isLooping = loopPreference.get(video.id);
    const button = $('.video-card__loop-button', card);

    button.setAttribute('aria-pressed', String(isLooping));
    button.title = isLooping ? `Loop is on – ${video.title} will repeat` : `Play ${video.title} on repeat`;
    $('.video-card__loop-badge', card).hidden = !isLooping;
  }

  /**
   * Brings rendered cards to life: Loop buttons (remembered per video and kept in sync
   * with the player and other tabs) and lengths read from the files when needed.
   * @param {HTMLElement} root - element containing the cards
   * @param {import('../services/video-service.js').Video[]} videos - the videos the cards show
   */
  function hydrate(root, videos) {
    const byId = new Map(videos.map((video) => [video.id, video]));
    const cards = $$('.video-card[data-video-id]', root).filter((card) => byId.has(card.dataset.videoId));

    cards.forEach((card) => {
      const video = byId.get(card.dataset.videoId);
      if (video.durationSeconds || !video.videoUrl) return;
      videoService.getVideoDuration(video).then((seconds) => {
        if (seconds) showDuration(card, seconds);
      });
    });

    const loopCards = cards.filter((card) => $('.video-card__loop-button', card));
    if (loopCards.length === 0) return;

    const syncAll = () => loopCards.forEach((card) => syncLoop(card, byId.get(card.dataset.videoId)));

    root.addEventListener('click', (event) => {
      const button = event.target.closest('.video-card__loop-button');
      if (!button) return;
      const { videoId } = button.closest('.video-card').dataset;
      loopPreference.set(videoId, !loopPreference.get(videoId));
    });

    syncAll();
    loopPreference.subscribe(syncAll);
  }

  MyEducation.components.videoCard = { render, hydrate };
})((window.MyEducation = window.MyEducation || {}));

/*
  Custom HTML5 video player: play/pause, ±10 s skip, seek bar with buffered indicator,
  volume and mute, playback speed (0.5×–2×), loop, picture-in-picture, full screen,
  auto-hiding controls, replay at the end and YouTube-style keyboard shortcuts
  (listed on video.html).

  The markup is built once; every change goes into `state`, and update() brings the DOM
  in line with it.
*/
(function (MyEducation) {
  'use strict';

  const { escapeHtml, safeUrl, icon, formatTime, setText } = MyEducation.utils;

  const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const SKIP_SECONDS = 10;
  const VOLUME_STEP = 0.1;
  const HIDE_CONTROLS_AFTER_MS = 2500;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  /** End of the buffered range that contains the playhead (falls back to the last range). */
  function getBufferedEnd(video) {
    const { buffered, currentTime } = video;
    for (let i = 0; i < buffered.length; i += 1) {
      if (buffered.start(i) <= currentTime && currentTime <= buffered.end(i)) return buffered.end(i);
    }
    return buffered.length ? buffered.end(buffered.length - 1) : 0;
  }

  const ICONS = {
    play: () => icon('play', { fill: 'currentColor' }),
    pause: () => icon('pause', { fill: 'currentColor' }),
    bigPlay: () => icon('play', { fill: 'currentColor', className: 'player__big-play-icon' }),
    replay: () => icon('rotate-ccw'),
    volumeMuted: () => icon('volume-x'),
    volumeLow: () => icon('volume-1'),
    volumeHigh: () => icon('volume-2'),
    fullscreen: () => icon('maximize'),
    exitFullscreen: () => icon('minimize'),
  };

  /** Replaces an element's icon only when it changes (keeps focus and avoids DOM churn). */
  function setIcon(element, name) {
    if (element.dataset.icon === name) return;
    element.dataset.icon = name;
    element.innerHTML = ICONS[name]();
  }

  function setLabel(button, label) {
    if (button.getAttribute('aria-label') === label) return;
    button.setAttribute('aria-label', label);
    button.title = label;
  }

  const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;

  /** A control-bar button; icons that change with the state are filled in by update(). */
  function controlButton(ref, { className = '', pressed, content = '' } = {}) {
    const classes = className ? `player__button ${className}` : 'player__button';
    const pressedAttribute = pressed === undefined ? '' : ` aria-pressed="${pressed}"`;
    return `<button type="button" class="${classes}" data-ref="${ref}"${pressedAttribute} disabled>${content}</button>`;
  }

  function template({ hasSource, hasPoster, title, canUsePictureInPicture }) {
    const label = title ? `Video player: ${title}` : 'Video player';
    const rateOptions = PLAYBACK_RATES.map(
      (rate) => `
        <li role="none">
          <button type="button" role="menuitemradio" aria-checked="${rate === 1}" class="player__rate-option" data-rate="${rate}">
            ${rate === 1 ? 'Normal' : `${rate}x`}
          </button>
        </li>`,
    ).join('');

    return `
      <div class="player" role="region" aria-label="${escapeHtml(label)}" tabindex="0">
        <video class="player__video" data-ref="video" preload="metadata" playsinline controlslist="nodownload"></video>

        ${
          hasSource
            ? ''
            : `
        <div class="player__overlay${hasPoster ? ' player__overlay--on-poster' : ''}">
          <div class="player__message">
            ${icon('circle-play', { className: 'player__message-icon', strokeWidth: 1.4 })}
            <p class="player__message-title">Your video is here</p>
            <p class="player__message-text">This video will play here as soon as it is uploaded.</p>
          </div>
        </div>`
        }

        <div class="player__overlay player__overlay--error" data-ref="errorOverlay" role="alert" hidden>
          <div class="player__message">
            ${icon('circle-alert', { className: 'player__message-icon', strokeWidth: 1.4 })}
            <p class="player__message-title">This video couldn&#39;t be loaded</p>
            <p class="player__message-text">Check your internet connection and try again.</p>
            <button type="button" class="player__overlay-button" data-ref="retry">Try again</button>
          </div>
        </div>

        <div class="player__center" data-ref="buffering" aria-hidden="true" hidden>
          ${icon('loader-circle', { className: 'player__spinner' })}
        </div>

        <button type="button" class="player__big-play" data-ref="bigPlay" hidden></button>

        <div class="player__controls" data-ref="controls" data-visible="true">
          <input type="range" class="player__seek" data-ref="seek" min="0" max="0" step="any" value="0"
            aria-label="Seek" disabled />

          <div class="player__bar">
            <div class="player__group">
              ${controlButton('play')}
              <button type="button" class="player__button player__skip" data-ref="back"
                aria-label="Back ${SKIP_SECONDS} seconds (j)" title="Back ${SKIP_SECONDS} seconds (j)" disabled>
                ${icon('rotate-ccw')}
                <span class="player__skip-label">${SKIP_SECONDS}</span>
              </button>
              <button type="button" class="player__button player__skip" data-ref="forward"
                aria-label="Forward ${SKIP_SECONDS} seconds (l)" title="Forward ${SKIP_SECONDS} seconds (l)" disabled>
                ${icon('rotate-cw')}
                <span class="player__skip-label">${SKIP_SECONDS}</span>
              </button>

              <div class="player__volume">
                ${controlButton('mute')}
                <input type="range" class="player__volume-slider" data-ref="volume" min="0" max="1" step="0.05"
                  value="1" aria-label="Volume" disabled />
              </div>

              <span class="player__time">
                <span data-ref="currentTime">0:00</span><span class="player__time-divider">/</span><span data-ref="duration">0:00</span>
              </span>
            </div>

            <div class="player__group">
              ${controlButton('loop', { pressed: false, content: icon('repeat') })}

              <div class="player__rate-menu" data-ref="rateMenu">
                <button type="button" class="player__button player__rate-button" data-ref="rateButton"
                  aria-haspopup="menu" aria-expanded="false" title="Playback speed (&lt; &gt;)" disabled>1x</button>
                <ul class="player__rate-list" data-ref="rateList" role="menu" aria-label="Playback speed" hidden>
                  ${rateOptions}
                </ul>
              </div>

              ${canUsePictureInPicture ? controlButton('pip', { className: 'player__pip', pressed: false, content: icon('picture-in-picture-2') }) : ''}
              ${controlButton('fullscreen')}
            </div>
          </div>
        </div>
      </div>`;
  }

  /**
   * Builds a player inside `mountPoint` (replacing its content).
   * Pass `loop` + `onLoopChange` to control looping from outside (e.g. a saved preference),
   * then call setLoop() when that value changes.
   * @param {HTMLElement} mountPoint
   * @param {{ src?: string | null, poster?: string | null, title?: string, loop?: boolean,
   *           onLoopChange?: (isLooping: boolean) => void }} options
   * @returns {{ setLoop: (isLooping: boolean) => void }}
   */
  function createVideoPlayer(mountPoint, { src, poster, title = '', loop = false, onLoopChange } = {}) {
    const source = safeUrl(src);
    const posterUrl = safeUrl(poster);
    const hasSource = Boolean(source);
    const canUsePictureInPicture = document.pictureInPictureEnabled === true;

    mountPoint.innerHTML = template({ hasSource, hasPoster: Boolean(posterUrl), title, canUsePictureInPicture });

    const player = mountPoint.firstElementChild;
    const refs = {};
    player.querySelectorAll('[data-ref]').forEach((element) => {
      refs[element.dataset.ref] = element;
    });
    const { video } = refs;

    if (posterUrl) video.poster = posterUrl;
    if (source) video.src = source;

    const state = {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      bufferedEnd: 0,
      volume: 1,
      isMuted: false,
      playbackRate: 1,
      isLooping: loop,
      isBuffering: false,
      hasEnded: false,
      hasError: false,
      isFullscreen: false,
      isPictureInPicture: false,
      isUserActive: true,
      isKeyboardFocusInControls: false,
      isRateMenuOpen: false,
    };

    let hideTimer = 0;
    let lastPointerType = 'mouse';
    let controlsVisibleOnPointerDown = true;

    const isDisabled = () => !hasSource || state.hasError;
    const effectiveVolume = () => (state.isMuted ? 0 : state.volume);
    const controlsVisible = () =>
      !state.isPlaying || state.isUserActive || state.isRateMenuOpen || state.isKeyboardFocusInControls;

    function setState(patch) {
      Object.assign(state, patch);
      update();
    }

    /* ---------- State → DOM ---------- */

    function update() {
      const disabled = isDisabled();
      const visible = controlsVisible();
      const volume = effectiveVolume();
      const { duration, currentTime } = state;

      player.classList.toggle('player--idle', !visible);
      refs.controls.dataset.visible = String(visible);
      video.loop = state.isLooping;

      refs.errorOverlay.hidden = !state.hasError;
      refs.buffering.hidden = !(!disabled && state.isBuffering);
      refs.bigPlay.hidden = !(!disabled && !state.isPlaying && !state.isBuffering);
      setIcon(refs.bigPlay, state.hasEnded ? 'replay' : 'bigPlay');
      refs.bigPlay.setAttribute('aria-label', state.hasEnded ? 'Replay' : 'Play');

      // Seek bar (max before value, so the value is never clamped to an old max)
      refs.seek.max = String(duration || 0);
      refs.seek.value = String(Math.min(currentTime, duration || 0));
      refs.seek.disabled = disabled || !duration;
      refs.seek.setAttribute('aria-valuetext', `${formatTime(currentTime)} of ${formatTime(duration)}`);
      refs.seek.style.setProperty('--played', `${duration ? (currentTime / duration) * 100 : 0}%`);
      refs.seek.style.setProperty('--buffered', `${duration ? (state.bufferedEnd / duration) * 100 : 0}%`);

      [refs.play, refs.back, refs.forward, refs.mute, refs.loop, refs.rateButton, refs.pip, refs.fullscreen]
        .filter(Boolean)
        .forEach((button) => {
          button.disabled = disabled;
        });

      setIcon(refs.play, state.isPlaying ? 'pause' : 'play');
      setLabel(refs.play, state.isPlaying ? 'Pause (k)' : 'Play (k)');

      let volumeIcon = 'volumeHigh';
      if (volume === 0) volumeIcon = 'volumeMuted';
      else if (volume < 0.5) volumeIcon = 'volumeLow';
      setIcon(refs.mute, volumeIcon);
      setLabel(refs.mute, volume === 0 ? 'Unmute (m)' : 'Mute (m)');

      refs.volume.value = String(volume);
      refs.volume.disabled = disabled;
      refs.volume.setAttribute('aria-valuetext', `${Math.round(volume * 100)}%`);
      refs.volume.style.setProperty('--level', `${volume * 100}%`);

      setText(refs.currentTime, formatTime(currentTime));
      setText(refs.duration, formatTime(duration));

      refs.loop.setAttribute('aria-pressed', String(state.isLooping));
      setLabel(refs.loop, state.isLooping ? 'Loop: on (r)' : 'Loop: off (r)');

      setText(refs.rateButton, `${state.playbackRate}x`);
      refs.rateButton.setAttribute('aria-label', `Playback speed: ${state.playbackRate}x`);
      refs.rateButton.setAttribute('aria-expanded', String(state.isRateMenuOpen));
      refs.rateList.hidden = !state.isRateMenuOpen;
      refs.rateList.querySelectorAll('[data-rate]').forEach((option) => {
        option.setAttribute('aria-checked', String(Number(option.dataset.rate) === state.playbackRate));
      });

      if (refs.pip) {
        refs.pip.setAttribute('aria-pressed', String(state.isPictureInPicture));
        setLabel(refs.pip, state.isPictureInPicture ? 'Exit picture-in-picture (p)' : 'Picture-in-picture (p)');
      }

      setIcon(refs.fullscreen, state.isFullscreen ? 'exitFullscreen' : 'fullscreen');
      setLabel(refs.fullscreen, state.isFullscreen ? 'Exit full screen (f)' : 'Full screen (f)');
    }

    /* ---------- Actions ---------- */

    function revealControls() {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setState({ isUserActive: false }), HIDE_CONTROLS_AFTER_MS);
      if (!state.isUserActive) setState({ isUserActive: true });
    }

    function togglePlay() {
      if (isDisabled()) return;
      if (video.paused || video.ended) video.play().catch(() => {});
      else video.pause();
    }

    function seekTo(time) {
      if (isDisabled() || !Number.isFinite(video.duration)) return;
      video.currentTime = clamp(time, 0, video.duration);
      setState({ currentTime: video.currentTime });
    }

    const skipBy = (seconds) => seekTo(video.currentTime + seconds);

    function changeVolume(value) {
      video.volume = clamp(value, 0, 1);
      video.muted = video.volume === 0;
    }

    function toggleMute() {
      if (video.muted || video.volume === 0) {
        video.muted = false;
        if (video.volume === 0) video.volume = 0.5;
      } else {
        video.muted = true;
      }
    }

    function changeRate(rate) {
      video.playbackRate = rate;
      setState({ isRateMenuOpen: false });
    }

    function stepRate(direction) {
      const index = PLAYBACK_RATES.indexOf(state.playbackRate);
      const currentIndex = index === -1 ? PLAYBACK_RATES.indexOf(1) : index;
      changeRate(PLAYBACK_RATES[clamp(currentIndex + direction, 0, PLAYBACK_RATES.length - 1)]);
    }

    function toggleLoop() {
      const next = !state.isLooping;
      if (onLoopChange) onLoopChange(next);
      else setState({ isLooping: next });
    }

    async function togglePictureInPicture() {
      try {
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else await video.requestPictureInPicture();
      } catch {
        // The browser can refuse (e.g. metadata not loaded yet); nothing to recover.
      }
    }

    async function toggleFullscreen() {
      try {
        if (fullscreenElement()) {
          await (document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen());
        } else if (player.requestFullscreen) {
          await player.requestFullscreen();
        } else if (player.webkitRequestFullscreen) {
          player.webkitRequestFullscreen();
        } else {
          video.webkitEnterFullscreen?.(); // iPhone Safari only supports native video full screen
        }
      } catch {
        // Full screen not allowed in this context.
      }
    }

    function retry() {
      setState({ hasError: false });
      video.load();
    }

    /* ---------- Keyboard shortcuts ---------- */

    player.addEventListener('keydown', (event) => {
      if (isDisabled() || event.ctrlKey || event.metaKey || event.altKey) return;

      const { target } = event;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const isSlider = target instanceof HTMLInputElement && target.type === 'range';
      const isButton = target instanceof HTMLButtonElement;

      // Let sliders keep their arrow keys and buttons keep Space/Enter.
      if (isSlider && key.startsWith('Arrow')) return;
      if (isButton && (key === ' ' || key === 'Enter')) return;

      switch (key) {
        case ' ':
        case 'k':
          togglePlay();
          break;
        case 'ArrowLeft':
        case 'j':
          skipBy(-SKIP_SECONDS);
          break;
        case 'ArrowRight':
        case 'l':
          skipBy(SKIP_SECONDS);
          break;
        case 'ArrowUp':
          changeVolume(effectiveVolume() + VOLUME_STEP);
          break;
        case 'ArrowDown':
          changeVolume(effectiveVolume() - VOLUME_STEP);
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'r':
          toggleLoop();
          break;
        case 'p':
          if (!canUsePictureInPicture) return;
          togglePictureInPicture();
          break;
        case '>':
          stepRate(1);
          break;
        case '<':
          stepRate(-1);
          break;
        case 'Home':
          seekTo(0);
          break;
        case 'End':
          seekTo(state.duration);
          break;
        default:
          if (/^[0-9]$/.test(key)) {
            seekTo((state.duration * Number(key)) / 10);
            break;
          }
          return;
      }

      event.preventDefault();
      revealControls();
    });

    /* ---------- Pointer: auto-hiding controls ---------- */

    player.addEventListener('pointermove', revealControls);

    player.addEventListener('pointerdown', (event) => {
      lastPointerType = event.pointerType;
      controlsVisibleOnPointerDown = controlsVisible();
      revealControls();
    });

    // A finger or pen "leaves" right after every tap; only a mouse really goes away.
    player.addEventListener('pointerleave', (event) => {
      if (event.pointerType !== 'mouse') return;
      clearTimeout(hideTimer);
      setState({ isUserActive: false });
    });

    video.addEventListener('click', () => {
      // On touch screens the first tap only brings the hidden controls back.
      if (lastPointerType === 'touch' && !controlsVisibleOnPointerDown) return;
      togglePlay();
    });
    video.addEventListener('dblclick', toggleFullscreen);

    /* ---------- Controls ---------- */

    refs.bigPlay.addEventListener('click', togglePlay);
    refs.play.addEventListener('click', togglePlay);
    refs.back.addEventListener('click', () => skipBy(-SKIP_SECONDS));
    refs.forward.addEventListener('click', () => skipBy(SKIP_SECONDS));
    refs.mute.addEventListener('click', toggleMute);
    refs.loop.addEventListener('click', toggleLoop);
    refs.fullscreen.addEventListener('click', toggleFullscreen);
    refs.pip?.addEventListener('click', togglePictureInPicture);
    refs.retry.addEventListener('click', retry);

    refs.seek.addEventListener('input', () => seekTo(Number(refs.seek.value)));
    refs.volume.addEventListener('input', () => changeVolume(Number(refs.volume.value)));

    refs.rateButton.addEventListener('click', () => setState({ isRateMenuOpen: !state.isRateMenuOpen }));
    refs.rateList.addEventListener('click', (event) => {
      const option = event.target.closest('[data-rate]');
      if (option) changeRate(Number(option.dataset.rate));
    });

    // Close the speed menu on a click outside it or on Escape.
    document.addEventListener('pointerdown', (event) => {
      if (state.isRateMenuOpen && !refs.rateMenu.contains(event.target)) setState({ isRateMenuOpen: false });
    });
    document.addEventListener('keydown', (event) => {
      if (state.isRateMenuOpen && event.key === 'Escape') setState({ isRateMenuOpen: false });
    });

    // Keep the controls up while the keyboard is in them.
    refs.controls.addEventListener('focusin', (event) => {
      if (event.target.matches(':focus-visible')) setState({ isKeyboardFocusInControls: true });
    });
    refs.controls.addEventListener('focusout', (event) => {
      if (!refs.controls.contains(event.relatedTarget)) setState({ isKeyboardFocusInControls: false });
    });

    const syncFullscreen = () => setState({ isFullscreen: fullscreenElement() === player });
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen);

    /* ---------- Video element events ---------- */

    const on = (type, handler) => video.addEventListener(type, handler);

    on('play', () => setState({ isPlaying: true, hasEnded: false }));
    on('pause', () => setState({ isPlaying: false }));
    on('ended', () => setState({ isPlaying: false, hasEnded: true }));
    on('timeupdate', () => setState({ currentTime: video.currentTime }));
    on('loadedmetadata', () => setState({ duration: video.duration }));
    on('durationchange', () => setState({ duration: video.duration }));
    on('progress', () => setState({ bufferedEnd: getBufferedEnd(video) }));
    on('volumechange', () => setState({ volume: video.volume, isMuted: video.muted }));
    on('ratechange', () => setState({ playbackRate: video.playbackRate }));
    on('waiting', () => setState({ isBuffering: true }));
    on('playing', () => setState({ isBuffering: false }));
    on('canplay', () => setState({ isBuffering: false }));
    on('error', () => setState({ hasError: true, isBuffering: false }));
    on('enterpictureinpicture', () => setState({ isPictureInPicture: true }));
    on('leavepictureinpicture', () => setState({ isPictureInPicture: false }));

    update();
    revealControls();

    return {
      setLoop(isLooping) {
        if (state.isLooping !== isLooping) setState({ isLooping });
      },
    };
  }

  MyEducation.components.createVideoPlayer = createVideoPlayer;
})((window.MyEducation = window.MyEducation || {}));

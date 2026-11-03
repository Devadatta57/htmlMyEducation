/* Videos: the lesson list, single videos and their lengths. */
(function (MyEducation) {
  'use strict';

  const { ApiError, apiGet, unwrapData, mockResponse, cachedQuery } = MyEducation.services.api;

  /**
   * @typedef {Object} Video
   * @property {string} id
   * @property {string} title
   * @property {string | null} description
   * @property {string | null} thumbnailUrl
   * @property {string | null} videoUrl - URL of the video file (mp4 / webm)
   * @property {number | null} durationSeconds
   */

  /**
   * Maps a backend record to the shape the pages use.
   * If the backend names fields differently, adjust only this function.
   * @returns {Video}
   */
  function toVideo(raw) {
    const duration = Number(raw.durationSeconds ?? raw.duration);

    return {
      id: String(raw.id ?? raw._id),
      title: raw.title ?? raw.name ?? '',
      description: raw.description ?? null,
      thumbnailUrl: raw.thumbnailUrl ?? raw.thumbnail ?? null,
      videoUrl: raw.videoUrl ?? raw.url ?? raw.src ?? null,
      durationSeconds: Number.isFinite(duration) && duration > 0 ? duration : null,
    };
  }

  /** @returns {Promise<Video[]>} in the order the backend returns them */
  function fetchVideos() {
    return cachedQuery('videos', async () => {
      const records = MyEducation.config.useMockApi
        ? await mockResponse(MyEducation.data.mockVideos)
        : unwrapData(await apiGet('/videos'));

      return (records ?? []).map(toVideo);
    });
  }

  /** @returns {Promise<Video>} rejects with ApiError 404 when there is no such video */
  function fetchVideoById(videoId) {
    return cachedQuery(`videos/${videoId}`, async () => {
      if (MyEducation.config.useMockApi) {
        const record = MyEducation.data.mockVideos.find((video) => String(video.id) === String(videoId));
        if (!record) throw new ApiError('Video not found', 404);
        return toVideo(await mockResponse(record));
      }

      return toVideo(unwrapData(await apiGet(`/videos/${encodeURIComponent(videoId)}`)));
    });
  }

  /* ---------- Length read from the file ---------- */

  const durationCache = new Map();

  /** Reads a video's length from its metadata without downloading the whole file. */
  function probeDuration(videoUrl) {
    return new Promise((resolve, reject) => {
      const probe = document.createElement('video');
      probe.preload = 'metadata';
      probe.muted = true;

      const cleanUp = () => {
        probe.onloadedmetadata = null;
        probe.onerror = null;
        probe.removeAttribute('src');
        probe.load();
      };

      probe.onloadedmetadata = () => {
        const { duration } = probe;
        cleanUp();
        if (Number.isFinite(duration)) resolve(duration);
        else reject(new Error('Video duration is not available'));
      };
      probe.onerror = () => {
        cleanUp();
        reject(new Error('Could not read video metadata'));
      };

      probe.src = videoUrl;
    });
  }

  /**
   * Video length in seconds: the backend's `durationSeconds` when provided, otherwise
   * read from the video file's metadata (once per URL). Null when neither is available.
   * @param {Video} video
   * @returns {Promise<number | null>}
   */
  function getVideoDuration(video) {
    if (video.durationSeconds) return Promise.resolve(video.durationSeconds);
    if (!video.videoUrl) return Promise.resolve(null);

    if (!durationCache.has(video.videoUrl)) {
      durationCache.set(
        video.videoUrl,
        probeDuration(video.videoUrl).catch(() => null),
      );
    }
    return durationCache.get(video.videoUrl);
  }

  MyEducation.services.videos = { fetchVideos, fetchVideoById, getVideoDuration };
})((window.MyEducation = window.MyEducation || {}));

# My Education – static HTML / CSS / JS

Plain HTML, CSS and JavaScript version of the My Education React (Vite) app. There's no build step, no framework and no `npm install`. Everything the pages need is in this folder, including the fonts, so they also work offline.

## Run it

- **Quick look:** double-click `index.html`. Everything works from `file://`, because the scripts are classic deferred scripts, not ES modules, and the sample data is JavaScript, not fetched JSON.
- **Local server** (closer to how it runs once deployed), from this folder:

  ```bash
  npx serve .
  ```

  or `python -m http.server 8080`, then open http://localhost:8080.
- **Deploy:** upload the whole folder to any static host (Netlify, Vercel, GitHub Pages, S3, Nginx, Apache). No rewrite rules are needed (see [Pages](#pages)).

## Pages

| Page | Address | What it shows |
| --- | --- | --- |
| Home | `index.html` | Hero, the two learning-path cards. **Explore** shows that card's list below the cards and jumps to it. Clicking the same Explore again closes it. |
| PDF viewer | `pdf.html?id=pdf-1` | One PDF inline, Download / Open full screen, previous / next part. Opened in a new tab from the PDF list. |
| Video page | `video.html?id=video-1` | Custom video player, the lesson's details, keyboard shortcuts, "More videos" with Loop buttons. Opened in a new tab from a video card. |
| Not found | `404.html` | Served by most static hosts for unknown addresses. |

The React app used `/pdf/:id` and `/video/:id`, which need a server rewrite (SPA fallback) and don't work from `file://`. The query-string addresses work everywhere.

## Project structure

```
htmlmyeducation/
├── index.html                  # Home: hero, learning paths, explore section
├── pdf.html                    # PDF viewer
├── video.html                  # Video page
├── 404.html                    # Page not found
├── README.md
├── .editorconfig
├── .gitignore
├── assets/
│   ├── fonts/                  # Poppins + Noto Sans Telugu (WOFF2, self-hosted) + OFL licences
│   ├── icons/favicon.svg
│   └── images/                 # WebP in 800 px and 1600 px widths, FEED logo
├── css/
│   ├── base/
│   │   ├── fonts.css           # @font-face rules (unicode-range subsets)
│   │   ├── variables.css       # design tokens (colours, radii, shadows, layout) + breakpoint list
│   │   ├── reset.css           # minimal modern reset, [hidden] always wins
│   │   └── base.css            # body defaults, focus ring, .visually-hidden, reduced motion
│   ├── components/             # one stylesheet per reusable component
│   │   ├── button.css          # .btn  --primary / --secondary / --ghost, --md / --sm
│   │   ├── logo.css            # .logo --hero / --section / --compact
│   │   ├── spinner.css
│   │   ├── status-message.css  # empty / error / info states
│   │   ├── viewer-top-bar.css  # sticky bar + Back button block of the viewer pages
│   │   ├── path-card.css       # learning-path card
│   │   ├── library.css         # PDF / video list panel
│   │   ├── pdf-item.css        # one PDF row
│   │   ├── video-card.css      # video card (normal + compact)
│   │   └── video-player.css    # custom player (container queries)
│   ├── sections/               # home page sections
│   │   ├── hero.css
│   │   ├── learning-paths.css
│   │   ├── learning-paths-decor.css
│   │   ├── section-wave.css
│   │   └── explore.css
│   └── pages/
│       ├── pdf-viewer.css
│       └── video-watch.css
└── js/
    ├── config.js               # ← API base URL: the one setting to change
    ├── utils/
    │   ├── dom.js              # $, $$, escapeHtml, safeUrl, setDocumentTitle, …
    │   ├── routes.js           # page addresses
    │   ├── format-time.js      # 13:23 / 1:02:15, ISO durations
    │   ├── icons.js            # Lucide icons as inline SVG
    │   └── header-offset.js    # makes room for a host site's fixed navbar
    ├── services/
    │   ├── api-client.js       # fetch + 5-minute cache + one retry (replaces React Query)
    │   ├── pdf-service.js      # toPdf() mapping, list / single PDF
    │   ├── video-service.js    # toVideo() mapping, list / single video, length from file
    │   └── loop-preference.js  # per-video Loop setting (localStorage, synced across tabs)
    ├── data/
    │   ├── mock-pdfs.js        # sample data until the backend is ready
    │   └── mock-videos.js
    ├── components/
    │   ├── ui.js               # button / spinner / status message markup
    │   ├── library.js          # list panel: loading, error + Try again, empty, list
    │   ├── pdf-library.js
    │   ├── video-card.js
    │   ├── video-library.js
    │   └── video-player.js
    └── pages/                  # one entry script per page
        ├── home.js
        ├── pdf-viewer.js
        └── video-watch.js
```

### Conventions

- **Content lives in HTML. Behaviour lives in JS.** The hero, the cards and the page frames are plain markup. JS only builds what comes from the API (the lists, the player) and adds interaction.
- **One namespace.** Every script is an IIFE that registers itself on `window.MyEducation` (`.config`, `.routes`, `.utils`, `.services`, `.data`, `.components`). Each page's own script (`js/pages/*.js`) runs last.
- **Script order matters.** The `<script defer>` tags in each page run in order: config → utils → services/data → components → page.
- **CSS order:** base → components → sections/pages. Class names follow BEM (`block__element--modifier`) and are named after the original React components, so you can compare the two versions side by side.
- **Safe by default.** Every text from the backend goes through `escapeHtml()`, and every file URL through `safeUrl()`, which only lets `http(s):`, `blob:` and `file:` addresses through (no `javascript:` links).

## Connecting the backend

Set the API base URL in `js/config.js`:

```js
const API_BASE_URL = 'https://api.example.com/api';
```

While it is empty, the pages use the built-in sample data (`js/data/`: 10 PDF parts and 10 videos, titles only, no files yet).

All endpoints return JSON. A bare array/object and a `{ "data": ... }` envelope are both accepted.

`GET /pdfs` → list of PDFs (sorted by `partNumber` on the page)

```json
[
  { "id": "1", "partNumber": 1, "title": "ఎగుమతి ప్రపంచానికి పరిచయం", "fileUrl": "https://cdn.example.com/pdfs/part-1.pdf" }
]
```

`GET /pdfs/:id` → a single PDF with the same fields.

`GET /videos` → list of videos (shown in the order returned)

```json
[
  {
    "id": "1",
    "title": "Video 1",
    "description": "Optional text",
    "thumbnailUrl": "https://cdn.example.com/thumbs/1.jpg",
    "videoUrl": "https://cdn.example.com/videos/1.mp4",
    "durationSeconds": 754
  }
]
```

`GET /videos/:id` → a single video with the same fields.

- If the backend uses different field names, change only `toPdf()` in `js/services/pdf-service.js` and `toVideo()` in `js/services/video-service.js`.
- `fileUrl` / `videoUrl` may be `null` while a file is still being uploaded. The page then shows "Your PDF is here soon" / "Your video is here".
- `durationSeconds` is optional. When it is missing, the card reads the length from the video file's metadata.
- If the API or files are on another domain, allow this site in that server's CORS settings. Video files must support HTTP range requests so seeking works.
- When the pages are opened from `file://`, the browser sends `Origin: null` to the API. Test against a real backend from a local server (see [Run it](#run-it)) or the deployed site.

## Video player

Play/pause, ±10 s skip, seek bar with buffered indicator, volume and mute, playback speed (0.5×–2×), **loop**, picture-in-picture, full screen, auto-hiding controls, replay at the end, and keyboard shortcuts (Space/K, ←/J, →/L, ↑/↓, M, R, &lt;/&gt;, F, P, 0–9, Home/End). The shortcuts are also listed on the video page.

The "More videos" cards on the video page have their own **Loop** button. The setting is saved per video in the browser (`localStorage`) and shared with the player's loop control and other open tabs, so a video set to loop on its card plays on repeat when opened.

## Responsive behaviour

Checked in headless Edge from `file://` (the double-click case) and over HTTP, at 280 px (Galaxy Fold), 320, 360, 375, 414, 640, 768 and 1024 px wide, landscape phones (568×320, 844×390), and 1280, 1440, 1920 and 2560 px desktops. On every page and state (lists open, PDF shown, video playing, error and empty states), nothing sticks out of the screen or gets cut off, the page never scrolls sideways, and the console shows no errors.

| Area | Desktop | Tablet | Phone |
| --- | --- | --- | --- |
| Hero | wordmark over the full-width photo | same, scaled | same; the wordmark shrinks below 310 px so it stays on one line |
| Learning-path cards | 2 side by side, line-art decorations around them | 2 side by side (from 640 px) | 1 per row, decorations hidden |
| PDF list | number, file icon, title, "View PDF ↗" | same | file icon hidden; below 380 px the button is an eye icon only |
| Video list | thumbnail beside title, description, length, Watch | same | smaller thumbnail and text, description on 2 lines |
| PDF viewer | title and buttons in the top bar | same | title on its own line under the logo; pager titles shorten with "…" |
| Video page | player + "More videos" side by side | stacked (below 960 px) | stacked; small players drop the ±10 s buttons, tiny ones the PiP button |
| Landscape phones | – | – | the player is capped to the screen height and the top bar scrolls away |

## Changes from the React version

- **Addresses:** `pdf.html?id=…` and `video.html?id=…` instead of `/pdf/:id` and `/video/:id`, so no server rewrites are needed and the pages work from `file://`.
- **Hero wordmark on very narrow phones:** below ~310 px (Galaxy Fold) "MY EDUCATION" ran past the right edge and was cut off. It now shrinks just enough to fit. Every other width keeps the original size.
- **Video controls on small phones:** at 320 px and narrower the control bar was wider than the player, so the full-screen button was cut off. Small players now use slightly smaller buttons and hide picture-in-picture, and a long clock (`1:02:15 / 1:02:15`) shortens with "…" instead of pushing buttons out.
- **"Your video is here" / error message on small players:** the message was taller than the space above the control bar and ran underneath it. Small players now show a shorter message that stays clear of the controls.
- **Landscape phones:** a full-width 16:9 player was taller than the screen. It is now capped to the screen height, and the sticky top bar scrolls away on short landscape screens instead of covering the top of the video.
- **Touch screens:** the first tap on a playing video now only brings the hidden controls back, as the code intended. Before, the tap also paused the video, and lifting the finger hid the controls again straight away. The seek handle is always visible on touch screens, and hover lift effects only apply on devices that can hover, so they don't stick after a tap.
- **Fonts:** self-hosted WOFF2 files only (no WOFF fallbacks), and only the subsets the content uses (Poppins Latin / Latin Extended, Noto Sans Telugu Telugu).
- **Retry feedback:** "Try again" shows the spinner while it retries.
- **404 page:** the heading is an `<h1>`.

## Fonts and licences

Poppins and Noto Sans Telugu are under the SIL Open Font License (`assets/fonts/OFL-*.txt`). Icons are from [Lucide](https://lucide.dev) (ISC licence).

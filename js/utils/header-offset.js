/*
  When these pages run inside a site whose navbar is laid over the top of the page (fixed,
  or absolutely positioned), publishes that bar's height as --site-header-height on <html>,
  so the hero heading and the viewer top bar start below it instead of being covered.
  The host site may also set --site-header-height itself; when no such bar is found, its
  value is left alone. On its own (no host site) this finds nothing and changes nothing.
*/
(function (MyEducation) {
  'use strict';

  const VARIABLE = '--site-header-height';

  /**
   * Bottom edge (in page coordinates) of any bar laid over the top of the page: a fixed
   * navbar, or one positioned absolutely over the hero. Found by what sits across the top
   * edge of the screen as well as by header/nav tags, so the host's markup doesn't matter.
   */
  function overlayBarBottom() {
    const candidates = [
      ...[0.25, 0.5, 0.75].flatMap((x) => document.elementsFromPoint(window.innerWidth * x, 1)),
      ...document.querySelectorAll('header, nav, [role="banner"]'),
    ];
    const checked = new Set();
    let bottom = 0;

    for (const candidate of candidates) {
      for (let el = candidate; el && el !== document.body; el = el.parentElement) {
        if (checked.has(el)) break;
        checked.add(el);

        const { position } = getComputedStyle(el);
        if (position !== 'fixed' && position !== 'absolute') continue;
        const rect = el.getBoundingClientRect();
        // A fixed bar stays on screen; an absolute one sits at the top of the page.
        const scroll = position === 'fixed' ? 0 : window.scrollY;
        if (rect.top + scroll <= 1 && rect.height > 0 && rect.width >= window.innerWidth / 2) {
          bottom = Math.max(bottom, rect.bottom + scroll);
        }
      }
    }
    return bottom;
  }

  function watchFixedHeaderOffset() {
    const root = document.documentElement;
    let published = false;
    let frame = 0;

    const measure = () => {
      const bottom = overlayBarBottom();
      if (bottom > 0) {
        root.style.setProperty(VARIABLE, `${Math.ceil(bottom)}px`);
        published = true;
      } else if (published && window.scrollY === 0) {
        // Only trust "no bar" at the top of the page: further down, an absolutely
        // positioned bar has scrolled out of view and would be missed.
        root.style.removeProperty(VARIABLE);
        published = false;
      }
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    schedule();
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    // The host navbar may render after this page, or change height later.
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  }

  // Scripts are deferred, so <body> exists by now.
  watchFixedHeaderOffset();
})((window.MyEducation = window.MyEducation || {}));

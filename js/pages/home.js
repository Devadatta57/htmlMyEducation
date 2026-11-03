/*
  Home page (index.html). Each learning-path card's Explore button shows that card's list
  (PDFs or videos) in the explore section below the cards and jumps down to it. Clicking
  the same Explore button again closes the list; exploring the other card replaces it.
  Until a list is open, the coloured wave runs along the bottom of the cards' section;
  after that it sits at the bottom of the explore section.
*/
(function (MyEducation) {
  'use strict';

  const { $, $$ } = MyEducation.utils;
  const { pdfLibrary, videoLibrary } = MyEducation.components;

  const LIBRARIES = { pdfs: pdfLibrary, videos: videoLibrary };

  function init() {
    const pathsSection = $('#learning-paths');
    const pathsWave = $('#learning-paths-wave');
    const explore = $('#explore');
    const exploreList = $('#explore-list');
    const exploreButtons = $$('[data-explore]');

    // Which card's list the explore section shows: 'pdfs', 'videos' or null.
    let explorePath = null;

    function show(path) {
      explorePath = path;
      const isOpen = path !== null;

      exploreButtons.forEach((button) => {
        button.setAttribute('aria-expanded', String(button.dataset.explore === path));
      });
      pathsSection.classList.toggle('learning-paths--with-wave', !isOpen);
      // An <svg> has no `hidden` property, so set the attribute itself.
      pathsWave.toggleAttribute('hidden', isOpen);
      explore.hidden = !isOpen;

      // The list is only built (and its data fetched) when it is opened.
      if (isOpen) LIBRARIES[path].mount(exploreList);
      else exploreList.replaceChildren();
    }

    exploreButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const path = button.dataset.explore;

        // A second click on the same card's Explore closes its list; the page stays on the cards.
        if (path === explorePath) {
          show(null);
          return;
        }

        show(path);
        // Jump straight there (no smooth scroll); still lands below a host site's navbar,
        // through scroll-padding-top on <html>.
        explore.scrollIntoView({ behavior: 'instant', block: 'start' });
        explore.focus({ preventScroll: true });
      });
    });
  }

  init();
})((window.MyEducation = window.MyEducation || {}));

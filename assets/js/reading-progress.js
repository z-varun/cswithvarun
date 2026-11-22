// Reading progress bar for blog posts.
(function () {
  'use strict';

  onDomReady(() => {
    const bar = document.getElementById('reading-progress-bar');
    const article = document.querySelector('.post-content');
    if (!bar || !article) return;

    let queued = false;

    function update() {
      queued = false;
      const rect = article.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = scrollable > 0 ? -rect.top / scrollable : 1;
      bar.style.transform = `scaleX(${Math.max(0, Math.min(1, progress))})`;
    }

    function requestUpdate() {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
  });
})();

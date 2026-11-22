// About page: count the stat numbers up when they scroll into view.
// The real numbers are already in the HTML; this is decoration only.
(function () {
  'use strict';

  onDomReady(() => {
    document.querySelectorAll('.stat-card').forEach((card) => {
      const counter = card.querySelector('.stat-number');
      if (!counter) return;
      const target = parseInt(counter.getAttribute('data-target'), 10);
      card.addEventListener('animated', () => Utils.animateCounter(counter, target), { once: true });
    });
  });
})();

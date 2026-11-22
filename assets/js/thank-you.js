// Thank-you page: count down, then return to the homepage unless the visitor opts to stay.
(function () {
  'use strict';

  onDomReady(() => {
    const countdown = document.getElementById('countdown');
    const cancel = document.getElementById('cancelRedirect');
    if (!countdown) return;

    let remaining = parseInt(countdown.textContent, 10) || 10;
    const timer = setInterval(() => {
      remaining -= 1;
      countdown.textContent = String(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        window.location.href = '/';
      }
    }, 1000);

    if (cancel) {
      cancel.addEventListener('click', () => {
        clearInterval(timer);
        const message = cancel.closest('.redirect-message');
        if (message) message.hidden = true;
      });
    }
  });
})();

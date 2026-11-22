// Runs in <head> before first paint: sets the theme and marks JS as available.
(function () {
  var root = document.documentElement;
  var stored = null;
  try {
    stored = localStorage.getItem('theme-preference');
  } catch (e) {
    // Storage blocked (private mode, disabled cookies): fall back to the OS setting.
  }
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.setAttribute('data-theme', stored === 'dark' || stored === 'light' ? stored : (prefersDark ? 'dark' : 'light'));
  root.classList.add('js');
})();

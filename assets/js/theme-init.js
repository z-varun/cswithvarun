// Runs in <head> before first paint: sets light/dark, the colour palette, and marks JS as available.
(function () {
  var root = document.documentElement;
  var stored = null;
  var palette = null;
  try {
    stored = localStorage.getItem('theme-preference');
    palette = localStorage.getItem('palette-preference');
  } catch (e) {
    // Storage blocked (private mode, disabled cookies): fall back to the OS setting.
  }
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.setAttribute('data-theme', stored === 'dark' || stored === 'light' ? stored : (prefersDark ? 'dark' : 'light'));
  // Mint is the default palette (no attribute); the others are opt-in.
  if (palette === 'rose' || palette === 'sky' || palette === 'slate') root.setAttribute('data-palette', palette);
  root.classList.add('js');
})();

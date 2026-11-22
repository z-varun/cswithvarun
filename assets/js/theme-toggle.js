// Theme toggle (follows the OS until the visitor picks light or dark) and colour palette picker.
(function () {
  'use strict';

  const STORAGE_KEY = 'theme-preference';
  const PALETTE_KEY = 'palette-preference';
  const PALETTES = ['mint', 'rose', 'sky', 'slate'];
  const root = document.documentElement;
  const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  const SUN_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
  const MOON_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';

  function readStored() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function writeStored(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // Not persisted; the choice still applies to this page view.
    }
  }

  function currentPalette() {
    const palette = root.getAttribute('data-palette');
    return PALETTES.includes(palette) ? palette : 'mint';
  }

  function renderPalette(palette) {
    if (palette === 'mint') root.removeAttribute('data-palette');
    else root.setAttribute('data-palette', palette);
    document.querySelectorAll('.palette-option').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.palette === palette));
    });
  }

  function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function render(theme) {
    root.setAttribute('data-theme', theme);
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    // The icon shows what clicking switches to.
    button.innerHTML = theme === 'dark' ? SUN_ICON : MOON_ICON;
    button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }

  onDomReady(() => {
    render(currentTheme());

    const button = document.getElementById('theme-toggle');
    if (button) {
      button.addEventListener('click', () => {
        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        writeStored(next);
        render(next);
      });
    }

    renderPalette(currentPalette());
    document.querySelectorAll('.palette-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        const palette = btn.dataset.palette;
        if (!PALETTES.includes(palette)) return;
        try {
          localStorage.setItem(PALETTE_KEY, palette);
        } catch (e) {
          // Not persisted; applies to this page view only.
        }
        renderPalette(palette);
      });
    });

    // Follow OS changes only while the visitor has not chosen a theme.
    if (darkQuery && darkQuery.addEventListener) {
      darkQuery.addEventListener('change', (e) => {
        if (!readStored()) render(e.matches ? 'dark' : 'light');
      });
    }
  });
})();

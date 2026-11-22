// ============================================
// Main: navigation, resume dropdown, scroll animations
// ============================================

(function () {
  'use strict';

  // A button that shows and hides a panel, closing on outside click and Escape.
  function disclosure(button, panel, { openClass = 'show', onToggle } = {}) {
    if (!button || !panel) return null;

    const isOpen = () => button.getAttribute('aria-expanded') === 'true';
    const set = (open) => {
      button.setAttribute('aria-expanded', String(open));
      button.classList.toggle('active', open);
      panel.classList.toggle(openClass, open);
      if (onToggle) onToggle(open);
    };

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      set(!isOpen());
    });

    document.addEventListener('click', (e) => {
      if (isOpen() && !panel.contains(e.target) && !button.contains(e.target)) set(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) {
        set(false);
        button.focus();
      }
    });

    panel.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => set(false)));

    return { set, isOpen };
  }

  function initNavigation() {
    disclosure(document.getElementById('resumeToggle'), document.getElementById('resumeDropdown'));

    const navToggle = document.getElementById('navToggle');
    const mobileNav = document.getElementById('mobileNav');
    disclosure(navToggle, mobileNav, {
      openClass: 'active',
      onToggle: (open) => navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Menu')
    });
  }

  onDomReady(() => {
    initNavigation();
    initAnimateOnView();
  });
})();

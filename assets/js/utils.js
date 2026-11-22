// ============================================
// Shared helpers (loaded before every other script except theme-init.js)
// ============================================

window.onDomReady = function (fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
};

const Utils = {
  prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  },

  /** Count an element's number up from 0 to target (skipped under reduced motion). */
  animateCounter(element, target, duration = 1500) {
    if (this.prefersReducedMotion() || !Number.isFinite(target)) {
      element.textContent = Number.isFinite(target) ? target.toLocaleString('en-US') : element.textContent;
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      element.textContent = Math.floor(target * progress).toLocaleString('en-US');
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  createObserver(callback, options = {}) {
    return new IntersectionObserver(callback, {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px',
      ...options
    });
  },

  smoothScrollTo(target, offset = 0) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;
    window.scrollTo({
      top: element.getBoundingClientRect().top + window.scrollY - offset,
      behavior: this.prefersReducedMotion() ? 'auto' : 'smooth'
    });
  }
};

window.Utils = Utils;

/**
 * Adds .animated to [data-animate] elements once they scroll into view.
 * Call once per page (main.js does). Without IntersectionObserver, everything is shown.
 */
window.initAnimateOnView = function () {
  const elements = document.querySelectorAll('[data-animate]');
  if (!('IntersectionObserver' in window)) {
    elements.forEach((el) => el.classList.add('animated'));
    return;
  }
  const observer = Utils.createObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('animated');
      entry.target.dispatchEvent(new CustomEvent('animated'));
      observer.unobserve(entry.target);
    });
  });
  elements.forEach((el) => observer.observe(el));
};

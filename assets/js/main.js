// ============================================
// Main JavaScript - Core Functionality
// ============================================

(function () {
  'use strict';

  // ============================================
  // Font Awesome Loading
  // ============================================
  function loadFontAwesome() {
    const faCSS = document.getElementById('fontawesome-css');
    if (faCSS && faCSS.media === 'print') {
      faCSS.media = 'all';
    }
  }

  // ============================================
  // Navigation & Resume Dropdown
  // ============================================
  function initNavigation() {
    const resumeToggle = document.getElementById('resumeToggle');
    const resumeDropdown = document.getElementById('resumeDropdown');
    const _mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const _navMenu = document.getElementById('navMenu');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    // ========================================
    // Resume Dropdown Handler
    // ========================================
    if (resumeToggle && resumeDropdown) {
      resumeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isExpanded =
          resumeToggle.getAttribute('aria-expanded') === 'true';

        // Close any other open dropdowns
        document.querySelectorAll(
          '.dropdown-menu.active, .dropdown-menu.show'
        ).forEach((otherMenu) => {
          if (otherMenu !== resumeDropdown) {
            otherMenu.classList.remove('active', 'show');
            const btn = otherMenu.closest('.dropdown')?.querySelector(
              'button'
            );
            if (btn) {
              btn.classList.remove('active');
              btn.setAttribute('aria-expanded', 'false');
            }
          }
        });

        // Toggle current dropdown
        if (isExpanded) {
          // Close dropdown
          resumeDropdown.classList.remove('show', 'active');
          resumeToggle.classList.remove('active');
          resumeToggle.setAttribute('aria-expanded', 'false');

          // Wait for transition to complete before hiding
          setTimeout(() => {
            if (!resumeDropdown.classList.contains('show')) {
              resumeDropdown.style.display = 'none';
            }
          }, 300); // Match your CSS transition time
        } else {
          // Open dropdown
          resumeDropdown.style.display = 'block';
          resumeToggle.classList.add('active');
          resumeToggle.setAttribute('aria-expanded', 'true');

          // Trigger reflow for CSS animations
          void resumeDropdown.offsetHeight;

          // Add show class for animation
          resumeDropdown.classList.add('show', 'active');
        }
      });

      // Close on click outside
      document.addEventListener('click', (e) => {
        if (
          !resumeToggle.contains(e.target) &&
          !resumeDropdown.contains(e.target)
        ) {
          if (resumeDropdown.classList.contains('show')) {
            resumeDropdown.classList.remove('show', 'active');
            resumeToggle.classList.remove('active');
            resumeToggle.setAttribute('aria-expanded', 'false');

            setTimeout(() => {
              resumeDropdown.style.display = 'none';
            }, 300);
          }
        }
      });

      // Close dropdown when clicking links
      resumeDropdown.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          resumeDropdown.classList.remove('show', 'active');
          resumeToggle.classList.remove('active');
          resumeToggle.setAttribute('aria-expanded', 'false');

          setTimeout(() => {
            resumeDropdown.style.display = 'none';
          }, 300);
        });
      });

      // Keyboard: Escape key closes dropdown
      document.addEventListener('keydown', (e) => {
        if (
          e.key === 'Escape' &&
          resumeDropdown.classList.contains('show')
        ) {
          resumeDropdown.classList.remove('show', 'active');
          resumeToggle.classList.remove('active');
          resumeToggle.setAttribute('aria-expanded', 'false');
          resumeToggle.focus();

          setTimeout(() => {
            resumeDropdown.style.display = 'none';
          }, 300);
        }
      });
    }

    // ========================================
    // Mobile Menu Handler
    // ========================================
    if (navToggle && mobileNav) {
      navToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isActive = mobileNav.classList.contains('active');

        if (isActive) {
          mobileNav.classList.remove('active');
          navToggle.classList.remove('active');
          navToggle.setAttribute('aria-expanded', 'false')
        } else {
          mobileNav.classList.add('active');
          navToggle.classList.add('active');
          navToggle.setAttribute('aria-expanded', 'true');
        }
      });

      // Close mobile menu when clicking links
      mobileNav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          mobileNav.classList.remove('active');
          navToggle.classList.remove('active');
        });
      });

      // Close on click outside
      document.addEventListener('click', (e) => {
        if (
          !navToggle.contains(e.target) &&
          !mobileNav.contains(e.target) &&
          mobileNav.classList.contains('active')
        ) {
          mobileNav.classList.remove('active');
          navToggle.classList.remove('active');
        }
      });

      // Keyboard: Escape closes mobile menu
      document.addEventListener('keydown', (e) => {
        if (
          e.key === 'Escape' &&
          mobileNav.classList.contains('active')
        ) {
          mobileNav.classList.remove('active');
          navToggle.classList.remove('active');
        }
      });
    }
  }

  // ============================================
  // Smooth Scroll for Anchor Links
  // ============================================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        // Skip smooth scroll if it's the resume dropdown toggle
        if (this.id === 'resumeToggle') return;

        e.preventDefault();
        const target = this.getAttribute('href');
        if (target && target !== '#') {
          const element = document.querySelector(target);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });
  }

  // ============================================
  // Intersection Observer for Animations
  // ============================================
  function initScrollAnimations() {
    // If you have a separate function for this
    if (typeof initAnimateOnView === 'function') {
      initAnimateOnView();
    }
  }

  // ============================================
  // Initialize All
  // ============================================
  function init() {
    loadFontAwesome();
    initNavigation();
    initSmoothScroll();
    initScrollAnimations();
  }

  onDomReady(init);
})();

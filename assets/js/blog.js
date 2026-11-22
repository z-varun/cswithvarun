// ============================================
// Blog index: tag filter
// ============================================

(function () {
  'use strict';

  onDomReady(() => {
    const filterButtons = Array.from(document.querySelectorAll('.filter-btn[data-filter], .filter-btn-dropdown'));
    const posts = Array.from(document.querySelectorAll('.blog-post-item'));
    const moreBtn = document.getElementById('moreFiltersBtn');
    const moreMenu = document.getElementById('moreFilters');
    const activeDisplay = document.getElementById('activeFilterDisplay');
    const activeTag = document.getElementById('activeFilterTag');
    const clearBtn = document.getElementById('clearFilterBtn');
    const status = document.getElementById('filterStatus');

    if (!posts.length) return;

    function setMoreMenu(open) {
      if (!moreBtn || !moreMenu) return;
      moreBtn.setAttribute('aria-expanded', String(open));
      moreMenu.classList.toggle('show', open);
    }

    function applyFilter(filter) {
      filterButtons.forEach((btn) => {
        const selected = btn.getAttribute('data-filter') === filter;
        btn.classList.toggle('active', selected);
        btn.setAttribute('aria-pressed', String(selected));
      });

      // Highlight "More Filters" when the active tag lives in its menu.
      if (moreBtn && moreMenu) {
        moreBtn.classList.toggle('active', !!moreMenu.querySelector('.filter-btn-dropdown.active'));
      }

      let visible = 0;
      posts.forEach((post) => {
        const tags = (post.getAttribute('data-tags') || '').split('|');
        const show = filter === 'all' || tags.includes(filter);
        post.hidden = !show;
        if (show) visible += 1;
      });

      const filtered = filter !== 'all';
      activeDisplay.hidden = !filtered;
      if (filtered) activeTag.textContent = filter;

      if (status) {
        status.textContent = filtered
          ? `Showing ${visible} post${visible === 1 ? '' : 's'} tagged ${filter}.`
          : `Showing all ${visible} posts.`;
      }

      setMoreMenu(false);
    }

    filterButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        applyFilter(btn.getAttribute('data-filter'));
      });
    });

    if (moreBtn) {
      moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setMoreMenu(moreBtn.getAttribute('aria-expanded') !== 'true');
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-dropdown')) setMoreMenu(false);
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && moreBtn.getAttribute('aria-expanded') === 'true') {
          setMoreMenu(false);
          moreBtn.focus();
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        applyFilter('all');
        const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
        if (allBtn) allBtn.focus();
      });
    }
  });
})();

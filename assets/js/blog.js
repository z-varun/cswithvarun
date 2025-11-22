// ============================================
// Blog Page - Filter & Search Functionality
// ============================================

(function () {
  'use strict';

  let currentFilter = 'all';
  let isSearching = false;

  // Cache DOM elements
  const elements = {
    filterBtns: null,
    dropdownBtns: null,
    moreFiltersBtn: null,
    moreFilters: null,
    posts: null,
    searchInput: null,
    clearSearchBtn: null,
    searchResultsCount: null,
    resultsCountText: null,
    activeFilterDisplay: null,
    activeFilterTag: null,
    clearFilterBtn: null,
    blogFilters: null
  };

  // ============================================
  // Filter Posts
  // ============================================
  function applyFilter(filter, buttonElement) {
    if (isSearching) return;

    currentFilter = filter;

    // Update active states
    elements.filterBtns.forEach(b => b.classList.remove('active'));
    elements.dropdownBtns.forEach(b => b.classList.remove('active'));

    if (buttonElement) {
      buttonElement.classList.add('active');
    }

    // Show/hide active filter display
    elements.activeFilterDisplay.style.display = filter === 'all' ? 'none' : 'flex';
    if (filter !== 'all') {
      elements.activeFilterTag.textContent = filter;
    }

    // Filter posts
    let visibleCount = 0;
    elements.posts.forEach(post => {
      const tags = post.getAttribute('data-tags');
      const isVisible = filter === 'all' || tags.includes(filter);

      if (isVisible) {
        post.style.display = 'flex';
        setTimeout(() => {
          post.style.opacity = '1';
          post.style.transform = 'translateY(0)';
        }, 10);
        visibleCount++;
      } else {
        post.style.opacity = '0';
        post.style.transform = 'translateY(20px)';
        setTimeout(() => post.style.display = 'none', 300);
      }
    });

    updateNoResultsMessage(visibleCount, filter);

    // Close dropdown
    if (elements.moreFilters) {
      elements.moreFilters.classList.remove('show');
      elements.moreFiltersBtn?.classList.remove('active');
    }

    // Scroll to posts if filtered
    if (filter !== 'all') {
      setTimeout(() => {
        const container = document.querySelector('.blog-container');
        if (container) Utils.smoothScrollTo(container, 100);
      }, 100);
    }
  }


  // ============================================
  // No Results Message
  // ============================================
  function updateNoResultsMessage(count, filterName) {
    const postsContainer = document.querySelector('.blog-container');
    const noResults = document.querySelector('.no-results-message');

    if (count === 0 && !noResults && postsContainer) {
      const message = document.createElement('div');
      message.className = 'no-results-message';
      message.innerHTML = `
        <i class="fas fa-search"></i>
        <h3>No posts found</h3>
        <p>No posts match "${filterName}". Try adjusting your filter or search!</p>
      `;
      postsContainer.appendChild(message);
    } else if (count > 0 && noResults) {
      noResults.remove();
    }
  }

  // ============================================
  // Event Listeners
  // ============================================
  function initEventListeners() {
    // Filter buttons
    elements.filterBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        if (isSearching) clearSearch();
        applyFilter(this.getAttribute('data-filter'), this);
      });
    });

    // Dropdown filter buttons
    elements.dropdownBtns.forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (isSearching) clearSearch();
        applyFilter(this.getAttribute('data-filter'), this);
      });
    });

    // More filters dropdown toggle
    if (elements.moreFiltersBtn) {
      elements.moreFiltersBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = elements.moreFiltersBtn.getAttribute('aria-expanded') === 'true';

        Utils.toggle(elements.moreFilters, 'show');
        Utils.toggle(elements.moreFiltersBtn, 'active');

        // Toggle ARIA state
        elements.moreFiltersBtn.setAttribute('aria-expanded', !isExpanded);
      });
    }

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (elements.moreFilters && !e.target.closest('.filter-dropdown')) {
        if (elements.moreFilters.classList.contains('show')) {
            elements.moreFilters.classList.remove('show');
            elements.moreFiltersBtn?.classList.remove('active');
            elements.moreFiltersBtn?.setAttribute('aria-expanded', 'false'); // Fix ARIA
        }
      }
    });

    // Clear filter button
    if (elements.clearFilterBtn) {
      elements.clearFilterBtn.addEventListener('click', () => {
        const allPostsBtn = document.querySelector('.filter-btn[data-filter="all"]');
        applyFilter('all', allPostsBtn);
      });
    }
  }

  // ============================================
  // Initialize
  // ============================================
  function init() {
    // Cache all DOM elements
    elements.filterBtns = document.querySelectorAll('.filter-btn:not(.filter-more)');
    elements.dropdownBtns = document.querySelectorAll('.filter-btn-dropdown');
    elements.moreFiltersBtn = document.getElementById('moreFiltersBtn');
    elements.moreFilters = document.getElementById('moreFilters');
    elements.posts = document.querySelectorAll('.blog-post-item');
    elements.resultsCountText = document.getElementById('resultsCountText');
    elements.activeFilterDisplay = document.getElementById('activeFilterDisplay');
    elements.activeFilterTag = document.getElementById('activeFilterTag');
    elements.clearFilterBtn = document.getElementById('clearFilterBtn');
    elements.blogFilters = document.querySelector('.blog-filters');

    initEventListeners();
  }

  onDomReady(init);

})();

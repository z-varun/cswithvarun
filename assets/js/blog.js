// ============================================
// Blog index: tag filter and search
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

    function applyFilter(filter, quiet) {
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

      if (status && !quiet) {
        status.textContent = filtered
          ? `Showing ${visible} post${visible === 1 ? '' : 's'} tagged ${filter}.`
          : `Showing all ${visible} posts.`;
      }

      setMoreMenu(false);
    }

    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => applyFilter(btn.getAttribute('data-filter')));
    });

    if (moreBtn) {
      moreBtn.addEventListener('click', () => setMoreMenu(moreBtn.getAttribute('aria-expanded') !== 'true'));

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

    // ---------- Search (Pagefind) ----------
    const form = document.getElementById('blogSearch');
    const input = document.getElementById('blogSearchInput');
    const results = document.getElementById('searchResults');
    const summary = document.getElementById('searchSummary');
    const list = document.getElementById('searchResultList');
    const container = document.querySelector('.blog-container');
    if (!form || !input || !results || !summary || !list || !container) return;

    form.hidden = false;
    let pagefind = null;
    let latest = 0;
    let timer = null;

    // Load the index on first use only; it is fetched in small chunks as needed.
    function loadPagefind() {
      if (!pagefind) {
        pagefind = import(form.dataset.pagefind).then(async (pf) => {
          await pf.options({ excerptLength: 24 });
          pf.init();
          return pf;
        });
        pagefind.catch(() => { pagefind = null; });
      }
      return pagefind;
    }

    // Pagefind excerpts are escaped text with <mark> around matches. Copy only text and
    // <mark>, so nothing from the index is ever inserted as markup.
    function excerptNode(html) {
      const p = document.createElement('p');
      p.className = 'search-result-excerpt';
      const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
      doc.body.childNodes.forEach((node) => {
        if (node.nodeName === 'MARK') {
          const mark = document.createElement('mark');
          mark.textContent = node.textContent;
          p.append(mark);
        } else {
          p.append(node.textContent);
        }
      });
      return p;
    }

    function setQueryInUrl(q) {
      const url = new URL(window.location.href);
      if (q) url.searchParams.set('q', q); else url.searchParams.delete('q');
      history.replaceState(history.state, '', url);
    }

    function showPosts() {
      results.hidden = true;
      list.replaceChildren();
      summary.textContent = '';
      container.hidden = false;
    }

    function render(q, items, total) {
      list.replaceChildren(...items.map((item) => {
        const li = document.createElement('li');
        li.className = 'search-result';
        const title = document.createElement('h2');
        title.className = 'search-result-title';
        const link = document.createElement('a');
        link.className = 'card-link';
        link.href = item.url;
        link.textContent = item.meta.title || item.url;
        title.append(link);
        li.append(title);
        if (item.meta.date) {
          const date = document.createElement('p');
          date.className = 'search-result-meta';
          date.textContent = item.meta.date;
          li.append(date);
        }
        li.append(excerptNode(item.excerpt));
        return li;
      }));
      summary.textContent = total
        ? `${total} ${total === 1 ? 'post matches' : 'posts match'} “${q}”`
        : `No posts match “${q}”. Try another word, or clear the search to see every post.`;
      container.hidden = true;
      results.hidden = false;
    }

    async function runSearch(raw) {
      const q = raw.trim();
      const id = ++latest;
      setQueryInUrl(q);
      if (!q) { showPosts(); return; }
      applyFilter('all', true); // search always covers every post
      try {
        const pf = await loadPagefind();
        const search = await pf.search(q);
        if (id !== latest) return;
        const items = await Promise.all(search.results.slice(0, 10).map((r) => r.data()));
        if (id !== latest) return;
        render(q, items, search.results.length);
      } catch (err) {
        if (id !== latest) return;
        showPosts();
        summary.textContent = 'Search isn\'t available right now. Browse the posts below instead.';
        results.hidden = false;
      }
    }

    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => runSearch(input.value), 150);
    });
    input.addEventListener('focus', () => { loadPagefind().catch(() => {}); }, { once: true });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      clearTimeout(timer);
      runSearch(input.value);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && input.value) {
        e.preventDefault();
        input.value = '';
        runSearch('');
      }
    });

    // Choosing a tag ends the search.
    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (input.value) { input.value = ''; runSearch(''); }
      });
    });

    // "/" jumps to search, as on GitHub and MDN.
    document.addEventListener('keydown', (e) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      e.preventDefault();
      input.focus();
    });

    // Shareable searches: /blog/?q=kubernetes
    const initial = new URLSearchParams(window.location.search).get('q');
    if (initial) {
      input.value = initial;
      runSearch(initial);
    }
  });
})();

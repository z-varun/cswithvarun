// Blog post enhancements: heading links, table of contents, copy buttons on code blocks.
// Everything here is progressive: posts read fine without it.
(function () {
  'use strict';

  onDomReady(() => {
    const content = document.querySelector('.post-content');
    if (!content) return;

    // Kramdown gives Markdown headings ids; raw-HTML headings don't, so add one.
    const used = new Set(Array.from(content.querySelectorAll('[id]')).map((el) => el.id));
    content.querySelectorAll('h2:not([id]), h3:not([id])').forEach((heading) => {
      const base = heading.textContent.trim().toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-') || 'section';
      let id = base;
      for (let i = 2; used.has(id); i++) id = `${base}-${i}`;
      used.add(id);
      heading.id = id;
    });

    const headings = Array.from(content.querySelectorAll('h2[id], h3[id]'));

    // 1. Link to each section (Kramdown gives headings ids automatically).
    headings.forEach((heading) => {
      const link = document.createElement('a');
      link.className = 'heading-anchor';
      link.href = `#${heading.id}`;
      link.setAttribute('aria-label', `Link to section: ${heading.textContent.trim()}`);
      link.textContent = '#';
      heading.appendChild(link);
    });

    // 2. Table of contents for longer posts (3 or more sections).
    const sections = headings.filter((h) => h.tagName === 'H2');
    if (sections.length >= 3) {
      const nav = document.createElement('nav');
      nav.className = 'post-toc';
      nav.setAttribute('aria-label', 'On this page');

      const details = document.createElement('details');
      details.open = window.matchMedia('(width > 768px)').matches;
      const summary = document.createElement('summary');
      summary.textContent = 'On this page';
      details.appendChild(summary);

      const list = document.createElement('ol');
      let sublist = null;
      headings.forEach((heading) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#${heading.id}`;
        // Heading text without the "#" anchor we just appended
        link.textContent = heading.firstChild ? Array.from(heading.childNodes)
          .filter((n) => !(n.classList && n.classList.contains('heading-anchor')))
          .map((n) => n.textContent).join('').trim() : heading.textContent.trim();
        item.appendChild(link);
        if (heading.tagName === 'H2') {
          list.appendChild(item);
          sublist = null;
        } else if (list.lastElementChild) {
          if (!sublist) {
            sublist = document.createElement('ol');
            list.lastElementChild.appendChild(sublist);
          }
          sublist.appendChild(item);
        }
      });

      details.appendChild(list);
      nav.appendChild(details);
      content.parentNode.insertBefore(nav, content);
    }

    // 3. Copy button on every code block.
    if (navigator.clipboard && window.isSecureContext) {
      content.querySelectorAll('pre').forEach((pre) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'copy-button';
        button.textContent = 'Copy';
        wrapper.appendChild(button);

        const status = document.createElement('span');
        status.className = 'sr-only';
        status.setAttribute('aria-live', 'polite');
        wrapper.appendChild(status);

        let reset;
        button.addEventListener('click', async () => {
          const code = pre.querySelector('code') || pre;
          try {
            await navigator.clipboard.writeText(code.innerText.replace(/\n$/, ''));
            button.textContent = 'Copied';
            status.textContent = 'Code copied to clipboard';
          } catch (e) {
            button.textContent = 'Copy failed';
            status.textContent = 'Could not copy the code';
          }
          button.classList.add('copied');
          clearTimeout(reset);
          reset = setTimeout(() => {
            button.textContent = 'Copy';
            button.classList.remove('copied');
            status.textContent = '';
          }, 2000);
        });
      });
    }
  });
})();

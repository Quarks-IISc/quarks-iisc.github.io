(function() {
  /**
   * NEWS ARTICLE LOADER
   * Renders one story from the News sheet, picked by the ?id= slug that
   * news-loader.js and news-page-loader.js link to.
   */

  function description(row) {
    return row['Description'] || row['Decription'] || '';
  }

  async function loadArticle() {
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('id');

    if (!articleId) {
      window.location.href = '/news/';
      return;
    }

    const loadingEl = document.getElementById('news-article-loading');
    const displayEl = document.getElementById('news-article-display');

    try {
      const rows = await QuarksSheets.load('news');
      const row = rows.find(r => QuarksSheets.slugify(r['Title']) === articleId);

      if (!row) {
        // Covers old Airtable record-id links as well as a story whose title
        // was edited in the sheet after someone copied the URL.
        loadingEl.innerHTML = '<div class="text-muted py-5">That story has moved or been renamed. <a href="/news/">Browse all news</a></div>';
        return;
      }

      const title = row['Title'] || 'Untitled News';
      const body = description(row);
      const publishedDate = row['Published Date'] || '';
      const publishedDateText = typeof formatHumanDate === 'function' ? formatHumanDate(publishedDate) : publishedDate;
      const link = row['Link'] || '';
      const linkText = row['Link Text'] || 'Read More';

      // Update Page Title
      document.title = `${title} | Quarks News`;

      // Inject Content
      document.getElementById('article-title').textContent = title;
      document.getElementById('article-date').textContent = publishedDateText;

      const wordCount = body.split(/\s+/).length;
      const readTime = Math.max(1, Math.round(wordCount / 180));
      document.getElementById('article-read-time').textContent = `${readTime} min read`;

      const bodyEl = document.getElementById('article-body');
      bodyEl.innerHTML = body.replace(/\n/g, '<br>');

      // Handle External Link
      if (link) {
        const linkContainer = document.getElementById('article-external-link');
        const linkAnchor = document.getElementById('external-link-anchor');
        linkAnchor.href = link;
        linkAnchor.innerHTML = `${linkText} <span class="arrow">&xrarr;</span>`;
        linkContainer.style.display = 'block';
      }

      // Show content
      loadingEl.style.display = 'none';
      displayEl.style.display = 'block';

    } catch (e) {
      console.error('Failed to load news article:', e);
      loadingEl.innerHTML = '<div class="text-danger py-5">Unable to load the article. <a href="/news/">Return to news</a></div>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadArticle);
  } else {
    loadArticle();
  }
})();

(function() {
  /**
   * NEWS ARTICLE LOADER
   * Fetches a single news record from Airtable and renders it.
   */

  // --- CONFIGURATION ---
  const AIRTABLE_BASE_ID = 'appZL8Aqpgy1IsIUY'; 
  const AIRTABLE_TABLE_NAME = 'tblf9YPTj8BSx7fV2'; 
  const OBFUSCATED_TOKEN = 'cGF0STN2Q21QTXlleFJBbEUuNTFlNTc4ZjJlNzg0MjEwM2QzNTMwYzNkY2YxMmE0OWQxYTM1NzliNjdmODExYzkzYjcxMDFkMmFlYTVlNzE4YQ=='; 
  // ---------------------

  async function loadArticle() {
    const params = new URLSearchParams(window.location.search);
    const recordId = params.get('id');

    if (!recordId) {
      window.location.href = '/news/';
      return;
    }

    const loadingEl = document.getElementById('news-article-loading');
    const displayEl = document.getElementById('news-article-display');

    try {
      const token = atob(OBFUSCATED_TOKEN);
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}/${recordId}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Airtable error: ${response.status}`);
      }
      
      const data = await response.json();
      const f = data.fields;

      const title = f['Title'] || f['title'] || 'Untitled News';
      const description = f['Description'] || f['description'] || '';
      const publishedDate = f['Published Date'] || '';
      const publishedDateText = typeof formatHumanDate === 'function' ? formatHumanDate(publishedDate) : publishedDate;
      const link = f['Link'] || f['link'] || '';
      const linkText = f['Link Text'] || f['link text'] || 'Read More';

      // Update Page Title
      document.title = `${title} | Quarks News`;

      // Inject Content
      document.getElementById('article-title').textContent = title;
      document.getElementById('article-date').textContent = publishedDateText;
      
      const wordCount = description.split(/\s+/).length;
      const readTime = Math.max(1, Math.round(wordCount / 180));
      document.getElementById('article-read-time').textContent = `${readTime} min read`;

      const bodyEl = document.getElementById('article-body');
      bodyEl.innerHTML = description.replace(/\n/g, '<br>');

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

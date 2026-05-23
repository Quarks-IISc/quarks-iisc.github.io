(function() {
  /**
   * NEWS LOADER (Airtable Version)
   */

  // --- CONFIGURATION ---
  const AIRTABLE_BASE_ID = 'appZL8Aqpgy1IsIUY'; 
  const AIRTABLE_TABLE_NAME = 'tblf9YPTj8BSx7fV2'; 
  const OBFUSCATED_TOKEN = 'cGF0STN2Q21QTXlleFJBbEUuNTFlNTc4ZjJlNzg0MjEwM2QzNTMwYzNkY2YxMmE0OWQxYTM1NzliNjdmODExYzkzYjcxMDFkMmFlYTVlNzE4YQ=='; 
  // ---------------------

  async function loadNews() {
    const listEl = document.getElementById('news-list');
    if (!listEl) return;

    try {
      const token = atob(OBFUSCATED_TOKEN);
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Airtable error: ${response.status}`);
      }
      
      const data = await response.json();
      
      const newsItems = data.records.map(record => {
        const f = record.fields;
        return {
          id: record.id,
          title: f['Title'] || f['title'] || '',
          description: f['Description'] || f['description'] || '',
          link: f['Link'] || f['link'] || '#',
          link_text: f['Link Text'] || f['link text'] || 'Read More',
          image: f['Image'] && f['Image'][0] ? f['Image'][0].url : (f['image'] && f['image'][0] ? f['image'][0].url : ''),
          published_date: f['Published Date'] || '',
          published_date_text: typeof formatHumanDate === 'function' ? formatHumanDate(f['Published Date']) : (f['Published Date'] || '')
        };
      }).sort((a, b) => {
        // Sort by date descending (newest first)
        return new Date(b.published_date) - new Date(a.published_date);
      });

      const html = newsItems.length > 0 ? newsItems.map(item => {
        const words = item.description.split(/\s+/);
        const isLong = words.length > 100;
        const readMoreUrl = isLong ? `/news-article/?id=${item.id}` : `/news/#${item.id}`;

        return `
        <li class="mb-4 pb-3 border-bottom">
          <div class="news-item-content">
            <div class="font-weight-bold" style="font-size: 1.15rem; line-height: 1.4;">
              <a href="${readMoreUrl}" style="color: inherit; text-decoration: none;">${item.title}</a>
            </div>
            <div class="news-desc-preview text-muted" style="font-weight: 400; font-size: 0.95rem;">
              ${item.description}
            </div>
          </div>
          <div class="mt-3 d-flex align-items-center justify-content-between flex-wrap" style="gap: 10px;">
            <a href="${readMoreUrl}" class="magazine-link" style="font-size: 0.95rem; padding-bottom: 2px;">Read More <span class="arrow" style="font-size: 1.2rem; margin-left: 8px;">&xrarr;</span></a>
            ${item.published_date_text ? `<span class="deadline-badge"><i class="far fa-calendar-alt mr-1"></i> Posted: ${item.published_date_text}</span>` : ''}
          </div>
        </li>
      `;}).join('') : '<li class="text-muted text-center py-3">No updates yet</li>';
      
      listEl.innerHTML = html;
      
    } catch (e) {
      console.error('Failed to load news:', e);
      listEl.innerHTML = '<li class="text-muted text-center py-3">Unable to load news updates</li>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNews);
  } else {
    loadNews();
  }
})();

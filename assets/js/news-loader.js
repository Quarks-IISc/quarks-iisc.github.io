(function() {
  /**
   * NEWS LOADER (homepage column)
   * Reads the News sheet via sheets-data.js.
   */

  // The sheet spells it "Decription"; accept either so fixing the header in the
  // sheet doesn't blank the column on the site.
  function description(row) {
    return row['Description'] || row['Decription'] || '';
  }

  function toItem(row) {
    const publishedDate = row['Published Date'] || '';
    return {
      id: QuarksSheets.slugify(row['Title']),
      title: row['Title'] || '',
      description: description(row),
      link: row['Link'] || '#',
      link_text: row['Link Text'] || 'Read More',
      image: row['Image'] || '',
      published_date: publishedDate,
      published_date_text: typeof formatHumanDate === 'function' ? formatHumanDate(publishedDate) : publishedDate
    };
  }

  async function loadNews() {
    const listEl = document.getElementById('news-list');
    if (!listEl) return;

    try {
      const rows = await QuarksSheets.load('news');

      const newsItems = rows
        .map(toItem)
        .filter(item => item.title.trim() || item.description.trim())
        .sort((a, b) => {
          // Newest first; rows with no date sort to the bottom.
          return QuarksSheets.dateKey(b.published_date) - QuarksSheets.dateKey(a.published_date);
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

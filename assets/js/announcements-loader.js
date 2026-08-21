(function() {
  /**
   * ANNOUNCEMENTS LOADER (homepage column)
   * Reads the Announcements sheet via sheets-data.js.
   */

  function toItem(row) {
    const deadline = row['Deadline'] || '';
    return {
      id: row['Content ID'] || QuarksSheets.slugify(row['Title']),
      title: row['Title'] || '',
      description: row['Description'] || '',
      link: row['Link'] || '#',
      link_text: row['Link Text'] || 'Apply Here',
      image: row['Image'] || '',
      deadline: deadline,
      deadline_text: typeof formatHumanDate === 'function' ? formatHumanDate(deadline) : deadline
    };
  }

  function card(a, type, sizes) {
    const itemData = JSON.stringify({
      title: a.title,
      description: a.description,
      link: a.link,
      linkText: a.link_text,
      image: a.image,
      dateText: a.deadline_text || a.deadline,
      type: type
    }).replace(/"/g, '&quot;');

    return `
      <li class="mb-${sizes.mb} pb-${sizes.pb} border-bottom">
        <div class="news-item-content">
          <div class="font-weight-bold" style="font-size: 1.15rem; line-height: 1.4;">
            ${a.title}
          </div>
          <div class="news-desc-preview text-muted" style="font-weight: 400; font-size: 0.95rem;">
            ${a.description}
          </div>
        </div>
        <div class="mt-${sizes.mt} ${a.deadline ? 'd-flex align-items-center justify-content-between flex-wrap' : ''}" style="gap: 10px;">
          <a href="javascript:void(0)" onclick="showNewsDetails(${itemData})" class="magazine-link" style="font-size: ${sizes.link}; padding-bottom: 2px;">Read More <span class="arrow" style="font-size: ${sizes.arrow}; margin-left: ${sizes.gap};">&xrarr;</span></a>
          ${a.deadline ? `<span class="deadline-badge"><i class="far fa-calendar-alt mr-1"></i> Deadline: ${a.deadline_text || a.deadline}</span>` : ''}
        </div>
      </li>
    `;
  }

  async function loadAnnouncements() {
    const listEl = document.getElementById('announcements-list');
    if (!listEl) return;

    try {
      const rows = await QuarksSheets.load('announcements');
      const announcements = rows
        .map(toItem)
        .filter(a => a.title.trim() || a.description.trim());

      const todayNum = QuarksSheets.todayKey();

      // No deadline means an open-ended notice: always active, listed last.
      const active = announcements
        .filter(a => !a.deadline || QuarksSheets.dateKey(a.deadline) >= todayNum)
        .sort((a, b) => {
          const aDate = a.deadline ? QuarksSheets.dateKey(a.deadline) : 99999999;
          const bDate = b.deadline ? QuarksSheets.dateKey(b.deadline) : 99999999;
          return aDate - bDate;
        });

      const past = announcements
        .filter(a => a.deadline && QuarksSheets.dateKey(a.deadline) < todayNum)
        .sort((a, b) => QuarksSheets.dateKey(b.deadline) - QuarksSheets.dateKey(a.deadline));

      const activeSizes = { mb: 4, pb: 3, mt: 3, link: '0.95rem', arrow: '1.2rem', gap: '8px' };
      const pastSizes = { mb: 3, pb: 2, mt: 2, link: '0.85rem', arrow: '1rem', gap: '5px' };

      const html = active.map(a => card(a, 'Announcements', activeSizes)).join('');

      const pastHtml = past.length > 0 ? `
        <div class="mt-5 mb-3">
          <h5 class="text-muted text-uppercase" style="letter-spacing: 2px; font-size: 0.9rem; font-weight: 700; border-bottom: 1px solid rgba(128,128,128,0.2); padding-bottom: 10px;">Past Announcements</h5>
        </div>
        ${past.map(a => card(a, 'Past Announcements', pastSizes)).join('')}
      ` : '';

      listEl.innerHTML = html + pastHtml || '<li class="text-muted text-center py-3">No announcements</li>';

    } catch (e) {
      console.error('Failed to load announcements:', e);
      listEl.innerHTML = '<li class="text-muted text-center py-3">Unable to load announcements</li>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAnnouncements);
  } else {
    loadAnnouncements();
  }
})();

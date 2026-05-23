(function() {
  /**
   * NEWS PAGE LOADER (Professional Magazine Version)
   */

  // --- CONFIGURATION (Synced with news-loader.js) ---
  const AIRTABLE_BASE_ID = 'appZL8Aqpgy1IsIUY'; 
  const AIRTABLE_TABLE_NAME = 'tblf9YPTj8BSx7fV2'; 
  const OBFUSCATED_TOKEN = 'cGF0STN2Q21QTXlleFJBbEUuNTFlNTc4ZjJlNzg0MjEwM2QzNTMwYzNkY2YxMmE0OWQxYTM1NzliNjdmODExYzkzYjcxMDFkMmFlYTVlNzE4YQ=='; 
  // ---------------------

  async function loadNewsPage() {
    const listEl = document.getElementById('news-page-list');
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
          link: f['Link'] || f['link'] || '',
          link_text: f['Link Text'] || f['link text'] || 'Read More',
          published_date: f['Published Date'] || '',
          published_date_text: typeof formatHumanDate === 'function' ? formatHumanDate(f['Published Date']) : (f['Published Date'] || '')
        };
      }).sort((a, b) => {
        return new Date(b.published_date) - new Date(a.published_date);
      });

      const styles = `
        <style>
          .news-section-header { 
            font-family: 'Playfair Display', serif; 
            font-size: 2.2rem; 
            font-weight: 800; 
            text-transform: uppercase; 
            letter-spacing: 1px; 
            color: var(--heading-color);
            padding-bottom: 0;
            margin-bottom: 40px;
            display: flex;
            align-items: center;
          }
          .news-section-header::after {
            content: "";
            flex: 1;
            margin-left: 20px;
            height: 1px;
            background: var(--border-color);
            opacity: 0.3;
          }

          .news-card { border-top: 1px solid var(--border-color); padding-top: 1.8rem; transition: all 0.3s ease; cursor: default; }
          .news-card:hover { border-top-color: var(--link-color) !important; transform: translateY(-3px); }
          .news-card:hover .news-title { color: var(--link-color) !important; }
          
          .news-hero .news-title { font-size: 2.5rem !important; }
          .news-hero .news-description { font-size: 1.2rem !important; max-width: 950px; }
          
          @media (min-width: 992px) {
            .news-grid-item:nth-child(odd) { border-right: 1px solid var(--border-color); padding-right: 2.5rem; }
            .news-grid-item:nth-child(even) { padding-left: 2.5rem; }
          }
        </style>
      `;

      function renderCard(item, truncationLimit, isHero = false) {
        const words = item.description.split(/\s+/);
        const isLong = words.length > 100;
        const hasExternalLink = item.link && item.link !== '#';
        
        // Refined truncation to ensure it's not "full length"
        const displayDescription = words.length > truncationLimit 
            ? words.slice(0, truncationLimit).join(' ') + '...' 
            : item.description;
        
        let readMoreUrl = '';
        let linkText = '';
        let targetAttr = '';
        
        if (isLong) {
          readMoreUrl = `/news-article/?id=${item.id}`;
          linkText = 'Read Full Story';
        } else if (hasExternalLink) {
          readMoreUrl = item.link;
          linkText = item.link_text || 'Read More';
          targetAttr = 'target="_blank" rel="noopener noreferrer"';
        }

        return `
          <div class="news-card h-100" id="${item.id}">
            <div class="news-meta text-muted mb-2" style="font-family: 'Inter', sans-serif; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
              ${item.published_date_text || 'Recent Update'}
            </div>
            <h3 class="news-title" style="font-family: 'Playfair Display', serif; font-weight: 700; line-height: 1.2; color: var(--heading-color); transition: color 0.2s ease; margin-bottom: 1.2rem; font-size: ${isHero ? '2.5rem' : '1.75rem'};">
              ${readMoreUrl ? `<a href="${readMoreUrl}" ${targetAttr} style="color: inherit; text-decoration: none;">${item.title}</a>` : item.title}
            </h3>
            <div class="news-description" style="font-family: 'Inter', sans-serif; font-size: ${isHero ? '1.2rem' : '1.05rem'}; color: var(--text-color); line-height: 1.7; margin-bottom: 1.5rem;">
              ${displayDescription.replace(/\n/g, '<br>')}
            </div>
            ${readMoreUrl ? `
              <div class="news-footer mt-auto">
                <a href="${readMoreUrl}" ${targetAttr} class="magazine-link" style="font-size: 0.95rem; font-weight: 600;">
                  ${linkText} <span class="arrow" style="font-size: 1.2rem; margin-left: 8px;">&xrarr;</span>
                </a>
              </div>
            ` : ''}
          </div>
        `;
      }

      if (newsItems.length === 0) {
        listEl.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted">No news updates found at the moment.</p></div>';
        return;
      }

      const latestItems = newsItems.slice(0, 3);
      const chronicleItems = newsItems.slice(3);

      let finalHtml = styles;

      // Render LATEST NEWS
      finalHtml += `<div class="col-12"><h4 class="news-section-header">Latest News</h4></div>`;
      
      // Hero (Item 1)
      finalHtml += `<div class="col-12 mb-5 pb-4 news-hero fade-up-element">${renderCard(latestItems[0], 100, true)}</div>`;
      
      // Secondary (Items 2 & 3)
      if (latestItems.length > 1) {
        finalHtml += latestItems.slice(1).map(item => `
          <div class="col-lg-6 mb-5 news-grid-item fade-up-element">${renderCard(item, 80)}</div>
        `).join('');
      }

      // Render CHRONICLES
      if (chronicleItems.length > 0) {
        finalHtml += `<div class="col-12 mt-5"><h4 class="news-section-header">Chronicles</h4></div>`;
        finalHtml += chronicleItems.map(item => `
          <div class="col-lg-6 mb-5 news-grid-item fade-up-element">${renderCard(item, 60)}</div>
        `).join('');
      }
      
      listEl.innerHTML = finalHtml;

      // Handle anchor scrolling for dynamic content
      if (window.location.hash) {
        const targetId = window.location.hash.substring(1);
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          setTimeout(() => {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetEl.parentElement.style.backgroundColor = 'var(--highlight-color)';
            setTimeout(() => {
              targetEl.parentElement.style.backgroundColor = 'transparent';
            }, 2000);
          }, 500);
        }
      }

      // Trigger fade-in animation for new elements
      if (typeof IntersectionObserver !== 'undefined') {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
            }
          });
        }, { threshold: 0.1 });
        
        listEl.querySelectorAll('.fade-up-element').forEach(el => observer.observe(el));
      }
      
    } catch (e) {
      console.error('Failed to load news page:', e);
      listEl.innerHTML = '<div class="col-12 text-center py-5 text-danger">Unable to load news updates. Please try again later.</div>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNewsPage);
  } else {
    loadNewsPage();
  }
})();

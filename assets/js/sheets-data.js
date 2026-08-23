/**
 * SHEETS DATA
 *
 * Shared reader for the two Google Sheets in the "Website" Drive folder that
 * back News and Announcements. Replaces the Airtable API, which sat behind a
 * monthly call quota (and needed a token shipped to the browser).
 *
 * Both sheets are read through the Google Visualization endpoint:
 *
 *   https://docs.google.com/spreadsheets/d/<id>/gviz/tq?tqx=out:json&sheet=<tab>
 *
 * That endpoint is public for any sheet shared as "anyone with the link can
 * view", needs no key, sends permissive CORS headers, and has no request quota.
 *
 * We ask for JSON rather than CSV on purpose. A CSV export renders dates using
 * the sheet's own locale, and the two sheets disagree: 4/1/2026 in News is the
 * 4th of January, while the same shape in Announcements would read as April.
 * The JSON response types date cells as `Date(2026,0,4)` — year, zero-based
 * month, day — so there is nothing left to guess.
 *
 * Editors only ever touch the sheets; nothing here needs redeploying when a row
 * is added.
 */
window.QuarksSheets = (function () {
  var SHEETS = {
    news: {
      id: '1cxoUKwiroEsxirOxcNEsa82YRSm-zm5PygFu9Ntkbvo',
      tab: 'Sheet1'
    },
    announcements: {
      id: '1O56l5QnyMzO8mPfpbcf9UFCMxPeoNkRNhYUaMNayKL0',
      tab: 'Sheet1'
    }
  };

  // One in-flight request per sheet, so a page that asks twice fetches once.
  var pending = {};

  function endpoint(cfg) {
    return (
      'https://docs.google.com/spreadsheets/d/' +
      cfg.id +
      '/gviz/tq?tqx=out:json&sheet=' +
      encodeURIComponent(cfg.tab)
    );
  }

  // The body arrives wrapped in a JS callback:
  //   /*O_o*/ google.visualization.Query.setResponse({...});
  function unwrap(text) {
    var start = text.indexOf('{');
    var end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) {
      throw new Error('Unexpected response from Google Sheets');
    }
    return JSON.parse(text.slice(start, end + 1));
  }

  function pad(n) {
    return (n < 10 ? '0' : '') + n;
  }

  // 'Date(2026,2,20)' -> '2026-03-20' (the format formatHumanDate expects).
  function toIsoDate(value) {
    if (typeof value !== 'string') return '';
    var m = value.match(/^Date\((\d+),(\d+),(\d+)/);
    if (!m) return '';
    return m[1] + '-' + pad(parseInt(m[2], 10) + 1) + '-' + pad(parseInt(m[3], 10));
  }

  function cellText(cell, type) {
    if (!cell || cell.v === null || cell.v === undefined) return '';
    if (type === 'date' || type === 'datetime') {
      // Fall back to the sheet's own formatted string if the cell was typed as
      // a date but holds something we can't read.
      return toIsoDate(cell.v) || cell.f || '';
    }
    // Numbers come through as floats (16 -> 16.0); `f` is what the sheet shows.
    if (type === 'number') return cell.f || String(cell.v);
    return String(cell.v);
  }

  function toObjects(table) {
    var headers = table.cols.map(function (col, i) {
      return (col.label || '').trim() || 'col' + i;
    });

    return table.rows
      .map(function (row) {
        var out = {};
        headers.forEach(function (name, i) {
          out[name] = cellText(row.c ? row.c[i] : null, table.cols[i].type);
        });
        return out;
      })
      .filter(function (row) {
        // Sheets pads the range with blank rows; drop anything with no content.
        return Object.keys(row).some(function (k) {
          return row[k] && row[k].trim();
        });
      });
  }

  /**
   * Read one sheet. Returns a promise for an array of plain objects keyed by
   * the header row, e.g. { Title: '...', 'Published Date': '2026-01-04' }.
   */
  function load(name) {
    var cfg = SHEETS[name];
    if (!cfg) return Promise.reject(new Error('Unknown sheet: ' + name));

    if (!pending[name]) {
      pending[name] = fetch(endpoint(cfg))
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Google Sheets error: ' + response.status);
          }
          return response.text();
        })
        .then(function (text) {
          return toObjects(unwrap(text).table);
        })
        .catch(function (err) {
          // Don't cache a failure — let the next caller retry.
          delete pending[name];
          throw err;
        });
    }
    return pending[name];
  }

  /**
   * Stable id for a news row. The sheet has no record id of its own, so the
   * title is the identity: it survives rows being reordered or inserted, which
   * a row number would not, and it makes for a readable article URL.
   */
  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  // 'YYYY-MM-DD' -> 20260320, for cheap date comparison. 0 when absent.
  function dateKey(iso) {
    if (!iso) return 0;
    var digits = String(iso).replace(/\D/g, '');
    return digits.length >= 8 ? parseInt(digits.slice(0, 8), 10) : 0;
  }

  function todayKey() {
    var now = new Date();
    return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  }

  return {
    load: load,
    slugify: slugify,
    dateKey: dateKey,
    todayKey: todayKey
  };
})();

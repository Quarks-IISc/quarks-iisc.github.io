(function () {
  /**
   * QUARKS QUACKS
   *
   * Sheet columns, any order, matched by name not position. Only "Name of
   * event" is required; every other column may be missing entirely, empty, or
   * spelt one of the alternatives listed against it in toEvent().
   *
   *   Name of event | Timing | Poster image | Venue | Speaker details |
   *   Event description | Registration link | Last date for registration
   *
   * Reads the events sheet and lays the posters out as two opposed marquees:
   * the top row drifts left, the bottom row drifts right, each carrying half
   * the posters. Clicking one opens the full details.
   *
   * Posters are NOT kept in this repo. The sheet holds a Google Drive link per
   * event and we rewrite it to Drive's own thumbnail endpoint, asking for the
   * width we actually need. Google resizes and re-encodes on their CDN, so a
   * 4 MB poster arrives as a ~40 KB image, the repo stays small, and adding an
   * event never needs a deploy. The trade is one extra DNS/TLS handshake to
   * drive.google.com, which is cheaper than shipping 20 posters from Pages.
   */

  var THUMB_WIDTH = 520; // carousel tile
  var FULL_WIDTH = 1200; // modal

  // Ten stand-ins so the page has something to show before the sheet fills up.
  // Twenty events over ten images, ten per row, exactly as the rows split.
  var DEMO_NAMES = [
    'Opening Ceremony', 'Board Game Marathon', 'Portrait Photobooth',
    'Rangmanch Improv Night', 'Rhythmica Open Mic', 'Campus Treasure Hunt',
    'The Mega Quiz', 'Fireside Chat: Science & Story', 'Crossword Clinic',
    'Sunrise Photo Walk', 'Debate: Abolish the 8 AM', 'Frames of IISc',
    'The Game Room', 'Origami & Doodle Workshop', 'Karaoke Hour',
    'Stage Play: Second Act', 'Stalls & Street Food', 'Lightning Talks',
    'Jam Session', 'Closing Night Concert'
  ];

  function demoEvents(baseurl) {
    return DEMO_NAMES.map(function (name, i) {
      var hour = 10 + Math.floor(i * 0.65);
      return {
        name: name,
        timing: hour + ':00 ' + (hour < 12 ? 'AM' : 'PM'),
        venue: 'To be announced',
        speaker: '',
        details:
          'A placeholder while the schedule is being finalised. Real details ' +
          'for every Quacks event land here as soon as the clubs confirm them.',
        register: '',
        lastDate: '',
        thumb: baseurl + '/assets/images/quarks-quacks/demo-' + ((i % 10) + 1) + '.webp',
        full: baseurl + '/assets/images/quarks-quacks/demo-' + ((i % 10) + 1) + '.webp',
        isDemo: true
      };
    });
  }

  // --- posters -------------------------------------------------------------

  // Accepts anything an editor is likely to paste: a /file/d/<id>/view link, a
  // ?id=<id> link, an open?id= link, or a bare file id.
  function driveId(value) {
    var text = String(value || '').trim();
    if (!text) return '';
    var byPath = text.match(/\/file\/d\/([A-Za-z0-9_-]{20,})/);
    if (byPath) return byPath[1];
    var byQuery = text.match(/[?&]id=([A-Za-z0-9_-]{20,})/);
    if (byQuery) return byQuery[1];
    if (/^[A-Za-z0-9_-]{25,}$/.test(text)) return text;
    return '';
  }

  function posterUrl(value, width) {
    var id = driveId(value);
    if (id) {
      return 'https://drive.google.com/thumbnail?id=' + id + '&sz=w' + width;
    }
    // Not a Drive link — assume it is already a usable image URL.
    var text = String(value || '').trim();
    return /^https?:\/\//.test(text) ? text : '';
  }

  // --- rows ----------------------------------------------------------------

  function field(row, names) {
    for (var i = 0; i < names.length; i++) {
      var value = row[names[i]];
      if (value !== undefined && String(value).trim() !== '') {
        return String(value).trim();
      }
    }
    return '';
  }

  function toEvent(row) {
    var poster = field(row, ['Poster image', 'Poster', 'Poster Image', 'Image']);
    return {
      name: field(row, ['Name of event', 'Event', 'Event name', 'Name', 'Title']),
      timing: field(row, ['Timing', 'Time', 'Timings']),
      venue: field(row, ['Venue', 'Location', 'Place']),
      speaker: field(row, ['Speaker details', 'Speaker', 'Guest', 'Guest/Judge', 'Judge']),
      details: field(row, [
        'Event description', 'Event details', 'Description', 'Details', 'About'
      ]),
      register: field(row, ['Registration link', 'Register', 'Registration', 'Link']),
      lastDate: field(row, [
        'Last date for registration', 'Last date', 'Registration deadline', 'Deadline'
      ]),
      thumb: posterUrl(poster, THUMB_WIDTH),
      full: posterUrl(poster, FULL_WIDTH),
      isDemo: false
    };
  }

  // --- rendering -----------------------------------------------------------

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function metaLine(event) {
    return [event.timing, event.venue].filter(Boolean).join('  \u00b7  ');
  }

  function posterHtml(event, cap) {
    return event.thumb
      ? '<img src="' + escapeHtml(event.thumb) + '" alt="' +
        escapeHtml(event.name) + ' poster" loading="' + cap + '" decoding="async" />'
      : '<div class="pond-pad-blank"><i class="fas fa-feather-alt"></i></div>';
  }

  /**
   * A swirl of a connector between entries, drawn in the same hand as the
   * site's other doodles. Three shapes, alternating and mirrored, so a long
   * running order does not look like the same mark stamped twenty times.
   */
  /**
   * Connectors between runs of rows. Each carries its own arrowheads, because
   * the three shapes finish at different points and a single hardcoded head
   * landed off the end of two of them. The middle one is double-ended.
   */
  var SWIRLS = [
    {
      d: 'M4 17 C 20 3, 40 3, 48 13 C 55 22, 40 28, 36 19 ' +
         'C 32 9, 54 4, 74 10 C 86 14, 94 17, 100 17',
      heads: [[100, 17, 90, 12, 90, 22]]
    },
    {
      // <~-~>
      d: 'M15 17 q8 -10 16 0 t16 0 t16 0 t16 0 t16 0',
      heads: [[15, 17, 25, 12, 25, 22], [95, 17, 85, 12, 85, 22]]
    },
    {
      d: 'M4 17 C 18 30, 38 30, 46 20 C 53 11, 38 5, 34 15 ' +
         'C 30 26, 52 31, 72 24 C 84 20, 93 18, 100 17',
      heads: [[100, 17, 90, 12, 90, 22]]
    }
  ];

  function swirlHtml(index) {
    var k = index % SWIRLS.length;
    var swirl = SWIRLS[k];
    var lean = k === 1 ? ' is-mid' : k === 2 ? ' is-right' : '';
    var heads = swirl.heads.map(function (h) {
      return '<path d="M' + h[0] + ' ' + h[1] + ' L ' + h[2] + ' ' + h[3] + '" />' +
             '<path d="M' + h[0] + ' ' + h[1] + ' L ' + h[4] + ' ' + h[5] + '" />';
    }).join('');

    return '' +
      '<svg class="docket-swirl' + lean + '" viewBox="0 0 104 34" fill="none" ' +
      'aria-hidden="true" stroke="currentColor" stroke-width="2.1" ' +
      'stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="' + swirl.d + '" />' + heads +
      '</svg>';
  }

  /**
   * The running order. No posters here on purpose: they float in the pond, and
   * showing every one again underneath made swimming pointless. A table rather
   * than a card each, because twenty cards ran far too deep to take in at a
   * glance — just with the rows given room to breathe.
   */
  function renderTable(events) {
    var body = document.getElementById('quack-rows');
    var status = document.getElementById('quack-status');
    if (!body) return;

    if (!events.length) {
      status.textContent = 'The schedule goes up here as soon as the clubs confirm it.';
      return;
    }

    function cell(label, value, cls) {
      return value
        ? '<td class="' + cls + '" data-label="' + label + '">' +
          escapeHtml(value) + '</td>'
        : '<td class="docket-dim is-empty" data-label="' + label + '">&mdash;</td>';
    }

    var rows = '';
    events.forEach(function (e, i) {
      var act = e.register
        ? '<a class="quack-reg" href="' + escapeHtml(e.register) +
          '" target="_blank" rel="noopener noreferrer">Register</a>' +
          (e.lastDate
            ? '<span class="docket-by">by ' + escapeHtml(e.lastDate) + '</span>'
            : '')
        : '<span class="docket-walkin">just turn up</span>';

      rows += '' +
        '<tr>' +
        '  <td class="docket-time" data-label="When">' +
             (e.timing ? escapeHtml(e.timing) : 'All day') + '</td>' +
        '  <td class="docket-name" data-label="What">' + escapeHtml(e.name) +
        (e.details ? '<small>' + escapeHtml(e.details) + '</small>' : '') +
        '  </td>' +
             cell('Where', e.venue, 'docket-where') +
             cell('Guest / judge', e.speaker, 'docket-where') +
        '  <td data-label="Sign up">' + act + '</td>' +
        '  <td><button type="button" class="quack-more" data-event="' + i +
             '">Poster</button></td>' +
        '</tr>';

      // a swirl every few rows, so a long list is not one unbroken run
      if ((i + 1) % 5 === 0 && i < events.length - 1) {
        rows += '<tr class="docket-swirl-row"><td colspan="6">' +
          swirlHtml((i + 1) / 5) + '</td></tr>';
      }
    });

    body.innerHTML = rows;
    status.style.display = 'none';
    body.querySelectorAll('.quack-more').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openModal(events[Number(btn.dataset.event)]);
      });
    });
  }

  // --- the pond ------------------------------------------------------------

  /**
   * A game viewport, deliberately not part of the document scroll.
   *
   * The world is one element moved by one transform. Nothing inside it is
   * animated and nothing reflows, so the browser keeps the whole pond as a
   * single composited layer and a frame costs two transform writes. The
   * previous version drove the duck from the page scroll, which meant every
   * frame paid for scroll events, observer callbacks and re-rastering a
   * ten-thousand-pixel document — that is what could not be tuned smooth.
   *
   * Sizes are all derived from the pond's measured box, so the same code lays
   * it out on a phone and on a desktop.
   */
  function wirePond(events) {
    var wrap = document.getElementById('pond-wrap');
    var pond = document.getElementById('pond');
    var world = document.getElementById('pond-world');
    var duck = document.getElementById('pond-duck');
    var card = document.getElementById('pond-card');
    var cardName = document.getElementById('pond-card-name');
    var cardMeta = document.getElementById('pond-card-meta');
    var cardOpen = document.getElementById('pond-card-open');
    var countEl = document.getElementById('pond-count');
    var totalEl = document.getElementById('pond-total');
    var hint = document.getElementById('pond-hint');
    var prize = document.getElementById('pond-prize');
    if (!pond || !world || !duck || !events.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (wrap) wrap.style.display = 'none';
      return;
    }

    // Weighted by repetition: lilies and weeds are the bulk of a pond, the
    // frog and the dragonfly are the once-in-a-while things you notice.
    /**
     * Deterministic scatter. The obvious trick — (i * a) % b — gives every
     * point the same step from the last one, so everything lands on the same
     * few diagonal lines. This hashes instead, which decorrelates the two axes
     * and actually fills the water, while still giving the same pond on every
     * visit.
     */
    function rand(i, salt) {
      var x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
      return x - Math.floor(x);
    }

    var DECOR = [
      'lily', 'lily', 'lily', 'lotus', 'lotus',
      'weed', 'weed', 'weed', 'cattail', 'cattail',
      'pebble', 'pebble', 'fish', 'fish', 'bubbles', 'bubbles',
      'turtle', 'frog', 'dragonfly', 'spark'
    ];
    var HAZARDS = ['shark', 'shark', 'squid'];

    var pads = [];           // { el, x, y, w, h, event }
    var FROGS = 2;
    var frogSpots = [];      // pairs of lilies, one pair per frog
    var hazards = [];        // the ones that can eat you
    var critters = [];       // the ones that just live here
    var padH = 240;
    var worldW = 0, worldH = 0, viewW = 0, viewH = 0;
    var padW = 190, duckSize = 52, rad = 22;
    var duckX = 0, duckY = 0, vx = 0, vy = 0;
    var camX = 0, camY = 0;
    var held = {};
    var pointer = null;      // { x, y } in pond coordinates, while dragging
    var here = null;
    var found = {};
    var foundCount = 0;
    var running = false, awake = false, focused = true;
    var lastWorld = '', lastDuck = '', lastFace = 0;
    var ripples = [];
    var lastRipple = 0;

    function layout() {
      var box = pond.getBoundingClientRect();
      if (!box.width) return;
      viewW = box.width;
      viewH = box.height;

      // A pad is about a quarter of the shorter side; the duck, a tenth.
      padW = Math.max(130, Math.min(210, Math.min(viewW, viewH) * 0.34));
      duckSize = Math.max(34, Math.min(64, Math.min(viewW, viewH) * 0.1));
      rad = duckSize * 0.42;
      duck.style.setProperty('--duck-size', duckSize.toFixed(1) + 'px');

      // Lay the pads on a jittered grid, roughly square, with a comfortable
      // channel between them for the duck to swim down.
      var cols = Math.max(2, Math.round(Math.sqrt(events.length * 1.35)));
      var rows = Math.ceil(events.length / cols);
      // Roomier cells, so the duck has water to swim in rather than corridors.
      var cellW = padW * 2.5;
      var cellH = padW * 2.8;

      worldW = Math.max(viewW, cols * cellW + cellW * 1.2);
      worldH = Math.max(viewH, rows * cellH + cellH * 0.9);
      world.style.width = worldW + 'px';
      world.style.height = worldH + 'px';

      // Decide the pad's size rather than measure it: 4px border, 7px inner
      // padding, a fixed art box and two lines for the name. Everything the
      // collision needs is then known before a single poster has loaded.
      var artH = Math.round(padW * 0.72);
      var nameH = 34;
      padH = 4 * 2 + 7 * 2 + artH + 6 + nameH;

      var html = '';
      var placed = [];
      events.forEach(function (event, i) {
        var seed = i * 31 + 7;
        var col = i % cols;
        var row = Math.floor(i / cols);
        // Jitter within the cell, and shove alternate rows half a cell sideways,
        // so the grid underneath stops being legible. Still deterministic: the
        // pond looks the same every time you come back to it.
        var jx = (rand(i, 11) - 0.5) * cellW * 0.42;
        var jy = (rand(i, 12) - 0.5) * cellH * 0.38;
        var stagger = (row % 2) * cellW * 0.5;
        var x = cellW * 0.45 + col * cellW + stagger + jx;
        var y = cellH * 0.4 + row * cellH + jy;
        placed.push({ x: x, y: y, event: event, i: i });
        html +=
          '<div class="pond-pad" data-pad="' + i + '" style="left:' + x.toFixed(0) +
          'px;top:' + y.toFixed(0) + 'px;width:' + padW.toFixed(0) +
          'px;height:' + padH.toFixed(0) + 'px;--art:' + artH + 'px">' +
          '  <div class="pond-pad-rise">' +
          '    <div class="pond-pad-inner">' + posterHtml(event, 'lazy') +
          '      <span class="pond-pad-name">' + escapeHtml(event.name) + '</span>' +
          '    </div>' +
          '  </div>' +
          '  <span class="pond-waterline"></span>' +
          '</div>';
      });

      // Each frog gets two lily pads set side by side, close enough that the
      // hop reads as one pad to the next rather than a leap across the pond.
      frogSpots = [];
      var lilyPx = Math.round(duckSize * 0.95);
      for (var f = 0; f < FROGS; f++) {
        var fx = (0.12 + rand(f, 41) * 0.7) * worldW;
        var fy = (0.12 + rand(f, 42) * 0.7) * worldH;
        var gap = lilyPx * 1.5 + rand(f, 43) * lilyPx * 0.6;
        var tilt = (rand(f, 44) - 0.5) * lilyPx * 0.5;
        var spot = {
          a: { x: fx, y: fy },
          b: { x: fx + gap, y: fy + tilt }
        };
        frogSpots.push(spot);
        [spot.a, spot.b].forEach(function (pt) {
          html +=
            '<svg class="pond-decor" style="left:' + (pt.x - lilyPx / 2).toFixed(0) +
            'px;top:' + (pt.y - lilyPx / 2).toFixed(0) + 'px;width:' + lilyPx +
            'px;height:' + lilyPx + 'px;opacity:0.95">' +
            '<use href="#qpx-lily"></use></svg>';
        });
      }

      // Static decor, painted once into the same layer. Never animated: one
      // animation in here and the browser stops treating the world as a single
      // cheap layer, which is the whole reason the pond runs smoothly.
      //
      // Scaled to the water, so a bigger pond is not a sparser one. Positions
      // are in world pixels rather than percentages, which spreads them evenly
      // instead of bunching them toward one corner on a long world.
      var decorCount = Math.max(45, Math.min(170,
        Math.round((worldW * worldH) / 42000)));
      for (var d = 0; d < decorCount; d++) {
        var kind = DECOR[Math.floor(rand(d, 5) * DECOR.length)];
        // A few big ones to anchor the eye, most of them small.
        var roll = rand(d, 6);
        var scale = roll > 0.92 ? 1.9 : roll > 0.62 ? 1.25 : 0.8;
        var size2 = Math.round((16 + rand(d, 7) * 18) * scale);
        html +=
          '<svg class="pond-decor" style="' +
          'left:' + (rand(d, 1) * worldW).toFixed(0) + 'px;' +
          'top:' + (rand(d, 2) * worldH).toFixed(0) + 'px;' +
          'width:' + size2 + 'px;height:' + size2 + 'px;' +
          'opacity:' + (0.5 + rand(d, 3) * 0.45).toFixed(2) + '">' +
          '<use href="#qpx-' + kind + '"></use></svg>';
      }

      world.innerHTML = html;

      pads = placed.map(function (p) {
        return {
          el: world.querySelector('[data-pad="' + p.i + '"]'),
          event: p.event,
          x: p.x,
          y: p.y,
          w: padW,
          h: padH
        };
      });

      critters = [];
      var LIVES = [
        'fish', 'fish', 'fish', 'fish', 'fish',
        'dragonfly', 'dragonfly', 'dragonfly',
        'frog', 'frog', 'turtle', 'turtle'
      ];
      var frogs = 0;
      LIVES.forEach(function (kind, n) {
        var over = kind === 'dragonfly' || kind === 'frog';
        var size3 = duckSize * (kind === 'turtle' ? 0.62
          : kind === 'frog' ? 0.5
          : kind === 'dragonfly' ? 0.46 : 0.52);
        var holder2 = document.createElement('div');
        holder2.innerHTML =
          '<svg class="pond-haz pond-critter' + (over ? ' is-over' : '') +
          '" width="' + size3.toFixed(0) + '" height="' + size3.toFixed(0) +
          '" viewBox="0 0 16 16"><use href="#qpx-' + kind + '"></use></svg>';
        var el2 = holder2.firstChild;
        world.appendChild(el2);

        var beast = {
          el: el2,
          kind: kind,
          r: size3 * 0.5,
          x: rand(n, 21) * worldW,
          y: rand(n, 22) * worldH,
          speed: (kind === 'turtle' ? 0.42 : kind === 'dragonfly' ? 2.1 : 0.9) *
                 (duckSize / 52)
        };

        if (kind === 'frog') {
          var spot2 = frogSpots[frogs++ % Math.max(1, frogSpots.length)];
          beast.from = { x: spot2.a.x, y: spot2.a.y };
          beast.to = { x: spot2.b.x, y: spot2.b.y };
          beast.t = 0;
          beast.wait = Math.round(rand(n, 25) * 90);
          beast.x = beast.from.x;
          beast.y = beast.from.y;
        } else if (kind === 'dragonfly') {
          beast.tx = rand(n, 26) * worldW;
          beast.ty = rand(n, 27) * worldH;
        } else {
          var dir = rand(n, 28) * Math.PI * 2;
          beast.vx = Math.cos(dir) * beast.speed;
          beast.vy = Math.sin(dir) * beast.speed * 0.5;
          beast.wobble = rand(n, 29) * 6.28;
        }
        critters.push(beast);
      });

      // Sharks patrol; the squid drifts. One more of each as the pond grows.
      hazards = [];
      var count = 5;
      for (var h = 0; h < count; h++) {
        var kind = HAZARDS[h % HAZARDS.length];
        var big = kind === 'shark';
        var size = duckSize * (big ? 1.55 : 1.15);
        var holder = document.createElement('div');
        holder.innerHTML =
          '<svg class="pond-haz" width="' + size.toFixed(0) + '" height="' +
          (size * (big ? 0.67 : 1.12)).toFixed(0) + '" viewBox="0 0 ' +
          (big ? '24 16' : '16 18') + '"><use href="#qpx-' + kind + '"></use></svg>';
        var el = holder.firstChild;
        world.appendChild(el);
        var speed = (big ? 1.5 : 0.85) * (duckSize / 52);
        hazards.push({
          el: el,
          kind: kind,
          speed: speed,
          x: (worldW / (count + 1)) * (h + 1),
          y: (worldH / (count + 1)) * ((h * 2 + 1) % (count + 1) + 0.5),
          vx: h % 2 ? speed : -speed,
          vy: (h % 3 - 1) * speed * 0.55,
          r: size * 0.38
        });
      }
      pads.forEach(function (p) {
        if (found[p.event.name]) p.el.classList.add('is-found');
      });

      if (totalEl) totalEl.textContent = events.length;
      if (!duckX && !duckY) {
        duckX = worldW / 2;
        duckY = Math.min(140, worldH / 2);
      }
      draw(true);
    }

    // measured again after posters land, since a pad's height depends on them
    function relayout() {
      var keepX = duckX, keepY = duckY;
      layout();
      duckX = keepX || duckX;
      duckY = keepY || duckY;
      wake();
    }

    function ripple() {
      var now = Date.now();
      if (now - lastRipple < 260 || ripples.length > 3) return;
      lastRipple = now;
      var el = document.createElement('div');
      el.className = 'pond-ripple';
      el.style.width = (duckSize * 1.4).toFixed(0) + 'px';
      el.style.height = (duckSize * 0.45).toFixed(0) + 'px';
      el.style.left = (duckX - camX - duckSize * 0.7).toFixed(0) + 'px';
      el.style.top = (duckY - camY - duckSize * 0.1).toFixed(0) + 'px';
      pond.appendChild(el);
      ripples.push(el);
      window.setTimeout(function () {
        ripples.shift();
        el.remove();
      }, 1400);
    }

    /** Caught. Everything sinks again and the tally goes back to nothing. */
    function bitten() {
      if (!foundCount) return;
      found = {};
      foundCount = 0;
      if (countEl) countEl.textContent = '0';
      pads.forEach(function (p) {
        p.el.classList.remove('is-found', 'is-here');
      });
      here = null;
      card.classList.remove('is-on');
      if (prize) prize.classList.remove('is-up');
      // A belly-up duck left behind at the spot, so the loss is visible rather
      // than just a number resetting. It is its own element: the live duck's
      // transform is driven by custom properties every frame, and a keyframe
      // animation on the same property would fight it.
      var ghost = document.createElement('img');
      ghost.className = 'pond-dead';
      ghost.src = duck.getAttribute('src');
      ghost.alt = '';
      ghost.style.left = Math.round(duckX - camX) + 'px';
      ghost.style.top = Math.round(duckY - camY) + 'px';
      ghost.style.width = duckSize + 'px';
      pond.appendChild(ghost);
      window.setTimeout(function () { ghost.remove(); }, 1100);

      duck.classList.add('is-gone');
      window.setTimeout(function () {
        // back in at a corner of the world, away from whatever ate it
        duckX = worldW * 0.12;
        duckY = worldH * 0.12;
        vx = vy = 0;
        draw(true);
        duck.classList.remove('is-gone');
      }, 750);

      pond.classList.add('is-bitten');
      var tally = document.querySelector('.pond-found');
      if (tally) tally.classList.add('is-lost');
      window.setTimeout(function () {
        pond.classList.remove('is-bitten');
        if (tally) tally.classList.remove('is-lost');
      }, 700);
    }

    /**
     * One style write per creature — three separate custom properties meant
     * three style resolutions per element per frame, and a single transform
     * string is one.
     *
     * Every creature is written every frame, on purpose. Skipping the ones off
     * screen sounded free and was not: the element simply kept whatever
     * transform it was last given, so it sat frozen at the edge of the view
     * and then jumped to its real position the moment it came back. That was
     * the popping — the simulation never stopped, only the browser's idea of
     * where things were.
     *
     * Sub-pixel on purpose: rounding to whole pixels quantises movement to the
     * frames that happen to cross an integer, which is what made the turtle
     * stutter at 0.3px a frame rather than glide.
     */
    function place(b) {
      b.el.style.transform =
        'translate3d(' + (b.x - b.r).toFixed(2) + 'px,' +
        (b.y - b.r).toFixed(2) + 'px,0) scaleX(' + (b.face || 1) + ')';
    }

    /** Fish drift, dragonflies dart, frogs hop pad to pad. Nothing here bites. */
    function moveCritters(now) {
      for (var i = 0; i < critters.length; i++) {
        var b = critters[i];

        if (b.kind === 'frog') {
          if (b.wait > 0) {
            b.wait -= 1;
          } else {
            b.t += 0.022;
            if (b.t >= 1) {
              b.t = 0;
              var swap = b.from; b.from = b.to; b.to = swap;
              b.wait = 60 + Math.round(rand(i, 31) * 90);
            }
          }
          var t = b.t;
          b.x = b.from.x + (b.to.x - b.from.x) * t;
          // the hop itself: an arc over the water between the two pads
          var span2 = Math.abs(b.to.x - b.from.x);
          b.y = b.from.y + (b.to.y - b.from.y) * t -
                Math.sin(Math.PI * t) * Math.max(duckSize * 0.5, span2 * 0.55);
          b.face = b.to.x < b.from.x ? -1 : 1;
        } else if (b.kind === 'dragonfly') {
          var dx2 = b.tx - b.x;
          var dy2 = b.ty - b.y;
          var d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (d2 < b.speed * 3) {
            b.tx = rand(i + now % 997, 32) * worldW;
            b.ty = rand(i + now % 997, 33) * worldH;
          } else {
            b.x += (dx2 / d2) * b.speed;
            b.y += (dy2 / d2) * b.speed;
            b.face = dx2 < 0 ? -1 : 1;
          }
        } else {
          b.wobble += 0.04;
          b.x += b.vx;
          b.y += b.vy + Math.sin(b.wobble) * 0.35;
          if (b.x < b.r || b.x > worldW - b.r) { b.vx *= -1; b.x += b.vx * 2; }
          if (b.y < b.r || b.y > worldH - b.r) { b.vy *= -1; b.y += b.vy * 2; }
          b.face = b.vx < 0 ? -1 : 1;
        }

        place(b);
      }
    }

    function moveHazards() {
      for (var i = 0; i < hazards.length; i++) {
        var h = hazards[i];

        // Within a few duck-lengths they notice you and turn to follow. Beyond
        // that they carry on patrolling and pay no attention at all.
        var seeX = duckX - h.x;
        var seeY = duckY - h.y;
        var seen = Math.sqrt(seeX * seeX + seeY * seeY);
        var range = duckSize * (h.kind === 'shark' ? 4.5 : 3);

        if (seen < range && seen > 1) {
          var pull = h.kind === 'shark' ? 0.09 : 0.05;
          h.vx += (seeX / seen) * h.speed * pull;
          h.vy += (seeY / seen) * h.speed * pull;
          // keep the chase from outrunning the duck entirely
          var top = h.speed * 1.5;
          var now2 = Math.sqrt(h.vx * h.vx + h.vy * h.vy);
          if (now2 > top) { h.vx = h.vx / now2 * top; h.vy = h.vy / now2 * top; }
          h.el.classList.add('is-hunting');
        } else {
          h.el.classList.remove('is-hunting');
        }

        h.x += h.vx;
        h.y += h.vy;
        // turn at the edges of the world rather than leaving it
        if (h.x < h.r || h.x > worldW - h.r) { h.vx *= -1; h.x += h.vx * 2; }
        if (h.y < h.r || h.y > worldH - h.r) { h.vy *= -1; h.y += h.vy * 2; }

        h.face = h.vx < 0 ? -1 : 1;
        place(h);

        var dx = h.x - duckX;
        var dy = h.y - duckY;
        var reach = h.r + rad;
        if (dx * dx + dy * dy < reach * reach) {
          bitten();
          // shove the duck clear, so one brush is not an instant second bite
          var away = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          vx -= (dx / away) * duckSize * 0.4;
          vy -= (dy / away) * duckSize * 0.4;
        }
      }
    }

    /**
     * Turn the ripples on for the pads in view and off for the rest. The flag
     * is kept per pad so a frame where nothing crossed the edge writes no DOM
     * at all — twenty classList calls every frame would cost more than the
     * animations they are meant to save.
     */
    function markVisible() {
      var pad2 = padW;
      for (var i = 0; i < pads.length; i++) {
        var p = pads[i];
        var seen =
          p.x + p.w > camX - pad2 && p.x < camX + viewW + pad2 &&
          p.y + p.h > camY - pad2 && p.y < camY + viewH + pad2;
        if (seen !== p.near) {
          p.near = seen;
          p.el.classList.toggle('in-view', seen);
        }
      }
    }

    function setHere(pad) {
      if (pad === here) return;
      if (here) here.el.classList.remove('is-here');
      here = pad;
      if (!pad) {
        card.classList.remove('is-on');
        return;
      }
      pad.el.classList.add('is-here');
      pad.el.classList.add('is-found');
      if (!found[pad.event.name]) {
        found[pad.event.name] = true;
        foundCount++;
        if (countEl) countEl.textContent = foundCount;
        // the whole pond: the name comes up out of the water
        if (prize && foundCount >= events.length) prize.classList.add('is-up');
      }
      cardName.textContent = pad.event.name;
      cardMeta.textContent = metaLine(pad.event) || 'Details to come';
      card.classList.add('is-on');
      if (hint) hint.style.display = 'none';
    }

    function draw(force) {
      var wx = Math.round(-camX);
      var wy = Math.round(-camY);
      var key = wx + ',' + wy;
      if (force || key !== lastWorld) {
        lastWorld = key;
        world.style.transform = 'translate3d(' + wx + 'px,' + wy + 'px,0)';
      }
      // The camera holds the duck in the middle, so its position on screen
      // barely changes — which is why the facing has to be part of the same
      // check and not nested inside a "has it moved?" one, where it almost
      // never ran.
      var dx = Math.round(duckX - camX);
      var dy = Math.round(duckY - camY);
      var face = vx < -0.25 ? -1 : vx > 0.25 ? 1 : lastFace || 1;
      var dkey = dx + ',' + dy + ',' + face;
      if (force || dkey !== lastDuck) {
        lastDuck = dkey;
        lastFace = face;
        duck.style.transform =
          'translate3d(' + dx + 'px,' + dy + 'px,0) scaleX(' + face + ')';
      }
    }

    /**
     * Nothing runs unless the pond is on screen, the window has focus and no
     * details window is up. Sharks patrolling a tab nobody is looking at is
     * wasted battery, and coming back to a duck that drifted off while you
     * were elsewhere is worse than coming back to one that waited.
     */
    function live() {
      return awake && focused && !modalOpen;
    }

    function pause() {
      focused = false;
      held = {};
      pointer = null;
      vx = vy = 0;
      pond.classList.add('is-paused');
    }

    function resume() {
      focused = true;
      pond.classList.remove('is-paused');
      wake();
    }

    function step() {
      running = false;
      if (!live()) {
        pond.classList.toggle('is-paused', !focused || modalOpen);
        return;
      }

      var thrust = duckSize * 0.045;
      if (held.left) vx -= thrust;
      if (held.right) vx += thrust;
      if (held.up) vy -= thrust;
      if (held.down) vy += thrust;

      if (pointer) {
        // Swim toward wherever the finger is, easing off as it arrives so it
        // settles instead of jittering around the target.
        var tx = pointer.x + camX - duckX;
        var ty = pointer.y + camY - duckY;
        var dist = Math.sqrt(tx * tx + ty * ty);
        if (dist > rad) {
          vx += (tx / dist) * thrust;
          vy += (ty / dist) * thrust;
        }
      }

      vx *= 0.9;
      vy *= 0.9;

      var nx = Math.max(rad, Math.min(worldW - rad, duckX + vx));
      var ny = Math.max(rad, Math.min(worldH - rad, duckY + vy));

      // Pads are solid. Resolve along the shallowest overlap so the duck slides
      // along an edge rather than sticking to it.
      var touching = null;
      for (var i = 0; i < pads.length; i++) {
        var p = pads[i];
        var reach = rad + 26;
        if (nx + reach > p.x && nx - reach < p.x + p.w &&
            ny + reach > p.y && ny - reach < p.y + p.h) {
          touching = p;
        }
        if (nx + rad <= p.x || nx - rad >= p.x + p.w ||
            ny + rad <= p.y || ny - rad >= p.y + p.h) continue;

        var dl = nx + rad - p.x;
        var dr = p.x + p.w - (nx - rad);
        var dt = ny + rad - p.y;
        var db = p.y + p.h - (ny - rad);
        var least = Math.min(dl, dr, dt, db);
        if (least === dl) { nx = p.x - rad; vx = Math.min(vx, 0); }
        else if (least === dr) { nx = p.x + p.w + rad; vx = Math.max(vx, 0); }
        else if (least === dt) { ny = p.y - rad; vy = Math.min(vy, 0); }
        else { ny = p.y + p.h + rad; vy = Math.max(vy, 0); }
      }

      var moved = Math.abs(nx - duckX) + Math.abs(ny - duckY);
      duckX = nx;
      duckY = ny;

      // The camera keeps the duck in the middle, and stops at the world's edge
      // so you never see past the pond.
      camX = Math.max(0, Math.min(worldW - viewW, duckX - viewW / 2));
      camY = Math.max(0, Math.min(worldH - viewH, duckY - viewH / 2));

      var now = Date.now();
      moveCritters(now);
      moveHazards();
      markVisible();
      draw(false);
      setHere(touching);
      if (moved > 0.6) ripple();

      // The wildlife never stops, so the loop runs for as long as the pond is
      // live. It is one transform write per creature, and nothing else.
      if (live()) wake();
    }

    function wake() {
      if (running) return;
      running = true;
      window.requestAnimationFrame(step);
    }

    // ---- input ----

    var KEYS = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right'
    };

    window.addEventListener('keydown', function (e) {
      var dir = KEYS[e.key];
      if (!dir || !awake) return;
      e.preventDefault();
      held[dir] = true;
      wake();
    });
    window.addEventListener('keyup', function (e) {
      var dir = KEYS[e.key];
      if (dir) { held[dir] = false; wake(); }
    });

    pond.querySelectorAll('[data-dir]').forEach(function (btn) {
      var dir = btn.dataset.dir;
      function on(e) { e.preventDefault(); btn.classList.add('is-held'); held[dir] = true; wake(); }
      function off() { btn.classList.remove('is-held'); held[dir] = false; wake(); }
      btn.addEventListener('pointerdown', on);
      btn.addEventListener('pointerup', off);
      btn.addEventListener('pointerleave', off);
      btn.addEventListener('pointercancel', off);
    });

    function pointAt(e) {
      var box = pond.getBoundingClientRect();
      pointer = { x: e.clientX - box.left, y: e.clientY - box.top };
    }
    pond.addEventListener('pointerdown', function (e) {
      // Anything that is a control rather than water keeps its own clicks.
      if (e.target.closest('[data-dir], .pond-card, .pond-hud')) return;
      pond.setPointerCapture(e.pointerId);
      pointAt(e);
      wake();
    });
    pond.addEventListener('pointermove', function (e) {
      if (pointer) { pointAt(e); wake(); }
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (type) {
      pond.addEventListener(type, function () { pointer = null; wake(); });
    });

    if (cardOpen) {
      cardOpen.addEventListener('click', function () {
        if (here) openModal(here.event);
      });
    }
    world.addEventListener('click', function (e) {
      var padEl = e.target.closest('[data-pad]');
      if (padEl) openModal(events[Number(padEl.dataset.pad)]);
    });

    // ---- wiring ----

    var fullBtn = document.getElementById('pond-full');
    if (fullBtn && wrap) {
      fullBtn.addEventListener('click', function () {
        var on = document.fullscreenElement || document.webkitFullscreenElement;
        if (on) {
          (document.exitFullscreen || document.webkitExitFullscreen).call(document);
          return;
        }
        var ask = wrap.requestFullscreen || wrap.webkitRequestFullscreen;
        if (!ask) return;
        var out = ask.call(wrap);
        if (out && out.catch) out.catch(function () {});
      });
      function onFull() {
        var on = (document.fullscreenElement || document.webkitFullscreenElement) === wrap;
        fullBtn.innerHTML = on
          ? '<i class="fas fa-compress"></i>'
          : '<i class="fas fa-expand"></i>';
        // the viewport just changed shape; rebuild the pond around it
        relayout();
      }
      document.addEventListener('fullscreenchange', onFull);
      document.addEventListener('webkitfullscreenchange', onFull);
    }

    // tab hidden, window blurred, or focus moved to something else on the page
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pause();
      else resume();
    });
    window.addEventListener('blur', pause);
    window.addEventListener('focus', resume);

    // so closing the details window can start it again
    window.QuacksPond = { wake: wake };

    window.addEventListener('resize', relayout);
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        // Nothing runs while the pond is off screen — scroll down to the
        // docket and the sharks stop swimming until you come back.
        awake = entries[0].isIntersecting;
        pond.classList.toggle('is-paused', !awake);
        if (awake) wake();
        // a sliver of pond clinging to the edge is not worth simulating
      }, { rootMargin: '-8% 0px', threshold: 0 }).observe(pond);
    } else {
      awake = true;
    }

    // No re-measuring when the posters arrive: a pad's box is decided up
    // front, so a late image changes nothing about the layout or the
    // collisions. Only a resize needs the pond rebuilt.
    layout();
  }

  // --- the details window --------------------------------------------------

  function detailRow(label, value, isLink) {
    if (!value) return '';
    var body = isLink
      ? '<a href="' + escapeHtml(value) + '" target="_blank" rel="noopener noreferrer">' +
        'Open the registration form <i class="fas fa-arrow-up-right-from-square"></i></a>'
      : escapeHtml(value);
    return '' +
      '<div class="quack-detail">' +
      '  <span class="quack-detail-label">' + label + '</span>' +
      '  <span class="quack-detail-value">' + body + '</span>' +
      '</div>';
  }

  // The pond watches this: a details window is somewhere else to be looking.
  var modalOpen = false;

  function openModal(event) {
    var modal = document.getElementById('quack-modal');
    var body = document.getElementById('quack-modal-body');

    body.innerHTML = '' +
      '<div class="quack-modal-grid">' +
      (event.full
        ? '<div class="quack-modal-poster">' +
          '<img src="' + escapeHtml(event.full) + '" alt="' +
          escapeHtml(event.name) + ' poster" />' +
          '</div>'
        : '') +
      '  <div class="quack-modal-side">' +
      '    <h3 class="quack-modal-title">' + escapeHtml(event.name) + '</h3>' +
      (event.details
        ? '<p class="quack-modal-text">' + escapeHtml(event.details) + '</p>'
        : '') +
      detailRow('When', event.timing) +
      detailRow('Where', event.venue) +
      detailRow('Guest / judge', event.speaker) +
      detailRow('Register by', event.lastDate) +
      detailRow('Registration', event.register, true) +
      '  </div>' +
      '</div>';

    modalOpen = true;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    document.getElementById('quack-modal-close').focus();
  }

  function closeModal() {
    modalOpen = false;
    document.getElementById('quack-modal').classList.remove('is-open');
    document.body.style.overflow = '';
    if (window.QuacksPond) window.QuacksPond.wake();
  }

  function wireCards(events) {
    document.querySelectorAll('.quack-lane-card').forEach(function (card) {
      function open() {
        openModal(events[Number(card.dataset.event)]);
      }
      card.addEventListener('click', open);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });
  }

  function wireModal() {
    var modal = document.getElementById('quack-modal');
    if (!modal) return;
    document.getElementById('quack-modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });
  }

  function init() {
    var baseurl = window.QUACKS_BASEURL || '';

    QuarksSheets.load('quacks')
      .then(function (rows) {
        var events = rows.map(toEvent).filter(function (e) { return e.name; });
        start(events.length ? events : demoEvents(baseurl));
      })
      .catch(function (e) {
        if (!e.notConnected) console.error('Failed to load Quacks events:', e);
        start(demoEvents(baseurl));
      });
  }

  function start(events) {
    renderTable(events);
    wirePond(events);
    wireModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

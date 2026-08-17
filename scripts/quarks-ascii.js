/* =============================================================================
 * quarks-ascii.js
 * -----------------------------------------------------------------------------
 * Interactive ASCII rendering of the QUARKS logo for the Quarks magazine site.
 *
 * The real logo PNG is sampled into a coarse height-field, so the ASCII glyphs
 * trace the actual letterforms (slashed Q, rounded U, triangular A …). A slowly
 * orbiting light shades that height-field every frame for a 3-D embossed look.
 *
 * On top of that base sit five toggleable effects (⋮ menu, top-right):
 *   • ripple      — water ripples that follow the cursor / splash on click
 *   • livingText  — the letters are woven from REAL post titles (a living
 *                   masthead), gently scrolling like a printing ribbon
 *   • tilt        — the whole plate tilts in perspective toward the cursor
 *   • burst       — clicking fires a "quark collision": glyph-particles scatter
 *                   outward and reform (on-theme for a science magazine)
 *   • reveal      — on first scroll-in the letters ink-bloom into existence
 *
 * No build step, no dependencies. Auto-initialises every element carrying the
 * `data-quarks-ascii` attribute. Choices persist in localStorage.
 * ========================================================================== */
(function () {
  'use strict';

  /* ----------------------------- tunables --------------------------------- */
  var CONFIG = {
    // grid density for the standalone (non-fill) layout
    colsDesktop: 150,
    colsTablet: 110,
    colsMobile: 74,
    // target glyph size (px per cell) for the banner-fill layout
    cellDesktop: 8,
    cellTablet: 6,
    cellMobile: 5.4,
    mobileBreak: 560,    // below this width: solid glyphs (no living-text noise)
    // logo width as a fraction of banner width (wider on small screens)
    logoFracDesktop: 0.72,
    logoFracTablet: 0.8,
    logoFracMobile: 0.88,
    maxLogoPx: 1200,     // cap the logo width on ultrawide screens
    padX: 3,
    padYRatio: 0.4,

    charAspect: 0.56,
    maxWidth: 1180,

    extrude: 1.0,
    idleAmp: 0.13,
    lightSpeed: 0.55,
    steepness: 2.4,

    rippleFreq: 0.9,
    rippleOmega: 7.0,
    rippleDecay: 1.7,
    rippleDistFade: 0.05,
    rippleSpawnMs: 55,
    maxRipples: 18,
    hoverRamp: 3.2,

    pixShiftY: 0.85,
    pixShiftX: 0.45,

    inkThreshold: 0.16,
    bgGhost: 0.30,

    // living-masthead text
    streamScroll: 3.5,   // characters per second the ribbon scrolls

    // 3-D tilt
    tiltMax: 8,          // degrees
    tiltEase: 7,         // higher = snappier
    tiltPerspective: 950,

    // particle collision
    burstRadiusCells: 26,
    burstAmp: 7.0,       // px of scatter per cell of proximity
    burstMaxParticles: 240,
    burstTtl: [0.6, 1.05],

    // intro reveal
    revealDur: 1.5,      // seconds

    letterRamp: ' .·:-=+*x#%@█'.split('')
  };

  var BG_RAMP = [' ', '·', ':', '~', '*', '+'];
  // clean block-shade ramp for phones: solid, anti-aliased letterforms
  var MOBILE_RAMP = ' ░▒▓█'.split('');
  var FX_DEFAULTS = { ripple: false, livingText: true, tilt: true, burst: true, reveal: true };
  var FX_ITEMS = [
    { key: 'ripple', label: 'Ripple' },
    { key: 'livingText', label: 'Living text' },
    { key: 'tilt', label: '3-D tilt' },
    { key: 'burst', label: 'Click burst' },
    { key: 'reveal', label: 'Intro reveal' }
  ];
  var STYLE_FLAG = '__quarksAsciiStyles';

  /* ----------------------------- helpers ---------------------------------- */
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function frac(v) { return v - Math.floor(v); }
  function hash2(x, y) { return frac(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453); }

  // parse "rgb(…)" / "rgba(…)" / "#rgb" / "#rrggbb" into [r,g,b]
  function toRGB(str) {
    if (!str) return [128, 128, 128];
    str = str.trim();
    var m = str.match(/^rgba?\(([^)]+)\)/i);
    if (m) {
      var p = m[1].split(',');
      return [parseFloat(p[0]) || 0, parseFloat(p[1]) || 0, parseFloat(p[2]) || 0];
    }
    if (str.charAt(0) === '#') {
      var h = str.slice(1);
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var n = parseInt(h, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    return [128, 128, 128];
  }

  function loadFx() {
    var fx = {};
    for (var k in FX_DEFAULTS) fx[k] = FX_DEFAULTS[k];
    try {
      var saved = JSON.parse(window.localStorage.getItem('quarksAsciiFx') || '{}');
      for (var j in saved) if (j in fx) fx[j] = !!saved[j];
    } catch (e) { /* private mode / disabled storage — defaults are fine */ }
    return fx;
  }
  function saveFx(fx) {
    try { window.localStorage.setItem('quarksAsciiFx', JSON.stringify(fx)); } catch (e) {}
  }

  // inject the control-menu styles once for the whole page
  function injectStyles() {
    if (window[STYLE_FLAG]) return;
    window[STYLE_FLAG] = true;
    var css =
      '.quarks-ascii-wrap canvas{will-change:transform;}' +
      '.qa-controls{position:absolute;top:8px;right:8px;z-index:6;}' +
      '.qa-kebab{width:30px;height:30px;border-radius:50%;border:1px solid var(--card-border,rgba(140,140,140,.35));' +
      'background:var(--card-bg,rgba(25,25,25,.55));color:var(--text-color,#999);font-size:18px;line-height:1;' +
      'cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:.45;' +
      'transition:opacity .25s ease,transform .25s ease;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);}' +
      '.quarks-ascii-wrap:hover .qa-kebab{opacity:.85;}' +
      '.qa-kebab:hover,.qa-kebab[aria-expanded="true"]{opacity:1;transform:scale(1.08);}' +
      '.qa-panel{position:absolute;top:38px;right:0;min-width:178px;background:var(--card-bg,#1b1b1b);' +
      'border:1px solid var(--card-border,rgba(140,140,140,.35));border-radius:11px;padding:6px;' +
      'box-shadow:0 12px 34px rgba(0,0,0,.28);opacity:0;visibility:hidden;transform:translateY(-6px) scale(.98);' +
      'transform-origin:top right;transition:opacity .18s ease,transform .18s ease,visibility .18s;}' +
      '.qa-panel.open{opacity:1;visibility:visible;transform:translateY(0) scale(1);}' +
      '.qa-title{font-size:.66rem;letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted,#8a8a8a);' +
      'padding:6px 10px 7px;opacity:.85;}' +
      '.qa-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:7px 10px;' +
      'border-radius:7px;font-size:.83rem;color:var(--text-color,#dcdcdc);cursor:pointer;user-select:none;' +
      '-webkit-user-select:none;}' +
      '.qa-row:hover{background:rgba(140,140,140,.13);}' +
      '.qa-row input{width:15px;height:15px;accent-color:var(--heading-color,#888);cursor:pointer;margin:0;}' +
      '.qa-sep{height:1px;background:var(--card-border,rgba(140,140,140,.28));margin:5px 6px;}' +
      '.qa-action{display:block;width:100%;text-align:left;background:none;border:0;padding:7px 10px;' +
      'border-radius:7px;font-size:.83rem;color:var(--text-color,#dcdcdc);cursor:pointer;}' +
      '.qa-action:hover{background:rgba(140,140,140,.13);}';
    var el = document.createElement('style');
    el.textContent = css;
    document.head.appendChild(el);
  }

  /* =========================================================================
   * One instance per [data-quarks-ascii] element.
   * ===================================================================== */
  function QuarksAscii(root) {
    this.root = root;
    this.canvas = root.querySelector('canvas');
    if (!this.canvas) { this.canvas = document.createElement('canvas'); root.appendChild(this.canvas); }
    this.ctx = this.canvas.getContext('2d');
    this.src = root.getAttribute('data-src') || window.QUARKS_LOGO_SRC || '/assets/images/quarks_black.png';

    this.dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
    this.reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.fill = root.hasAttribute('data-fill'); // fill the whole container (banner)
    this.fx = loadFx();

    this.cols = 0; this.rows = 0;
    this.cellW = 0; this.cellH = 0; this.fontSize = 0;
    this.field = null; this.Z = null; this.streamIdx = null;
    this.logoX0 = 0; this.logoY0 = 0; this.logoCols = 0; this.logoRows = 0;

    this.stream = 'QUARKS';
    this.scrollOff = 0;

    this.ripples = [];
    this.particles = [];
    this.pointer = { x: -1, y: -1, inside: false };
    this.hoverEnergy = 0;
    this.lastSpawn = 0;

    this.tilt = { rx: 0, ry: 0, trx: 0, try_: 0 };

    this.revealActive = false;
    this.revealStart = 0;
    this.revealProgress = 1;
    this.hasEntered = false;

    this.startTime = 0; this.lastTs = 0; this.now = 0;
    this.rafId = 0; this.ready = false;

    this.ink = [0, 0, 0]; this.glow = [255, 255, 255];

    this.boundFrame = this.frame.bind(this);
    injectStyles();
    this.buildControls();
    this.loadImage();
    this.bindEvents();
  }

  /* --------------------------- image + grid ------------------------------- */
  QuarksAscii.prototype.loadImage = function () {
    var self = this;
    var img = new Image();
    img.decoding = 'async';
    img.onload = function () { self.image = img; self.imgOK = true; self.build(); self.boot(); };
    img.onerror = function () { self.imgOK = false; self.build(); self.boot(); };
    img.src = this.src;
  };

  QuarksAscii.prototype.targetCols = function (w) {
    if (w < 560) return CONFIG.colsMobile;
    if (w < 920) return CONFIG.colsTablet;
    return CONFIG.colsDesktop;
  };

  QuarksAscii.prototype.cellTarget = function (w) {
    if (w < 560) return CONFIG.cellMobile;
    if (w < 920) return CONFIG.cellTablet;
    return CONFIG.cellDesktop;
  };

  QuarksAscii.prototype.logoFraction = function (w) {
    if (w < 560) return CONFIG.logoFracMobile;
    if (w < 920) return CONFIG.logoFracTablet;
    return CONFIG.logoFracDesktop;
  };

  QuarksAscii.prototype.build = function () {
    var rect = this.root.getBoundingClientRect();
    var width = rect.width || this.root.clientWidth || 800;
    var height = rect.height || width * 0.42;
    if (!this.fill) width = Math.min(width, CONFIG.maxWidth);
    if (width < 80) { width = 800; height = 340; }
    // on phones the woven title text is illegible — render solid letterforms
    this.small = width < CONFIG.mobileBreak;

    var imgW = this.imgOK ? this.image.naturalWidth : 712;
    var imgH = this.imgOK ? this.image.naturalHeight : 167;

    if (this.fill) {
      // ---- fill the whole banner; logo sits centred with gaps ----
      this.cols = clamp(Math.round(width / this.cellTarget(width)), 50, 260);
      this.cellW = width / this.cols;
      this.cellH = this.cellW / CONFIG.charAspect;
      this.rows = Math.max(10, Math.round(height / this.cellH));

      var ratio = (this.cellW / this.cellH) * (imgH / imgW); // logoRows per logoCol
      var capCols = Math.round(CONFIG.maxLogoPx / this.cellW);
      this.logoCols = clamp(Math.min(Math.round(this.cols * this.logoFraction(width)), capCols), 12, this.cols - 4);
      this.logoRows = Math.max(4, Math.round(this.logoCols * ratio));
      var maxLogoRows = this.rows - 6;
      if (maxLogoRows > 5 && this.logoRows > maxLogoRows) {
        this.logoRows = maxLogoRows;
        this.logoCols = Math.round(this.logoRows / ratio);
      }
      this.logoX0 = Math.round((this.cols - this.logoCols) / 2);
      this.logoY0 = Math.round((this.rows - this.logoRows) / 2);
    } else {
      // ---- standalone: canvas wraps tightly around the logo ----
      this.cols = this.targetCols(width);
      this.cellW = width / this.cols;
      this.cellH = this.cellW / CONFIG.charAspect;
      this.logoCols = this.cols - CONFIG.padX * 2;
      this.logoRows = Math.max(4, Math.round(this.logoCols * (this.cellW / this.cellH) * (imgH / imgW)));
      var padY = Math.max(3, Math.round(this.logoRows * CONFIG.padYRatio));
      this.rows = this.logoRows + padY * 2;
      this.logoX0 = CONFIG.padX;
      this.logoY0 = padY;
    }
    this.fontSize = this.cellH * 0.96;

    var cssW = this.cols * this.cellW, cssH = this.rows * this.cellH;
    this.canvas.style.width = cssW + 'px';
    this.canvas.style.height = cssH + 'px';
    this.canvas.width = Math.round(cssW * this.dpr);
    this.canvas.height = Math.round(cssH * this.dpr);

    this.field = new Float32Array(this.cols * this.rows);
    this.Z = new Float32Array(this.cols * this.rows);
    this.sample(imgW, imgH);
    this.indexStream();
    this.buildStream();
    this.readColors();
    this.configCtx();
  };

  QuarksAscii.prototype.sample = function () {
    var off = document.createElement('canvas');
    off.width = this.logoCols; off.height = this.logoRows;
    var octx = off.getContext('2d');
    octx.clearRect(0, 0, off.width, off.height);

    if (this.imgOK) {
      octx.drawImage(this.image, 0, 0, this.logoCols, this.logoRows);
    } else {
      octx.fillStyle = '#000';
      octx.font = '900 ' + Math.floor(this.logoRows * 0.82) + 'px Arial, sans-serif';
      octx.textAlign = 'center'; octx.textBaseline = 'middle';
      octx.fillText('QUARKS', this.logoCols / 2, this.logoRows / 2);
    }

    var data = null;
    try { data = octx.getImageData(0, 0, this.logoCols, this.logoRows).data; } catch (e) { data = null; }
    if (!data) return;

    for (var gy = 0; gy < this.logoRows; gy++) {
      for (var gx = 0; gx < this.logoCols; gx++) {
        var i = (gy * this.logoCols + gx) * 4;
        var a = data[i + 3] / 255;
        var lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
        this.field[(this.logoY0 + gy) * this.cols + (this.logoX0 + gx)] = a * (1 - lum);
      }
    }
  };

  // give every letter-cell a sequential index (reading order) for the ribbon
  QuarksAscii.prototype.indexStream = function () {
    this.streamIdx = new Int32Array(this.cols * this.rows);
    var c = 0;
    for (var y = 0; y < this.rows; y++) {
      for (var x = 0; x < this.cols; x++) {
        var i = y * this.cols + x;
        this.streamIdx[i] = (this.field[i] > CONFIG.inkThreshold) ? c++ : -1;
      }
    }
    this.letterCount = c;
  };

  QuarksAscii.prototype.getWords = function () {
    var w = window.QUARKS_WORDS;
    if (!Array.isArray(w) || !w.length) {
      try { w = JSON.parse(this.root.getAttribute('data-words') || ''); } catch (e) { w = null; }
    }
    if (!Array.isArray(w) || !w.length) {
      w = ['QUARKS', 'The undergraduate magazine of IISc', 'stories', 'poems', 'pictures', 'crosswords', 'newsletters'];
    }
    return w.filter(function (s) { return typeof s === 'string' && s.length; });
  };

  QuarksAscii.prototype.buildStream = function () {
    var s = this.getWords().join('  ·  ').toUpperCase().replace(/\s/g, '·');
    this.stream = s.length ? s : 'QUARKS';
  };

  QuarksAscii.prototype.configCtx = function () {
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.font = '700 ' + this.fontSize.toFixed(2) +
      'px "JetBrains Mono","Fira Code","SFMono-Regular",Menlo,Consolas,monospace';
    this.ctx.textBaseline = 'middle';
    this.ctx.textAlign = 'center';
  };

  QuarksAscii.prototype.readColors = function () {
    // explicit overrides win — used to stay light over the photo banner
    var inkAttr = this.root.getAttribute('data-ink');
    if (inkAttr) {
      this.ink = toRGB(inkAttr);
      this.glow = toRGB(this.root.getAttribute('data-glow') || inkAttr);
      return;
    }
    var cs = getComputedStyle(this.root);
    var text = cs.getPropertyValue('--text-color') || getComputedStyle(document.body).color || '#343a40';
    var head = cs.getPropertyValue('--heading-color') || text;
    this.ink = toRGB(text);
    this.glow = toRGB(head);
  };

  /* ------------------------------ ripples --------------------------------- */
  QuarksAscii.prototype.addRipple = function (cx, cy, strength) {
    this.ripples.push({ x: cx, y: cy, t: this.now, s: strength });
    if (this.ripples.length > CONFIG.maxRipples) this.ripples.shift();
  };

  QuarksAscii.prototype.waveAt = function (x, y) {
    var t = this.now, ax = CONFIG.charAspect, w = 0;
    // ambient shimmer keeps the surface alive even when idle
    w += CONFIG.idleAmp * Math.sin(x * 0.20 + t * 0.9) * Math.sin(y * 0.33 - t * 0.7);
    if (!this.fx.ripple) return w;

    if (this.hoverEnergy > 0.001) {
      var dxh = (x - this.pointer.x) * ax, dyh = (y - this.pointer.y);
      var dh = Math.sqrt(dxh * dxh + dyh * dyh);
      w += Math.sin(dh * CONFIG.rippleFreq - t * CONFIG.rippleOmega) * Math.exp(-dh * 0.07) * 0.6 * this.hoverEnergy;
    }
    for (var k = 0; k < this.ripples.length; k++) {
      var r = this.ripples[k], age = t - r.t;
      var dx = (x - r.x) * ax, dy = (y - r.y);
      var d = Math.sqrt(dx * dx + dy * dy);
      var env = Math.exp(-age * CONFIG.rippleDecay) / (1 + d * CONFIG.rippleDistFade);
      w += Math.sin(d * CONFIG.rippleFreq - age * CONFIG.rippleOmega) * env * r.s;
    }
    return w;
  };

  /* ---------------------------- particle burst ---------------------------- */
  QuarksAscii.prototype.spawnBurst = function (cx, cy) {
    if (!this.fx.burst) return;
    var R = CONFIG.burstRadiusCells, ax = CONFIG.charAspect;
    var x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(this.cols - 1, Math.ceil(cx + R));
    var y0 = Math.max(0, Math.floor(cy - R / ax)), y1 = Math.min(this.rows - 1, Math.ceil(cy + R / ax));
    var added = 0;
    for (var y = y0; y <= y1; y++) {
      for (var x = x0; x <= x1; x++) {
        var i = y * this.cols + x;
        if (this.field[i] <= CONFIG.inkThreshold) continue;
        if (this.particles.length + added >= CONFIG.burstMaxParticles) break;
        var dx = (x - cx) * ax, dy = (y - cy);
        var d = Math.sqrt(dx * dx + dy * dy) || 0.001;
        if (d > R) continue;
        var prox = 1 - d / R;                         // closer to the hit = bigger throw
        var jitter = hash2(x, y) * 6.283;
        var dirx = dx / d + Math.cos(jitter) * 0.5;
        var diry = dy / d + Math.sin(jitter) * 0.5;
        var amp = prox * CONFIG.burstAmp * this.cellH * (0.6 + hash2(y, x) * 0.8);
        var ttl = CONFIG.burstTtl[0] + hash2(x + 7, y) * (CONFIG.burstTtl[1] - CONFIG.burstTtl[0]);
        this.particles.push({
          gx: x, gy: y, dirx: dirx, diry: diry, amp: amp, t: this.now, ttl: ttl
        });
        added++;
      }
    }
  };

  QuarksAscii.prototype.glyphForCell = function (i) {
    if (this.fx.livingText && !this.small && this.stream.length && this.streamIdx[i] >= 0) {
      return this.stream.charAt((this.streamIdx[i] + this.scrollOff) % this.stream.length);
    }
    return null; // caller falls back to the brightness ramp
  };

  /* ------------------------------- reveal --------------------------------- */
  QuarksAscii.prototype.startReveal = function () {
    if (this.reduceMotion) { this.revealActive = false; this.revealProgress = 1; return; }
    this.revealActive = true;
    this.revealStart = this.now;
    this.revealProgress = 0;
  };
  // 0..1 visibility for a cell during the ink-bloom intro
  QuarksAscii.prototype.revealK = function (x, y) {
    if (!this.revealActive || this.revealProgress >= 1) return 1;
    var th = (x / this.cols) * 0.55 + hash2(x, y) * 0.28;
    return clamp((this.revealProgress - th) / 0.2, 0, 1);
  };

  /* --------------------------- the render loop ---------------------------- */
  QuarksAscii.prototype.boot = function () {
    if (this.ready) return;
    this.ready = true;
    if (this.reduceMotion) { this.now = 0.6; this.renderStatic(); return; }
    var self = this;
    this.rafId = requestAnimationFrame(function (ts) { self.startTime = ts; self.boundFrame(ts); });
    // if the section was already in view before the image finished loading,
    // (or there's no IntersectionObserver) kick off the intro reveal now
    if (this.fx.reveal && (this.hasEntered || !('IntersectionObserver' in window))) this.startReveal();
  };

  QuarksAscii.prototype.frame = function (ts) {
    this.rafId = requestAnimationFrame(this.boundFrame);
    // throttle to ~30fps on phones to save battery / avoid heat (desktop stays 60)
    if (this.small) {
      if (this._lastDraw && ts - this._lastDraw < 32) return;
      this._lastDraw = ts;
    }
    var dt = Math.min(0.05, (ts - (this.lastTs || ts)) / 1000);
    this.lastTs = ts;
    this.now = (ts - this.startTime) / 1000;
    this.scrollOff = Math.floor(this.now * CONFIG.streamScroll);

    var target = this.pointer.inside ? 1 : 0;
    this.hoverEnergy += (target - this.hoverEnergy) * Math.min(1, CONFIG.hoverRamp * dt);

    this.updateTilt(dt);

    for (var k = this.ripples.length - 1; k >= 0; k--)
      if (this.now - this.ripples[k].t > 4.2) this.ripples.splice(k, 1);
    for (var p = this.particles.length - 1; p >= 0; p--)
      if (this.now - this.particles[p].t > this.particles[p].ttl) this.particles.splice(p, 1);

    if (this.revealActive && this.revealProgress < 1)
      this.revealProgress = clamp((this.now - this.revealStart) / CONFIG.revealDur, 0, 1);

    this.render();
  };

  QuarksAscii.prototype.updateTilt = function (dt) {
    if (this.reduceMotion) return;
    var on = this.fx.tilt && this.pointer.inside;
    if (!on) { this.tilt.trx = 0; this.tilt.try_ = 0; }
    var e = Math.min(1, CONFIG.tiltEase * dt);
    this.tilt.rx += (this.tilt.trx - this.tilt.rx) * e;
    this.tilt.ry += (this.tilt.try_ - this.tilt.ry) * e;
    if (Math.abs(this.tilt.rx) < 0.01 && Math.abs(this.tilt.ry) < 0.01 && !on) {
      this.canvas.style.transform = '';
    } else {
      this.canvas.style.transform = 'perspective(' + CONFIG.tiltPerspective + 'px) rotateX(' +
        this.tilt.rx.toFixed(2) + 'deg) rotateY(' + this.tilt.ry.toFixed(2) + 'deg)';
    }
  };

  QuarksAscii.prototype.buildZ = function () {
    var cols = this.cols, rows = this.rows, Z = this.Z, F = this.field;
    for (var y = 0; y < rows; y++)
      for (var x = 0; x < cols; x++) {
        var i = y * cols + x;
        Z[i] = F[i] * CONFIG.extrude + this.waveAt(x, y);
      }
  };

  QuarksAscii.prototype.render = function () {
    var ctx = this.ctx, cols = this.cols, rows = this.rows, F = this.field, Z = this.Z;
    var cw = this.cellW, ch = this.cellH, dpr = this.dpr;

    ctx.clearRect(0, 0, cols * cw, rows * ch);
    this.buildZ();

    var la = this.now * CONFIG.lightSpeed;
    var lx = Math.cos(la) * 0.7, ly = Math.sin(la) * 0.7, lz = 0.9;
    var ll = Math.sqrt(lx * lx + ly * ly + lz * lz); lx /= ll; ly /= ll; lz /= ll;

    var nz = CONFIG.steepness, ink = this.ink, glow = this.glow;
    var lram = CONFIG.letterRamp, lN = lram.length - 1;
    var prevAlpha = -1, prevFill = '';

    for (var y = 1; y < rows - 1; y++) {
      var rowY = y * ch + ch * 0.5;
      for (var x = 1; x < cols - 1; x++) {
        var i = y * cols + x;
        var base = F[i];
        var wave = Z[i] - base * CONFIG.extrude;
        var isLetter = base > CONFIG.inkThreshold;
        if (!isLetter && Math.abs(wave) < CONFIG.bgGhost) continue;

        var rk = isLetter ? this.revealK(x, y) : 1;
        if (rk <= 0.001) continue;

        var gx = Z[i + 1] - Z[i - 1], gy = Z[i + cols] - Z[i - cols];
        var nl = Math.sqrt(gx * gx + gy * gy + nz * nz);
        var diffuse = (-gx * lx - gy * ly + nz * lz) / nl; if (diffuse < 0) diffuse = 0;
        var shade = 0.46 + 0.6 * diffuse;

        var glyph, alpha, mix;
        if (isLetter) {
          var inten = clamp(shade * (0.72 + 0.4 * base) + wave * 0.22, 0, 1);
          var custom = this.glyphForCell(i);
          if (this.small) {
            // phones: clean, bold block-shade letterforms (reveal fades via alpha)
            glyph = MOBILE_RAMP[clamp(Math.round(lerp(1, 4, inten)), 1, 4)];
          } else if (rk < 0.7) {
            // ink-bloom: dots condense into the glyph
            glyph = custom || lram[Math.round(lerp(2, lN, inten))];
            if (rk < 0.4) glyph = lram[1 + Math.round(rk / 0.4 * 2)]; // · : -
          } else {
            glyph = custom || lram[Math.round(lerp(4, lN, inten))];
          }
          alpha = clamp(0.72 + 0.3 * base, 0.6, 1) * clamp(0.7 + inten * 0.45, 0.55, 1) * rk;
          mix = clamp(inten - 0.55, 0, 1) * 0.6;
        } else {
          var amp = Math.abs(wave);
          var bi = clamp((amp - CONFIG.bgGhost) / 0.9, 0, 1);
          glyph = BG_RAMP[Math.min(BG_RAMP.length - 1, 1 + Math.round(bi * (BG_RAMP.length - 2)))];
          alpha = 0.10 + 0.32 * bi;
          mix = 0.15 + 0.4 * bi;
        }
        if (glyph === ' ' || alpha < 0.02) continue;

        var dispY = -wave * CONFIG.pixShiftY * ch * 0.18;
        var dispX = gx * CONFIG.pixShiftX * cw * 0.5;

        var r = Math.round(lerp(ink[0], glow[0], mix));
        var g = Math.round(lerp(ink[1], glow[1], mix));
        var b = Math.round(lerp(ink[2], glow[2], mix));
        var fill = 'rgb(' + r + ',' + g + ',' + b + ')';

        var qa = Math.round(alpha * 24) / 24;
        if (qa !== prevAlpha) { ctx.globalAlpha = qa; prevAlpha = qa; }
        if (fill !== prevFill) { ctx.fillStyle = fill; prevFill = fill; }
        // snap to the device-pixel grid so glyphs render crisp (no sub-pixel blur)
        ctx.fillText(glyph,
          Math.round((x * cw + cw * 0.5 + dispX) * dpr) / dpr,
          Math.round((rowY + dispY) * dpr) / dpr);
      }
    }

    this.drawParticles();
    ctx.globalAlpha = 1;
  };

  QuarksAscii.prototype.drawParticles = function () {
    if (!this.particles.length) return;
    var ctx = this.ctx, cw = this.cellW, ch = this.cellH, cols = this.cols;
    var ink = this.ink, glow = this.glow, lram = CONFIG.letterRamp;
    ctx.fillStyle = 'rgb(' + Math.round(lerp(ink[0], glow[0], 0.5)) + ',' +
      Math.round(lerp(ink[1], glow[1], 0.5)) + ',' + Math.round(lerp(ink[2], glow[2], 0.5)) + ')';
    for (var k = 0; k < this.particles.length; k++) {
      var p = this.particles[k];
      var age = this.now - p.t, t = age / p.ttl; if (t >= 1) continue;
      var env = Math.sin(Math.PI * t);                 // out then back home
      var hx = p.gx * cw + cw * 0.5, hy = p.gy * ch + ch * 0.5;
      var px = hx + p.dirx * p.amp * env;
      var py = hy + p.diry * p.amp * env + p.amp * 0.25 * t * t; // a little gravity
      var i = p.gy * cols + p.gx;
      var glyph = this.glyphForCell(i) || lram[lram.length - 2];
      ctx.globalAlpha = clamp(0.95 - t * 0.25, 0, 1) * (env * 0.6 + 0.4);
      ctx.fillText(glyph, px, py);
    }
  };

  QuarksAscii.prototype.renderStatic = function () {
    this.hoverEnergy = 0; this.ripples.length = 0; this.particles.length = 0;
    this.revealActive = false; this.revealProgress = 1; this.scrollOff = 0;
    this.canvas.style.transform = '';
    this.render();
  };

  /* ------------------------------ controls -------------------------------- */
  QuarksAscii.prototype.buildControls = function () {
    var self = this;
    var bar = document.createElement('div'); bar.className = 'qa-controls';

    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'qa-kebab';
    btn.setAttribute('aria-label', 'Logo effects'); btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false'); btn.innerHTML = '&#8942;';

    var panel = document.createElement('div'); panel.className = 'qa-panel'; panel.setAttribute('role', 'menu');
    var title = document.createElement('div'); title.className = 'qa-title'; title.textContent = 'Effects';
    panel.appendChild(title);

    FX_ITEMS.forEach(function (item) {
      var row = document.createElement('label'); row.className = 'qa-row'; row.setAttribute('role', 'menuitemcheckbox');
      var span = document.createElement('span'); span.textContent = item.label;
      var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!self.fx[item.key];
      cb.addEventListener('change', function () {
        self.fx[item.key] = cb.checked; saveFx(self.fx);
        if (item.key === 'tilt' && !cb.checked) { self.tilt.trx = 0; self.tilt.try_ = 0; }
        if (item.key === 'reveal' && cb.checked) self.startReveal();
        if (self.reduceMotion) self.renderStatic();
      });
      row.appendChild(span); row.appendChild(cb); panel.appendChild(row);
    });

    var sep = document.createElement('div'); sep.className = 'qa-sep'; panel.appendChild(sep);
    var replay = document.createElement('button');
    replay.type = 'button'; replay.className = 'qa-action'; replay.textContent = '↻  Replay reveal';
    replay.addEventListener('click', function (e) {
      e.stopPropagation(); self.fx.reveal = true; saveFx(self.fx);
      var rc = panel.querySelectorAll('input')[FX_ITEMS.map(function (z) { return z.key; }).indexOf('reveal')];
      if (rc) rc.checked = true;
      self.startReveal(); self.closePanel();
    });
    panel.appendChild(replay);

    btn.addEventListener('click', function (e) { e.stopPropagation(); self.togglePanel(); });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () { self.closePanel(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') self.closePanel(); });

    bar.appendChild(btn); bar.appendChild(panel);
    this.root.appendChild(bar);
    this.kebab = btn; this.panel = panel;
  };
  QuarksAscii.prototype.togglePanel = function () {
    this.panel.classList.contains('open') ? this.closePanel() : this.openPanel();
  };
  QuarksAscii.prototype.openPanel = function () {
    this.panel.classList.add('open'); this.kebab.setAttribute('aria-expanded', 'true');
  };
  QuarksAscii.prototype.closePanel = function () {
    this.panel.classList.remove('open'); this.kebab.setAttribute('aria-expanded', 'false');
  };

  /* ------------------------------- events --------------------------------- */
  QuarksAscii.prototype.localCell = function (clientX, clientY) {
    var rect = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / rect.width * this.cols,
      y: (clientY - rect.top) / rect.height * this.rows
    };
  };

  QuarksAscii.prototype.onMove = function (clientX, clientY) {
    var c = this.localCell(clientX, clientY);
    var moved = Math.hypot(c.x - this.pointer.x, c.y - this.pointer.y);
    this.pointer.x = c.x; this.pointer.y = c.y; this.pointer.inside = true;

    // 3-D tilt target from cursor position
    this.tilt.trx = -((c.y / this.rows) - 0.5) * 2 * CONFIG.tiltMax;
    this.tilt.try_ = ((c.x / this.cols) - 0.5) * 2 * CONFIG.tiltMax;

    if (this.reduceMotion || !this.fx.ripple) return;
    var t = performance.now();
    if (t - this.lastSpawn > CONFIG.rippleSpawnMs) {
      this.lastSpawn = t;
      this.addRipple(c.x, c.y, clamp(0.5 + moved * 0.22, 0.5, 1.8));
    }
  };

  QuarksAscii.prototype.bindEvents = function () {
    var self = this, cv = this.canvas;

    cv.addEventListener('mousemove', function (e) { self.onMove(e.clientX, e.clientY); });
    cv.addEventListener('mouseenter', function (e) { self.pointer.inside = true; self.onMove(e.clientX, e.clientY); });
    cv.addEventListener('mouseleave', function () { self.pointer.inside = false; });
    cv.addEventListener('click', function (e) {
      if (self.reduceMotion) return;
      var c = self.localCell(e.clientX, e.clientY);
      if (self.fx.ripple) self.addRipple(c.x, c.y, 2.2);
      self.spawnBurst(c.x, c.y);
    });

    cv.addEventListener('touchstart', function (e) {
      var tc = e.touches[0]; if (!tc) return;
      self.pointer.inside = true; self.onMove(tc.clientX, tc.clientY);
      if (!self.reduceMotion) { var c = self.localCell(tc.clientX, tc.clientY); self.spawnBurst(c.x, c.y); }
    }, { passive: true });
    cv.addEventListener('touchmove', function (e) {
      var tc = e.touches[0]; if (!tc) return; self.onMove(tc.clientX, tc.clientY);
    }, { passive: true });
    cv.addEventListener('touchend', function () { self.pointer.inside = false; });

    var rt;
    var rebuild = function () {
      clearTimeout(rt);
      rt = setTimeout(function () { self.build(); if (self.reduceMotion) self.renderStatic(); }, 150);
    };
    if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(this.root);
    else window.addEventListener('resize', rebuild);

    if ('MutationObserver' in window) {
      var mo = new MutationObserver(function () { self.readColors(); if (self.reduceMotion) self.renderStatic(); });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
      mo.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        var vis = entries[0].isIntersecting;
        if (vis && !self.hasEntered) {          // fire the intro reveal on first view
          self.hasEntered = true;
          if (self.fx.reveal && self.ready) self.startReveal();
        }
        if (self.reduceMotion) return;
        if (vis && !self.rafId && self.ready) {
          self.lastTs = 0; self.rafId = requestAnimationFrame(self.boundFrame);
        } else if (!vis && self.rafId) {
          cancelAnimationFrame(self.rafId); self.rafId = 0;
        }
      }, { threshold: 0.08 });
      io.observe(this.root);
    } else if (this.fx.reveal) {
      this.startReveal();
    }
  };

  /* ------------------------------- boot ----------------------------------- */
  function initAll() {
    var nodes = document.querySelectorAll('[data-quarks-ascii]');
    for (var i = 0; i < nodes.length; i++)
      if (!nodes[i].__quarksAscii) nodes[i].__quarksAscii = new QuarksAscii(nodes[i]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
  else initAll();

  window.QuarksAscii = QuarksAscii;
})();

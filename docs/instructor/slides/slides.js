/* Shared behavior for the instructor slide decks.
   Keys: ←/→, PageUp/PageDown, Space (Shift+Space back), Home/End, N (notes), T (thumbnails), P (present), ? (help).
   Thumbnails: a pane on the left with every slide, to scroll through and jump to one.
   Present: the deck goes full screen and a presenter window opens with the timer, the current
   and next slides and the speaker notes, like Google Slides' presenter view. Both stay in sync.
   Click or tap: left third goes back, the rest goes forward. URL hash = slide number. */
(function () {
  'use strict';

  var deck = document.querySelector('.deck');
  if (!deck) return;

  var root = document.documentElement;
  var deckTitle = deck.getAttribute('data-title') || document.title;
  var slides = Array.prototype.slice.call(deck.querySelectorAll('section.slide'));
  var pages = [];
  var total = slides.length;
  var current = 0;

  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) { return null; }
    return null;
  }

  // Wrap each slide with a printable copy of its notes, and add its footer.
  slides.forEach(function (slide, i) {
    var page = document.createElement('div');
    page.className = 'slide-page';
    slide.parentNode.insertBefore(page, slide);
    page.appendChild(slide);

    var foot = document.createElement('footer');
    foot.className = 'slide-foot';
    foot.innerHTML = '<span class="foot-brand"><img class="logo-color" src="assets/liferay-logo.svg" alt="Liferay"><img class="logo-white" src="assets/liferay-logo-white.svg" alt="Liferay"><span class="foot-title"></span></span><span class="foot-num"></span>';
    foot.querySelector('.foot-title').textContent = deckTitle;
    foot.querySelector('.foot-num').textContent = (i + 1) + ' / ' + total;
    slide.appendChild(foot);

    var notes = slide.querySelector('aside.notes');
    var printNotes = document.createElement('div');
    printNotes.className = 'print-notes';
    printNotes.innerHTML = '<h2>Speaker notes, slide ' + (i + 1) + '</h2>' + (notes ? notes.innerHTML : '<p>No notes.</p>');
    page.appendChild(printNotes);
    pages.push(page);
  });

  // Toolbar
  var bar = document.createElement('nav');
  bar.className = 'toolbar';
  bar.setAttribute('aria-label', 'Slide navigation');
  bar.innerHTML =
    '<span class="deck-title"><a href="../index.html"></a></span>' +
    '<button type="button" data-act="thumbs" aria-pressed="false" title="Slide thumbnails (T)">▦ Slides</button>' +
    '<button type="button" data-act="prev" aria-label="Previous slide">‹</button>' +
    '<span class="counter" aria-live="polite"></span>' +
    '<button type="button" data-act="next" aria-label="Next slide">›</button>' +
    '<button type="button" data-act="notes" aria-pressed="false" title="Speaker notes (N)">Notes</button>' +
    '<button type="button" data-act="present" class="present" title="Present: full screen, with speaker notes in a new window (P)">▶ Present</button>' +
    '<button type="button" data-act="help" aria-label="Keyboard shortcuts" title="Shortcuts (?)">?</button>';
  bar.querySelector('.deck-title a').textContent = deckTitle;
  document.body.appendChild(bar);
  var counter = bar.querySelector('.counter');
  var notesBtn = bar.querySelector('[data-act="notes"]');
  var thumbsBtn = bar.querySelector('[data-act="thumbs"]');

  // Thumbnail pane: built the first time it opens.
  var thumbs = document.createElement('nav');
  thumbs.className = 'thumbs';
  thumbs.setAttribute('aria-label', 'Slides');
  document.body.appendChild(thumbs);
  var thumbItems = [];

  // Notes panel
  var panel = document.createElement('section');
  panel.className = 'notes-panel';
  panel.setAttribute('aria-label', 'Speaker notes');
  document.body.appendChild(panel);

  // Help overlay
  var help = document.createElement('div');
  help.className = 'help';
  help.setAttribute('role', 'dialog');
  help.setAttribute('aria-label', 'Keyboard shortcuts');
  help.innerHTML =
    '<div class="card"><h2>Keyboard shortcuts</h2><table>' +
    '<tr><td><kbd>→</kbd> <kbd>Space</kbd> <kbd>PgDn</kbd></td><td>Next slide</td></tr>' +
    '<tr><td><kbd>←</kbd> <kbd>Shift</kbd>+<kbd>Space</kbd> <kbd>PgUp</kbd></td><td>Previous slide</td></tr>' +
    '<tr><td><kbd>Home</kbd> / <kbd>End</kbd></td><td>First / last slide</td></tr>' +
    '<tr><td><kbd>N</kbd></td><td>Show or hide speaker notes</td></tr>' +
    '<tr><td><kbd>T</kbd></td><td>Show or hide the slide thumbnails</td></tr>' +
    '<tr><td><kbd>P</kbd></td><td>Present: full screen, and the presenter view in a new window</td></tr>' +
    '<tr><td><kbd>?</kbd></td><td>Show or hide this help</td></tr>' +
    '<tr><td><kbd>Esc</kbd></td><td>Close this help</td></tr>' +
    '<tr><td>Click / tap</td><td>Left third: back. Elsewhere: forward.</td></tr>' +
    '</table><p class="close-hint">Add <code>#12</code> to the URL to open slide 12. Print (Ctrl/Cmd+P) gives one slide per page with notes.</p></div>';
  document.body.appendChild(help);

  function layout() {
    var stacked = window.innerWidth < 720;
    root.classList.toggle('stacked', stacked);
    if (stacked) return;
    var presenting = root.classList.contains('presenting');
    var barH = presenting ? 0 : (bar.offsetHeight || 48);
    var notesH = !presenting && root.classList.contains('notes-open') ? panel.offsetHeight : 0;
    var thumbsW = !presenting && root.classList.contains('thumbs-open') ? thumbs.offsetWidth : 0;
    var availW = window.innerWidth - thumbsW - (presenting ? 0 : 32);
    var availH = window.innerHeight - barH - notesH - (presenting ? 0 : 24);
    var w = Math.max(320, Math.min(availW, availH * 16 / 9));
    root.style.setProperty('--u', (w / 100) + 'px');
    var viewport = document.querySelector('.viewport');
    viewport.style.bottom = (barH + notesH) + 'px';
    viewport.style.left = thumbsW + 'px';
    thumbs.style.bottom = barH + 'px';
  }

  function render() {
    pages.forEach(function (p, i) { p.classList.toggle('active', i === current); });
    counter.textContent = (current + 1) + ' / ' + total;
    var notes = slides[current].querySelector('aside.notes');
    panel.innerHTML = '<h2>Speaker notes, slide ' + (current + 1) + '</h2>' + (notes ? notes.innerHTML : '<p>No notes.</p>');
    panel.scrollTop = 0;
    var title = slides[current].querySelector('h1, h2');
    document.title = deckTitle + ' (' + (current + 1) + ')' + (title ? ': ' + title.textContent.trim() : '');
    if (root.classList.contains('stacked')) window.scrollTo(0, 0);
    updatePresenter();
    markThumb();
  }

  function buildThumbs() {
    if (thumbItems.length) return;
    var w = 176;
    slides.forEach(function (slide, i) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'thumb';
      item.setAttribute('aria-label', 'Slide ' + (i + 1));
      var num = document.createElement('span');
      num.className = 'thumb-num';
      num.textContent = i + 1;
      var frame = document.createElement('div');
      frame.className = 'thumb-frame';
      frame.style.setProperty('--u', (w / 100) + 'px');
      var copy = slide.cloneNode(true);
      copy.removeAttribute('id');
      copy.querySelectorAll('img').forEach(function (img) { img.loading = 'lazy'; });
      frame.appendChild(copy);
      item.appendChild(num);
      item.appendChild(frame);
      item.addEventListener('click', function () { go(i); item.blur(); });
      thumbs.appendChild(item);
      thumbItems.push(item);
    });
  }

  function markThumb() {
    if (!root.classList.contains('thumbs-open')) return;
    thumbItems.forEach(function (t, i) {
      t.classList.toggle('active', i === current);
      if (i === current) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
    var active = thumbItems[current];
    if (active) {
      var top = active.offsetTop, bottom = top + active.offsetHeight;
      if (top < thumbs.scrollTop || bottom > thumbs.scrollTop + thumbs.clientHeight) {
        thumbs.scrollTop = top - (thumbs.clientHeight - active.offsetHeight) / 2;
      }
    }
  }

  function toggleThumbs(force) {
    var open = typeof force === 'boolean' ? force : !root.classList.contains('thumbs-open');
    if (open) buildThumbs();
    root.classList.toggle('thumbs-open', open);
    thumbsBtn.setAttribute('aria-pressed', String(open));
    store('bewl-slides-thumbs', open ? '1' : '0');
    layout();
    markThumb();
  }

  function go(n) {
    n = Math.max(0, Math.min(total - 1, n));
    current = n;
    if (window.location.hash !== '#' + (n + 1)) {
      try { history.replaceState(null, '', '#' + (n + 1)); } catch (e) { window.location.hash = String(n + 1); }
    }
    render();
  }

  function fromHash() {
    var m = /^#(\d+)$/.exec(window.location.hash);
    return m ? parseInt(m[1], 10) - 1 : 0;
  }

  function toggleNotes(force) {
    var open = typeof force === 'boolean' ? force : !root.classList.contains('notes-open');
    root.classList.toggle('notes-open', open);
    notesBtn.setAttribute('aria-pressed', String(open));
    store('bewl-slides-notes', open ? '1' : '0');
    layout();
  }

  function toggleHelp(force) {
    var open = typeof force === 'boolean' ? force : !root.classList.contains('help-open');
    root.classList.toggle('help-open', open);
  }

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    var k = e.key;
    if (k === '?') { toggleHelp(); e.preventDefault(); return; }
    if (k === 'Escape') { toggleHelp(false); return; }
    if (root.classList.contains('help-open')) return;
    if (k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) { go(current + 1); e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === 'PageUp' || (k === ' ' && e.shiftKey)) { go(current - 1); e.preventDefault(); }
    else if (k === 'Home') { go(0); e.preventDefault(); }
    else if (k === 'End') { go(total - 1); e.preventDefault(); }
    else if (k === 'n' || k === 'N') { toggleNotes(); e.preventDefault(); }
    else if (k === 't' || k === 'T') { toggleThumbs(); e.preventDefault(); }
    else if (k === 'p' || k === 'P') { present(); e.preventDefault(); }
  });

  bar.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'prev') go(current - 1);
    else if (act === 'next') go(current + 1);
    else if (act === 'notes') toggleNotes();
    else if (act === 'thumbs') toggleThumbs();
    else if (act === 'help') toggleHelp();
    else if (act === 'present') present();
    b.blur();
  });

  help.addEventListener('click', function (e) { if (e.target === help) toggleHelp(false); });

  deck.addEventListener('click', function (e) {
    if (e.target.closest('a, button, input, summary')) return;
    var sel = window.getSelection && window.getSelection();
    if (sel && String(sel).length) return;
    var rect = deck.getBoundingClientRect();
    if (e.clientX - rect.left < rect.width * 0.3) go(current - 1);
    else go(current + 1);
  });

  var touchX = null, touchY = null;
  deck.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return;
    touchX = e.touches[0].clientX; touchY = e.touches[0].clientY;
  }, { passive: true });
  deck.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    var dy = e.changedTouches[0].clientY - touchY;
    touchX = null;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 40) {
      go(current + (dx < 0 ? 1 : -1));
      e.preventDefault();
    }
  });


  // ---------- Presenter view ----------
  // A second window, driven from this one: the timer, the current and next slides (real copies,
  // scaled), the speaker notes, and Previous / Next. Keys work in either window.

  var presenter = null;
  var timer = { start: 0, elapsed: 0, running: false, tick: null };
  var notesSize = parseFloat(store('bewl-presenter-notes-size')) || 20;

  var PRESENTER_CSS =
    'html,body{margin:0;height:100%;}' +
    'body{font-family:"Source Sans 3",system-ui,sans-serif;background:#1c1d26;color:#e7e8ef;display:grid;grid-template-rows:auto 1fr;overflow:hidden;}' +
    '.pv-bar{display:flex;align-items:center;gap:10px;padding:10px 16px;background:#272833;border-bottom:1px solid #3a3b47;font-size:15px;}' +
    '.pv-bar .pv-title{font-weight:700;margin-right:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
    '.pv-bar button{background:#3a3b47;color:#fff;border:1px solid #4b4c5a;border-radius:6px;padding:6px 12px;font:inherit;cursor:pointer;}' +
    '.pv-bar button:hover{background:#4b4c5a;}' +
    '.pv-bar .pv-nav{background:#0b5fff;border-color:#0b5fff;font-weight:700;min-width:96px;}' +
    '.pv-time{font-variant-numeric:tabular-nums;font-size:22px;font-weight:700;min-width:84px;text-align:center;}' +
    '.pv-count{font-variant-numeric:tabular-nums;min-width:72px;text-align:center;}' +
    '.pv-main{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);gap:16px;padding:16px;min-height:0;}' +
    '.pv-label{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#a7a9bc;margin:0 0 6px;}' +
    '.pv-current{grid-row:1/3;display:flex;flex-direction:column;min-height:0;}' +
    '.pv-side{display:flex;flex-direction:column;min-height:0;}' +
    '.pv-notes{grid-column:2;display:flex;flex-direction:column;min-height:0;}' +
    '.pv-notes-body{flex:1;overflow-y:auto;background:#272833;border-radius:8px;padding:14px 18px;line-height:1.45;}' +
    '.pv-notes-body p{margin:0 0 .7em;} .pv-notes-body a{color:#8fb4ff;}' +
    '.pv-frame{position:relative;width:calc(var(--u)*100);height:calc(var(--u)*56.25);pointer-events:none;border-radius:4px;overflow:hidden;}' +
    '.pv-frame .slide{box-shadow:none;}' +
    '.pv-end{display:flex;align-items:center;justify-content:center;background:#272833;color:#a7a9bc;border-radius:4px;}' +
    '.pv-size{margin-left:auto;display:flex;gap:6px;} .pv-size button{background:#3a3b47;color:#fff;border:1px solid #4b4c5a;border-radius:6px;padding:2px 10px;font:inherit;cursor:pointer;}' +
    '.pv-notes-head{display:flex;align-items:center;}';

  function fmt(ms) {
    var sec = Math.floor(ms / 1000), m = Math.floor(sec / 60), h = Math.floor(m / 60);
    var two = function (n) { return (n < 10 ? '0' : '') + n; };
    return (h ? h + ':' + two(m % 60) : m) + ':' + two(sec % 60);
  }

  function timerNow() {
    return timer.elapsed + (timer.running ? Date.now() - timer.start : 0);
  }

  function showTime() {
    if (!presenter || presenter.closed) return;
    var t = presenter.document.querySelector('.pv-time');
    var b = presenter.document.querySelector('[data-pv="pause"]');
    if (t) t.textContent = fmt(timerNow());
    if (b) b.textContent = timer.running ? 'Pause' : 'Resume';
  }

  // Put a scaled copy of a slide (or "End of the deck") in a frame that fits the box.
  function fill(box, index) {
    var doc = presenter.document;
    var w = box.clientWidth, h = box.clientHeight;
    var u = Math.max(1, Math.min(w, h * 16 / 9)) / 100;
    var frame = doc.createElement('div');
    frame.className = 'pv-frame';
    frame.style.setProperty('--u', u + 'px');
    if (index < total) {
      frame.appendChild(doc.importNode(slides[index], true));
    } else {
      frame.classList.add('pv-end');
      frame.textContent = 'End of the deck';
    }
    box.innerHTML = '';
    box.appendChild(frame);
  }

  function updatePresenter() {
    if (!presenter || presenter.closed) return;
    var doc = presenter.document;
    if (!doc.querySelector('.pv-main')) return;
    doc.querySelector('.pv-count').textContent = (current + 1) + ' / ' + total;
    var title = slides[current].querySelector('h1, h2');
    doc.title = 'Presenter view: ' + (current + 1) + (title ? ' · ' + title.textContent.trim() : '');
    fill(doc.querySelector('.pv-current-box'), current);
    fill(doc.querySelector('.pv-next-box'), current + 1);
    var notes = slides[current].querySelector('aside.notes');
    var body = doc.querySelector('.pv-notes-body');
    body.innerHTML = notes ? notes.innerHTML : '<p>No notes.</p>';
    body.style.fontSize = notesSize + 'px';
    body.scrollTop = 0;
    showTime();
  }

  function buildPresenter() {
    var doc = presenter.document;
    var base = window.location.href.split('#')[0];
    var fonts = document.querySelector('link[href*="fonts.googleapis"]');
    doc.open();
    doc.write('<!doctype html><html lang="en"><head><meta charset="utf-8"><base href="' + base + '">' +
      '<title>Presenter view</title>' +
      (fonts ? '<link rel="stylesheet" href="' + fonts.href + '">' : '') +
      '<link rel="stylesheet" href="slides.css"><style>' + PRESENTER_CSS + '</style></head><body>' +
      '<div class="pv-bar"><span class="pv-title"></span>' +
      '<span class="pv-time">0:00</span><button type="button" data-pv="pause">Pause</button><button type="button" data-pv="reset">Reset</button>' +
      '<button type="button" class="pv-nav" data-pv="prev">‹ Previous</button><span class="pv-count"></span>' +
      '<button type="button" class="pv-nav" data-pv="next">Next ›</button></div>' +
      '<div class="pv-main">' +
      '<div class="pv-current"><p class="pv-label">Current slide</p><div class="pv-current-box" style="flex:1;min-height:0;"></div></div>' +
      '<div class="pv-side"><p class="pv-label">Next</p><div class="pv-next-box" style="height:22vh;"></div></div>' +
      '<div class="pv-notes"><div class="pv-notes-head"><p class="pv-label">Speaker notes</p>' +
      '<span class="pv-size"><button type="button" data-pv="smaller" title="Smaller notes">A−</button><button type="button" data-pv="bigger" title="Bigger notes">A+</button></span></div>' +
      '<div class="pv-notes-body"></div></div>' +
      '</div></body></html>');
    doc.close();
    doc.querySelector('.pv-title').textContent = deckTitle;

    doc.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pv]');
      if (!b) return;
      var act = b.getAttribute('data-pv');
      if (act === 'prev') go(current - 1);
      else if (act === 'next') go(current + 1);
      else if (act === 'pause') {
        if (timer.running) { timer.elapsed = timerNow(); timer.running = false; }
        else { timer.start = Date.now(); timer.running = true; }
        showTime();
      }
      else if (act === 'reset') { timer.elapsed = 0; timer.start = Date.now(); showTime(); }
      else if (act === 'smaller' || act === 'bigger') {
        notesSize = Math.max(12, Math.min(40, notesSize + (act === 'bigger' ? 2 : -2)));
        store('bewl-presenter-notes-size', String(notesSize));
        doc.querySelector('.pv-notes-body').style.fontSize = notesSize + 'px';
      }
    });
    doc.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var k = e.key;
      if (k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) { go(current + 1); e.preventDefault(); }
      else if (k === 'ArrowLeft' || k === 'PageUp' || (k === ' ' && e.shiftKey)) { go(current - 1); e.preventDefault(); }
      else if (k === 'Home') { go(0); e.preventDefault(); }
      else if (k === 'End') { go(total - 1); e.preventDefault(); }
    });
    presenter.addEventListener('resize', updatePresenter);
    // Let the stylesheet load before measuring the boxes.
    presenter.setTimeout(updatePresenter, 50);
    presenter.setTimeout(updatePresenter, 400);
  }

  function present() {
    if (!presenter || presenter.closed) {
      presenter = window.open('', 'bewl-presenter-view', 'width=1100,height=720');
      if (!presenter) {
        window.alert('Your browser blocked the presenter window. Allow pop-ups for this page, then press Present again.');
        return;
      }
      timer = { start: Date.now(), elapsed: 0, running: true, tick: null };
      buildPresenter();
      timer.tick = window.setInterval(function () {
        if (!presenter || presenter.closed) { window.clearInterval(timer.tick); return; }
        showTime();
      }, 500);
    } else {
      presenter.focus();
    }
    if (root.requestFullscreen && !document.fullscreenElement) {
      root.requestFullscreen().catch(function () {});
    }
  }

  document.addEventListener('fullscreenchange', function () {
    root.classList.toggle('presenting', Boolean(document.fullscreenElement));
    layout();
  });
  window.addEventListener('beforeunload', function () {
    if (presenter && !presenter.closed) presenter.close();
  });

  window.__bewlSlides = { go: function (n) { go(n); }, current: function () { return current; }, present: present };

  window.addEventListener('hashchange', function () {
    var n = fromHash();
    if (n !== current) go(n);
  });
  window.addEventListener('resize', layout);

  if (store('bewl-slides-notes') === '1') {
    root.classList.add('notes-open');
    notesBtn.setAttribute('aria-pressed', 'true');
  }
  if (store('bewl-slides-thumbs') === '1' && window.innerWidth >= 720) {
    toggleThumbs(true);
  }
  layout();
  go(fromHash());
})();

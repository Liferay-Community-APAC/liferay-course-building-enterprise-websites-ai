/* Shared behavior for the instructor slide decks.
   Keys: ←/→, PageUp/PageDown, Space (Shift+Space back), Home/End, N (notes), ? (help).
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
    foot.innerHTML = '<span></span><span></span>';
    foot.children[0].textContent = deckTitle;
    foot.children[1].textContent = (i + 1) + ' / ' + total;
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
    '<button type="button" data-act="prev" aria-label="Previous slide">‹</button>' +
    '<span class="counter" aria-live="polite"></span>' +
    '<button type="button" data-act="next" aria-label="Next slide">›</button>' +
    '<button type="button" data-act="notes" aria-pressed="false" title="Speaker notes (N)">Notes</button>' +
    '<button type="button" data-act="help" aria-label="Keyboard shortcuts" title="Shortcuts (?)">?</button>';
  bar.querySelector('.deck-title a').textContent = deckTitle;
  document.body.appendChild(bar);
  var counter = bar.querySelector('.counter');
  var notesBtn = bar.querySelector('[data-act="notes"]');

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
    '<tr><td><kbd>?</kbd></td><td>Show or hide this help</td></tr>' +
    '<tr><td><kbd>Esc</kbd></td><td>Close this help</td></tr>' +
    '<tr><td>Click / tap</td><td>Left third: back. Elsewhere: forward.</td></tr>' +
    '</table><p class="close-hint">Add <code>#12</code> to the URL to open slide 12. Print (Ctrl/Cmd+P) gives one slide per page with notes.</p></div>';
  document.body.appendChild(help);

  function layout() {
    var stacked = window.innerWidth < 720;
    root.classList.toggle('stacked', stacked);
    if (stacked) return;
    var barH = bar.offsetHeight || 48;
    var notesH = root.classList.contains('notes-open') ? panel.offsetHeight : 0;
    var availW = window.innerWidth - 32;
    var availH = window.innerHeight - barH - notesH - 24;
    var w = Math.max(320, Math.min(availW, availH * 16 / 9));
    root.style.setProperty('--u', (w / 100) + 'px');
    document.querySelector('.viewport').style.bottom = (barH + notesH) + 'px';
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
  });

  bar.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'prev') go(current - 1);
    else if (act === 'next') go(current + 1);
    else if (act === 'notes') toggleNotes();
    else if (act === 'help') toggleHelp();
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

  window.addEventListener('hashchange', function () {
    var n = fromHash();
    if (n !== current) go(n);
  });
  window.addEventListener('resize', layout);

  if (store('bewl-slides-notes') === '1') {
    root.classList.add('notes-open');
    notesBtn.setAttribute('aria-pressed', 'true');
  }
  layout();
  go(fromHash());
})();

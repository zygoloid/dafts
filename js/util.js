// Shared helpers. Everything hangs off the global G so the game runs from file:// too.
var G = window.G = {};

G.auto = /[?&]auto\b/.test(location.search);           // autoplay for testing
G.fast = /[?&]fast\b/.test(location.search);           // shorter waits for testing
G.debug = /[?&]debug\b/.test(location.search) || G.auto;
G.talkMs = +((/[?&]talk=(\d+)/.exec(location.search) || [])[1] || 5);   // how long autoplay lingers on each line

G.wait = function (ms) {
  if (G.fast) ms = Math.min(ms, 30);
  if (G.ui && G.ui.skipping) ms = 0;
  return new Promise(function (res) { setTimeout(res, ms); });
};
G.rand = function (n) { return Math.floor(Math.random() * n); };
G.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
G.chance = function (p) { return Math.random() < p; };
G.shuffle = function (arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
};
G.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
G.$ = function (sel, root) { return (root || document).querySelector(sel); };
G.el = function (tag, cls, html) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
};
// Like a click handler, but only for presses that began on this element. Buttons that appear
// mid-tap (say, choices revealed by the tap that finished a line of dialogue) would otherwise
// receive that tap's click as soon as the finger lifts.
G.onPress = function (el, fn) {
  var armed = false, born = Date.now();
  el.addEventListener('pointerdown', function () { armed = true; });
  el.addEventListener('click', function (ev) {
    // Without a press of its own, only accept keyboard activation of a button that has been
    // on screen a moment (Safari's clicks carry no pointerType, so age is the tell there).
    if (!armed && !G.auto && (ev.pointerType || Date.now() - born < 400)) return;
    armed = false;
    fn.call(el, ev);
  });
};
G.esc = function (s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
};
// Draw from a pool without repeats until it runs dry, then refill.
G.deck = function (items) {
  var pile = [];
  return function () {
    if (!pile.length) pile = G.shuffle(items);
    return pile.pop();
  };
};

// ---- persistence (all wrapped; private browsing may throw) ----
G.SAVE_KEY = 'dafts.save.v1';
G.save = { chapter: 0, maxChapter: 0, captured: 0, done: false, muted: false, seen: [] , fails: {} };
G.loadSave = function () {
  try {
    var raw = localStorage.getItem(G.SAVE_KEY);
    if (raw) Object.assign(G.save, JSON.parse(raw));
  } catch (e) { /* ignore */ }
};
G.writeSave = function () {
  try { localStorage.setItem(G.SAVE_KEY, JSON.stringify(G.save)); } catch (e) { /* ignore */ }
};
G.loadSave();

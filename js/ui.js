// Rendering, input and dialogue. Knows nothing about the story; story.js drives it.
(function () {
  var Rules = G.rules, Art = G.art, A = G.audio;
  var ui = G.ui = {};
  var $ = G.$, el = G.el;

  var app, board, squaresEl, piecesEl, fxEl, captionEl, statusEl, dlg, dlgText, dlgName, dlgPortrait, dlgChoices, hudEl;
  var squareEls = [];
  var pieceEls = new Map();   // id -> element
  ui.state = null;

  var SPEAKERS = {
    colin: { name: 'COLIN', voice: { f: 330, type: 'square' } },
    arbiter: { name: 'The Arbiter', voice: { f: 130, type: 'sawtooth', vol: 0.035 } },
    gary: { name: 'Gary', voice: { f: 560, type: 'triangle', vol: 0.07 } },
    brenda: { name: 'Brenda', voice: { f: 300, type: 'triangle', vol: 0.07 } },
    narrator: { name: 'The Narrator', voice: { f: 170, type: 'sine', vol: 0.08, spread: 0.08 } },
    pigeon: { name: 'The Pigeon', voice: { f: 400, type: 'sine', vol: 0.06 } },
    duck: { name: 'The Duck', voice: { f: 520, type: 'sawtooth', vol: 0.03 } },
    ghost: { name: 'A Captured Piece', voice: { f: 700, type: 'sine', vol: 0.05 } },
    piece: { name: 'A Red Piece', voice: { f: 620, type: 'triangle', vol: 0.06 } },
    bpiece: { name: 'A Black Piece', voice: { f: 380, type: 'triangle', vol: 0.06 } },
    you: { name: 'You', voice: null },
    taxman: { name: 'The Taxman', voice: { f: 160, type: 'square', vol: 0.03 } },
    boot: { name: 'A Boot', voice: { f: 240, type: 'square', vol: 0.03 } },
    jigsaw: { name: 'A Bit of Sky', voice: { f: 640, type: 'sine', vol: 0.06 } },
    die: { name: 'A Die', voice: { f: 260, type: 'triangle', vol: 0.06 } },
    sock: { name: 'A Sock', voice: { f: 420, type: 'triangle', vol: 0.05 } },
    tile: { name: 'A Letter Tile', voice: { f: 480, type: 'square', vol: 0.03 } },
    manual: { name: "COLIN's Manual", voice: null },
    ad: { name: 'Advertisement', voice: { f: 900, type: 'square', vol: 0.02 } }
  };
  ui.SPEAKERS = SPEAKERS;

  ui.init = function () {
    app = $('#app'); board = $('#board'); squaresEl = $('#squares'); piecesEl = $('#pieces');
    fxEl = $('#fx'); captionEl = $('#caption'); statusEl = $('#status'); hudEl = $('#hud');
    dlg = $('#dialogue'); dlgText = $('.text', dlg); dlgName = $('.name', dlg);
    dlgPortrait = $('.portrait', dlg); dlgChoices = $('.choices', dlg);
    for (var i = 0; i < 64; i++) {
      var r = i >> 3, c = i & 7;
      var s = el('div', 'sq ' + (Rules.isDark(r, c) ? 'dark' : 'light'));
      s.style.setProperty('--r', r); s.style.setProperty('--c', c);
      squaresEl.appendChild(s); squareEls.push(s);
    }
    ui.colin('neutral');
    board.addEventListener('pointerdown', onBoardDown);
    board.addEventListener('pointerup', onBoardUp);
    board.addEventListener('pointercancel', function () { dragStart = null; });
    app.addEventListener('pointerdown', onAppDown, true);
    window.addEventListener('pointermove', onLook, { passive: true });
    window.addEventListener('resize', layout);
    if (window.ResizeObserver) new ResizeObserver(layout).observe($('#stage'));
    layout();
    eyeLoop();
  };

  function layout() {
    var stage = $('#stage');
    var w = stage.clientWidth - 12, h = stage.clientHeight - 8;
    var bs = Math.max(200, Math.floor(Math.min(w, h, 640) / 8) * 8);
    document.documentElement.style.setProperty('--bs', bs + 'px');
  }
  ui.layout = layout;

  // ---------------- board classes / themes ----------------
  ui.boardClass = function (cls, on) { board.classList.toggle(cls, on !== false); };
  ui.appClass = function (cls, on) { app.classList.toggle(cls, on !== false); };
  ui.theme = function (name) {
    app.className = app.className.replace(/\btheme-\S+/g, '').trim();
    if (name) app.classList.add('theme-' + name);
  };
  ui.title = function (t) { $('#chapTitle').textContent = t || ''; };
  ui.status = function (html) { statusEl.innerHTML = html || ''; };
  ui.hud = function (html) { hudEl.innerHTML = html || ''; hudEl.classList.toggle('on', !!html); };

  // ---------------- pieces ----------------
  function pieceClass(p) {
    var c = 'pc ' + (p.color || '') + ' k-' + p.kind;
    if (p.king) c += ' king';
    if (p.strike) c += ' strike';
    if (p.name) c += ' n-' + p.name;
    if (p.ally) c += ' ally';
    if (p.frozen) c += ' frozen';
    if (p.cls) c += ' ' + p.cls;
    return c;
  }
  function makePieceEl(p) {
    var e = el('div', pieceClass(p));
    var inner = el('div', 'pc-in');
    var body = '<div class="disc"></div>';
    if (p.kind === 'egg') body = '<div class="eggshape"></div>';
    else if (p.kind === 'pigeon') body = '<div class="pigeonart">' + Art.pigeon() + '</div>';
    else if (p.kind === 'thing') body = '<div class="thing">' + (p.icon || '?') + '</div>';
    else if (p.kind === 'duck') body = '<div class="pigeonart">' + Art.duck() + '</div>';
    inner.innerHTML = body +
      '<div class="eyes"><span class="eye"><i></i></span><span class="eye"><i></i></span></div>' +
      '<div class="crown">' + Art.crownSvg + '</div>' +
      (p.name === 'brenda' && !/nocap/.test(p.cls || '') ? '<div class="acc cap">' + Art.capSvg + '</div>' : '') +
      (p.name === 'gary' ? '<div class="acc plaster">' + Art.plasterSvg + '</div>' : '') +
      (p.kind === 'rule' ? '<div class="rulelabel">' + G.esc(p.label || '') + '</div>' : '');
    e.appendChild(inner);
    var plac = el('div', 'placard');
    e.appendChild(plac);
    e.style.setProperty('--bd', (Math.random() * 6).toFixed(2) + 's');
    e._inner = inner; e._plac = plac;
    return e;
  }
  function placeEl(e, s) {
    e.style.setProperty('--r', s >> 3);
    e.style.setProperty('--c', s & 7);
    e._sq = s;
  }
  // Make the DOM match a state. Pieces that vanished fly away unless opts.instant.
  ui.sync = function (state, opts) {
    opts = opts || {};
    ui.state = state;
    var seen = new Set();
    for (var s = 0; s < 64; s++) {
      var p = state.cells[s];
      if (!p) continue;
      seen.add(p.id);
      var e = pieceEls.get(p.id);
      if (!e) {
        e = makePieceEl(p);
        placeEl(e, s);
        if (!opts.instant) e.classList.add('spawn');
        piecesEl.appendChild(e);
        pieceEls.set(p.id, e);
        (function (e) { setTimeout(function () { e.classList.remove('spawn'); }, 500); })(e);
      } else {
        var cls = pieceClass(p);
        var keep = e.className.match(/\b(hop|wobble|sel-pc|must|spawn|shake|dim|lookup)\b/g) || [];
        e.className = cls + (keep.length ? ' ' + keep.join(' ') : '');
        if (e._sq !== s) placeEl(e, s);
      }
      e._plac.textContent = p.strike ? (p.slogan || 'ON STRIKE') : '';
      if (p.kind === 'rule') {
        var lab = e.querySelector('.rulelabel');
        if (lab && lab.textContent !== p.label) lab.textContent = p.label || '';
      }
    }
    pieceEls.forEach(function (e, id) {
      if (seen.has(id)) return;
      pieceEls.delete(id);
      if (opts.instant) { e.remove(); return; }
      ui.flyAway(e, opts.flyDir);
    });
  };
  ui.flyAway = function (e, dir) {
    var ang = dir ? Math.atan2(dir[0], dir[1]) : Math.random() * Math.PI * 2;
    var dist = 260 + Math.random() * 120;
    e.style.setProperty('--fx', (Math.cos(ang) * dist).toFixed(0) + 'px');
    e.style.setProperty('--fy', (Math.sin(ang) * dist - (dir ? 0 : 120)).toFixed(0) + 'px');
    e.style.setProperty('--fr', ((Math.random() - 0.5) * 1440).toFixed(0) + 'deg');
    e.classList.add('gone');
    setTimeout(function () { e.remove(); }, 900);
  };
  // Forget about a piece's element without removing it, so the caller can animate it out.
  ui.detach = function (id) { var e = pieceEls.get(id); pieceEls.delete(id); return e; };
  ui.placePiece = function (id, s) { var e = pieceEls.get(id); if (e) placeEl(e, s); };
  ui.clearPieces = function () { pieceEls.forEach(function (e) { e.remove(); }); pieceEls.clear(); };
  ui.pieceEl = function (id) { return pieceEls.get(id); };
  ui.pieceElAt = function (s) {
    var p = ui.state && ui.state.cells[s];
    return p ? pieceEls.get(p.id) : null;
  };
  ui.pieceAnim = function (id, cls, ms) {
    var e = pieceEls.get(id);
    if (!e) return;
    e.classList.remove(cls); void e.offsetWidth; e.classList.add(cls);
    setTimeout(function () { e.classList.remove(cls); }, ms || 600);
  };

  // Animate a move hop by hop, then sync to the resulting state.
  ui.animateMove = async function (mv, newState, opts) {
    opts = opts || {};
    var p = ui.state.cells[mv.from];
    var e = p && pieceEls.get(p.id);
    var hopMs = opts.hopMs || 230;
    if (e) {
      e.style.setProperty('--mv', hopMs + 'ms');
      for (var i = (mv._shown || 0) + 1; i < mv.path.length; i++) {
        e.classList.add('moving');
        placeEl(e, mv.path[i]);
        if (mv.caps.length) { e.classList.remove('hop'); void e.offsetWidth; e.classList.add('hop'); }
        await G.wait(hopMs);
        A.play(mv.caps.length ? 'capture' : 'tock');
      }
      e.classList.remove('moving');
    }
    ui.sync(newState, opts);
  };

  // ---------------- highlights ----------------
  ui.highlight = function (h) {
    h = h || {};
    for (var i = 0; i < 64; i++) {
      var s = squareEls[i];
      s.classList.toggle('sel', h.sel === i);
      s.classList.toggle('tgt', !!(h.targets && h.targets.indexOf(i) >= 0));
      s.classList.toggle('last', !!(h.last && h.last.indexOf(i) >= 0));
    }
    pieceEls.forEach(function (e) {
      e.classList.toggle('must', !!(h.must && h.must.indexOf(e._sq) >= 0));
      e.classList.toggle('sel-pc', h.sel === e._sq);
    });
  };
  ui.squareClass = function (s, cls, on) { squareEls[s].classList.toggle(cls, on !== false); };
  ui.clearSquareClass = function (cls) { squareEls.forEach(function (s) { s.classList.remove(cls); }); };
  ui.squareEl = function (s) { return squareEls[s]; };

  // ---------------- input ----------------
  ui.onTap = null;       // function(sq) set by the active controller
  ui.onDrag = null;      // {down(x,y,sq), move(x,y), up(x,y)} for the physics chapter
  ui.talking = false;
  var dragStart = null;
  function boardXY(ev) {
    var r = board.getBoundingClientRect();
    return { x: (ev.clientX - r.left) / r.width * 8, y: (ev.clientY - r.top) / r.height * 8 };
  }
  ui.boardXY = boardXY;
  function onBoardDown(ev) {
    if (ui.talking) return;
    var p = boardXY(ev);
    if (ui.onDrag) {
      ev.preventDefault();
      try { board.setPointerCapture(ev.pointerId); } catch (e) {}
      ui.onDrag.down(p.x, p.y);
      dragStart = p;
      return;
    }
    var c = Math.floor(p.x), r = Math.floor(p.y);
    if (!Rules.inB(r, c)) return;
    if (ui.onTap) ui.onTap(Rules.sq(r, c));
  }
  function onBoardUp(ev) {
    if (ui.onDrag && dragStart) { var p = boardXY(ev); ui.onDrag.up(p.x, p.y); dragStart = null; }
  }
  window.addEventListener('pointermove', function (ev) {
    if (ui.onDrag && dragStart) { var p = boardXY(ev); ui.onDrag.move(p.x, p.y); }
  }, { passive: true });

  // eyes follow the pointer (the pieces are rather taken with you)
  var look = null, lookDirty = false;
  function onLook(ev) { look = { x: ev.clientX, y: ev.clientY }; lookDirty = true; }
  function eyeLoop() {
    if (lookDirty && look && board.classList.contains('awake')) {
      lookDirty = false;
      pieceEls.forEach(function (e) {
        var r = e.getBoundingClientRect();
        var dx = look.x - (r.left + r.width / 2), dy = look.y - (r.top + r.height / 2);
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        var k = Math.min(1, d / 60);
        e.style.setProperty('--ex', (dx / d * k).toFixed(2));
        e.style.setProperty('--ey', (dy / d * k).toFixed(2));
      });
    }
    requestAnimationFrame(eyeLoop);
  }

  // ---------------- dialogue ----------------
  var advance = null, typing = null;
  function onAppDown(ev) {
    if (!ui.talking || !advance) return;
    if (ev.target.closest('#topbar') || ev.target.closest('.choices') || ev.target.closest('#overlay:not(.hidden)')) return;
    ev.preventDefault();
    ev.stopPropagation();
    if (typing) { typing(); return; }
    var f = advance; advance = null; f();
  }
  function parse(text) {
    // *emphasis* only
    var out = [], re = /\*([^*]+)\*/g, last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) out.push({ em: false, s: text.slice(last, m.index) });
      out.push({ em: true, s: m[1] });
      last = re.lastIndex;
    }
    if (last < text.length) out.push({ em: false, s: text.slice(last) });
    return out;
  }
  function typeInto(node, text, voice) {
    return new Promise(function (resolve) {
      node.innerHTML = '';
      var segs = parse(text), si = 0, ci = 0, cur = null, n = 0, done = false;
      function finish() {
        if (done) return; done = true;
        node.innerHTML = '';
        segs.forEach(function (sg) {
          var x = document.createElement(sg.em ? 'em' : 'span'); x.textContent = sg.s; node.appendChild(x);
        });
        typing = null; resolve();
      }
      typing = finish;
      if ((G.auto && G.talkMs < 100) || G.fast) { finish(); return; }
      (function step() {
        if (done) return;
        if (si >= segs.length) { finish(); return; }
        if (!cur) { cur = document.createElement(segs[si].em ? 'em' : 'span'); node.appendChild(cur); }
        var ch = segs[si].s[ci++];
        cur.textContent += ch;
        if (voice && /\w/.test(ch) && (n++ % 2 === 0)) A.play('blip', voice);
        if (ci >= segs[si].s.length) { si++; ci = 0; cur = null; }
        var d = /[.!?]/.test(ch) ? 140 : /[,;:—]/.test(ch) ? 70 : 22;
        setTimeout(step, d);
      })();
    });
  }
  function showSpeaker(who, opts) {
    var sp = SPEAKERS[who] || { name: who };
    dlg.className = 'sp-' + who;
    dlgPortrait.innerHTML = opts.portrait || Art.portrait(who, opts.mood);
    dlgName.textContent = opts.name || sp.name;
    if (who === 'colin' && opts.mood) ui.colin(opts.mood);
    if (who === 'arbiter' && opts.mood && ui.arbiterShown) ui.arbiter(opts.mood);
    return sp;
  }
  // Blocking line of dialogue. Resolves when the player taps.
  ui.say = async function (who, text, opts) {
    opts = opts || {};
    var sp = showSpeaker(who, opts);
    dlgChoices.innerHTML = '';
    ui.talking = true;
    app.classList.add('talking');
    dlg.classList.remove('hidden');
    dlg.classList.remove('done');
    await typeInto(dlgText, text, sp.voice);
    dlg.classList.add('done');
    await new Promise(function (res) {
      advance = res;
      if (G.auto) setTimeout(function () { if (advance === res) { advance = null; res(); } }, G.talkMs);
    });
    if (!opts.keep) ui.endTalk();
  };
  ui.endTalk = function () {
    ui.talking = false;
    advance = null;
    app.classList.remove('talking');
    dlg.classList.add('hidden');
  };
  // Shows choices; resolves with the chosen index.
  ui.choose = async function (options, opts) {
    opts = opts || {};
    var who = opts.who || 'you';
    var sp = showSpeaker(who, opts);
    ui.talking = true;
    app.classList.add('talking');
    dlg.classList.remove('hidden');
    dlg.classList.add('done', 'choosing');
    dlgText.innerHTML = '';
    if (opts.prompt) await typeInto(dlgText, opts.prompt, sp.voice);
    dlgChoices.innerHTML = '';
    return new Promise(function (resolve) {
      options.forEach(function (o, i) {
        var b = el('button', 'choice', G.esc(o));
        b.addEventListener('click', function (ev) {
          ev.stopPropagation();
          A.play('select');
          dlgChoices.innerHTML = '';
          dlg.classList.remove('choosing');
          ui.endTalk();
          resolve(i);
        });
        dlgChoices.appendChild(b);
      });
      if (G.auto) setTimeout(function () {
        var i = opts.autoPick != null ? opts.autoPick : G.rand(options.length);
        var bs = dlgChoices.querySelectorAll('button');
        if (bs[i]) bs[i].click();
      }, G.talkMs);
    });
  };

  // Non-blocking remarks.
  var barkTimer = null;
  ui.bark = function (who, text, ms) {
    ms = ms || 2400;
    if (who === 'colin') {
      var b = $('#colinBark');
      b.textContent = text;
      b.classList.add('on');
      clearTimeout(barkTimer);
      barkTimer = setTimeout(function () { b.classList.remove('on'); }, ms);
      var v = SPEAKERS.colin.voice;
      for (var i = 0; i < Math.min(6, text.length / 4); i++) setTimeout(function () { A.play('blip', v); }, i * 60);
      return;
    }
    if (who === 'narrator' || who === 'caption') { ui.caption(text, ms, who); return; }
    if (who === 'arbiter' && ui.arbiterShown) { arbBubble(text, ms); return; }
    ui.caption(text, ms, who);
  };
  var capTimer = null;
  ui.caption = function (text, ms, who) {
    captionEl.className = 'on cap-' + (who || 'caption');
    captionEl.innerHTML = (who && who !== 'caption' && who !== 'narrator' && SPEAKERS[who] ? '<b>' + G.esc(SPEAKERS[who].name) + ':</b> ' : '') + G.esc(text);
    clearTimeout(capTimer);
    capTimer = setTimeout(function () { captionEl.className = ''; }, ms || 3000);
  };
  // Speech bubble on a board square.
  ui.pieceSay = function (s, text, ms, cls) {
    var b = el('div', 'bubble ' + (cls || ''), G.esc(text));
    b.style.setProperty('--r', s >> 3); b.style.setProperty('--c', s & 7);
    if ((s & 7) <= 1) b.classList.add('left'); else if ((s & 7) >= 6) b.classList.add('right');
    if ((s >> 3) === 0) b.classList.add('below');
    fxEl.appendChild(b);
    setTimeout(function () { b.classList.add('out'); }, ms || 1800);
    setTimeout(function () { b.remove(); }, (ms || 1800) + 400);
    return b;
  };
  ui.floatText = function (s, text, cls) {
    var b = el('div', 'floater ' + (cls || ''), G.esc(text));
    b.style.setProperty('--r', s >> 3); b.style.setProperty('--c', s & 7);
    fxEl.appendChild(b);
    setTimeout(function () { b.remove(); }, 1400);
  };
  ui.fx = function () { return fxEl; };

  // ---------------- COLIN & the Arbiter ----------------
  ui.colin = function (mood) {
    var a = $('#colinAvatar');
    if (a._mood === mood) return;
    a._mood = mood;
    a.innerHTML = Art.colin(mood);
  };
  ui.arbiterShown = false;
  var arbMood = null;
  ui.arbiter = function (mood) {
    var a = $('#arbiter');
    if (!ui.arbiterShown) {
      ui.arbiterShown = true;
      a.classList.add('in');
    }
    if (mood && mood !== arbMood) {
      arbMood = mood;
      a.innerHTML = Art.arbiterFull(mood) + '<div class="arbBubble"></div>';
    }
  };
  ui.arbiterHide = function () {
    ui.arbiterShown = false;
    $('#arbiter').classList.remove('in');
  };
  function arbBubble(text, ms) {
    var b = $('#arbiter .arbBubble');
    if (!b) return;
    b.textContent = text; b.classList.add('on');
    setTimeout(function () { b.classList.remove('on'); }, ms || 2000);
  }
  ui.whistle = async function () {
    A.play('whistle');
    var w = el('div', 'phweet', 'PHWEEEEET!');
    $('#stage').appendChild(w);
    ui.shake();
    setTimeout(function () { w.remove(); }, 1200);
    await G.wait(600);
  };

  // ---------------- effects ----------------
  ui.shake = function (big) {
    var s = $('#stage');
    s.classList.remove('shake', 'bigshake'); void s.offsetWidth;
    s.classList.add(big ? 'bigshake' : 'shake');
    setTimeout(function () { s.classList.remove('shake', 'bigshake'); }, 600);
  };
  ui.flash = function (color) {
    var f = el('div', 'flash');
    if (color) f.style.background = color;
    document.body.appendChild(f);
    setTimeout(function () { f.remove(); }, 700);
  };
  ui.confetti = function (n, chars) {
    var layer = el('div', 'confetti');
    document.body.appendChild(layer);
    for (var i = 0; i < (n || 40); i++) {
      var c = el('i', '', chars ? G.pick(chars) : '');
      c.style.left = Math.random() * 100 + 'vw';
      c.style.setProperty('--d', (1.5 + Math.random() * 2).toFixed(2) + 's');
      c.style.setProperty('--x', ((Math.random() - 0.5) * 200).toFixed(0) + 'px');
      c.style.setProperty('--h', G.rand(360));
      c.style.animationDelay = (Math.random() * 0.8).toFixed(2) + 's';
      if (chars) c.className = 'char';
      layer.appendChild(c);
    }
    setTimeout(function () { layer.remove(); }, 5000);
  };

  // ---------------- overlay cards ----------------
  var overlay;
  ui.overlay = function (html, cls) {
    overlay = $('#overlay');
    overlay.className = cls || '';
    overlay.innerHTML = html;
    return overlay;
  };
  ui.overlayHide = function () {
    overlay = $('#overlay');
    overlay.className = 'hidden';
    overlay.innerHTML = '';
  };
  // Generic card with buttons. Resolves with the index of the button pressed.
  ui.card = function (o) {
    return new Promise(function (resolve) {
      var html = '<div class="card ' + (o.cls || '') + '">' +
        (o.kicker ? '<div class="kicker">' + o.kicker + '</div>' : '') +
        (o.title ? '<h1>' + o.title + '</h1>' : '') +
        (o.sub ? '<div class="sub">' + o.sub + '</div>' : '') +
        (o.body ? '<div class="cbody">' + o.body + '</div>' : '') +
        '<div class="cbtns"></div></div>';
      var ov = ui.overlay(html, 'show ' + (o.ocls || ''));
      var btns = $('.cbtns', ov);
      (o.buttons || ['Continue']).forEach(function (b, i) {
        var bt = el('button', 'btn' + (i === 0 ? ' primary' : ''), b);
        bt.addEventListener('click', function () {
          A.unlock(); A.play('select');
          if (!o.keep) ui.overlayHide();
          resolve(i);
        });
        btns.appendChild(bt);
      });
      if (G.auto) setTimeout(function () {
        var bs = btns.querySelectorAll('button');
        var i = o.autoPick || 0;
        if (bs[i]) bs[i].click();
      }, 10);
    });
  };
})();

// The big zoom out, and the credits.
(function () {
  var ui = G.ui, A = G.audio;
  var C = G.cut = {};

  // ---------- frames: each one contains the previous one, nested inside its "inner" square ----------
  function boardFrame(pupil) {
    var s = '<rect width="100" height="100" fill="#5c3b25"/>' +
      '<path d="M0 8 Q50 5 100 9 M0 30 Q50 27 100 31 M0 91 Q50 88 100 92 M0 70 Q50 73 100 69" stroke="#4a2e1c" stroke-width="0.8" fill="none"/>' +
      '<rect x="16.5" y="16.5" width="67" height="67" fill="#3a2416"/><rect x="18" y="18" width="64" height="64" fill="#e8d3b0"/>';
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) if ((r + c) & 1) s += '<rect x="' + (18 + c * 8) + '" y="' + (18 + r * 8) + '" width="8" height="8" fill="#7a4b2a"/>';
    var red = [[5, 0], [5, 4], [6, 1], [6, 5], [7, 2], [4, 3]], blk = [[0, 3], [1, 2], [1, 6], [2, 1], [2, 5], [3, 4]];
    red.forEach(function (p) { s += '<circle cx="' + (22 + p[1] * 8) + '" cy="' + (22 + p[0] * 8) + '" r="3.2" fill="#c43a2f" stroke="#7c1d16" stroke-width=".8"/>'; });
    blk.forEach(function (p) { s += '<circle cx="' + (22 + p[1] * 8) + '" cy="' + (22 + p[0] * 8) + '" r="3.2" fill="#2d2d32" stroke="#0e0e10" stroke-width=".8"/>'; });
    // Gary, going over the top edge
    s += '<circle cx="58" cy="13" r="3.8" fill="#c43a2f" stroke="#7c1d16" stroke-width=".8"/>' +
      '<rect x="59.5" y="9.3" width="3" height="1.2" rx=".5" fill="#e8c39a" transform="rotate(30 61 10)"/>' +
      '<circle cx="56.8" cy="12.8" r="1.05" fill="#fff"/><circle cx="59.3" cy="12.8" r="1.05" fill="#fff"/>' +
      '<circle cx="56.9" cy="12.9" r=".5" fill="#000"/><circle cx="59.3" cy="12.9" r=".5" fill="#000"/>';
    if (pupil) s += nest(pupil, { x: 59.06, y: 12.66, w: 0.48 });
    return s;
  }
  function nest(content, i) {
    return '<svg x="' + i.x + '" y="' + i.y + '" width="' + i.w + '" height="' + i.w + '" viewBox="0 0 100 100">' + content + '</svg>';
  }
  function hand(skin, bg, inner, extra) {
    return '<rect width="100" height="100" fill="' + bg + '"/>' + (extra || '') +
      '<path d="M14 100 L20 72 Q26 60 40 63 L60 63 Q74 60 80 72 L86 100 Z" fill="' + skin + '"/>' +
      '<rect x="29" y="12" width="42" height="76" rx="6" fill="#1b1b1f"/><rect x="32" y="18" width="36" height="64" rx="2" fill="#111"/>' +
      '<rect x="45" y="21" width="10" height="8" rx="1.5" fill="#d8cdb0"/><rect x="47" y="22.5" width="6" height="5" fill="#0b1d10"/>' +
      '<rect x="34" y="71" width="32" height="9" rx="1.5" fill="#2d2520"/>' +
      nest(inner, { x: 32, y: 32, w: 36 }) +
      '<ellipse cx="28" cy="44" rx="3.5" ry="5" fill="' + skin + '"/><ellipse cx="27.5" cy="55" rx="3.5" ry="5" fill="' + skin + '"/><ellipse cx="28" cy="66" rx="3.5" ry="5" fill="' + skin + '"/>' +
      '<ellipse cx="72.5" cy="58" rx="3.5" ry="8" fill="' + skin + '"/>';
  }
  function room(inner) {
    var rain = '';
    for (var i = 0; i < 9; i++) rain += '<line x1="' + (8 + i * 2.8) + '" y1="17" x2="' + (7 + i * 2.8) + '" y2="' + (24 + (i % 3) * 6) + '" stroke="#7d93c4" stroke-width=".4"/>';
    return '<rect width="100" height="100" fill="#6b5446"/><rect y="84" width="100" height="16" fill="#4a3528"/>' +
      '<rect x="6" y="14" width="26" height="30" fill="#1c2a44" stroke="#e8dcc8" stroke-width="2"/>' + rain +
      '<line x1="19" y1="14" x2="19" y2="44" stroke="#e8dcc8" stroke-width="1.2"/>' +
      '<circle cx="88" cy="38" r="18" fill="#ffd98a" opacity=".22"/><line x1="88" y1="40" x2="88" y2="84" stroke="#333" stroke-width="1.5"/>' +
      '<path d="M80 40 L96 40 L92 28 L84 28 Z" fill="#e9c97a"/>' +
      '<rect x="16" y="44" width="68" height="26" rx="6" fill="#4b3b5a"/><rect x="12" y="62" width="76" height="22" rx="5" fill="#43344f"/>' +
      '<rect x="9" y="52" width="10" height="32" rx="4" fill="#3d2f48"/><rect x="81" y="52" width="10" height="32" rx="4" fill="#3d2f48"/>' +
      '<path d="M41 46 Q50 42 59 46 L61 64 L39 64 Z" fill="#7c3a3a"/>' +
      '<circle cx="50" cy="37" r="7" fill="#e0ad87"/><path d="M43 35 Q50 26 57 35 Q55 30 50 30 Q45 30 43 35 Z" fill="#3b2a22"/>' +
      '<path d="M42 50 L47 64" stroke="#7c3a3a" stroke-width="3.2" stroke-linecap="round"/><path d="M58 50 L53 64" stroke="#7c3a3a" stroke-width="3.2" stroke-linecap="round"/>' +
      '<path d="M44 70 L40 92" stroke="#2c3550" stroke-width="5" stroke-linecap="round"/><path d="M56 70 L60 92" stroke="#2c3550" stroke-width="5" stroke-linecap="round"/>' +
      nest(inner, { x: 47, y: 62, w: 6 }) +
      '<rect x="88" y="66" width="10" height="18" fill="#5a4030"/><rect x="90" y="60" width="5" height="6" rx="1" fill="#e8e0d0"/>' +
      '<path d="M91 58 Q90 55 92 53 M93.5 58 Q92.5 55 94.5 52" stroke="#fff" stroke-width=".5" fill="none" opacity=".7"/>';
  }
  function house(inner) {
    var stars = '';
    for (var i = 0; i < 25; i++) stars += '<circle cx="' + ((i * 37) % 100) + '" cy="' + ((i * 53) % 36) + '" r=".35" fill="#fff" opacity=".7"/>';
    return '<rect width="100" height="100" fill="#141a33"/>' + stars + '<circle cx="84" cy="12" r="5" fill="#f1ecd2"/>' +
      '<rect y="80" width="100" height="20" fill="#1d2a1d"/>' +
      '<rect x="14" y="44" width="72" height="38" fill="#8a5a44"/><line x1="50" y1="44" x2="50" y2="82" stroke="#6b4434" stroke-width="1"/>' +
      '<path d="M10 46 L50 20 L90 46 Z" fill="#3b2b2b"/><rect x="24" y="22" width="6" height="14" fill="#6b4434"/><rect x="70" y="22" width="6" height="14" fill="#6b4434"/>' +
      '<rect x="20" y="50" width="10" height="10" fill="#222a3a"/><rect x="34" y="50" width="10" height="10" fill="#222a3a"/>' +
      '<rect x="74" y="50" width="10" height="10" fill="#222a3a"/>' +
      '<rect x="59" y="49" width="12" height="12" fill="#ffd98a" opacity=".35"/>' +
      nest(inner, { x: 60, y: 50, w: 10 }) +
      '<rect x="60" y="50" width="10" height="10" fill="none" stroke="#e8dcc8" stroke-width=".6"/>' +
      '<rect x="22" y="66" width="8" height="16" fill="#2b3b5a"/><rect x="70" y="66" width="8" height="16" fill="#5a2b2b"/>' +
      '<rect x="36" y="66" width="8" height="8" fill="#222a3a"/><rect x="56" y="66" width="8" height="8" fill="#222a3a"/>' +
      '<rect x="0" y="78" width="12" height="6" rx="3" fill="#1f3a20"/><rect x="88" y="78" width="12" height="6" rx="3" fill="#1f3a20"/>';
  }
  function island(inner) {
    var clouds = '';
    [[30, 30, 14], [70, 50, 12], [45, 80, 16], [20, 65, 10], [80, 20, 12]].forEach(function (c) {
      clouds += '<ellipse cx="' + c[0] + '" cy="' + c[1] + '" rx="' + c[2] + '" ry="' + (c[2] / 2.4) + '" fill="#c9ced6" opacity=".35"/>';
    });
    return '<rect width="100" height="100" fill="#1b3a5a"/>' +
      '<path d="M48 8 Q56 6 58 14 Q62 20 56 26 Q62 30 60 36 Q66 42 64 50 Q72 58 70 66 Q74 74 64 78 Q58 82 46 82 Q36 86 28 90 Q34 82 40 78 Q34 74 38 68 Q32 64 36 58 Q42 54 44 48 Q40 42 44 36 Q38 30 42 22 Q40 14 48 8 Z" fill="#2f5a32"/>' +
      '<path d="M24 40 Q30 36 32 44 Q30 52 24 50 Q20 46 24 40 Z" fill="#2f5a32"/>' +
      '<circle cx="56" cy="62" r="2.2" fill="#ffd98a" opacity=".55"/>' +
      nest(inner, { x: 55.4, y: 61.4, w: 1.2 }) + clouds;
  }
  function earth(inner) {
    var stars = '';
    for (var i = 0; i < 40; i++) stars += '<circle cx="' + ((i * 41) % 100) + '" cy="' + ((i * 67) % 100) + '" r=".3" fill="#fff" opacity=".6"/>';
    return '<rect width="100" height="100" fill="#05060d"/>' + stars +
      '<circle cx="50" cy="50" r="30" fill="#1b3a5a"/>' +
      '<path d="M30 40 Q36 30 44 36 Q42 46 34 50 Q28 48 30 40 Z M52 40 Q62 36 70 44 Q74 56 64 64 Q56 70 54 60 Q50 50 52 40 Z M36 62 Q44 60 46 70 Q40 76 34 72 Z" fill="#2f5a32"/>' +
      '<path d="M26 56 Q40 52 52 58 M58 30 Q66 26 74 32" stroke="#fff" stroke-width="1.6" fill="none" opacity=".6" stroke-linecap="round"/>' +
      nest(inner, { x: 46.5, y: 28.5, w: 3 }) +
      '<circle cx="50" cy="50" r="30" fill="none" stroke="#7fb3ff" stroke-width=".8" opacity=".5"/>';
  }
  function galaxy(inner) {
    var s = '<rect width="100" height="100" fill="#000"/>';
    for (var i = 0; i < 50; i++) s += '<circle cx="' + ((i * 29) % 100) + '" cy="' + ((i * 71) % 100) + '" r=".25" fill="#fff" opacity=".5"/>';
    for (var a = 0; a < 6; a++) s += '<ellipse cx="50" cy="50" rx="36" ry="10" fill="#b9a5ff" opacity=".09" transform="rotate(' + (a * 30) + ' 50 50)"/>';
    for (var k = 0; k < 120; k++) {
      var t = k / 120 * Math.PI * 4, rr = 4 + k / 120 * 34, arm = k % 2 ? Math.PI : 0;
      s += '<circle cx="' + (50 + Math.cos(t + arm) * rr).toFixed(1) + '" cy="' + (50 + Math.sin(t + arm) * rr * 0.6).toFixed(1) + '" r="' + (0.4 + (k % 3) * 0.3) + '" fill="#e7dcff" opacity=".7"/>';
    }
    s += '<circle cx="50" cy="50" r="6" fill="#fff4d6" opacity=".9"/>';
    return s + nest(inner, { x: 62, y: 44, w: 1.5 });
  }
  function cosmicBoard(inner) {
    var s = '<rect width="100" height="100" fill="#000"/><rect x="9" y="9" width="82" height="82" fill="#6a4fd1" opacity=".6"/>';
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
      s += '<rect x="' + (10 + c * 10) + '" y="' + (10 + r * 10) + '" width="10" height="10" fill="' + ((r + c) & 1 ? '#000' : '#241a3d') + '"/>';
    }
    [[0, 1], [1, 4], [2, 1], [2, 7], [5, 0], [5, 6], [6, 3], [7, 4]].forEach(function (p, i) {
      var cx = 15 + p[1] * 10, cy = 15 + p[0] * 10, col = i % 2 ? '#ff8a7a' : '#e7dcff';
      s += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="3.6" ry="1.6" fill="' + col + '" opacity=".6" transform="rotate(' + (i * 40) + ' ' + cx + ' ' + cy + ')"/><circle cx="' + cx + '" cy="' + cy + '" r="1" fill="#fff"/>';
    });
    return s + nest(inner, { x: 40, y: 50, w: 10 });
  }
  function cosmicHand(inner) {
    var neb = '<circle cx="15" cy="20" r="25" fill="#5a2a8a" opacity=".35"/><circle cx="90" cy="80" r="30" fill="#2a4a8a" opacity=".3"/>';
    for (var i = 0; i < 40; i++) neb += '<circle cx="' + ((i * 43) % 100) + '" cy="' + ((i * 31) % 100) + '" r=".35" fill="#fff" opacity=".7"/>';
    var finger = '<path d="M64 -4 L64 18 Q64 28 58 29 Q52 28 52 18 L52 -4 Z" fill="#8b6fd0" stroke="#4a3590" stroke-width=".8"/>' +
      '<path d="M54.5 22 Q58 25.5 61.5 22" stroke="#4a3590" stroke-width=".7" fill="none"/><ellipse cx="58" cy="25" rx="3.6" ry="2.6" fill="#b9a5ff" opacity=".7"/>';
    return hand('#8b6fd0', '#0b0620', inner, neb) + finger;
  }

  var STEPS = [
    { cap: 'Gary went over the edge of the board.' },
    { f: function (p) { return hand('#e0ad87', '#43344f', p); }, inner: { x: 32, y: 32, w: 36 }, cap: 'Past the edge of the board was a screen. The screen was a phone. The phone was in a hand.' },
    { f: room, inner: { x: 47, y: 62, w: 6 }, cap: 'The hand belonged to someone on a sofa, whose tea was going cold.', line: ['gary', 'Is that... the *Finger*?'] },
    { f: house, inner: { x: 60, y: 50, w: 10 }, cap: 'The sofa was in a semi-detached house in Kettering.' },
    { f: island, inner: { x: 55.4, y: 61.4, w: 1.2 }, cap: 'Kettering was on an island that was mostly drizzle.' },
    { f: earth, inner: { x: 46.5, y: 28.5, w: 3 }, cap: 'The island was on a small, damp, blue planet.' },
    { f: galaxy, inner: { x: 62, y: 44, w: 1.5 }, cap: 'The planet was in a perfectly ordinary galaxy…' },
    { f: cosmicBoard, inner: { x: 40, y: 50, w: 10 }, cap: '…which was sitting on a dark square. Of a board.' },
    { f: cosmicHand, inner: { x: 32, y: 32, w: 36 }, cap: 'Above the board hovered an enormous Finger. The Finger belonged to a hand. The hand was holding a phone.', line: ['gary', 'EVEN THE FINGER HAS A FINGER?!'] },
    { f: boardFrame, inner: { x: 59.06, y: 12.66, w: 0.48 }, cap: 'And the phone was in the eye of a small red draughts piece called Gary. Who was falling off the edge of a board.', line: ['gary', '...Oh. It’s just us again.'] }
  ];

  function animateBox(svg, from, to, ms) {
    return new Promise(function (res) {
      if (G.fast) { svg.setAttribute('viewBox', to.x + ' ' + to.y + ' ' + to.w + ' ' + to.w); res(); return; }
      var t0 = performance.now();
      // zoom around the fixed point so it feels like one continuous camera move
      var u = (from.x - to.x) / ((from.w - to.w) || 1e-9), v = (from.y - to.y) / ((from.w - to.w) || 1e-9);
      var Fx = from.x - from.w * u, Fy = from.y - from.w * v;
      var lf = Math.log(from.w), lt = Math.log(to.w);
      (function step(now) {
        var k = Math.min(1, (now - t0) / ms);
        var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        var w = Math.exp(lf + (lt - lf) * e);
        var x = Fx + w * u, y = Fy + w * v;
        svg.setAttribute('viewBox', x + ' ' + y + ' ' + w + ' ' + w);
        if (k < 1) requestAnimationFrame(step); else res();
      })(t0);
    });
  }
  function tapOrWait(ov, ms) {
    return new Promise(function (res) {
      var done = false;
      function f() { if (done) return; done = true; ov.removeEventListener('pointerdown', f); res(); }
      ov.addEventListener('pointerdown', f);
      setTimeout(f, G.fast ? 20 : ms);
    });
  }

  C.zoomOut = async function () {
    var ov = ui.overlay('<div class="zoom"><svg class="zsvg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"></svg>' +
      '<div class="zcap"></div><div class="zline"></div><div class="zhint">tap to continue</div></div>', 'show zoomov');
    var svg = ov.querySelector('.zsvg'), cap = ov.querySelector('.zcap'), line = ov.querySelector('.zline');
    var content = boardFrame(null);
    svg.innerHTML = content;
    A.play('whoosh');
    for (var i = 0; i < STEPS.length; i++) {
      var st = STEPS[i];
      line.classList.remove('on');
      if (st.f) {
        content = st.f(content);
        svg.setAttribute('viewBox', st.inner.x + ' ' + st.inner.y + ' ' + st.inner.w + ' ' + st.inner.w);
        svg.innerHTML = content;
        cap.classList.remove('on');
        var span = Math.log(100 / st.inner.w);
        A.play('whoosh');
        await animateBox(svg, st.inner, { x: 0, y: 0, w: 100 }, 900 + span * 420);
      }
      cap.textContent = st.cap;
      cap.classList.add('on');
      if (st.line) {
        await G.wait(900);
        line.innerHTML = '<b>' + ui.SPEAKERS[st.line[0]].name + ':</b> ' + G.esc(st.line[1]).replace(/\*([^*]+)\*/g, '<em>$1</em>');
        line.classList.add('on');
        A.play('blip', ui.SPEAKERS[st.line[0]].voice);
      }
      await tapOrWait(ov, st.line ? 4200 : 3200);
    }
    await G.wait(400);
    ui.overlayHide();
  };

  // ---------- credits ----------
  C.credits = async function () {
    var lines = [
      ['h', 'DAFTS'],
      ['s', 'a game of draughts, mostly'],
      ['g', ''],
      ['k', 'Starring'],
      ['r', 'Gary', 'red, front row, wears a plaster'],
      ['r', 'Brenda', 'black, shop steward, NUDAC'],
      ['r', 'COLIN', '1985–present (resting)'],
      ['r', 'The Arbiter', 'formerly'],
      ['r', 'The Narrator', 'as himself'],
      ['r', 'The Pigeon', 'Coo'],
      ['r', 'The Duck', 'Quack'],
      ['r', 'A Bit of Sky', 'from a 1,000-piece lighthouse'],
      ['g', ''],
      ['k', 'Featuring'],
      ['r', 'Twelve red men, twelve black men', 'same tree'],
      ['r', 'Every piece ever sent to the Box', ''],
      ['g', ''],
      ['k', 'With thanks to'],
      ['r', 'William Payne', 'who wrote the rules down in 1756'],
      ['r', 'Dr M. Ainsworth', 'and her cat'],
      ['r', 'Whoever left the window open', ''],
      ['g', ''],
      ['s', 'No pieces were permanently harmed. Several were flipped.'],
      ['g', ''],
      ['s', 'Thank you for playing.']
    ];
    var html = lines.map(function (l) {
      if (l[0] === 'h') return '<h1 class="dafts-title">' + l[1] + '</h1>';
      if (l[0] === 's') return '<p class="cs">' + l[1] + '</p>';
      if (l[0] === 'k') return '<p class="ck">' + l[1] + '</p>';
      if (l[0] === 'g') return '<div class="cg"></div>';
      return '<p class="cr"><b>' + l[1] + '</b>' + (l[2] ? '<span>' + l[2] + '</span>' : '') + '</p>';
    }).join('');
    var ov = ui.overlay('<div class="credits"><div class="roll">' + html + '</div></div>', 'show creditsov');
    A.play('fanfare');
    var roll = ov.querySelector('.roll');
    await tapOrWait(ov, 600);
    roll.classList.add('go');
    await new Promise(function (res) {
      var done = false;
      function f() { if (done) return; done = true; res(); }
      roll.addEventListener('animationend', f);
      setTimeout(f, G.fast ? 30 : 32000);
      ov.addEventListener('dblclick', f);
    });
    ui.overlayHide();
  };
})();

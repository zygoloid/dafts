// Title screen, menus, chapter flow, House Rules.
(function () {
  var ui = G.ui, A = G.audio, P = G.play, Rules = G.rules, AI = G.ai;
  var M = G.main = {};
  var LOG = window.__dafts = { log: [], errors: [] };
  function log(x) { LOG.log.push(x); if (G.debug) console.log('[dafts]', x); }
  window.addEventListener('error', function (e) { LOG.errors.push(String(e.message) + ' @' + e.filename + ':' + e.lineno); });
  window.addEventListener('unhandledrejection', function (e) { LOG.errors.push('promise: ' + (e.reason && (e.reason.stack || e.reason.message) || e.reason)); });

  function go(hash) {
    location.hash = hash || '';
    location.reload();
  }

  // ---------------- title ----------------
  function letters(ending) {
    var w = 'DRAUGHTS'.split(''), mc = G.save.maxChapter || 0;
    return w.map(function (ch, i) {
      var drop = i === 1 || i === 3 || i === 4 || i === 5;
      var cls = '';
      if (G.save.done && !ending) cls = drop ? 'hidden' : '';
      else if (drop && (mc >= 7 || (mc >= 4 && (i === 1 || i === 4)) || (mc >= 1 && i === 1))) cls = 'loose';
      return '<span data-i="' + i + '" class="' + cls + '">' + ch + '</span>' +
        (i === 2 ? '<span class="newF ' + (G.save.done && !ending ? '' : 'hidden') + '">F</span>' : '');
    }).join('');
  }
  M.title = async function (ending) {
    G.storyReset && G.storyReset();
    ui.clearPieces();
    ui.title('');
    ui.boardClass('awake', false);
    var s = G.save, started = (s.maxChapter || 0) > 0 || s.chapter > 0;
    document.title = s.done ? 'Dafts' : 'Draughts';
    var btns = [];
    if (s.done) btns.push(['house', 'House Rules', 'primary']);
    else if (started) btns.push(['continue', 'Continue', 'primary']);
    else btns.push(['play', 'Play', 'primary']);
    if (started || s.done) btns.push(['chapters', 'Chapter select', '']);
    if (started || s.done) btns.push(['new', 'New game', '']);
    btns.push(['rules', s.done ? 'Rules (amended)' : 'How to play', '']);
    var html = '<div class="title-screen">' +
      '<div class="mini"><i class="r"></i><i class="b"></i><i class="r"></i><i class="b"></i></div>' +
      '<div class="logo">' + letters(ending) + '</div>' +
      '<div class="tag">' + (s.done ? 'a game of draughts, mostly' : 'A traditional game for one player and one computer.') + '</div>' +
      btns.map(function (b) { return '<button class="btn ' + b[2] + '" data-a="' + b[0] + '">' + b[1] + '</button>'; }).join('') +
      '<div class="foot">' + (s.done ? 'Thank you for playing.' : 'Version 1.0 · English draughts · 8×8') + '</div>' +
      '</div>';
    var ov = ui.overlay(html, 'show');
    if (ending) await animateEnding(ov);
    return new Promise(function (resolve) {
      ov.querySelectorAll('button[data-a]').forEach(function (b) {
        G.onPress(b, function () { A.unlock(); A.play('select'); resolve(b.getAttribute('data-a')); });
      });
    }).then(async function (a) {
      if (a === 'play' || a === 'continue') { ui.overlayHide(); return M.playChapter(a === 'play' ? 0 : (s.chapter || 0)); }
      if (a === 'new') {
        var ok = await ui.card({ title: 'Start again?', sub: 'Your progress will be forgotten. COLIN will pretend not to remember you.', buttons: ['Start again', 'Cancel'] });
        if (ok === 0) { var muted = G.save.muted, done = G.save.done; G.save = { chapter: 0, maxChapter: done ? 9 : 0, captured: 0, done: done, muted: muted, seen: [], fails: {} }; G.save.chapter = 0; G.writeSave(); go(''); return; }
        return M.title();
      }
      if (a === 'chapters') return M.chapterSelect();
      if (a === 'rules') return M.rulesPage();
      if (a === 'house') return M.houseRules();
    });
  };
  async function animateEnding(ov) {
    var spans = ov.querySelectorAll('.logo span[data-i]');
    await G.wait(900);
    for (var i = 0; i < spans.length; i++) {
      var k = +spans[i].getAttribute('data-i');
      if (k === 1 || k === 3 || k === 4 || k === 5) {
        spans[i].classList.remove('loose');
        spans[i].classList.add('fallen');
        A.play('bonk', 0.8);
        await G.wait(380);
      }
    }
    await G.wait(600);
    spans.forEach(function (sp) { if (sp.classList.contains('fallen')) sp.classList.add('hidden'); });
    var f = ov.querySelector('.newF');
    f.classList.remove('hidden');
    f.classList.add('loose');
    A.play('crown');
    document.title = 'Dafts';
    await G.wait(800);
  }

  // opts.pick(i) / opts.back() override what happens next (the pause menu reloads into the chapter).
  M.chapterSelect = async function (opts) {
    opts = opts || {};
    var max = G.save.done ? G.chapters.length - 1 : (G.save.maxChapter || 0);
    var html = '<div class="card"><h1>Chapters</h1><div class="chapgrid">' + G.chapters.map(function (c, i) {
      return '<button data-i="' + i + '"' + (i > max ? ' disabled' : '') + '>' + (i + 1) + '. ' + (i > max ? '???' : c.title) + '<small>' + (i > max ? 'Not yet.' : c.sub) + '</small></button>';
    }).join('') + '</div><button class="btn" data-back>Back</button></div>';
    var ov = ui.overlay(html, 'show');
    return new Promise(function (resolve) {
      ov.querySelectorAll('.chapgrid button').forEach(function (b) {
        G.onPress(b, function () {
          A.unlock(); A.play('select');
          var i = +b.getAttribute('data-i');
          if (opts.pick) { resolve(opts.pick(i)); return; }
          ui.overlayHide(); resolve(M.playChapter(i, true));
        });
      });
      G.onPress(ov.querySelector('[data-back]'), function () { A.play('select'); resolve(opts.back ? opts.back() : M.title()); });
    });
  };

  M.rulesPage = async function () {
    var d = G.save.done;
    var items = [
      ['The board has 64 squares. Only the 32 dark squares are used.', 'All 64, if you like.'],
      ['Red moves up the board; black moves down. Pieces move one square diagonally forwards.', 'Any direction. Any distance. Backwards is fine. Sideways is fine.'],
      ['Capture by jumping over an enemy piece into the empty square beyond. You can chain jumps together.', null],
      ['If you can capture, you must.', 'You may capture, if you fancy it.'],
      ['Reach the far row and your piece is crowned king. Kings can move backwards. Being crowned ends your move, even in the middle of a capture.', 'Everyone is a king. Crowns for all.'],
      ['A player who cannot move loses.', 'Nobody loses.'],
      ['The players move alternately.', 'Mostly.']
    ];
    var body = '<ol class="rulesbody">' + items.map(function (it) {
      return '<li>' + (d && it[1] ? '<s>' + it[0] + '</s> <span class="amend">' + it[1] + '</span>' : it[0]) + '</li>';
    }).join('') + '</ol>' + (d ? '<p class="rulesbody amend">§0: The Arbiter may do whatever is necessary to keep the game a game. (He mostly blows his whistle now. It plays a little tune.)</p>' : '');
    await ui.card({ title: d ? 'The Rules (amended)' : 'How to play', body: body, buttons: ['Back'] });
    return M.title();
  };

  // ---------------- chapters ----------------
  M.playChapter = async function (i, fromSelect) {
    var ch = G.chapters[i];
    if (!ch) return M.title();
    G.save.chapter = i;
    G.save.maxChapter = Math.max(G.save.maxChapter || 0, i);
    G.writeSave();
    P.metArbiter = i >= 1;
    ui.title(i === 0 ? 'Draughts' : 'Chapter ' + (i + 1) + ' · ' + ch.title);
    log('start:' + i);
    if (!ch.noCard) {
      await ui.card({ kicker: 'Chapter ' + (i + 1), title: ch.title, sub: ch.sub, body: '<div class="acr">' + ch.acr + '</div>', cls: 'chapter', buttons: ['Begin'] });
    } else if (fromSelect || location.hash) {
      await ui.card({ title: 'Draughts', sub: 'A perfectly ordinary game.', buttons: ['Begin'] });
    }
    while (true) {
      var r;
      ui.introStart('intro' + i);
      try { r = await ch.run(); }
      catch (e) { LOG.errors.push('chapter ' + i + ': ' + (e.stack || e)); throw e; }
      ui.introDone();
      log('result:' + i + ':' + r);
      if (r === 'win') break;
      A.play('lose');
      G.save.fails = G.save.fails || {};
      G.save.fails[i] = (G.save.fails[i] || 0) + 1;
      G.writeSave();
      var btns = ['Try again'];
      if (G.save.fails[i] >= 2) btns.push('Skip this bit');
      var b = await ui.card({ cls: 'fail', title: 'Oh dear.', sub: ch.fail || 'That didn’t go to plan.', buttons: btns });
      G.storyReset();
      ui.clearPieces();
      if (b === 1) break;
    }
    G.storyReset();
    if (i + 1 < G.chapters.length) {
      G.save.chapter = i + 1;
      G.save.maxChapter = Math.max(G.save.maxChapter || 0, i + 1);
      G.writeSave();
      return M.playChapter(i + 1);
    }
    G.save.done = true;
    G.save.chapter = 0;
    G.writeSave();
    log('finished');
    ui.colin('sleep');
    await G.cut.credits();
    return M.title(true);
  };

  // ---------------- House Rules ----------------
  var HOUSE = [
    ['forced', 'You must take', 'Compulsory captures', true],
    ['flying', 'Flying kings', 'Kings slide any distance', false],
    ['back', 'Backwards men', 'Men can move and capture backwards', false],
    ['crownjump', 'Crowned and carrying on', 'A man crowned mid-capture keeps jumping as a king', false],
    ['flip', 'Same tree', 'Captured pieces change sides', false],
    ['wind', 'A bit of a draught', 'Gusts every couple of turns', false],
    ['eggs', 'Mating season', 'Pairs of pieces lay eggs', false],
    ['strike', 'Industrial action', 'Random pieces go on strike', false],
    ['chaos', 'Random nonsense', 'Adverts, cats, Morris dancers…', true]
  ];
  M.houseRules = async function () {
    var hr = G.save.house || {};
    HOUSE.forEach(function (h) { if (!(h[0] in hr)) hr[h[0]] = h[3]; });
    if (!hr.colin) hr.colin = 'proper';
    var body = '<div class="toggles">' + HOUSE.map(function (h) {
      return '<label><input type="checkbox" data-k="' + h[0] + '"' + (hr[h[0]] ? ' checked' : '') + '><span>' + h[1] + '<small>' + h[2] + '</small></span></label>';
    }).join('') +
      '<label><span>COLIN<small>How hard should he try?</small></span><select data-colin>' +
      [['gentle', 'Gentle'], ['proper', 'Proper'], ['pigeon', 'Pigeon']].map(function (o) { return '<option value="' + o[0] + '"' + (hr.colin === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') +
      '</select></label></div>';
    var p = ui.card({ title: 'House Rules', sub: 'Every house has its own. These are yours.', body: body, buttons: ['Play', 'Back'], keep: true });
    var ov = document.querySelector('#overlay');
    ov.querySelectorAll('input[data-k]').forEach(function (c) { c.addEventListener('change', function () { hr[c.getAttribute('data-k')] = c.checked; }); });
    ov.querySelector('select[data-colin]').addEventListener('change', function (e) { hr.colin = e.target.value; });
    var b = await p;
    ui.overlayHide();
    G.save.house = hr; G.writeSave();
    if (b === 1) return M.title();
    return M.playHouse(hr);
  };
  M.playHouse = async function (hr) {
    G.storyReset();
    ui.title('House Rules');
    P.awake = true; ui.boardClass('awake');
    P.metArbiter = true;
    var st = Rules.standard();
    st.cells[Rules.sq(5, 2)] = Rules.clonePiece(st.cells[Rules.sq(5, 2)], { name: 'gary' });
    st.cells[Rules.sq(2, 5)] = Rules.clonePiece(st.cells[Rules.sq(2, 5)], { name: 'brenda' });
    st.rules = {
      forced: !!hr.forced, flyingKings: !!hr.flying, menBack: !!hr.back, menCapBack: !!hr.back,
      effect: hr.flip ? 'flip' : 'remove', crownContinues: !!hr.crownjump
    };
    P.setup(st);
    var mods = [];
    if (hr.wind) mods.push(P.Wind({ every: 2 }));
    if (hr.eggs) mods.push(P.Eggs({ max: 3, hatchIn: 2, chance: 0.7 }));
    if (hr.strike) mods.push(P.Strike({ frac: 0.25 }));
    if (hr.chaos) mods.push(G.Interludes({ max: 99, base: 0.12, minTurn: 2 }));
    var depth = hr.colin === 'gentle' ? 1 : 4, noise = hr.colin === 'gentle' ? 70 : 12;
    var cnt = function (t) { return Rules.count(P.state, t); };
    ui.status('<span class="goal">Red <b>' + cnt('P') + '</b> · Black <b>' + cnt('C') + '</b></span>');
    var r = await P.run({
      mods: mods,
      ai: { depth: depth, noise: noise },
      aiMove: hr.colin === 'pigeon' ? function (s, moves) { return G.pick(moves); } : null,
      colinMood: hr.colin === 'pigeon' ? 'sly' : 'neutral',
      statusText: function () { return '<span class="goal">Red <b>' + cnt('P') + '</b> · Black <b>' + cnt('C') + '</b></span>'; },
      afterMove: async function (team) {
        if (hr.colin === 'pigeon' && team === 'C' && G.chance(0.3)) { ui.bark('colin', 'Coo.'); A.play('coo'); }
      },
      check: function () { return cnt('C') === 0 ? 'win' : cnt('P') === 0 ? 'lose' : null; }
    });
    A.play(r === 'win' ? 'win' : 'lose');
    var b = await ui.card({ title: r === 'win' ? 'You win!' : 'COLIN wins.', sub: r === 'win' ? 'COLIN says well done, and means it.' : 'COLIN says sorry, and also means it.', buttons: ['Play again', 'Change the rules', 'Title screen'] });
    G.storyReset();
    ui.clearPieces();
    if (b === 0) return M.playHouse(hr);
    if (b === 1) return M.houseRules();
    return M.title();
  };

  // ---------------- menu & sound ----------------
  function soundIcon() { document.querySelector('#soundBtn').innerHTML = G.save.muted ? '&#128263;' : '&#128266;'; }
  function initChrome() {
    soundIcon();
    document.querySelector('#soundBtn').addEventListener('click', function () {
      A.unlock();
      A.setMuted(!G.save.muted);
      soundIcon();
      A.play('select');
    });
    document.querySelector('#menuBtn').addEventListener('click', async function () {
      var ov = document.querySelector('#overlay');
      if (!ov.classList.contains('hidden')) return;
      A.play('select');
      G.paused = true;
      await pauseMenu();
    });
    async function pauseMenu() {
      var playing = !!document.querySelector('#chapTitle').textContent;
      var btns = playing ? ['Resume', 'Restart this chapter', 'Chapter select', 'Quit to title'] : ['Resume'];
      var b = await ui.card({ title: 'Paused', sub: 'COLIN is waiting patiently. (He is good at that.)', buttons: btns });
      if (b === 1) go('ch=' + (G.save.chapter || 0));
      else if (b === 2) await M.chapterSelect({ pick: function (i) { go('ch=' + i); }, back: function () { return pauseMenu(); } });
      else if (b === 3) go('');
      else { ui.overlayHide(); G.paused = false; }
    }
    // a first tap anywhere unlocks audio on iOS
    window.addEventListener('pointerdown', function () { A.unlock(); }, { once: true, capture: true });
  }

  // ---------------- boot ----------------
  window.addEventListener('load', function () {
    ui.init();
    initChrome();
    var h = location.hash.replace('#', '');
    var m = /^ch=(\d+)/.exec(h);
    if (m) {
      var n = Math.min(+m[1], G.chapters.length - 1);
      history.replaceState(null, '', location.pathname + location.search);
      if (!G.debug) n = Math.min(n, G.save.done ? 99 : (G.save.maxChapter || 0));
      M.playChapter(n, true);
    } else if (h === 'select') {
      history.replaceState(null, '', location.pathname + location.search);
      M.chapterSelect();
    } else if (h === 'house' && G.debug) {
      M.playHouse({ forced: true, chaos: true, wind: true, eggs: true, strike: true, colin: 'proper' });
    } else {
      M.title();
    }
  });
})();

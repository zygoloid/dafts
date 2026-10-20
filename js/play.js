// The turn loop, player input, and the reusable rule-bending "mods" (wind, eggs, strikes).
(function () {
  var Rules = G.rules, ui = G.ui, A = G.audio, AI = G.ai;
  var P = G.play = {};
  P.state = null;
  P.awake = false;     // once the pieces wake up, they have opinions about being captured
  P.last = null;
  P.metArbiter = false;

  P.setup = function (state) {
    P.state = state;
    P.last = null;
    ui.highlight({});
    ui.sync(state, { instant: true });
  };
  P.set = function (state, opts) {
    P.state = state;
    ui.sync(state, opts);
  };
  // Replace a piece in place (keeps its id, so the DOM just restyles it).
  P.mutate = function (s, changes) {
    var ns = Rules.cloneState(P.state);
    ns.cells[s] = Rules.clonePiece(ns.cells[s], changes);
    P.set(ns);
    return ns.cells[s];
  };
  P.mutateAll = function (pred, changes) {
    var ns = Rules.cloneState(P.state);
    for (var i = 0; i < 64; i++) {
      var p = ns.cells[i];
      if (p && pred(p, i)) ns.cells[i] = Rules.clonePiece(p, typeof changes === 'function' ? changes(p, i) : changes);
    }
    P.set(ns);
  };
  P.findNamed = function (name) { return Rules.find(P.state, function (p) { return p.name === name; }); };

  var SCREAMS = ['AAAA!', 'AAAAAAA', 'Noooo!', 'Ow!', 'Worth it!', 'See you in the Box!', 'Tell my mum!', 'Not the face!', 'Rude!', 'Avenge me!', 'Bye!', 'I regret nothing!', 'Oof.'];
  var nextScream = G.deck(SCREAMS);

  P.mustTakeNotice = function () {
    A.play('bad');
    if (P.metArbiter) ui.caption('§2.4: If you CAN take, you MUST take. — The Arbiter', 2600, 'caption');
    else ui.caption('A capture is available, so you must take it.', 2200, 'caption');
  };

  // ---------- player input: tap a piece, tap where it goes (multi-jumps hop by hop) ----------
  P.playerMove = function (moves) {
    ui.introDone();
    return new Promise(function (resolve) {
      var forcedNow = moves.length && moves[0].caps.length && Rules.R(P.state, 'P', 'forced');
      var froms = [];
      moves.forEach(function (m) { if (froms.indexOf(m.from) < 0) froms.push(m.from); });
      var sel = null, prefix = null, cands = null, dimmed = [];
      // moves the chapter wants to react to even though they aren't legal (see P.attempts)
      var attempts = P.attempts ? P.attempts(P.state) : [];
      function refresh() {
        var targets = [];
        if (cands) cands.forEach(function (m) {
          var nx = m.path[prefix.length];
          if (nx != null && targets.indexOf(nx) < 0) targets.push(nx);
        });
        ui.highlight({ sel: sel, targets: targets, must: forcedNow && !cands ? froms : [], last: P.last });
      }
      function reset() { sel = null; prefix = null; cands = null; refresh(); }
      function hop(s, next) {
        prefix = prefix.concat([s]);
        cands = next;
        var done = cands.filter(function (m) { return m.path.length === prefix.length; });
        if (done.length) { finish(done[0]); return; }
        var first = cands[0];
        var pid = P.state.cells[first.from].id;
        ui.placePiece(pid, s);
        var capSq = first.caps[prefix.length - 2];
        var ce = ui.pieceElAt(capSq);
        if (ce) { ce.classList.add('dim'); dimmed.push(ce); }
        A.play('capture');
        sel = s;
        refresh();
        if (!Rules.R(P.state, 'P', 'forced')) ui.caption('Keep jumping, or tap the piece again to stop here.', 2200, 'caption');
      }
      function finish(m) {
        ui.onTap = null;
        dimmed.forEach(function (e) { e.classList.remove('dim'); });
        m._shown = prefix ? Math.max(0, prefix.length - 2) : 0;
        ui.highlight({});
        resolve(m);
      }
      ui.onTap = function (s) {
        if (prefix && prefix.length > 1) {
          var cont = cands.filter(function (m) { return m.path[prefix.length] === s; });
          if (cont.length) hop(s, cont);
          else if (s === sel && !Rules.R(P.state, 'P', 'forced')) {
            // captures aren't compulsory, so neither is finishing a chain of them
            var base = cands[0];
            finish({ from: base.from, to: s, path: prefix.slice(), caps: base.caps.slice(0, prefix.length - 1), crown: false, pid: base.pid });
          }
          else ui.caption('Keep jumping — the capture isn’t finished!', 1600, 'caption');
          return;
        }
        if (sel != null && cands) {
          var nx = cands.filter(function (m) { return m.path[1] === s; });
          if (nx.length) { hop(s, nx); return; }
          var tried = attempts.filter(function (m) { return m.from === sel && m.path[1] === s; })[0];
          if (tried && P.onAttempt) { reset(); P.onAttempt(tried); return; }
        }
        var mine = moves.filter(function (m) { return m.from === s; });
        if (!mine.length && attempts.some(function (m) { return m.from === s; })) {
          // nothing legal from here, but let the player try the thing the chapter wants to comment on
          if (sel === s) { reset(); return; }
          sel = s; prefix = [s]; cands = [];
          A.play('select');
          refresh();
          return;
        }
        if (mine.length) {
          if (sel === s) { reset(); return; }
          sel = s; prefix = [s]; cands = mine;
          A.play('select');
          ui.pieceAnim(P.state.cells[s].id, 'lookup', 400);
          if (P.onSelect) P.onSelect(s);
          refresh();
          return;
        }
        var p = P.state.cells[s];
        if (p && p.team === 'P') {
          if (p.strike) { ui.pieceSay(s, G.pick(['I’m on strike!', 'Not today, Finger.', 'Picket line, love.', 'Solidarity!']), 1400); A.play('bad'); }
          else if (forcedNow) P.mustTakeNotice();
          else if (p.kind === 'egg') ui.pieceSay(s, '*egg noises*', 1200);
          else ui.pieceAnim(p.id, 'wobble', 500);
        } else if (p && P.onTapOther) {
          P.onTapOther(s, p);
        }
        reset();
      };
      refresh();
      if (G.auto) setTimeout(function () {
        if (!ui.onTap) return;
        var m = AI.best(P.state, 'P', { depth: G.autoDepth || 3, noise: 10, moves: moves });
        prefix = null; finish(m);
      }, 15);
    });
  };

  // ---------- performing a move, with all the screaming ----------
  P.doMove = async function (mv, team, opts) {
    opts = opts || {};
    var before = P.state;
    var res = Rules.apply(before, mv);
    await ui.animateMove(mv, res.state, { hopMs: opts.hopMs });
    P.state = res.state;
    P.last = [mv.from, mv.to];
    P.react(res, mv, team);
    if (team === 'P' && mv.caps.length && res.crowned && !Rules.R(res.state, 'P', 'crownContinues') &&
        Rules.moves(res.state, 'P', mv.to).some(function (m) { return m.caps.length; })) {
      ui.caption('Crowned! In English draughts, being crowned ends your move, even in the middle of a capture.', 3600, 'caption');
    }
    var mods = (P.cfg && P.cfg.mods) || [];
    for (var i = 0; i < mods.length; i++) if (mods[i].afterMove) await mods[i].afterMove(team, mv, res);
    if (P.cfg && P.cfg.afterMove) await P.cfg.afterMove(team, mv, res);
    return res;
  };
  P.react = function (res, mv, team) {
    if (res.captured.length) {
      A.buzz(25);
      G.save.captured = (G.save.captured || 0) + res.captured.length;
      G.writeSave();
      if (P.awake) {
        res.captured.forEach(function (v, i) {
          if (v.kind === 'egg') { setTimeout(function () { ui.floatText(mv.caps[i], 'crack!', 'small'); A.play('crack'); }, i * 120); return; }
          setTimeout(function () {
            A.play('scream');
            ui.floatText(mv.caps[i], nextScream(), 'scream');
          }, i * 160);
        });
      }
    }
    if (res.flipped.length) {
      res.flipped.forEach(function (v) { ui.pieceAnim(v.id, 'flip', 700); });
      A.play('pop');
    }
    if (res.crowned) {
      A.play('crown');
      ui.floatText(mv.to, 'CROWNED!', 'gold');
    }
  };

  // ---------- the main turn loop ----------
  // cfg: {mods, check() -> 'win'|'lose'|null, ai: {depth, noise}, aiMove(state, moves), onStuck(team), afterMove}
  P.run = async function (cfg) {
    P.cfg = cfg;
    P.turn = 0;
    P.bonusMoves = 0;
    P.skipAI = 0;
    var mods = cfg.mods || [];
    var r;
    function check() { return cfg.check ? cfg.check() : null; }
    async function hook(name) {
      for (var i = 0; i < mods.length; i++) if (mods[i][name]) { await mods[i][name](); if ((r = check())) return r; }
      if (cfg[name]) { await cfg[name](); if ((r = check())) return r; }
      return null;
    }
    for (var i = 0; i < mods.length; i++) if (mods[i].start) await mods[i].start();
    try {
      while (true) {
        P.turn++;
        if ((r = await hook('beforePlayer'))) return r;
        if ((r = check())) return r;
        var n = 1 + (P.bonusMoves || 0) + (cfg.movesPerTurn ? cfg.movesPerTurn() - 1 : 0);
        P.bonusMoves = 0;
        for (var k = 0; k < n; k++) {
          var moves = Rules.moves(P.state, 'P');
          if (!moves.length) {
            r = cfg.onStuck ? await cfg.onStuck('P') : 'lose';
            if (r) return r;
            break;
          }
          if (n > 1) ui.status((cfg.statusText ? cfg.statusText() + ' · ' : '') + '<b>Move ' + (k + 1) + ' of ' + n + '</b>');
          var mv = await P.playerMove(moves);
          await P.doMove(mv, 'P');
          if ((r = check())) return r;
          if (cfg.statusText) ui.status(cfg.statusText());
        }
        if ((r = await hook('beforeAI'))) return r;
        if (P.skipAI > 0) {
          P.skipAI--;
        } else {
          var cm = Rules.moves(P.state, 'C');
          if (!cm.length) {
            r = cfg.onStuck ? await cfg.onStuck('C') : 'win';
            if (r) return r;
          } else {
            ui.colin('think');
            await G.wait(cfg.aiDelay != null ? cfg.aiDelay : 450 + Math.random() * 350);
            var am = cfg.aiMove ? cfg.aiMove(P.state, cm) : AI.best(P.state, 'C', { depth: (cfg.ai && cfg.ai.depth) || 3, noise: (cfg.ai && cfg.ai.noise != null) ? cfg.ai.noise : 25, moves: cm });
            ui.colin(cfg.colinMood || 'neutral');
            await P.doMove(am, 'C');
            if ((r = check())) return r;
          }
        }
        if ((r = await hook('afterRound'))) return r;
        if (cfg.statusText) ui.status(cfg.statusText());
      }
    } finally {
      for (var j = 0; j < mods.length; j++) if (mods[j].stop) await mods[j].stop();
      ui.onTap = null;
      ui.highlight({});
    }
  };

  // ---------- real time: no turns at all ----------
  // cfg: {interval(elapsedMs) -> ms, check(), onMove(team, mv, res)}
  P.runRealtime = function (cfg) {
    ui.introDone();
    return new Promise(function (resolve) {
      var alive = true, sel = null, t0 = Date.now();
      var started = false, lastMine = Date.now(), lastCap = Date.now(), resignShown = false;
      P.cfg = { mods: [] };
      // Real time can wedge: pieces locked together, or kings shuffling forever with nothing to take.
      // Offer a way out whenever the player stalls or nobody is getting anywhere.
      function showResign(on) {
        if (on === resignShown) return;
        resignShown = on;
        if (!on) { ui.hud(''); return; }
        ui.hud('<button class="resign">Resign</button>');
        var b = document.querySelector('#hud .resign');
        if (b) G.onPress(b, function () { A.play('bad'); end('lose'); });
      }
      function refresh() {
        if (sel != null && (!P.state.cells[sel] || P.state.cells[sel].team !== 'P')) sel = null;
        var targets = sel == null ? [] : Rules.moves(P.state, 'P', sel).map(function (m) { return m.to; });
        ui.highlight({ sel: sel, targets: targets });
      }
      function end(r) {
        if (!alive) return;
        alive = false;
        showResign(false);
        ui.onTap = null;
        ui.highlight({});
        resolve(r);
      }
      function exec(mv, team) {
        var res = Rules.apply(P.state, mv);
        P.state = res.state;
        ui.sync(res.state);
        A.play(mv.caps.length ? 'capture' : 'tock');
        P.react(res, mv, team);
        if (team === 'P') { lastMine = Date.now(); started = true; }
        if (mv.caps.length) lastCap = Date.now();
        if (cfg.onMove) cfg.onMove(team, mv, res);
        refresh();
        var r = cfg.check();
        if (r) end(r);
        return res;
      }
      ui.onTap = function (s) {
        if (!alive) return;
        if (sel != null) {
          var mv = Rules.moves(P.state, 'P', sel).filter(function (m) { return m.to === s; })[0];
          if (mv) {
            exec(mv, 'P');
            sel = (mv.caps.length && Rules.moves(P.state, 'P', mv.to).some(function (m) { return m.caps.length; })) ? mv.to : null;
            refresh();
            return;
          }
        }
        var p = P.state.cells[s];
        if (p && p.team === 'P' && Rules.moves(P.state, 'P', s).length) { sel = s; A.play('select'); }
        else sel = null;
        refresh();
      };
      (async function watchdog() {
        while (alive) {
          await G.wait(500);
          if (!alive) break;
          var mine = Rules.moves(P.state, 'P'), his = Rules.moves(P.state, 'C');
          if (!mine.length && !his.length) {
            end(cfg.onDeadlock ? cfg.onDeadlock() : 'lose');
            break;
          }
          var now = Date.now();
          if (G.paused) { lastMine = now; lastCap += 500; continue; }
          showResign(!mine.length || now - lastMine > 4000 || now - lastCap > 15000);
        }
      })();
      (async function colinLoop() {
        while (alive) {
          await G.wait(cfg.interval(Date.now() - t0));
          if (!alive) break;
          if (!started || G.paused) { if (!started) t0 = Date.now(); continue; }   // waits for you to go first, and while you're paused
          var moves = Rules.moves(P.state, 'C');
          if (!moves.length) { var r = cfg.check(); if (r) end(r); continue; }
          exec(AI.greedy(P.state, 'C', moves), 'C');
        }
      })();
      if (G.auto) (async function autoLoop() {
        while (alive) {
          await G.wait(250);
          if (!alive) break;
          var moves = Rules.moves(P.state, 'P');
          if (moves.length) exec(AI.greedy(P.state, 'P', moves), 'P');
        }
      })();
      refresh();
    });
  };

  // =====================================================================
  // Mods
  // =====================================================================
  var DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  var DIR_NAMES = { '-1,-1': 'north-westerly', '-1,1': 'north-easterly', '1,-1': 'south-westerly', '1,1': 'south-easterly' };

  // A draught. Every few rounds a gust shoves everything one square downwind.
  P.Wind = function (opts) {
    opts = opts || {};
    var every = opts.every || 2;
    var m = { gusts: 0, count: every, dir: G.pick(DIRS), isWind: true };
    function render() {
      var ang = Math.atan2(m.dir[0], m.dir[1]) * 180 / Math.PI;
      ui.hud('<div class="vane" style="--a:' + ang.toFixed(0) + 'deg"><span>&#10148;</span></div>' +
        '<div class="hudtxt"><b>' + (m.count <= 1 ? 'Gust next turn!' : 'Gust in ' + m.count + ' turns') + '</b><br>' + DIR_NAMES[m.dir.join(',')] + '</div>');
    }
    m.start = function () { render(); };
    m.stop = function () { ui.hud(''); };
    m.afterRound = async function () {
      m.count--;
      if (m.count <= 0) {
        await P.gust(m.dir);
        m.gusts++;
        if (opts.onGust) await opts.onGust(m);
        var nd = G.pick(DIRS);
        m.dir = nd;
        m.count = every;
      }
      render();
    };
    return m;
  };
  P.gust = async function (d) {
    A.play('wind');
    ui.boardClass('gusting');
    var fx = ui.fx();
    for (var i = 0; i < 14; i++) {
      var w = G.el('div', 'windline');
      w.style.setProperty('--a', (Math.atan2(d[0], d[1]) * 180 / Math.PI).toFixed(0) + 'deg');
      w.style.top = (Math.random() * 100) + '%';
      w.style.left = (Math.random() * 100) + '%';
      w.style.animationDelay = (Math.random() * 0.5).toFixed(2) + 's';
      fx.appendChild(w);
      (function (w) { setTimeout(function () { w.remove(); }, 1600); })(w);
    }
    await G.wait(350);
    var ns = Rules.cloneState(P.state);
    var list = Rules.all(ns, function (p) { return p.kind === 'man' || p.kind === 'egg'; });
    list.sort(function (a, b) {
      return ((b >> 3) * d[0] + (b & 7) * d[1]) - ((a >> 3) * d[0] + (a & 7) * d[1]);
    });
    var blown = [];
    list.forEach(function (s) {
      var p = ns.cells[s], r = (s >> 3) + d[0], c = (s & 7) + d[1];
      if (!Rules.inB(r, c)) { ns.cells[s] = null; blown.push({ p: p, s: s }); return; }
      var t = Rules.sq(r, c);
      if (ns.cells[t] || ns.blocked[t]) return;
      ns.cells[s] = null;
      ns.cells[t] = (p.kind === 'man' && !p.king && r === Rules.farRow(p)) ? Rules.clonePiece(p, { king: true }) : p;
    });
    P.set(ns, { flyDir: d });
    P.last = null;
    var lines = ['Wheeeee!', 'I can see my house!', 'Tell Brenda I—', 'Not agaaain!', 'I’m flyiiing!', 'Hold my hand!', 'Byeee!'];
    blown.slice(0, 3).forEach(function (b, i) {
      setTimeout(function () { ui.floatText(b.s, G.pick(lines), 'scream'); A.play('scream'); }, i * 200);
    });
    G.save.captured = (G.save.captured || 0) + blown.length;
    await G.wait(700);
    ui.boardClass('gusting', false);
    if (blown.length) ui.bark('colin', blown.length === 1 ? 'Gone with the wind.' : blown.length + ' pieces lost to the weather!');
    return blown;
  };

  // Mating season. Pairs of pieces lay eggs; eggs hatch into new pieces.
  P.Eggs = function (opts) {
    opts = opts || {};
    var max = opts.max || 3, hatchIn = opts.hatchIn || 2;
    var m = {};
    function lay(team) {
      var st = P.state;
      if (Rules.count(st, team, function (p) { return p.kind === 'egg'; }) >= max) return null;
      var cands = [];
      for (var s = 0; s < 64; s++) {
        var p = st.cells[s];
        if (!p || p.team !== team || p.kind !== 'man') continue;
        Rules.neighbours(s).forEach(function (n) {
          var q = st.cells[n];
          if (!q || q.team !== team || q.kind !== 'man' || n < s) return;
          Rules.neighbours(s).concat(Rules.neighbours(n)).forEach(function (e) {
            if (!st.cells[e] && !st.blocked[e] && Rules.isDark(e >> 3, e & 7)) {
              var home = p.color === 'red' ? (e >> 3) : 7 - (e >> 3);
              cands.push({ s: e, w: home });
            }
          });
        });
      }
      if (!cands.length) return null;
      cands.sort(function (a, b) { return b.w - a.w; });
      var top = cands.slice(0, 4);
      var at = G.pick(top).s;
      var ns = Rules.cloneState(st);
      var owner = team === 'P' ? 'red' : 'black';
      ns.cells[at] = Rules.piece({ team: team, color: owner, kind: 'egg', hatch: hatchIn });
      P.set(ns);
      A.play('egg');
      return at;
    }
    m.afterMove = async function (team) {
      if (!G.chance(opts.chance == null ? 0.8 : opts.chance)) return;
      var at = lay(team);
      if (at != null && opts.onLay) await opts.onLay(team, at);
    };
    m.afterRound = async function () {
      var ns = Rules.cloneState(P.state), hatched = [];
      for (var s = 0; s < 64; s++) {
        var p = ns.cells[s];
        if (!p || p.kind !== 'egg') continue;
        if (p.hatch > 1) { ns.cells[s] = Rules.clonePiece(p, { hatch: p.hatch - 1, cls: 'wobbling' }); continue; }
        ns.cells[s] = Rules.piece({ team: p.team, color: p.color, kind: 'man' });
        hatched.push(s);
      }
      if (!hatched.length) { P.set(ns); return; }
      A.play('crack');
      P.set(ns, { instant: false });
      hatched.forEach(function (s) { ui.floatText(s, 'hatch!', 'small'); });
      if (opts.onHatch) await opts.onHatch(hatched);
    };
    return m;
  };

  // Industrial action: a rotating third of the pieces refuse to move or be taken.
  var SLOGANS = ['FAIR SQUARES', 'NO JUMPING', 'CROWNS 4 ALL', 'TEA BREAKS NOW', 'WE ARE NOT PAWNS', 'NUDAC', 'DIAGONAL RIGHTS', '12 MEN 1 BOARD', 'DOWN TOOLS', 'JUMP ON THIS', 'SAME TREE'];
  P.Strike = function (opts) {
    opts = opts || {};
    var frac = opts.frac || 0.33;
    var m = {};
    m.beforePlayer = async function () {
      for (var tries = 0; tries < 12; tries++) {
        var ns = Rules.cloneState(P.state);
        for (var s = 0; s < 64; s++) {
          var p = ns.cells[s];
          if (!p || p.kind !== 'man') continue;
          var on = p.name === 'brenda' || (p.name !== 'gary' && G.chance(frac));
          if (on !== !!p.strike) ns.cells[s] = Rules.clonePiece(p, { strike: on, slogan: on ? G.pick(SLOGANS) : '' });
        }
        if (Rules.moves(ns, 'P').length && Rules.moves(ns, 'C').length) { P.set(ns); return; }
      }
      m.clear();
    };
    m.clear = function () { P.mutateAll(function (p) { return p.strike; }, { strike: false }); };
    m.stop = function () { m.clear(); };
    return m;
  };
})();

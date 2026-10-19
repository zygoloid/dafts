// Random nonsense that can barge into a game at any moment. Different every playthrough.
(function () {
  var Rules = G.rules, ui = G.ui, A = G.audio, P = G.play;

  function men(team, pred) {
    return Rules.all(P.state, function (p) { return p.team === team && p.kind === 'man' && (!pred || pred(p)); });
  }
  function crownStray(ns) {
    for (var s = 0; s < 64; s++) {
      var p = ns.cells[s];
      if (p && p.kind === 'man' && !p.king && (s >> 3) === Rules.farRow(p)) ns.cells[s] = Rules.clonePiece(p, { king: true });
    }
  }
  function flyer(html, cls, from, to, ms) {
    var f = G.el('div', 'flyer ' + (cls || ''), html);
    f.style.left = from[0] + '%'; f.style.top = from[1] + '%';
    f.style.setProperty('--ms', ms + 'ms');
    ui.fx().appendChild(f);
    void f.offsetWidth;
    f.style.left = to[0] + '%'; f.style.top = to[1] + '%';
    setTimeout(function () { f.remove(); }, ms + 100);
    return f;
  }

  var ADS = [
    '<h2>BORED OF DRAUGHTS?</h2><p>Try <b>DRAUGHTS 2</b>.<br>Now with <i>more draughts</i>.</p><p class="stars">&#9733;&#9733;&#9733;&#9733;&#9734; &ldquo;It&rsquo;s draughts again.&rdquo; &mdash; A Man</p>',
    '<h2>HOT SINGLE PIECES<br>IN YOUR AREA</h2><p>They&rsquo;re round. They&rsquo;re wooden.<br>They&rsquo;re <b>two squares away</b>.</p>',
    '<h2>CAPTURED IN A JUMP<br>THAT WASN&rsquo;T YOUR FAULT?</h2><p>You could be owed compensation.<br>Call <b>Hopper, Hopper &amp; Leap</b>.</p><p class="stars">No win, no fee. No legs, no problem.</p>',
    '<h2>UNLOCK THE NINTH ROW</h2><p>Only <b>&pound;4.99</b>!</p><p class="stars">(There is no ninth row.)</p>'
  ];
  var nextAd = G.deck(ADS);

  var LIST = [
    {
      id: 'ad',
      run: async function () {
        await new Promise(function (resolve) {
          var ov = ui.overlay('<div class="ad"><div class="adtag">Advertisement</div><div class="adbody">' + nextAd() + '</div><button class="adx" aria-label="Close">&#10005;</button><div class="adhint">Tap the &#10005; to close</div></div>', 'show adov');
          var x = ov.querySelector('.adx'), flees = 0, maxF = 3 + G.rand(3), done = false;
          function close() { if (done) return; done = true; ui.overlayHide(); resolve(); }
          x.addEventListener('pointerdown', function (e) {
            e.stopPropagation(); e.preventDefault();
            if (flees < maxF) {
              flees++;
              x.style.left = (8 + Math.random() * 78) + '%';
              x.style.top = (6 + Math.random() * 80) + '%';
              A.play('boing');
              if (flees === 2) ov.querySelector('.adhint').textContent = 'It’s just a button. Keep trying.';
            } else close();
          });
          setTimeout(function () { var h = ov.querySelector('.adhint'); if (h) h.textContent = 'Fine. You can tap it now.'; maxF = 0; }, 9000);
          if (G.auto) setTimeout(close, 20);
        });
        ui.bark('colin', 'Sorry. I don’t get a say in the adverts.', 2600);
      }
    },
    {
      id: 'taxman',
      can: function () { return men('P').length >= 4 && men('C').length >= 4; },
      run: async function () {
        await ui.say('taxman', 'Evening. Capture Gains Tax. I’ll be needing one piece from each of you.');
        if (P.metArbiter) await ui.say('arbiter', 'Is that in the rules?', { mood: 'shock' });
        else await ui.say('colin', 'Is that in the rules?', { mood: 'shock' });
        await ui.say('taxman', 'It’s in *my* rules, sir. Thank you kindly.');
        var ns = Rules.cloneState(P.state);
        ['P', 'C'].forEach(function (t) {
          var c = men(t, function (p) { return !p.name; });
          if (c.length) ns.cells[G.pick(c)] = null;
        });
        P.set(ns);
        A.play('capture');
        ui.caption('Two pieces have been taken into the custody of the Taxman.', 2500);
      }
    },
    {
      id: 'update',
      run: async function (mod) {
        await ui.say('colin', 'Sorry — I need to install an update. It won’t take a moment.', { mood: 'sad' });
        ui.colin('sleep');
        ui.hud('<div class="hudtxt"><b>COLIN is updating</b><br><span class="upd">Installing: Sense of Humour 0.2</span><div class="bar"><i></i></div></div>');
        P.skipAI = 1;
        ui.caption('COLIN is busy. You get two moves in a row!', 3000);
        var steps = ['Removing: Fear of Pigeons', 'Optimising: Small Talk', 'Installing: Favourite Colour'];
        var i = 0;
        var tmr = setInterval(function () {
          var u = document.querySelector('#hud .upd');
          if (!u) { clearInterval(tmr); return; }
          u.textContent = steps[i++ % steps.length];
        }, 1500);
        mod.lingering.push({
          rounds: 1,
          end: async function () {
            clearInterval(tmr);
            ui.hud('');
            ui.colin('happy');
            await ui.say('colin', 'Update complete. New feature: I now have a favourite colour.', { mood: 'happy' });
            await ui.say('colin', 'It is beige.', { mood: 'happy' });
          }
        });
      }
    },
    {
      id: 'cat',
      can: function () { return Rules.count(P.state, 'P') > 3 && Rules.count(P.state, 'C') > 3; },
      run: async function () {
        A.play('meow');
        var fromLeft = G.chance(0.5);
        var row = 1 + G.rand(6);
        flyer('<span class="paw">&#128062;</span>', 'pawfly', [fromLeft ? -30 : 110, row * 12.5 - 6], [fromLeft ? 110 : -30, row * 12.5 - 6], 1100);
        await G.wait(450);
        var ns = Rules.cloneState(P.state);
        var hit = [];
        for (var c = 0; c < 8; c++) {
          [row - 1, row, row + 1].forEach(function (r) {
            var s = Rules.sq(r, c), p = ns.cells[s];
            if (p && p.kind === 'man' && !p.name && hit.length < 2 && G.chance(0.5)) { ns.cells[s] = null; hit.push(s); }
          });
        }
        if (!hit.length) {
          var any = Rules.all(ns, function (p) { return p.kind === 'man' && !p.name; });
          if (any.length) { var s0 = G.pick(any); ns.cells[s0] = null; hit.push(s0); }
        }
        P.set(ns, { flyDir: [0, fromLeft ? 1 : -1] });
        hit.forEach(function (s) { ui.floatText(s, 'MEOW', 'scream'); });
        A.play('scream');
        await G.wait(500);
        ui.bark('colin', 'Was that... a cat? Whose cat is that?', 2600);
      }
    },
    {
      id: 'morris',
      run: async function () {
        A.play('bells');
        ui.caption('A troupe of Morris dancers has come down the long diagonal. Hey nonny no.', 3200);
        for (var i = 0; i < 4; i++) {
          (function (i) {
            setTimeout(function () {
              flyer(i % 2 ? '&#128378;' : '&#128131;', 'dancer', [-6, 94], [94, -6], 1800);
              A.play('bells');
            }, i * 260);
          })(i);
        }
        await G.wait(900);
        var diag = [];
        for (var r = 7, c = 0; r >= 0; r--, c++) diag.push(Rules.sq(r, c));
        var ns = Rules.cloneState(P.state);
        var occ = diag.map(function (s) { return ns.cells[s]; }).reverse();
        diag.forEach(function (s, i) { ns.cells[s] = occ[i]; });
        crownStray(ns);
        P.set(ns);
        P.last = null;
        await G.wait(900);
        ui.bark('colin', 'Everyone on that diagonal has been... rearranged.', 2600);
      }
    },
    {
      id: 'royal',
      can: function () { return men('P', function (p) { return !p.king; }).length && men('C', function (p) { return !p.king; }).length; },
      run: async function () {
        A.play('fanfare');
        ui.caption('By Royal Appointment: two pieces have been crowned at random. Nobody knows why. Nobody asks.', 3600);
        await G.wait(500);
        var ns = Rules.cloneState(P.state);
        ['P', 'C'].forEach(function (t) {
          var c = men(t, function (p) { return !p.king; });
          if (c.length) { var s = G.pick(c); ns.cells[s] = Rules.clonePiece(ns.cells[s], { king: true }); ui.floatText(s, 'CROWNED!', 'gold'); }
        });
        P.set(ns);
        A.play('crown');
        await G.wait(900);
      }
    },
    {
      id: 'demons',
      can: function () { return men('P').length >= 2 && men('C').length >= 2; },
      run: async function () {
        A.play('sneeze');
        ui.colin('shock');
        await ui.say('colin', 'AH— AH— *ATCHOO!*', { mood: 'shock' });
        await ui.say('colin', '...I don’t have a nose. Where did that come from?', { mood: 'shock' });
        var targets = [G.pick(men('P', function (p) { return !p.name; }).concat(men('P'))), G.pick(men('C', function (p) { return !p.name; }).concat(men('C')))];
        for (var i = 0; i < 3; i++) flyer('&#128520;', 'demon', [50, -10], [10 + Math.random() * 80, 10 + Math.random() * 80], 900);
        await G.wait(900);
        var ns = Rules.cloneState(P.state);
        targets.forEach(function (s) {
          var p = ns.cells[s]; if (!p) return;
          ns.cells[s] = Rules.clonePiece(p, { team: p.team === 'P' ? 'C' : 'P', color: p.color === 'red' ? 'black' : 'red' });
        });
        crownStray(ns);
        P.set(ns);
        targets.forEach(function (s) { ui.pieceAnim(ns.cells[s].id, 'flip', 700); });
        A.play('pop');
        if (P.metArbiter) await ui.say('arbiter', 'NASAL DEMONS! I *told* you. This is what undefined behaviour looks like!', { mood: 'angry' });
        ui.caption('Two pieces have been swapped to the other side by tiny demons.', 2800);
      }
    },
    {
      id: 'pigeon',
      can: function () { return Rules.emptyDark(P.state).length > 4; },
      run: async function (mod) {
        A.play('coo');
        var empties = Rules.emptyDark(P.state).filter(function (s) { var r = s >> 3; return r >= 2 && r <= 5; });
        if (!empties.length) empties = Rules.emptyDark(P.state);
        var at = G.pick(empties);
        var ns = Rules.cloneState(P.state);
        ns.cells[at] = Rules.piece({ team: 'N', kind: 'pigeon', color: 'none' });
        P.set(ns);
        ui.caption('A pigeon has landed on the board. It does not know the rules. It does not care.', 3000);
        mod.lingering.push({
          rounds: 3,
          tick: function () { G.interludes.walkPigeon(); },
          end: async function () {
            var s = Rules.find(P.state, function (p) { return p.kind === 'pigeon'; });
            if (s < 0) return;
            var ns2 = Rules.cloneState(P.state);
            ns2.cells[s] = null;
            ns2.blocked = Object.assign({}, ns2.blocked);
            ns2.blocked[s] = 3;
            P.set(ns2, { flyDir: [-1, 0.3] });
            ui.squareClass(s, 'poop');
            A.play('coo');
            ui.caption('The pigeon has left. It has left something behind. That square is out of use for a bit.', 3200);
          }
        });
      }
    },
    {
      id: 'powercut',
      can: function () { return P.awake; },
      run: async function (mod) {
        A.play('thunder');
        ui.appClass('powercut');
        ui.caption('Power cut! Luckily, the pieces’ eyes glow in the dark.', 3000);
        mod.lingering.push({ rounds: 1, end: async function () { ui.appClass('powercut', false); ui.flash('#fff8'); } });
      }
    }
  ];

  G.interludes = {
    list: LIST,
    walkPigeon: function () {
      var s = Rules.find(P.state, function (p) { return p.kind === 'pigeon'; });
      if (s < 0) return;
      var opts = Rules.neighbours(s).filter(function (n) { return !P.state.cells[n] && !P.state.blocked[n]; });
      if (!opts.length) { ui.pieceSay(s, 'Coo.', 1200); return; }
      var ns = Rules.cloneState(P.state);
      var t = G.pick(opts);
      ns.cells[t] = ns.cells[s]; ns.cells[s] = null;
      P.set(ns);
      if (G.chance(0.4)) { ui.pieceSay(t, G.pick(['Coo.', 'Coo?', 'COO.', '*struts*']), 1200); A.play('coo'); }
    },
    // tick down poop squares
    tickBlocked: function () {
      var b = P.state.blocked, changed = false, nb = {};
      for (var k in b) {
        if (b[k] > 1) nb[k] = b[k] - 1;
        else { ui.squareClass(+k, 'poop', false); changed = true; }
        if (b[k] > 1) changed = true;
      }
      if (changed) { var ns = Rules.cloneState(P.state); ns.blocked = nb; P.state = ns; ui.state = ns; }
    }
  };

  // The mod that schedules them.
  // opts: {max, base, exclude: [ids], only: [ids], minTurn}
  G.Interludes = function (opts) {
    opts = opts || {};
    var m = { count: 0, lingering: [] };
    var max = opts.max == null ? 1 : opts.max;
    m.beforePlayer = async function () {
      if (m.count >= max || m.lingering.length) return;
      var t = P.turn - (opts.minTurn || 3);
      if (t < 0) return;
      var p = Math.min(0.9, (opts.base || 0.1) * (t + 1));
      if (!G.chance(p)) return;
      var pool = LIST.filter(function (i) {
        if (opts.only && opts.only.indexOf(i.id) < 0) return false;
        if (opts.exclude && opts.exclude.indexOf(i.id) >= 0) return false;
        return !i.can || i.can();
      });
      if (!pool.length) return;
      var fresh = pool.filter(function (i) { return (G.save.seen || []).indexOf(i.id) < 0; });
      var it = G.pick(fresh.length ? fresh : pool);
      m.count++;
      G.save.seen = (G.save.seen || []).concat([it.id]);
      if (fresh.length <= 1) G.save.seen = [];
      G.writeSave();
      await it.run(m);
    };
    m.afterRound = async function () {
      G.interludes.tickBlocked();
      var keep = [];
      for (var i = 0; i < m.lingering.length; i++) {
        var l = m.lingering[i];
        if (l.tick) await l.tick();
        l.rounds--;
        if (l.rounds <= 0) { if (l.end) await l.end(); }
        else keep.push(l);
      }
      m.lingering = keep;
    };
    m.stop = async function () {
      for (var i = 0; i < m.lingering.length; i++) if (m.lingering[i].end) await m.lingering[i].end();
      m.lingering = [];
      ui.appClass('powercut', false);
      ui.clearSquareClass('poop');
      if (P.state && Object.keys(P.state.blocked).length) { var ns = Rules.cloneState(P.state); ns.blocked = {}; P.state = ns; }
      var s = P.state ? Rules.find(P.state, function (p) { return p.kind === 'pigeon' && !p.keep; }) : -1;
      if (s >= 0 && !opts.keepPigeon) { var ns2 = Rules.cloneState(P.state); ns2.cells[s] = null; P.set(ns2); }
    };
    return m;
  };
})();

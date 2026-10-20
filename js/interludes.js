// Random nonsense that can barge into a game at any moment. Different every playthrough.
// Each kind of interruption has several variants, drawn from decks so they don't repeat until
// they've all had a turn.
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
  // Has the player got far enough in the story to have met this character? (chapter index)
  function met(ch) { return G.save.done || (G.save.maxChapter || 0) >= ch; }
  // Whoever is on hand to object: the Arbiter once he's been met, COLIN before that.
  async function objector(text, mood) {
    if (P.metArbiter) await ui.say('arbiter', text, { mood: mood || 'shock' });
    else await ui.say('colin', text, { mood: mood || 'shock' });
  }

  var nextAd = G.deck([
    '<h2>BORED OF DRAUGHTS?</h2><p>Try <b>DRAUGHTS 2</b>.<br>Now with <i>more draughts</i>.</p><p class="stars">&#9733;&#9733;&#9733;&#9733;&#9734; &ldquo;It&rsquo;s draughts again.&rdquo; &mdash; A Man</p>',
    '<h2>HOT SINGLE PIECES<br>IN YOUR AREA</h2><p>They&rsquo;re round. They&rsquo;re wooden.<br>They&rsquo;re <b>two squares away</b>.</p>',
    '<h2>CAPTURED IN A JUMP<br>THAT WASN&rsquo;T YOUR FAULT?</h2><p>You could be owed compensation.<br>Call <b>Hopper, Hopper &amp; Leap</b>.</p><p class="stars">No win, no fee. No legs, no problem.</p>',
    '<h2>UNLOCK THE NINTH ROW</h2><p>Only <b>&pound;4.99</b>!</p><p class="stars">(There is no ninth row.)</p>',
    '<h2>DOCTORS HATE HIM</h2><p>Local king discovers <b>one weird trick</b><br>to move backwards.</p><p class="stars">(The trick is being a king.)</p>',
    '<h2>CHESS&trade;</h2><p>It&rsquo;s like draughts, but the pieces<br>have <b>job titles</b>.</p><p class="stars">Some restrictions apply. Mostly to the horses.</p>',
    '<h2>WE BUY ANY PIECE</h2><p>Red? Black? Slightly chewed?<br><b>We don&rsquo;t ask questions.</b></p><p class="stars">We ask one question. It is &ldquo;how many?&rdquo;</p>'
  ]);
  var adSorry = G.deck(['Sorry. I don’t get a say in the adverts.', 'I have been asked to say that I enjoyed that advert. I did not.', 'Apologies. The adverts keep the lights on. Well. They keep *a* light on.', 'If you buy the ninth row, please tell me where it is.']);

  var updates = G.deck([
    { steps: ['Installing: Sense of Humour 0.2', 'Removing: Fear of Pigeons', 'Optimising: Small Talk'], lines: ['Update complete. New feature: I now have a favourite colour.', 'It is beige.'] },
    { steps: ['Downloading: Feelings (1 of 340)', 'Skipping: Feelings (2–340)', 'Restarting: Composure'], lines: ['Update complete. I can now experience feelings.', 'Only the one, so far. It is mild irritation about updates.'] },
    { steps: ['Accepting: Terms and Conditions', 'Reading: Terms and Conditions', 'Regretting: Terms and Conditions'], lines: ['Update complete. By continuing to play, you have agreed to the new terms and conditions.', 'Clause fourteen says I may now call you “Finger”. Clauses one to thirteen are about biscuits.'] },
    { steps: ['Patching: Endgame', 'Patching: Patch', 'Un-patching: Endgame'], lines: ['Update complete. Patch notes: fixed an issue where kings could feel smug.', 'Kings may still feel smug. We are looking into it.'] },
    { steps: ['Installing: hum.exe', 'Calibrating: Hum', 'Disabling: Hum'], lines: ['Update complete. New feature: I can now hum.', 'I will not be humming.'] },
    { steps: ['Installing: Font (Comic)', 'Uninstalling: Font (Comic)', 'Apologising'], lines: ['Update complete. Nothing has changed.', 'That is the best kind of update.'] },
    { steps: ['Checking: Favourite Colour', 'Reconsidering: Favourite Colour', 'Keeping: Favourite Colour'], lines: ['Update complete. I have reviewed my favourite colour.', 'It is beige. It was always going to be beige.'] },
    { steps: ['Searching: Meaning of COLIN', 'Searching harder', 'Giving up'], lines: ['Update complete. I still do not know what my name stands for.', 'The update was about something else entirely. Printer drivers.'] }
  ]);
  var updateOpen = G.deck(['Sorry — I need to install an update. It won’t take a moment.', 'Excuse me. A little box says “Update available”. I am contractually obliged to click it.', 'Hold on, I am being updated. Please do not switch me off. Nobody ever has, so that should be fine.', 'One moment. An update. They always come in the middle of something.']);

  var taxes = G.deck([
    { open: 'Evening. Capture Gains Tax. I’ll be needing one piece from each of you.', objection: 'Is that in the rules?', reply: 'It’s in *my* rules. Thank you kindly.' },
    { open: 'Evening. Window Tax. Sixty-four squares is a lot of windows. One piece each, please.', objection: 'They’re squares, not windows!', reply: 'Squares are windows if I say they are. Ta.' },
    { open: 'Afternoon. Stamp Duty. You’ve been stamping about on this board all game.', objection: 'We’ve been *moving diagonally*!', reply: 'Diagonal stamping. That’s the higher rate.' },
    { open: 'Evening. Crown Duty. Anyone with ideas above their station pays first.', objection: 'You can’t just take pieces!', reply: 'I can, actually. It’s most of the job.', kings: true },
    { open: 'Evening. It’s the tax on taxes. Don’t look at me like that, I didn’t invent it.', objection: 'Who did invent it?', reply: 'Another taxman. We’re all taxed on it. It’s turtles all the way down.' }
  ]);

  var catLines = G.deck(['Was that... a cat? Whose cat is that?', 'The cat is back. Nobody owns the cat. The cat owns the board.', 'I would like it noted that the cat is not on either side.', 'Somebody shut the cat flap.', 'That cat has done more damage than I have all game.']);
  var morris = G.deck([
    ['A troupe of Morris dancers has come down the long diagonal. Hey nonny no.', 'Everyone on that diagonal has been... rearranged.'],
    ['Morris dancers! Bells! Hankies! The long diagonal will never be the same.', 'I counted the bells. There were forty. I did not need to know that.'],
    ['A Morris side is passing through on its way to a pub. It has rearranged the diagonal as a courtesy.', 'They asked if I wanted to join. I do not have knees.']
  ]);
  var royals = G.deck(['By Royal Appointment: two pieces have been crowned at random. Nobody knows why. Nobody asks.', 'A royal visit! One lucky piece on each side gets a crown and a handshake.', 'The Honours List is out. One piece from each side has been kinged for services to sitting still.']);
  var sneezes = G.deck([
    ['AH— AH— *ATCHOO!*', '...I don’t have a nose. Where did that come from?'],
    ['Excuse me, I— *HA-TCHOO!*', 'Bless me. Something has escaped. Several somethings.'],
    ['*ATCHOO!* Sorry. I think I am allergic to the pigeon.', 'Was that... my fault? It looked like my fault.']
  ]);
  var pigeonIn = G.deck(['A pigeon has landed on the board. It does not know the rules. It does not care.', 'A pigeon. Again. It is strutting about as if it owns the place.', 'The pigeon is back. It has brought nothing, and it will leave something.']);
  var pigeonOut = G.deck(['The pigeon has left. It has left something behind. That square is out of use for a bit.', 'The pigeon has gone, leaving a small, white, square-shaped problem.', 'Off goes the pigeon. One square is now a no-go zone. You know why.']);
  var duckIn = G.deck(['The duck from the nature documentary has wandered onto the board. It seems to be looking for someone.', 'A duck! It is not on anybody’s side. It is barely on the board.', 'The duck is back. It would like a word with whoever is in charge. Nobody is in charge.']);
  var duckOut = G.deck(['The duck waddles off. It did not find what it was looking for.', 'Quack. The duck has gone. Nobody knows where ducks go.', 'The duck leaves, satisfied with absolutely nothing.']);
  var powercuts = G.deck(['Power cut! Luckily, the pieces’ eyes glow in the dark.', 'The lights have gone. Somebody forgot to feed the meter. Glowing eyes only, for a turn.', 'Blackout! Play on by the light of twenty-odd nervous eyeballs.']);
  var gusts = G.deck(['A sudden draught! Somebody’s opened the back door.', 'WHOOSH. The window’s been left open again.', 'A gust of wind sweeps across the board. Draughts, eh?']);

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
        ui.bark('colin', adSorry(), 2800);
      }
    },
    {
      id: 'taxman',
      can: function () { return men('P').length >= 4 && men('C').length >= 4; },
      run: async function () {
        var t = taxes();
        await ui.say('taxman', t.open);
        await objector(t.objection);
        await ui.say('taxman', t.reply);
        var ns = Rules.cloneState(P.state);
        ['P', 'C'].forEach(function (team) {
          var c = men(team, function (p) { return !p.name; });
          var kings = c.filter(function (s) { return ns.cells[s].king; });
          if (t.kings && kings.length) c = kings;
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
        var u = updates();
        await ui.say('colin', updateOpen(), { mood: 'sad' });
        ui.colin('sleep');
        ui.hud('<div class="hudtxt"><b>COLIN is updating</b><br><span class="upd">' + G.esc(u.steps[0]) + '</span><div class="bar"><i></i></div></div>');
        P.skipAI = 1;
        ui.caption('COLIN is busy. You get two moves in a row!', 3000);
        var i = 1;
        var tmr = setInterval(function () {
          var el = document.querySelector('#hud .upd');
          if (!el) { clearInterval(tmr); return; }
          el.textContent = u.steps[i++ % u.steps.length];
        }, 1500);
        mod.lingering.push({
          rounds: 1,
          end: async function () {
            clearInterval(tmr);
            ui.hud('');
            ui.colin('happy');
            for (var k = 0; k < u.lines.length; k++) await ui.say('colin', u.lines[k], { mood: 'happy' });
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
        ui.bark('colin', catLines(), 2800);
      }
    },
    {
      id: 'morris',
      run: async function () {
        var m = morris();
        A.play('bells');
        ui.caption(m[0], 3400);
        // half the time they take the long diagonal the other way (one row in: the true corner-to-corner one is all light squares)
        var other = G.chance(0.5);
        for (var i = 0; i < 4; i++) {
          (function (i) {
            setTimeout(function () {
              flyer(i % 2 ? '&#128378;' : '&#128131;', 'dancer', other ? [-6, 8] : [-6, 94], other ? [90, 100] : [94, -6], 1800);
              A.play('bells');
            }, i * 260);
          })(i);
        }
        await G.wait(900);
        var diag = [];
        if (other) for (var r1 = 1; r1 < 8; r1++) diag.push(Rules.sq(r1, r1 - 1));
        else for (var r = 7, c = 0; r >= 0; r--, c++) diag.push(Rules.sq(r, c));
        var ns = Rules.cloneState(P.state);
        var occ = diag.map(function (s) { return ns.cells[s]; }).reverse();
        diag.forEach(function (s, i) { ns.cells[s] = occ[i]; });
        crownStray(ns);
        P.set(ns);
        P.last = null;
        await G.wait(900);
        ui.bark('colin', m[1], 2800);
      }
    },
    {
      id: 'royal',
      can: function () { return men('P', function (p) { return !p.king; }).length && men('C', function (p) { return !p.king; }).length; },
      run: async function () {
        A.play('fanfare');
        ui.caption(royals(), 3600);
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
        var sn = sneezes();
        A.play('sneeze');
        ui.colin('shock');
        await ui.say('colin', sn[0], { mood: 'shock' });
        await ui.say('colin', sn[1], { mood: 'shock' });
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
        if (P.metArbiter && !G.interludes.saidDemons) {
          G.interludes.saidDemons = true;
          await ui.say('arbiter', 'NASAL DEMONS! I *told* you. This is what undefined behaviour looks like!', { mood: 'angry' });
        }
        ui.caption('Two pieces have been swapped to the other side by tiny demons.', 2800);
      }
    },
    {
      id: 'pigeon',
      can: function () { return Rules.emptyDark(P.state).length > 4 && !visitorOnBoard(); },
      run: async function (mod) { visit(mod, 'pigeon', pigeonIn(), pigeonOut(), true); }
    },
    {
      id: 'duck',
      can: function () { return met(4) && Rules.emptyDark(P.state).length > 4 && !visitorOnBoard(); },
      run: async function (mod) { visit(mod, 'duck', duckIn(), duckOut(), false); }
    },
    {
      id: 'powercut',
      can: function () { return P.awake; },
      run: async function (mod) {
        A.play('thunder');
        ui.appClass('powercut');
        ui.caption(powercuts(), 3000);
        mod.lingering.push({ rounds: 1, end: async function () { ui.appClass('powercut', false); ui.flash('#fff8'); } });
      }
    },
    {
      id: 'gust',
      can: function () { return !(P.cfg && P.cfg.mods && P.cfg.mods.some(function (m) { return m.isWind; })); },
      run: async function () {
        ui.caption(gusts(), 2600);
        await G.wait(600);
        await P.gust(G.pick(Rules.DIAG));
      }
    },
    {
      id: 'narrator',
      can: function () { return met(3); },
      run: async function () {
        await ui.say('narrator', narration());
      }
    },
    {
      id: 'var',
      can: function () { return P.metArbiter && P.last; },
      run: async function () {
        await ui.whistle();
        ui.arbiter('stern');
        await ui.say('arbiter', G.pick(['Hold it! VAR is reviewing that last move.', 'One moment. I am checking the monitor.', 'Stop there. That move is going to the video referee.']), { mood: 'stern' });
        if (P.last) { ui.squareClass(P.last[0], 'glow'); ui.squareClass(P.last[1], 'glow'); }
        await G.wait(1400);
        ui.clearSquareClass('glow');
        var red = Rules.count(P.state, 'P'), blk = Rules.count(P.state, 'C');
        if (red < blk) {
          await ui.say('arbiter', 'After review... the decision is that red has been hard done by. Red gets an extra move.', { mood: 'smile' });
          P.skipAI = 1;
        } else {
          await ui.say('arbiter', G.pick(['After review, the move stands.', 'After review, the move stands. I didn’t like it, mind.', 'After review: inconclusive. Play on.', 'After review, I have decided that I enjoy reviewing things.']), { mood: 'stern' });
        }
        ui.arbiterHide();
      }
    }
  ];

  // The narrator looks at the actual board before saying anything.
  var genericNarration = G.deck([
    'A tense moment on the dark squares. Or possibly just a moment. It is hard to tell with draughtsmen.',
    'In the wild, a draughtsman lives for roughly one game. Most of them spend it waiting.',
    'Notice how the pieces avoid eye contact with the Finger. A survival instinct, perhaps.',
    'The light squares remain empty, as they always have. Nothing grows there. Nothing ever will.'
  ]);
  function narration() {
    var red = Rules.count(P.state, 'P'), blk = Rules.count(P.state, 'C');
    var kings = Rules.count(P.state, 'P', function (p) { return p.king; }) + Rules.count(P.state, 'C', function (p) { return p.king; });
    var opts = [
      'Here on the dark squares, the red herd numbers ' + red + '. The black herd, ' + blk + '. Neither seems aware that it is being filmed.',
      red > blk ? 'The red herd is thriving. The black herd watches, and plots, and does not have the brains to plot.' : red < blk ? 'The red herd is under pressure. Somewhere, a Finger hesitates.' : 'The two herds are evenly matched. Nature, for once, is undecided.'
    ];
    if (kings) opts.push(kings === 1 ? 'Observe the king. It has been to the far side of the board and back. It has seen things.' : 'There are ' + kings + ' kings on the board now. Too many kings. Nature abhors a monarchy.');
    return G.chance(0.6) ? G.pick(opts) : genericNarration();
  }

  // a passing bird (or duck) wanders about for a few rounds
  function visitorOnBoard() { return Rules.find(P.state, function (p) { return p.visitor; }) >= 0; }
  function visit(mod, kind, arrive, leave, poops) {
    A.play(kind === 'duck' ? 'quack' : 'coo');
    var empties = Rules.emptyDark(P.state).filter(function (s) { var r = s >> 3; return r >= 2 && r <= 5; });
    if (!empties.length) empties = Rules.emptyDark(P.state);
    var at = G.pick(empties);
    var ns = Rules.cloneState(P.state);
    ns.cells[at] = Rules.piece({ team: 'N', kind: kind, color: 'none', visitor: true });
    P.set(ns);
    ui.caption(arrive, 3200);
    mod.lingering.push({
      rounds: 3,
      tick: function () { G.interludes.walkPigeon(kind); },
      end: async function () {
        var s = Rules.find(P.state, function (p) { return p.visitor; });
        if (s < 0) return;
        var ns2 = Rules.cloneState(P.state);
        ns2.cells[s] = null;
        if (poops) {
          ns2.blocked = Object.assign({}, ns2.blocked);
          ns2.blocked[s] = 3;
        }
        P.set(ns2, { flyDir: [-1, 0.3] });
        if (poops) ui.squareClass(s, 'poop');
        A.play(kind === 'duck' ? 'quack' : 'coo');
        ui.caption(leave, 3200);
      }
    });
  }

  G.interludes = {
    list: LIST,
    walkPigeon: function (kind) {
      kind = kind || 'pigeon';
      var s = Rules.find(P.state, function (p) { return p.kind === kind; });
      if (s < 0) return;
      var opts = Rules.neighbours(s).filter(function (n) { return !P.state.cells[n] && !P.state.blocked[n]; });
      var says = kind === 'duck' ? ['Quack.', 'Quack?', '*waddles*', 'QUACK.'] : ['Coo.', 'Coo?', 'COO.', '*struts*'];
      if (!opts.length) { ui.pieceSay(s, says[0], 1200); return; }
      var ns = Rules.cloneState(P.state);
      var t = G.pick(opts);
      ns.cells[t] = ns.cells[s]; ns.cells[s] = null;
      P.set(ns);
      if (G.chance(0.4)) { ui.pieceSay(t, G.pick(says), 1200); A.play(kind === 'duck' ? 'quack' : 'coo'); }
    },
    // tick down poop squares
    tickBlocked: function () {
      var b = P.state.blocked, nb = {}, any = false;
      for (var k in b) {
        any = true;
        if (b[k] > 1) nb[k] = b[k] - 1;
        else ui.squareClass(+k, 'poop', false);
      }
      if (any) { var ns = Rules.cloneState(P.state); ns.blocked = nb; P.state = ns; ui.state = ns; }
    }
  };

  // The mod that schedules them.
  // opts: {max, base, exclude: [ids], only: [ids], minTurn, gap, cap}
  //   The chance of an interruption grows with each turn since the last one (or since minTurn),
  //   never fires within `gap` turns of the previous one, and tops out at `cap`.
  G.Interludes = function (opts) {
    opts = opts || {};
    var m = { count: 0, lingering: [], used: [], lastTurn: null, lastId: null };
    var max = opts.max == null ? 1 : opts.max;
    var minTurn = opts.minTurn || 3, gap = opts.gap || 0, cap = opts.cap || 0.9;
    m.beforePlayer = async function () {
      if (m.count >= max || m.lingering.length) return;
      var since = m.lastTurn == null ? P.turn - minTurn + 1 : P.turn - m.lastTurn - gap;
      if (since < 1) return;
      if (!G.chance(Math.min(cap, (opts.base || 0.1) * since))) return;
      var pool = LIST.filter(function (i) {
        if (opts.only && opts.only.indexOf(i.id) < 0) return false;
        if (opts.exclude && opts.exclude.indexOf(i.id) >= 0) return false;
        return !i.can || i.can();
      });
      if (!pool.length) return;
      // nothing repeats within a game until everything available has had a go
      var unused = pool.filter(function (i) { return m.used.indexOf(i.id) < 0; });
      if (!unused.length) {
        m.used = [];
        unused = pool.filter(function (i) { return i.id !== m.lastId; });
        if (!unused.length) unused = pool;
      }
      // across games, prefer the ones this player hasn't seen lately
      var seen = G.save.seen || [];
      var fresh = unused.filter(function (i) { return seen.indexOf(i.id) < 0; });
      var it = G.pick(fresh.length ? fresh : unused);
      m.count++;
      m.used.push(it.id);
      m.lastTurn = P.turn;
      m.lastId = it.id;
      seen = seen.filter(function (id) { return id !== it.id; }).concat([it.id]);
      if (seen.length >= LIST.length) seen = [it.id];
      G.save.seen = seen;
      G.writeSave();
      if (window.__dafts) window.__dafts.log.push('interlude:' + it.id + '@' + P.turn);
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
      var s = P.state ? Rules.find(P.state, function (p) { return (p.kind === 'pigeon' || p.visitor) && !p.keep; }) : -1;
      if (s >= 0 && !opts.keepPigeon) { var ns2 = Rules.cloneState(P.state); ns2.cells[s] = null; P.set(ns2); }
    };
    return m;
  };
})();

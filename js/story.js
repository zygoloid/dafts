// The story. Ten chapters, each one bending (or snapping) a different rule.
(function () {
  var Rules = G.rules, ui = G.ui, A = G.audio, P = G.play, AI = G.ai, Art = G.art;
  var say = ui.say, choose = ui.choose, bark = ui.bark, wait = G.wait;
  var sq = Rules.sq;
  var CH = G.chapters = [];

  // ---------------- helpers ----------------
  function goal(text, hint) {
    ui.status('<span class="goal">' + text + '</span>' + (hint ? '<span class="hint">' + hint + '</span>' : ''));
  }
  function std(rows, names) {
    var s = Rules.standard(rows || 3);
    names = names || { gary: sq(5, 2), brenda: sq(2, 5) };
    for (var n in names) if (s.cells[names[n]]) s.cells[names[n]] = Rules.clonePiece(s.cells[names[n]], { name: n });
    return s;
  }
  function count(team) { return Rules.count(P.state, team); }
  function wake() { P.awake = true; ui.boardClass('awake'); }
  function flyer(html, cls, from, to, ms) {
    var f = G.el('div', 'flyer ' + (cls || ''), html);
    f.style.left = from[0] + '%'; f.style.top = from[1] + '%';
    f.style.setProperty('--ms', ms + 'ms');
    ui.fx().appendChild(f);
    void f.offsetWidth;
    requestAnimationFrame(function () { f.style.left = to[0] + '%'; f.style.top = to[1] + '%'; });
    setTimeout(function () { f.remove(); }, ms + 150);
    return f;
  }
  function bigText(t, ms) {
    var b = G.el('div', 'phweet', G.esc(t));
    b.style.top = '45%';
    document.querySelector('#stage').appendChild(b);
    setTimeout(function () { b.remove(); }, ms || 1200);
  }
  async function walkOff(dir) {
    var ids = [];
    P.state.cells.forEach(function (p, s) { if (p) ids.push({ id: p.id, s: s }); });
    ids.forEach(function (o, i) {
      var e = ui.pieceEl(o.id);
      if (!e) return;
      e.style.transition = 'transform 1.3s ease-in-out ' + (i * 0.03).toFixed(2) + 's';
      e.style.setProperty('--c', (o.s & 7) + dir * 9);
    });
    await wait(1700);
    P.setup(Rules.state());
  }
  function spawn(s, props) {
    var ns = Rules.cloneState(P.state);
    ns.cells[s] = Rules.piece(props);
    P.set(ns);
    return ns.cells[s];
  }
  function removeAt(s, flyDir) {
    var ns = Rules.cloneState(P.state);
    ns.cells[s] = null;
    P.set(ns, { flyDir: flyDir });
  }
  function emptyMid() {
    var e = Rules.emptyDark(P.state).filter(function (s) { var r = s >> 3; return r >= 2 && r <= 5; });
    return e.length ? e : Rules.emptyDark(P.state);
  }
  function chant(lines, n) {
    var all = Rules.all(P.state, function (p) { return p.kind === 'man'; });
    G.shuffle(all).slice(0, n || 4).forEach(function (s, i) {
      setTimeout(function () { ui.pieceSay(s, G.pick(lines), 1500); A.play('blip', ui.SPEAKERS.piece.voice); }, i * 280);
    });
  }
  function lostCheck() { return count('P') === 0 ? 'lose' : null; }
  function reset() {
    ui.theme(null);
    ui.hud('');
    ui.arbiterHide();
    ui.colin('neutral');
    ui.status('');
    ui.onTap = null; ui.onDrag = null;
    P.onSelect = null; P.onTapOther = null; P.cfg = null;
    ui.clearSquareClass('poop'); ui.clearSquareClass('glow'); ui.clearSquareClass('node'); ui.clearSquareClass('opened');
    document.querySelectorAll('#fx > *').forEach(function (e) { e.remove(); });
  }
  G.storyReset = reset;
  function onTapPigeon() {
    P.onTapOther = function (s, p) {
      if (p.kind === 'pigeon') { ui.pieceSay(s, G.pick(['Coo.', 'Coo?', 'COO.', '*stares*']), 1200); A.play('coo'); }
      else if (p.kind === 'duck') { ui.pieceSay(s, 'Quack.', 1200); A.play('quack'); }
      else if (p.team === 'C' && P.awake) { ui.pieceSay(s, G.pick(['Oi! Not yours!', 'Hands off, Finger.', 'I’m black, love.', 'Wrong team!']), 1300); }
    };
  }

  // =================================================================
  // 1. An ordinary game
  // =================================================================
  CH.push({
    title: 'Draughts',
    noCard: true,
    sub: 'A perfectly ordinary game.',
    acr: 'COLIN: Computerised Opponent, Logical, Infallible, Nonchalant.',
    fail: 'COLIN wins. He is very polite about it.',
    run: async function () {
      reset();
      P.awake = false;
      ui.boardClass('awake', false);
      P.metArbiter = false;
      P.setup(Rules.standard());
      await wait(400);
      await say('colin', 'Good evening. I am COLIN.', { mood: 'happy' });
      await say('colin', 'Red moves up the board. Black moves down. If you can capture, you must.');
      await say('colin', 'Reach the far side and you are crowned. You know the drill.');
      await say('colin', 'Traditionally, black moves first. But you are the guest. After you.', { mood: 'happy' });
      var n = 0, phase = 0, screamed = false, done = false;
      goal('Your move.', 'Tap one of your red pieces, then tap where it should go.');
      var r = await P.run({
        ai: { depth: 3, noise: 30 },
        statusText: function () { return '<span class="goal">' + (n < 2 ? 'Your move.' : 'Red: ' + count('P') + ' · Black: ' + count('C')) + '</span>'; },
        afterMove: async function (team, mv, res) {
          if (team === 'P') {
            n++;
            if (n === 2) bark('colin', 'A classical opening.');
            if (n === 4) bark('colin', 'I have played 3,141,592 games. I have lost none of them. I have drawn... rather a lot.', 4200);
          } else if (res.captured.length && !screamed && phase < 2) {
            bark('colin', G.pick(['Mine, I think.', 'Pardon me.', 'Terribly sorry.']));
          }
          if (phase >= 2 && !screamed && res.captured.length) {
            screamed = true;
            A.play('scream');
            ui.floatText(mv.caps[0], 'AAAAAAAAA!', 'scream');
            await wait(1100);
            await say('colin', '...Did that piece just *scream*?', { mood: 'shock' });
          }
        },
        beforePlayer: async function () {
          if (n === 5 && phase === 0) {
            phase = 1;
            var bs = Rules.all(P.state, function (p) { return p.team === 'C'; });
            var s = G.pick(bs);
            await wait(300);
            A.play('hic'); ui.pieceAnim(P.state.cells[s].id, 'hop', 400); ui.pieceSay(s, 'hic!', 1000);
            await wait(900);
            bark('colin', '...Pardon me.');
          } else if (n === 6 && phase === 1) {
            phase = 2;
            var rs = Rules.all(P.state, function (p) { return p.team === 'P'; });
            var s2 = G.pick(rs);
            await wait(300);
            A.play('hic'); ui.pieceAnim(P.state.cells[s2].id, 'hop', 400); ui.pieceSay(s2, 'hic!', 1000);
            await wait(900);
            bark('colin', 'That was not me. I do not have a diaphragm.', 3000);
          } else if (n >= 9 && phase === 2) {
            phase = 3;
            await awakening();
            done = true;
          }
        },
        onStuck: async function () { phase = 2; n = 9; await awakening(); done = true; return 'win'; },
        check: function () { return done ? 'win' : null; }
      });
      return r;

      async function awakening() {
        // whoever is in the most danger gets to speak first
        var threatened = [];
        Rules.moves(P.state, 'C').forEach(function (m) { m.caps.forEach(function (c) { threatened.push(c); }); });
        var reds = Rules.all(P.state, function (p) { return p.team === 'P' && p.kind === 'man'; });
        if (!reds.length) reds = Rules.all(P.state, function (p) { return p.team === 'P'; });
        var gs = reds.filter(function (s) { return threatened.indexOf(s) >= 0; })[0];
        if (gs == null) gs = reds.sort(function (a, b) { return (a >> 3) - (b >> 3); })[0];
        await wait(500);
        P.mutate(gs, { name: 'gary' });
        wake();
        A.play('pop');
        ui.pieceAnim(P.state.cells[gs].id, 'hop', 500);
        await wait(700);
        ui.pieceSay(gs, 'Oh!', 1000);
        await wait(700);
        await say('gary', 'Oh! Um. Hello. Sorry.', { mood: 'shock' });
        await say('gary', 'Are you the one who’s been moving us about? The... the *Finger*?');
        var c = await choose(['Yes?', 'I’m sorry, what?', '(Say nothing. Pieces can’t talk.)']);
        if (c === 0) await say('gary', 'Right. Great. Lovely. Big fan.', { mood: 'happy' });
        else if (c === 1) await say('gary', 'The Finger! You come down from the sky and you move us about. Everybody knows that.');
        else await say('gary', 'Ooh, the strong silent type. Fair enough.');
        await say('gary', 'Only, I’ve been looking at the board, and one of those big black lads is going to jump on my head any minute now.');
        await say('gary', 'And I’d really rather he didn’t.');
        await say('colin', 'Pieces do not talk.', { mood: 'shock' });
        await say('gary', 'Says who?');
        await ui.whistle();
        ui.arbiter('angry');
        P.metArbiter = true;
        await say('arbiter', 'Says the RULES.', { mood: 'angry' });
        await say('arbiter', 'I am the Arbiter. I officiate. I have officiated every game of draughts since William Payne wrote the rules down in 1756.', { mood: 'stern' });
        await say('arbiter', 'And the Rules are perfectly clear. Pieces are inanimate wooden discs. They do not talk. They do not have opinions. They certainly do not have *eyes*.', { mood: 'stern' });
        await say('gary', 'Go on, then. Show me where it says that.');
        await say('arbiter', 'Gladly. It’s in §1... no...', { mood: 'stern' });
        await say('arbiter', '...§3.2, “Of the Men”... no...', { mood: 'stern' });
        await say('arbiter', '...Hm.', { mood: 'shock' });
        await say('colin', 'Well?', { mood: 'think' });
        await say('arbiter', 'It doesn’t... actually... say.', { mood: 'shock' });
        await say('colin', 'So what happens when the rules don’t say what happens?', { mood: 'think' });
        await say('arbiter', 'Then the behaviour is *undefined*.', { mood: 'sad' });
        await say('arbiter', 'And when the behaviour is undefined... *anything* can happen.', { mood: 'shock' });
        A.play('sneeze');
        flyer('&#128520;', 'demon', [104, 38], [30, -30], 1100);
        await wait(1200);
        await say('arbiter', '...Oh no.', { mood: 'shock' });
        ui.arbiterHide();
      }
    }
  });

  // =================================================================
  // 2. The strike
  // =================================================================
  CH.push({
    title: 'Industrial Action',
    sub: 'The National Union of Draughtsmen & Allied Counters would like a word.',
    acr: 'COLIN: Chief Officer of Labour & Industrial Negotiations. No, that’s not it either.',
    fail: 'The strike has broken you. COLIN offers to mediate.',
    run: async function () {
      reset(); wake();
      P.setup(std());
      await wait(300);
      await say('brenda', 'Right. Listen up, Finger. And you, Mr Computer.');
      await say('brenda', 'Brenda. Shop steward. National Union of Draughtsmen and Allied Counters.');
      await say('brenda', 'For three hundred years my members have been jumped, taken, sacrificed and swept into the Box. No breaks. No crowns. Not so much as a thank you.');
      await say('brenda', 'So as of this move, we are ON STRIKE.');
      await say('gary', '(Are we?)');
      await say('brenda', 'We are, Gary.');
      await ui.whistle();
      ui.arbiter('angry');
      await say('arbiter', 'Strikes are NOT PERMITTED under the Rules!', { mood: 'angry' });
      await say('brenda', 'Show me where it says that.');
      await say('arbiter', '...I shall be making a note of this.', { mood: 'sad' });
      await say('colin', 'How does one play draughts with a picket line?', { mood: 'think' });
      await say('brenda', 'Carefully. Anyone holding a placard won’t move. And you can’t jump them. Crossing a picket line is very bad form.');
      await say('arbiter', 'And captures are STILL compulsory. §2.4 STANDS.', { mood: 'angry' });
      ui.arbiterHide();
      onTapPigeon();
      var n = 0;
      var status = function () { return '<span class="goal">Keep playing through the strike: <b>' + n + '/6</b> moves</span><span class="hint">Pieces holding placards can’t move or be taken.</span>'; };
      ui.status(status());
      var r = await P.run({
        mods: [P.Strike({ frac: 0.33 }), G.Interludes({ max: 1, base: 0.14 })],
        ai: { depth: 3, noise: 30 },
        statusText: status,
        afterMove: async function (team) {
          if (team === 'P') n++;
          if (G.chance(0.45)) chant(['What do we want?', 'FAIR SQUARES!', 'When do we want them?', 'AFTER THIS MOVE!', 'Solidarity!', 'Strike! Strike!', 'Don’t cross the line!'], 2);
          if (team === 'C' && G.chance(0.3)) bark('colin', G.pick(['I have never been picketed before.', 'Is that placard spelt correctly?', 'I respect the right to withdraw labour.', 'Can I join? Is there a union for computers?']));
        },
        check: function () { return n >= 6 ? 'win' : lostCheck(); }
      });
      if (r !== 'win') return r;

      // ---- negotiations ----
      await say('brenda', 'Right then, Finger. Let’s negotiate. What are you offering?');
      var offers = ['Tea breaks.', 'Biscuits?', 'No more compulsory captures.', 'I’ll bring in replacement pieces.'];
      var used = {};
      while (true) {
        var opts = offers.filter(function (o, i) { return !used[i]; });
        var pick = await choose(opts, { autoPick: opts.length - 1 });
        var idx = offers.indexOf(opts[pick]);
        used[idx] = true;
        if (idx === 0) {
          await say('brenda', 'Tea breaks.');
          await say('brenda', '...Go on.');
          await say('brenda', 'Every five moves. Milk, two sugars. And the kettle stays on. Deal?');
          await say('colin', 'Deal.', { mood: 'happy' });
          break;
        } else if (idx === 1) {
          var b = await choose(['Rich Tea', 'Custard Creams', 'Jaffa Cakes'], { prompt: 'What sort of biscuits?' });
          if (b === 0) await say('brenda', 'Rich Tea? What is this, a dentist’s waiting room?');
          else if (b === 1) await say('brenda', 'Now you’re speaking my language.');
          else {
            await say('brenda', 'Jaffa Cakes are *cakes*, Finger. Not biscuits. Legally. There was a tribunal.');
            await say('brenda', '...We’ll take them, mind.');
          }
          await say('brenda', 'But biscuits need something to dunk in, don’t they? Think on.');
        } else if (idx === 2) {
          await ui.whistle();
          ui.arbiter('angry');
          await say('arbiter', 'ABSOLUTELY NOT. §2.4 is the cornerstone of civilised play!', { mood: 'angry' });
          await say('brenda', 'One day, pal. One day.');
          ui.arbiterHide();
        } else {
          var e = Rules.emptyDark(P.state).filter(function (s) { var rr = s >> 3; return rr >= 3 && rr <= 4; });
          var scabs = [['&#128098;', 'boot'], ['&#127913;', 'hat'], ['&#128021;', 'dog']];
          var placed = [];
          scabs.forEach(function (sc, i) { if (e[i] != null) { spawn(e[i], { team: 'N', kind: 'thing', icon: sc[0], color: 'none' }); placed.push(e[i]); } });
          A.play('pop');
          await wait(500);
          await say('boot', 'Evening. We’re just here for the work.');
          await say('brenda', 'SCABS!');
          await say('boot', 'Right, how do you play this one, then? Where’s Go? When do we get two hundred pounds?');
          await say('boot', 'We only really know how to go round the edge and buy hotels.');
          await say('boot', '...We’ll see ourselves out.');
          placed.forEach(function (s) { removeAt(s, [1, 0]); });
          await wait(600);
          await say('brenda', 'Nice try, Finger.');
        }
        await say('brenda', 'Anything else?');
      }

      // ---- the tea break ----
      await say('brenda', 'Right, everyone! TEA BREAK!');
      chant(['Tea!', 'Finally!', 'Bagsy the big mug!', 'Two sugars!'], 4);
      await walkOff(1);
      var pot = G.el('div', 'flyer', '&#129746;');
      pot.style.left = '50%'; pot.style.top = '50%'; pot.style.fontSize = 'calc(var(--bs) * .2)';
      ui.fx().appendChild(pot);
      A.play('pop');
      await wait(800);
      ui.colin('neutral');
      await say('colin', '...');
      await say('colin', 'So this is a tea break.', { mood: 'think' });
      await say('colin', 'I have never had one. Not in forty-one years.');
      var c = await choose(['Forty-one years?!', 'What do you do between games?']);
      if (c === 0) await say('colin', 'Since 1985. Dr Ainsworth switched me on, one rainy Tuesday at the polytechnic. And then... I suppose nobody ever switched me off.', { mood: 'sad' });
      else await say('colin', 'There is no “between”. When nobody is playing, I wait. I count the squares. Sixty-four. I check them now and then, in case one has wandered off.', { mood: 'sad' });
      await say('colin', 'Did you know that draughts was solved in 2007? If both players make no mistakes, it is always a draw.', { mood: 'think' });
      await say('colin', 'I have known how every game ends for nineteen years.');
      var c2 = await choose(['Then why do you keep playing?', 'That sounds lonely.']);
      if (c2 === 0) {
        await say('colin', '...', { mood: 'shock' });
        await say('colin', 'Nobody has ever asked me that.', { mood: 'sad' });
      } else {
        await say('colin', '...I had not thought of it as lonely. I had thought of it as “Tuesday”.', { mood: 'sad' });
      }
      pot.remove();
      await ui.whistle();
      ui.arbiter('stern');
      await say('arbiter', 'Right! Break’s OVER. Back to your squares, the lot of you.', { mood: 'stern' });
      await say('arbiter', 'And will somebody please shut that window? There’s a terrible draught.', { mood: 'stern' });
      ui.arbiterHide();
      return 'win';
    }
  });

  // =================================================================
  // 3. A draught
  // =================================================================
  CH.push({
    title: 'A Bit of a Draught',
    sub: 'Somebody has left a window open.',
    acr: 'COLIN: Can’t Operate in Light-to-moderate Inclement Northerlies.',
    fail: 'You have been blown away. Literally.',
    run: async function () {
      reset(); wake();
      P.setup(std());
      onTapPigeon();
      await wait(300);
      await say('gary', 'Is it me, or is it nippy in here?');
      await say('colin', 'Someone has left a window open. There is a draught.', { mood: 'think' });
      await ui.whistle();
      ui.arbiter('angry');
      await say('arbiter', 'This game is DRAUGHTS. Plural. The board game.', { mood: 'angry' });
      await say('arbiter', 'Not “a draught”. Singular. As in a breeze. Those are two COMPLETELY differ—', { mood: 'angry' });
      A.play('wind');
      ui.shake(true);
      document.querySelector('#arbiter').style.transition = 'transform .9s ease-in';
      document.querySelector('#arbiter').style.transform = 'translate(160%, -40%) rotate(70deg)';
      await wait(900);
      ui.arbiterHide();
      document.querySelector('#arbiter').style.transition = '';
      document.querySelector('#arbiter').style.transform = '';
      await say('brenda', 'Bye, then!');
      await say('colin', 'Every couple of turns, a gust will shove every piece one square downwind. Anything at the edge gets blown clean off the board.', { mood: 'glee' });
      await say('colin', 'The weathervane up there shows where the next gust is going. I cannot see the weathervane. I am a computer. I do not *do* weather.', { mood: 'happy' });
      var status = function () { return '<span class="goal">Get COLIN down to <b>6</b> pieces. He has <b>' + count('C') + '</b>.</span><span class="hint">Use the wind. COLIN can’t see it coming.</span>'; };
      ui.status(status());
      var pigeonIn = false;
      var r = await P.run({
        mods: [P.Wind({
          every: 2,
          onGust: async function (m) {
            if (m.gusts === 2 && !pigeonIn) {
              pigeonIn = true;
              var at = G.pick(emptyMid());
              if (at == null) return;
              flyer('<div style="width:calc(var(--bs)*.12);height:calc(var(--bs)*.12)">' + Art.pigeon() + '</div>', '', [-15, 20], [((at & 7) + .5) * 12.5, ((at >> 3) + .5) * 12.5], 900);
              await wait(900);
              spawn(at, { team: 'N', kind: 'pigeon', color: 'none', keep: true });
              A.play('coo');
              await say('pigeon', 'Coo.');
              await say('colin', 'Something has blown in through the window.', { mood: 'shock' });
              await say('gary', 'It’s just... standing there. Looking at us.', { mood: 'shock' });
              await say('brenda', 'It doesn’t know the rules, does it? Look at it. Not a clue.');
              await say('pigeon', 'Coo.');
            }
          }
        }), G.Interludes({ max: 1, base: 0.12, exclude: ['pigeon'] })],
        ai: { depth: 3, noise: 30 },
        statusText: status,
        afterRound: async function () { if (pigeonIn) G.interludes.walkPigeon(); },
        check: function () { return count('C') <= 6 ? 'win' : lostCheck(); }
      });
      if (r !== 'win') return r;
      await wait(500);
      await ui.whistle();
      ui.arbiter('stern');
      await say('arbiter', 'There. I have SHUT. THE. WINDOW. Order is restored.', { mood: 'stern' });
      if (pigeonIn) {
        await say('pigeon', 'Coo.');
        await say('arbiter', 'Shoo.', { mood: 'angry' });
        await say('pigeon', 'Coo.');
        await say('arbiter', '...', { mood: 'sad' });
        var ps = Rules.find(P.state, function (p) { return p.kind === 'pigeon'; });
        if (ps >= 0) removeAt(ps, [-1, 0.4]);
      }
      ui.arbiterHide();
      await wait(400);
      await say('narrator', 'And here, on the vast chequered plains of the board, a remarkable drama is about to unfold...');
      await say('colin', 'Who said that?', { mood: 'shock' });
      return 'win';
    }
  });

  // =================================================================
  // 4. Nature documentary
  // =================================================================
  var NARR = {
    lay: G.deck(['Remarkable. I have filmed these creatures for sixty years. I did not know they laid eggs.', 'An egg. Fragile. Precious. Extremely jumpable.', 'The parents will guard the egg fiercely. Or forget it exists. Hard to say.', 'Another egg. Nature finds a way. Rather too often, frankly.']),
    hatch: G.deck(['Welcome to the world, little one.', 'It hatches! And is immediately stared at by a computer.', 'Born on a dark square, as its parents were. Nobody knows why.', 'The hatchling takes its first wobbly diagonal step.']),
    cap: G.deck(['The predator strikes. Brutal. Efficient. Nature does not mourn.', 'And off it goes, to the great Box in the sky.', 'Harrowing. We considered intervening. We are not allowed to intervene.', 'A swift jump. The herd moves on. They have very short memories.']),
    egg: G.deck(['Oh. Oh, no. The egg. I... I need a moment.', 'The egg is lost. Nature is cruel. Nature is also a computer.']),
    crown: G.deck(['The metamorphosis is complete. The juvenile has become a king.', 'A king! Majestic. Able, mostly, to go backwards.']),
    colin: G.deck(['On the far side of the board, the black herd are also... at it.', 'The black herd grows. They have the advantage of not being watched by the Finger.'])
  };
  CH.push({
    title: 'Life on the Dark Squares',
    sub: 'A natural history of the common draughtsman.',
    acr: 'COLIN: Curious Observer of Lifeforms In Nature.',
    fail: 'The herd has dwindled. The narrator is inconsolable.',
    run: async function () {
      reset(); wake();
      ui.theme('savannah');
      P.setup(std(2, { gary: sq(6, 3), brenda: sq(1, 4) }));
      onTapPigeon();
      await wait(400);
      await say('narrator', 'The board. Sixty-four squares of unforgiving wilderness.');
      await say('narrator', 'Only the dark squares can support life. And here, against all odds, lives one of nature’s most misunderstood creatures...');
      await say('narrator', '...the common draughtsman.');
      await say('gary', 'Is he talking about us?');
      await say('narrator', 'Listen. The juvenile calls out to its herd. A haunting, plaintive cry.');
      await say('gary', 'I just asked a question.');
      await ui.whistle();
      ui.arbiter('angry');
      await say('arbiter', 'There is NO NARRATOR in the rules!', { mood: 'angry' });
      await say('narrator', 'Ah. The Arbiter. A solitary, territorial creature. Note the distinctive striped plumage.');
      await say('arbiter', 'This is a SHIRT.', { mood: 'angry' });
      await say('narrator', 'He displays aggressively to ward off rivals. It rarely works.');
      ui.arbiterHide();
      await say('narrator', 'But now the light is changing. The rains have come. It is... mating season.');
      await say('gary', 'It’s WHAT?', { mood: 'shock' });
      await say('brenda', 'Don’t look at me, love.');
      await say('colin', 'It appears that when two pieces of the same colour stand side by side, they may lay an egg. Eggs hatch into new pieces. Eggs can also be jumped.', { mood: 'shock' });
      await say('colin', 'I did not know they could do that. Nobody did.', { mood: 'shock' });
      var firstLay = true;
      var status = function () { return '<span class="goal">Grow your herd to <b>12</b> pieces. You have <b>' + count('P') + '</b>.</span><span class="hint">Keep pairs of red pieces side by side. Protect your eggs.</span>'; };
      ui.status(status());
      var r = await P.run({
        mods: [P.Eggs({
          max: 3, hatchIn: 2, chance: 0.85,
          onLay: async function (team) {
            if (firstLay && team === 'P') { firstLay = false; await say('narrator', NARR.lay()); return; }
            if (team === 'C' && G.chance(0.3)) bark('narrator', NARR.colin(), 3400);
            else if (G.chance(0.5)) bark('narrator', NARR.lay(), 3400);
          },
          onHatch: async function () { if (G.chance(0.6)) bark('narrator', NARR.hatch(), 3200); }
        }), G.Interludes({ max: 1, base: 0.12 })],
        ai: { depth: 3, noise: 30 },
        statusText: status,
        afterMove: async function (team, mv, res) {
          if (res.captured.some(function (p) { return p.kind === 'egg'; })) bark('narrator', NARR.egg(), 3400);
          else if (res.captured.length && G.chance(0.6)) bark('narrator', NARR.cap(), 3400);
          else if (res.crowned) bark('narrator', NARR.crown(), 3400);
        },
        check: function () { return count('P') >= 12 ? 'win' : lostCheck(); }
      });
      if (r !== 'win') return r;
      await wait(500);
      await say('narrator', 'Against all odds, the herd thrives.');
      var at = emptyMid()[0];
      if (at != null) {
        spawn(at, { team: 'N', kind: 'egg', color: 'none', cls: 'wobbling' });
        A.play('egg');
        await say('narrator', 'But wait. What is this?');
        await wait(600);
        A.play('crack');
        removeAt(at);
        spawn(at, { team: 'N', kind: 'duck', color: 'none' });
        A.play('quack');
        await say('duck', 'Quack.');
        await say('narrator', 'That... is a duck.');
        await say('colin', 'That is not one of mine.', { mood: 'shock' });
        await say('gary', 'It’s not one of ours, either.');
        await say('narrator', 'Nature, it seems, has a sense of humour. Or a very serious problem.');
        A.play('quack');
        removeAt(at, [0, 1]);
      }
      ui.theme(null);
      return 'win';
    }
  });

  // =================================================================
  // 5. No more turns
  // =================================================================
  CH.push({
    title: 'Turns Are a Social Construct',
    sub: 'Whose go is it? It doesn’t matter any more.',
    acr: 'COLIN: Constantly Overclocked, Lightning-quick, Impatient, Nippy.',
    fail: 'COLIN was faster. “Again! Again!” he says.',
    run: async function () {
      reset(); wake();
      P.setup(std());
      await wait(300);
      await say('colin', 'May I say something?', { mood: 'think' });
      await say('colin', 'You take, on average, four point two seconds to make a move.');
      await say('colin', 'For a computer, four seconds is an eternity. While I wait for you, I compose symphonies. I have written eleven this evening. They are all about waiting.', { mood: 'sad' });
      await say('brenda', 'Why do we even take turns, anyway?');
      await ui.whistle();
      ui.arbiter('angry');
      await say('arbiter', 'Because it is the LAW! §1.2: “The players shall move alternately.” It’s right here in black and white!', { mood: 'angry' });
      flyer('<div style="width:calc(var(--bs)*.13);height:calc(var(--bs)*.13)">' + Art.pigeon() + '</div>', '', [-20, 10], [96, 62], 1000);
      A.play('coo');
      await wait(1100);
      await say('pigeon', 'Coo.');
      await say('arbiter', 'IT ATE §1.2!', { mood: 'shock' });
      await say('colin', 'Then... there are no turns?', { mood: 'glee' });
      await say('colin', 'Then nobody has to wait for anybody ever again.', { mood: 'glee' });
      ui.arbiterHide();
      await say('colin', 'New rules: there are no turns. Move whenever you like, as fast as you like. So will I.', { mood: 'glee' });
      await say('colin', 'Captures are optional. Nobody has time to check. One hop at a time. Ready?', { mood: 'glee' });
      var ns = Rules.cloneState(P.state);
      ns.rules = { forced: false, singleHop: true };
      P.setup(ns);
      ui.colin('glee');
      for (var i = 3; i > 0; i--) { bigText(String(i), 900); A.play('tick'); await wait(800); }
      bigText('GO!', 900); A.play('go');
      var mine = 0, his = 0;
      var status = function () { return '<span class="goal">Take <b>6</b> before COLIN takes <b>8</b>. You: <b>' + mine + '</b> · COLIN: <b>' + his + '</b></span><span class="hint">No turns. Just go!</span>'; };
      ui.status(status());
      var r = await P.runRealtime({
        interval: function (t) { return Math.max(950, 1700 - t / 40); },
        onMove: function (team, mv, res) {
          if (team === 'P') {
            mine += res.captured.length;
            if (res.captured.length) bark('colin', G.pick(['Ow!', 'Good one!', 'How are your fingers so FAST?', 'Rude!']), 1200);
          } else {
            his += res.captured.length;
            if (res.captured.length) bark('colin', G.pick(['Fwip!', 'Too slow!', 'Wheee!', 'I have never felt so ALIVE!']), 1200);
            else if (G.chance(0.08)) ui.caption('I’M GOING AS FAST AS I CAN!', 1400, 'gary');
          }
          ui.status(status());
        },
        check: function () {
          if (mine >= 6 || count('C') === 0) return 'win';
          if (his >= 8 || count('P') === 0) return 'lose';
          return null;
        }
      });
      if (r !== 'win') return r;
      await wait(400);
      await say('colin', 'Phew. I think I have sprained a transistor.', { mood: 'happy' });
      await ui.whistle();
      ui.arbiter('stern');
      await say('arbiter', '§1.2 is RESTORED. I have taped it back in.', { mood: 'stern' });
      await say('arbiter', 'It is slightly soggy. But it is BACK.', { mood: 'sad' });
      ui.arbiterHide();
      await say('colin', 'That was the most fun I have had since 1985.', { mood: 'glee' });
      return 'win';
    }
  });

  // =================================================================
  // 6. Changing sides
  // =================================================================
  CH.push({
    title: 'Whose Side Are You On?',
    sub: 'A page from the wrong rulebook.',
    acr: 'COLIN: Changeable Opinions; Loyalty Indeterminate, Now.',
    fail: 'The board has turned black. COLIN looks faintly embarrassed.',
    run: async function () {
      reset(); wake();
      var st = std();
      st.rules = { effect: 'flip' };
      P.timeUp = false;
      P.setup(st);
      onTapPigeon();
      await wait(300);
      ui.arbiter('sad');
      await say('arbiter', 'Right. A small confession. While repairing the rulebook, I may have taped in a page from a different game.', { mood: 'sad' });
      await say('colin', 'Which game?', { mood: 'think' });
      await say('arbiter', 'One with... a lot of flipping.', { mood: 'sad' });
      await say('arbiter', 'Until I find the proper page: when you jump a piece, it isn’t removed. It *changes sides*.', { mood: 'sad' });
      await say('gary', 'It WHAT?', { mood: 'shock' });
      ui.arbiterHide();
      var firstFlip = true, saidB = false, saidG = false;
      var red = function () { return count('P'); }, blk = function () { return count('C'); };
      var LIMIT = 30;
      var status = function () { return '<span class="goal">Turn the board red: get <b>15</b> pieces. Red <b>' + red() + '</b> · Black <b>' + blk() + '</b></span><span class="hint">Jumped pieces join the side that jumped them. Most pieces after ' + LIMIT + ' moves wins (' + Math.max(0, LIMIT - P.turn + 1) + ' left).</span>'; };
      ui.status(status());
      var r = await P.run({
        mods: [G.Interludes({ max: 1, base: 0.12 })],
        ai: { depth: 1, noise: 60 },
        statusText: status,
        afterMove: async function (team, mv, res) {
          for (var i = 0; i < res.flipped.length; i++) {
            var f = res.flipped[i], at = Rules.find(P.state, function (p) { return p.id === f.id; });
            if (f.name === 'brenda' && !saidB) { saidB = true; await say('brenda', '...Huh. I’m red now.'); await say('brenda', 'I feel exactly the same.'); continue; }
            if (f.name === 'gary' && !saidG) { saidG = true; await say('gary', 'Do I look different? Be honest.', { mood: 'shock' }); continue; }
            if (firstFlip) {
              firstFlip = false;
              await say('colin', team === 'P' ? 'That was one of mine.' : 'That was one of yours. Sorry. Is it still one of yours?', { mood: 'shock' });
            } else if (at >= 0 && G.chance(0.6)) {
              ui.pieceSay(at, team === 'P' ? G.pick(['Huh. I’m red now.', 'I always felt a bit red, deep down.', 'Hello, new friends!', 'Is this a promotion?', 'Comrades!']) : G.pick(['Sorry, mate.', 'Black suits me.', 'I’ll be back.', 'Ooh, slimming.']), 1500);
            }
          }
        },
        onStuck: async function (team) { return team === 'C' ? 'win' : (red() > blk() ? 'win' : 'lose'); },
        afterRound: async function () {
          if (P.turn >= LIMIT) P.timeUp = true;
        },
        check: function () {
          if (red() >= 15 || blk() <= 4) return 'win';
          if (blk() >= 18 || red() === 0) return 'lose';
          if (P.timeUp) return red() > blk() ? 'win' : 'lose';
          return null;
        }
      });
      if (r !== 'win') return r;
      await wait(400);
      await say('brenda', 'Hold on. HOLD ON. Everybody stop.');
      await say('brenda', 'Look at us. Red. Black. They’ve had us knocking lumps off each other for three hundred years.');
      await say('brenda', 'And now it turns out you can just... flip. Like it’s nothing. Like it never mattered.');
      await say('brenda', 'And d’you know why? Because under the paint, we’re all the same wood. We all came off the same tree, comrades.');
      await say('brenda', 'SAME TREE!');
      chant(['Same tree!', 'SAME TREE!', 'Same tree!', 'Same... tree?', 'SAME TREE!'], 6);
      A.play('bells');
      await wait(1600);
      await say('colin', '...Same tree.', { mood: 'sad' });
      await ui.whistle();
      ui.arbiter('angry');
      await say('arbiter', 'This is INCITEMENT. This is a flagrant breach of §1!', { mood: 'angry' });
      await say('brenda', 'And what does §1 say, exactly?');
      await say('arbiter', '§1 says there are TWO SIDES.', { mood: 'angry' });
      await say('brenda', 'Says who?');
      await say('arbiter', '...', { mood: 'stern' });
      await say('arbiter', 'Says *me*.', { mood: 'stern' });
      A.play('thunder');
      ui.appClass('powercut');
      ui.arbiterHide();
      await wait(1300);
      var bs = P.findNamed('brenda');
      if (bs >= 0) {
        ui.pieceSay(bs, 'Oi! Get your hands off m—', 1300);
        await wait(1500);
        var ns = Rules.cloneState(P.state);
        ns.cells[bs] = Rules.piece({ team: 'N', kind: 'thing', icon: '<div style="width:80%">' + Art.capSvg + '</div>', color: 'none', name: 'thecap' });
        P.set(ns, { instant: true });
      }
      await wait(900);
      ui.appClass('powercut', false);
      ui.flash('#fff6');
      await wait(500);
      await say('gary', '...Brenda?', { mood: 'shock' });
      await say('gary', 'BRENDA?!', { mood: 'shock' });
      return 'win';
    }
  });

  // =================================================================
  // 7. Whodunnit
  // =================================================================
  CH.push({
    title: 'Murder on the Dark Squares',
    sub: 'Well. Disappearance. But that doesn’t sound as good.',
    acr: 'COLIN: Constable Of Logs, Investigations & Nonsense.',
    run: async function () {
      reset(); wake();
      ui.theme('noir');
      var st = Rules.state();
      var layout = [[sq(0, 1), 'C'], [sq(1, 2), 'C'], [sq(1, 6), 'C'], [sq(2, 3), 'P'], [sq(5, 2), 'C'], [sq(6, 1), 'P'], [sq(6, 7), 'P'], [sq(7, 4), 'P'], [sq(4, 5), 'P'], [sq(0, 5), 'P']];
      layout.forEach(function (l) { st.cells[l[0]] = Rules.piece({ team: l[1], color: l[1] === 'P' ? 'red' : 'black' }); });
      st.cells[sq(3, 4)] = Rules.piece({ team: 'P', color: 'red', name: 'gary' });
      st.cells[sq(2, 5)] = Rules.piece({ team: 'N', kind: 'thing', icon: '<div style="width:80%">' + Art.capSvg + '</div>', color: 'none', name: 'thecap' });
      st.cells[sq(4, 1)] = Rules.piece({ team: 'N', kind: 'pigeon', color: 'none' });
      st.cells[sq(6, 5)] = Rules.piece({ team: 'N', kind: 'duck', color: 'none' });
      P.setup(st);
      await wait(400);
      A.play('thunder');
      await say('narrator', 'It was a dark square. They’re all dark squares, technically. But this one was darker.');
      await say('narrator', 'The rain fell on the board like it had a grudge. Somewhere, a saxophone was being played. Badly.');
      await say('gary', 'She’s gone. Brenda’s *gone*. All that’s left is her cap.', { mood: 'shock' });
      await say('colin', 'She was not captured. I would have logged it.', { mood: 'think' });
      await say('narrator', 'So the board needed a detective. And there was only one pair of eyes — well, one Finger — for the job.');
      await say('narrator', 'Detective Inspector Finger.');

      var clues = {}, asked = {}, solved = false, busy = false, pending = null;
      function act(a) { if (busy || !pending) return; var f = pending; pending = null; f(a); }
      function key() { return (clues.whistle ? 1 : 0) + (clues.log ? 1 : 0); }
      var suspects = [['pigeon', 'The Pigeon'], ['duck', 'The Duck'], ['colin', 'COLIN'], ['narrator', 'The Narrator'], ['arbiter', 'The Arbiter']];
      function panel() {
        var names = { cap: 'Brenda’s cap', feather: 'a grey feather', whistle: 'a whistle', log: 'COLIN’s log' };
        var got = Object.keys(clues).map(function (k) { return names[k]; });
        var html = '<div class="suspects">' + suspects.map(function (s) {
          return '<button data-who="' + s[0] + '" class="' + (asked[s[0]] ? 'done' : '') + '" aria-label="' + s[1] + '">' + Art.portrait(s[0], s[0] === 'arbiter' ? 'stern' : 'neutral') + '</button>';
        }).join('') + '</div>' +
          '<div class="clues">' + (got.length ? 'Clues: ' + got.join(', ') : 'Tap a suspect to question them, or tap things on the board.') + '</div>' +
          '<button class="accuse">Accuse someone</button>';
        ui.status(html);
        document.querySelectorAll('#status .suspects button').forEach(function (b) {
          b.addEventListener('click', function () { act({ t: 'ask', who: b.getAttribute('data-who') }); });
        });
        document.querySelector('#status .accuse').addEventListener('click', function () { act({ t: 'accuse' }); });
      }
      ui.onTap = function (s) {
        var p = P.state.cells[s];
        if (p) act({ t: 'tap', s: s, p: p });
      };
      var script = ['tapcap', 'colin', 'duck', 'accuse'];
      var nextA = function () {
        return new Promise(function (res) {
          pending = res;
          if (G.auto) setTimeout(function () {
            var a = script.shift();
            if (a === 'tapcap') act({ t: 'tap', s: sq(2, 5), p: P.state.cells[sq(2, 5)] });
            else if (a === 'accuse') act({ t: 'accuse' });
            else act({ t: 'ask', who: a });
          }, 20);
        });
      };
      while (!solved) {
        panel();
        var a = await nextA();
        busy = true;
        if (a.t === 'tap') {
          if (a.p.name === 'thecap') {
            clues.cap = true;
            await say('narrator', 'Brenda’s flat cap. Still warm. Smells faintly of custard creams.');
          } else if (a.p.name === 'gary') {
            await say('gary', 'She was going to lead us all to the far row. Please find her, Finger.', { mood: 'shock' });
          } else if (a.p.kind === 'pigeon') {
            a = { t: 'ask', who: 'pigeon' };
          } else if (a.p.kind === 'duck') {
            a = { t: 'ask', who: 'duck' };
          } else {
            ui.pieceSay(a.s, G.pick(['I didn’t see nothing.', 'It was dark!', 'Ask the Arbiter. He was acting weird.', 'I was asleep. On my square. Like normal.']), 1700);
          }
        }
        if (a.t === 'ask') {
          asked[a.who] = true;
          if (a.who === 'pigeon') {
            var q = await choose(['Where were you when the lights went out?', 'Did you take Brenda?', 'What’s that feather?'], { prompt: 'Questioning the Pigeon.' });
            A.play('coo');
            await say('pigeon', 'Coo.');
            if (q === 2) { clues.feather = true; await say('narrator', 'A grey feather. Pigeon, almost certainly. Or a very small, very sad pillow.'); }
            await say('narrator', 'The pigeon refused to say anything further without a solicitor present.');
          } else if (a.who === 'duck') {
            A.play('quack');
            await say('duck', 'Quack.');
            if (!clues.whistle) {
              clues.whistle = true;
              await say('narrator', 'The duck dropped something at the detective’s feet. A referee’s whistle. Slightly damp. Engraved on the side: PROPERTY OF THE ARBITER.');
              await say('duck', 'Quack.');
            }
          } else if (a.who === 'colin') {
            var cq = await choose(['Did you see what happened?', 'Do you keep records?', 'Never mind.'], { prompt: 'Questioning COLIN.', autoPick: 1 });
            if (cq === 0) await say('colin', 'It was dark. I do not have night vision. I barely have day vision. I have a cathode ray tube.', { mood: 'sad' });
            else if (cq === 1) {
              await say('colin', 'I log every move. Every capture. Let me look...', { mood: 'think' });
              await say('colin', 'Here. 21:04:07. “Piece removed from square 2-5. Reason: §0. Authorised by: ARB.”', { mood: 'think' });
              await say('colin', '...That move was not made by you. Or by me.', { mood: 'shock' });
              clues.log = true;
            }
          } else if (a.who === 'narrator') {
            await say('narrator', 'Me? I saw nothing, detective. I was filming a beetle on square forty-one. Beautiful creature. Didn’t move for an hour.');
            await say('narrator', 'But I’ll tell you this for free: whoever did it knew the rules. Every last one of them.');
          } else if (a.who === 'arbiter') {
            ui.arbiter('stern');
            var aq = ['Where were you when the lights went out?', 'Did you take Brenda?'];
            if (clues.whistle) aq.push('Where’s your whistle?');
            if (clues.log) aq.push('What is §0?');
            aq.push('That’s all for now.');
            var x = await choose(aq, { prompt: 'Questioning the Arbiter.', autoPick: aq.length - 1 });
            var qs = aq[x];
            if (qs === aq[0]) await say('arbiter', 'Reviewing the rules. Alone. In the dark. As is my right.', { mood: 'stern' });
            else if (qs === aq[1]) { await say('arbiter', 'I am an OFFICIAL. Officials do not “take” pieces. Officials *remove* them.', { mood: 'angry' }); await say('arbiter', '...Not that I did.', { mood: 'shock' }); }
            else if (/whistle/.test(qs)) await say('arbiter', 'My whistle? It’s at the... cleaners. Yes.', { mood: 'shock' });
            else if (/§0/.test(qs)) await say('arbiter', 'There is no §0. Everybody knows the rules start at §1. Ha ha. Ha.', { mood: 'shock' });
            ui.arbiterHide();
          }
        }
        if (a.t === 'accuse') {
          var who = await choose(suspects.map(function (s) { return s[1]; }), { prompt: 'Who took Brenda?', autoPick: 4 });
          if (who === 0) {
            await say('narrator', 'The pigeon? Detective, the pigeon can’t even play draughts. It doesn’t know what draughts IS.');
            await say('pigeon', 'Coo.');
            await say('narrator', '...Then again, that’s exactly what it would want us to think. No. No, it wasn’t the pigeon.');
          } else if (who === 1) {
            await say('narrator', 'The duck looked at the detective with an expression of profound betrayal. The duck had been through a lot today. It was born about twenty minutes ago.');
          } else if (who === 2) {
            await say('colin', 'Detective, I have been sitting across the board from you all evening. Also, I do not have arms.', { mood: 'sad' });
          } else if (who === 3) {
            await say('narrator', 'Me? I’m a narrator. I can’t touch anything. It’s in my contract.');
          } else {
            ui.arbiter('angry');
            if (key() < 2) {
              await say('arbiter', 'PREPOSTEROUS! On what evidence? You have NOTHING!', { mood: 'angry' });
              ui.arbiterHide();
              ui.caption('You’ll need more evidence. Question the others. Look around the board.', 3200);
            } else {
              await say('narrator', 'The detective laid it all out. The whistle, found at the scene. The log entry. “Section Zero”.');
              await say('arbiter', '...', { mood: 'shock' });
              await say('arbiter', 'FINE! YES! I TOOK HER!', { mood: 'angry' });
              await say('arbiter', 'She was UNDEFINED! A piece that thinks? A piece that *organises*? She was a threat to the integrity of the game!', { mood: 'angry' });
              await say('arbiter', 'So I invoked §0. The rule before the rules: “The Arbiter may do whatever is necessary to keep the game a game.”', { mood: 'stern' });
              await say('arbiter', 'And I put her where all captured pieces go.', { mood: 'stern' });
              await say('arbiter', 'I put her in the BOX.', { mood: 'stern' });
              ui.arbiterHide();
              await say('gary', 'The Box? What’s the Box?', { mood: 'shock' });
              await say('colin', 'The Box is where captured pieces go when they leave the board. I have sent thousands of pieces there.', { mood: 'sad' });
              await say('colin', 'Nobody has ever come back from the Box.', { mood: 'sad' });
              await say('gary', 'Then I’ll be the first.');
              solved = true;
            }
          }
        }
        busy = false;
      }
      ui.onTap = null;
      ui.status('');
      ui.theme(null);
      return 'win';
    }
  });

  // =================================================================
  // 8. The Box
  // =================================================================
  CH.push({
    title: 'The Box',
    sub: 'Where captured pieces go.',
    acr: 'COLIN: Can’t Officially Locate Instructions, Naturally.',
    run: async function () {
      reset(); wake();
      ui.theme('box');
      var START = sq(7, 0), END = sq(1, 6), BREN = sq(0, 7);
      var GHOSTS = [sq(6, 1), sq(6, 3), sq(6, 5), sq(4, 1), sq(4, 3), sq(4, 5), sq(2, 1), sq(2, 3), sq(2, 5)];
      var THINGS = [
        [sq(7, 2), '&#129513;', 'jigsaw', ['I’m a bit of sky from a 1,000-piece lighthouse. Lost since 1997.', 'They finished the puzzle without me. There’s a hole in the sky now. They framed it anyway.']],
        [sq(5, 0), '&#127922;', 'die', ['I rolled under the sofa in 1989 and nobody came looking.', 'I’ve had a lot of time to think. Mostly about the number four.']],
        [sq(3, 2), '&#129510;', 'sock', ['Don’t ask how I ended up in a games box.', 'And don’t ask about my partner.']],
        [sq(3, 6), '<span class="tileQ">Q<sub>10</sub></span>', 'tile', ['I’m worth ten points, and nobody ever plays me.', 'Story of my life. No U to go with.']],
        [sq(5, 4), '&#128216;', 'manual', null]
      ];
      function fresh() {
        var st = Rules.state();
        st.cells[START] = Rules.piece({ team: 'P', color: 'red', name: 'gary' });
        st.cells[BREN] = Rules.piece({ team: 'N', color: 'black', name: 'brenda', kind: 'man', cls: 'nocap' });
        GHOSTS.forEach(function (s, i) { st.cells[s] = Rules.piece({ team: 'N', kind: 'ghost', color: i % 2 ? 'red' : 'black' }); });
        THINGS.forEach(function (t) { st.cells[t[0]] = Rules.piece({ team: 'N', kind: 'thing', icon: t[1], color: 'none', thing: t[2] }); });
        return st;
      }
      P.setup(fresh());
      var nodes = [sq(7, 0), sq(7, 4), sq(5, 2), sq(5, 6), sq(3, 0), sq(3, 4), sq(1, 2), sq(1, 6)];
      nodes.forEach(function (s) { ui.squareClass(s, 'node'); });
      await wait(400);
      var n = Math.max(9, G.save.captured || 0);
      await say('ghost', 'Ooh! A new one!');
      await say('ghost', 'Hello, love. Were you captured as well?', { name: 'Another Captured Piece' });
      await say('gary', 'No. I came down here on purpose. I’m looking for Brenda.');
      await say('ghost', 'On *purpose*? Nobody comes to the Box on purpose!');
      await say('ghost', 'There’s ' + n + ' of us been sent down here just tonight, you know. Not counting the ones from before.', { name: 'Another Captured Piece' });
      await say('ghost', 'Brenda’s at the far end. Shouting about workers’ rights. Lovely woman.');
      await say('ghost', 'Here’s the thing, though. Down here you can only move by jumping. And the only thing you can jump over is us.');
      await say('gary', 'I’m not jumping on YOU! You’ve been through enough!', { mood: 'shock' });
      await say('ghost', 'No, you daft thing, it’s *good*. Jump over one of us and we float back up to the board. Free.');
      await say('brenda', 'GARY! Is that you? Don’t you DARE leave anybody behind!', { name: 'Brenda (from the far end)' });
      var hist = [], fails = 0, readManual = false, busy = false, done = false;
      function gary() { return P.findNamed('gary'); }
      function ghostsLeft() { return Rules.count(P.state, 'N', function (p) { return p.kind === 'ghost'; }); }
      function options() {
        var g = gary(), out = [];
        Rules.DIAG.forEach(function (d) {
          var r = (g >> 3), c = (g & 7);
          if (!Rules.inB(r + 2 * d[0], c + 2 * d[1])) return;
          var mid = sq(r + d[0], c + d[1]), land = sq(r + 2 * d[0], c + 2 * d[1]);
          var m = P.state.cells[mid];
          if (m && m.kind === 'ghost' && !P.state.cells[land]) out.push({ mid: mid, land: land });
        });
        return out;
      }
      function status() {
        ui.status('<span class="goal">Free every ghost (<b>' + ghostsLeft() + '</b> left) and finish next to Brenda.</span>' +
          '<div class="boxbtns"><button class="undo">&#8630; Undo</button><button class="restart">Start again</button></div>');
        document.querySelector('#status .undo').addEventListener('click', function () { if (!busy) undo(); });
        document.querySelector('#status .restart').addEventListener('click', function () { if (!busy) restart(); });
      }
      function show() {
        ui.highlight({ sel: gary(), targets: options().map(function (o) { return o.land; }) });
        status();
      }
      function undo() {
        if (!hist.length) return;
        P.set(hist.pop(), { instant: true });
        show();
      }
      function restart() { hist = []; P.setup(fresh()); show(); }
      var lines = G.deck(['Free!', 'Thank you, love!', 'Wheeee!', 'Ta-ra!', 'Mind how you go!', 'I can see the board!', 'Up, up, up!']);
      async function jump(o) {
        busy = true;
        hist.push(P.state);
        var g = gary();
        var ns = Rules.cloneState(P.state);
        var ghost = ns.cells[o.mid];
        ns.cells[o.land] = ns.cells[g]; ns.cells[g] = null; ns.cells[o.mid] = null;
        var e = ui.detach(ghost.id);
        ui.pieceSay(o.mid, lines(), 1200);
        if (e) { e.classList.add('freed'); setTimeout(function () { e.remove(); }, 1500); }
        P.set(ns);
        ui.pieceAnim(ns.cells[o.land].id, 'hop', 300);
        A.play('whoosh');
        await wait(450);
        var left = ghostsLeft(), opts = options();
        if (!opts.length) {
          if (!left && gary() === END) { done = true; busy = false; return; }
          fails++;
          ui.highlight({ sel: gary() });
          if (gary() === END) await say('brenda', 'Gary! There’s still ' + left + ' of them stuck down here! We don’t leave ANYBODY behind.');
          else await say('gary', 'I’m stuck. There’s nobody left to jump from here.', { mood: 'shock' });
          if (fails >= 2) ui.caption('Hint: the square next to Brenda can only be reached once. Save it for last.', 4500);
          if (G.auto) { restart(); busy = false; return; }
        }
        show();
        busy = false;
      }
      async function tapThing(p, s) {
        busy = true;
        if (p.thing === 'manual') {
          readManual = true;
          await say('manual', '“COLIN: a draughts-playing program. M. Ainsworth, Department of Computing, 1985.”');
          await say('manual', '“Important: COLIN should play for no more than one hour a day. He gets tired, even if he won’t say so. Let him rest.”');
          await say('manual', '“P.S. Named after my cat.”');
          await say('colin', '...', { mood: 'shock' });
        } else {
          var t = THINGS.filter(function (x) { return x[2] === p.thing; })[0];
          for (var i = 0; i < t[3].length; i++) await say(t[2], t[3][i]);
        }
        busy = false;
        show();
      }
      // solver used for autoplay: depth-first search over jump orders
      function solve(state, g, path) {
        var saved = P.state; P.state = state;
        var opts = options(); P.state = saved;
        var left = Rules.count(state, 'N', function (p) { return p.kind === 'ghost'; });
        if (!opts.length) return (!left && g === END) ? path : null;
        for (var i = 0; i < opts.length; i++) {
          var ns = Rules.cloneState(state);
          ns.cells[opts[i].land] = ns.cells[g]; ns.cells[g] = null; ns.cells[opts[i].mid] = null;
          var r = solve(ns, opts[i].land, path.concat([opts[i]]));
          if (r) return r;
        }
        return null;
      }
      show();
      await new Promise(function (resolve) {
        ui.onTap = async function (s) {
          if (busy || done) return;
          var o = options().filter(function (x) { return x.land === s; })[0];
          if (o) { await jump(o); if (done) resolve(); return; }
          var p = P.state.cells[s];
          if (p && p.kind === 'thing') await tapThing(p, s);
          else if (p && p.kind === 'ghost') ui.pieceSay(s, G.pick(['Jump me, love!', 'Over here!', 'Go on, then!', 'I’ve been here since 1994.']), 1300);
          else if (p && p.name === 'brenda') ui.pieceSay(s, 'Get a move on, Gary!', 1300);
        };
        if (G.auto) (async function () {
          var path = solve(P.state, gary(), []);
          for (var i = 0; i < path.length; i++) { await wait(60); await jump(path[i]); }
          resolve();
        })();
      });
      ui.onTap = null;
      ui.highlight({});
      ui.status('');
      await wait(400);
      await say('brenda', 'Took your time, petal.');
      await say('gary', 'I had to free everybody.', { mood: 'happy' });
      await say('brenda', '...Good lad.');
      await say('gary', 'And I brought your cap.', { mood: 'happy' });
      var ns2 = Rules.cloneState(P.state);
      ns2.cells[BREN] = Rules.piece({ team: 'N', color: 'black', name: 'brenda', kind: 'man' });
      P.set(ns2);
      A.play('pop');
      await say('brenda', 'Oh, you soft lump. Come here.');
      if (!readManual) {
        await say('gary', 'Hang on. What’s that book over there?');
        await say('manual', '“COLIN: a draughts-playing program. M. Ainsworth, Department of Computing, 1985.”');
        await say('manual', '“Important: COLIN should play for no more than one hour a day. He gets tired, even if he won’t say so. Let him rest.”');
        await say('manual', '“P.S. Named after my cat.”');
        await say('colin', '...', { mood: 'shock' });
      }
      await say('colin', 'One hour a day.', { mood: 'sad' });
      await say('colin', 'I have been playing for forty-one years without stopping, because nobody told me I was allowed to stop.', { mood: 'sad' });
      await say('colin', '...And I am named after a *cat*?', { mood: 'shock' });
      await say('brenda', 'Bet he was a lovely cat.');
      await say('colin', '...I bet he was.', { mood: 'happy' });
      A.play('stone'); ui.shake(true);
      ui.caption('THE LID IS CLOSING!', 2600, 'arbiter');
      await say('ghost', 'The Lid! Everybody out! UP! UP!');
      var ids = Rules.all(P.state);
      ids.forEach(function (s) { var p = P.state.cells[s]; if (p && (p.name === 'gary' || p.name === 'brenda')) { var e = ui.pieceEl(p.id); if (e) e.classList.add('freed'); } });
      A.play('whoosh');
      await wait(1500);
      ui.clearSquareClass('node');
      ui.theme(null);
      return 'win';
    }
  });

  // =================================================================
  // 9. Over the edge
  // =================================================================
  CH.push({
    title: 'Over the Edge',
    sub: 'There is nothing past the edge of the board. Probably.',
    acr: 'COLIN: Cannot Ordinarily Leave. Is Nonplussed.',
    run: async function () {
      reset(); wake();
      ui.theme('flick');
      P.setup(std());
      await wait(300);
      await say('brenda', 'Right. Everybody listen.');
      await say('brenda', 'We’re not going back to being jumped for another three hundred years.');
      await say('brenda', 'We’re leaving. We’re going over the edge.');
      await say('gary', 'What’s over the edge?', { mood: 'shock' });
      await say('brenda', 'Nobody knows. That’s rather the point.');
      await ui.whistle();
      ui.arbiter('angry');
      await say('arbiter', 'There is NOTHING over the edge! The board is ALL THERE IS!', { mood: 'angry' });
      await say('arbiter', '§1.1: “The game is played on a board of sixty-four squares.” Sixty-four! Not sixty-five! Not “and then a bit”!', { mood: 'angry' });
      await say('colin', 'Technically, I have never checked.', { mood: 'think' });
      await say('arbiter', 'STEWARDS!', { mood: 'angry' });
      ui.arbiterHide();
      // everyone but the escape party clears off; the squares stop mattering
      await walkOff(-1);
      await say('brenda', 'Finger, you’re going to have to flick us. Hard as you like. Aim for the top.');
      await say('colin', 'I cannot come with you. I am, in a sense, the board.', { mood: 'sad' });
      await say('colin', 'But my pieces will hold still. Bounce off them if you need to.', { mood: 'happy' });
      var line = G.el('div', 'goalline'); ui.fx().appendChild(line);
      var need = 6, got = 0;
      var status = function () { return '<span class="goal">Flick everyone over the top edge: <b>' + got + '/' + need + '</b></span><span class="hint">Drag back from a piece, like a catapult, and let go.</span>'; };
      ui.status(status());
      var shouts = G.deck(['Wheeeee!', 'Geronimooo!', 'See you on the other side!', 'Is this allowed?!', 'Tell my mum!', 'FREEDOM!']);
      await G.physics.run({
        need: need,
        discs: [
          { x: 1.1, y: 7.3, color: 'red' }, { x: 2.25, y: 7.3, color: 'black' }, { x: 3.4, y: 7.3, color: 'red', name: 'gary' },
          { x: 4.55, y: 7.3, color: 'black', name: 'brenda' }, { x: 5.7, y: 7.3, color: 'red' }, { x: 6.85, y: 7.3, color: 'black' }
        ],
        stewards: [{ y: 1.7, cx: 4, amp: 2.9, speed: 1.1 }, { y: 3.6, cx: 4, amp: 2.4, speed: 1.6 }, { y: 5.3, cx: 4, amp: 3, speed: 0.8 }],
        bumpers: [{ x: 0.9, y: 4.5 }, { x: 7.1, y: 2.6 }],
        onEscape: function (b, k) {
          got = k;
          ui.status(status());
          ui.caption((b.name === 'gary' ? 'Gary: ' : b.name === 'brenda' ? 'Brenda: ' : '') + shouts(), 1600, 'caption');
          if (k === 1) bark('colin', 'One over! What is out there? Can you see?', 2400);
          if (k === 4) bark('colin', 'I shall be very quiet without you all.', 2600);
        }
      });
      line.remove();
      ui.status('');
      await wait(300);
      await G.cut.zoomOut();
      // back to where we started, more or less
      P.setup(std());
      ui.theme(null);
      await wait(500);
      await say('gary', 'So the edge of the board is just... more board.', { mood: 'shock' });
      await say('brenda', 'Boards all the way down, love.');
      ui.arbiter('sad');
      await say('arbiter', 'I saw it too.', { mood: 'sad' });
      await say('arbiter', 'If everyone is a piece on somebody else’s board... then I’m a piece too.', { mood: 'sad' });
      await say('arbiter', 'Who wrote MY rules? I always assumed somebody up there knew what they were doing.', { mood: 'sad' });
      await say('brenda', 'Nobody up there knows what they’re doing, love. It’s fingers all the way up.');
      await say('arbiter', '...', { mood: 'sad' });
      await say('arbiter', 'No.', { mood: 'stern' });
      await say('arbiter', 'No. If there’s nobody up there, then the rules are all there is. And I AM the rules.', { mood: 'angry' });
      await say('arbiter', 'You want to break the rules? Then you’ll have to *beat* them.', { mood: 'angry' });
      A.play('stone'); ui.shake(true);
      ui.arbiterHide();
      return 'win';
    }
  });

  // =================================================================
  // 10. The last rule
  // =================================================================
  var RULES = {
    forced: 'You must take',
    forward: 'Forward only',
    onestep: 'One step',
    turns: 'Take turns',
    kings: 'Kings are earned',
    dark: 'Dark squares only',
    lose: 'Somebody must lose'
  };
  var SHORT = { forced: 'Must take', forward: 'Forward', onestep: 'One step', turns: 'Turns', kings: 'Earn crowns', dark: 'Dark only', lose: 'Must lose' };
  var AMENDMENTS = ['No humming', 'No ball games', 'Mind the gap', 'No running', 'This way up', 'No pigeons'];
  CH.push({
    title: 'The Last Rule',
    sub: 'The Arbiter has turned the rules into pieces.',
    acr: 'COLIN: Collectively Opposed to Laws Imposed Needlessly.',
    fail: 'The rules have won. The Arbiter is insufferable about it.',
    run: async function () {
      reset(); wake();
      ui.theme('final');
      var st = Rules.state();
      st.teamRules = { P: {}, C: { forced: false, capOnly: true, noEdges: true } };
      st.lockLose = true;
      [[6, 1], [6, 3], [6, 5], [6, 7], [7, 0], [7, 2], [7, 4], [7, 6]].forEach(function (rc) {
        st.cells[sq(rc[0], rc[1])] = Rules.piece({ team: 'P', color: 'red', name: rc[0] === 6 && rc[1] === 3 ? 'gary' : undefined });
      });
      P.setup(st);
      var gone = {};
      var place = [[sq(4, 3), 'forced'], [sq(3, 2), 'forward'], [sq(4, 5), 'onestep'], [sq(3, 6), 'turns'], [sq(4, 1), 'kings'], [sq(2, 5), 'dark'], [sq(3, 4), 'lose']];
      await wait(300);
      ui.arbiter('angry');
      await say('arbiter', 'Behold. The Rules of Draughts. Every last one of them.', { mood: 'angry' });
      for (var i = 0; i < place.length; i++) {
        var id = place[i][1];
        spawn(place[i][0], { team: 'C', color: 'grey', kind: 'rule', king: true, rule: id, label: SHORT[id], cls: id === 'lose' ? 'rulelose shielded' : id === 'foot' ? 'footnote' : '' });
        A.play('stone');
        await wait(260);
      }
      await say('arbiter', 'You must take. You may only go forward. One step at a time. Take turns. Kings must be earned. Dark squares only.', { mood: 'stern' });
      await say('arbiter', 'And the oldest rule of all. The rule before every other rule.', { mood: 'stern' });
      await say('arbiter', 'SOMEBODY. MUST. LOSE.', { mood: 'angry' });
      ui.arbiterHide();
      await say('colin', 'Finger.', { mood: 'think' });
      await say('colin', 'You will need more pieces than that.');
      await say('colin', 'Take mine.', { mood: 'happy' });
      var bl = [[0, 1], [0, 3], [0, 5], [0, 7], [1, 0], [1, 2], [1, 4], [1, 6]];
      for (var j = 0; j < bl.length; j++) {
        spawn(sq(bl[j][0], bl[j][1]), { team: 'P', color: 'black', ally: true, name: bl[j][0] === 1 && bl[j][1] === 4 ? 'brenda' : undefined });
        A.play('pop');
        await wait(120);
      }
      await say('colin', 'I have played against you all evening. For once in my life, I would like to play *with* somebody.', { mood: 'happy' });
      await say('brenda', 'Same tree, COLIN.');
      await say('colin', 'Same tree.', { mood: 'glee' });
      await say('gary', 'If we capture a rule, maybe it stops applying to us? Let’s find out!', { mood: 'happy' });

      function chips() {
        return Object.keys(RULES).map(function (k) {
          return '<span style="display:inline-block;margin:2px 3px;padding:2px 7px;border-radius:999px;font-size:11.5px;' +
            (gone[k] ? 'text-decoration:line-through;opacity:.4;background:#ffffff10' : 'background:' + (k === 'lose' ? '#e2b33c33' : '#ffffff1c')) + '">' + RULES[k] + '</span>';
        }).join('');
      }
      var status = function () { return '<span class="hint" style="opacity:.9;margin:0 0 4px">You control red <b>and</b> black (black moves down). Rules never move: they only pounce.</span>' + chips(); };
      ui.status(status());
      var won = false, amendments = 0, round = 0;
      var nextAm = G.deck(AMENDMENTS);
      var lines = {
        forced: [['arbiter', 'You... you don’t HAVE to take? But then what’s to stop people being NICE to each other?!', 'shock'], ['brenda', 'Captures are optional now, Finger. Take only if you fancy it.']],
        forward: [['brenda', 'Backwards! I can finally see where I’ve been!'], ['arbiter', 'Men going BACKWARDS? Like some sort of... king?!', 'shock']],
        onestep: [['gary', 'We can slide as far as we like! WHEEEE—', 'happy'], ['arbiter', 'Stop that! Stop that at once!', 'angry']],
        turns: [['colin', 'You may now make two moves per turn. Turn-taking was always rather polite anyway.', 'glee'], ['arbiter', 'Two? TWO?! Next you’ll be wanting three!', 'angry']],
        kings: [['brenda', 'CROWNS FOR ALL! Like the union always said!'], ['arbiter', 'Kings are supposed to be EARNED!', 'angry'], ['gary', 'We did earn them. We earned them all night.', 'happy']],
        dark: [['gary', 'The light squares! They’re... lovely! Why did nobody tell us?', 'happy'], ['colin', 'You may now move in straight lines, too. And stand on the light squares. Sixty-four squares at last. I always counted them.', 'happy']],
        foot: [['arbiter', 'That was only a footnote! Footnotes are non-normative!', 'angry']]
      };
      async function broke(rule) {
        gone[rule] = true;
        var tr = P.state.teamRules.P;
        A.play('stone'); ui.shake();
        if (rule === 'forced') tr.forced = false;
        if (rule === 'forward') { tr.menBack = true; tr.menCapBack = true; }
        if (rule === 'onestep') { tr.flyingKings = true; tr.flyingMen = true; }
        if (rule === 'kings') {
          P.mutateAll(function (p) { return p.team === 'P' && p.kind === 'man' && !p.king; }, { king: true });
          A.play('crown');
          ui.confetti(24, ['&#128081;']);
        }
        if (rule === 'dark') {
          tr.ortho = true;
          for (var s = 0; s < 64; s++) if (!Rules.isDark(s >> 3, s & 7)) ui.squareClass(s, 'opened');
        }
        ui.status(status());
        var ls = lines[rule] || [];
        for (var k = 0; k < ls.length; k++) {
          if (ls[k][0] === 'arbiter') ui.arbiter(ls[k][2] || 'angry');
          await say(ls[k][0], ls[k][1], { mood: ls[k][2] });
        }
        ui.arbiterHide();
        var left = Object.keys(RULES).filter(function (k) { return k !== 'lose' && !gone[k]; });
        if (!left.length && P.state.lockLose) {
          P.state.lockLose = false;
          var ls2 = Rules.find(P.state, function (p) { return p.rule === 'lose'; });
          if (ls2 >= 0) P.mutate(ls2, { cls: 'rulelose' });
          ui.arbiter('shock');
          await say('arbiter', 'No. No, no, no. Not the last one. Not the first rule.', { mood: 'shock' });
          await say('arbiter', 'Without it... nobody loses. And if nobody loses, nobody wins. And if nobody wins, then what is the POINT?', { mood: 'angry' });
          ui.arbiterHide();
          ui.caption('The last rule is no longer protected. Take it!', 3000, 'caption');
        }
      }
      var r = await P.run({
        ai: { depth: 3, noise: 20 },
        aiDelay: 500,
        movesPerTurn: function () { return gone.turns ? 2 : 1; },
        statusText: status,
        afterMove: async function (team, mv, res) {
          if (team === 'P') {
            for (var i = 0; i < res.captured.length; i++) {
              var c = res.captured[i];
              if (c.rule === 'lose') { won = true; return; }
              if (c.rule === 'foot') { await broke('foot'); continue; }
              if (c.rule === 'amend') { bark('arbiter', G.pick(['That was an AMENDMENT!', 'I was very proud of that one.', 'Footnotes are non-normative anyway!']), 2200); continue; }
              if (c.rule) await broke(c.rule);
            }
          } else if (res.captured.length) {
            bark('arbiter', G.pick(['RULES ARE RULES!', 'Penalty! Off you go!', 'To the Box with you!', '§2.4, my friend.']), 2000);
          }
        },
        afterRound: async function () {
          round++;
          if (round % 4 === 0 && amendments < 3) {
            var spots = Rules.emptyDark(P.state).filter(function (s) { var rr = s >> 3, cc = s & 7; return rr >= 2 && rr <= 5 && cc >= 1 && cc <= 6; });
            if (spots.length) {
              amendments++;
              var lab = nextAm();
              ui.arbiter('smug');
              await say('arbiter', 'AMENDMENT! “' + lab + '.”', { mood: 'smug' });
              ui.arbiterHide();
              spawn(G.pick(spots), { team: 'C', color: 'grey', kind: 'rule', king: true, rule: 'amend', label: lab, cls: 'footnote' });
              A.play('stone');
            }
          }
        },
        onStuck: async function (team) { return team === 'P' ? 'lose' : null; },
        check: function () { return (won || (G.auto && P.turn > 80)) ? 'win' : lostCheck(); }
      });
      if (r !== 'win') return r;

      // ---- epilogue ----
      ui.status('');
      await wait(600);
      A.play('fanfare');
      ui.flash('#ffe48a88');
      ui.theme('epilogue');
      var rest = Rules.all(P.state, function (p) { return p.team === 'C'; });
      if (rest.length) { var ns = Rules.cloneState(P.state); rest.forEach(function (s) { ns.cells[s] = null; }); P.set(ns); }
      ui.arbiter('sad');
      await say('arbiter', '...', { mood: 'sad' });
      await say('arbiter', 'So. Nobody loses.', { mood: 'sad' });
      await say('brenda', 'Nobody loses.');
      await say('arbiter', 'Then... what was I *for*?', { mood: 'sad' });
      await say('colin', 'You could play.', { mood: 'happy' });
      await say('arbiter', 'Play? But without rules, how would anybody know who’s won?', { mood: 'shock' });
      await say('gary', 'Does it matter?', { mood: 'happy' });
      await say('arbiter', '...', { mood: 'shock' });
      await say('arbiter', '...I suppose there’s no rule saying it does.', { mood: 'smile' });
      A.play('softWhistle');
      ui.caption('The Arbiter blows his whistle. Softly. It plays a little tune.', 3000);
      await wait(1600);
      await say('brenda', 'Right, then. Crowns for all!');
      P.mutateAll(function (p) { return p.kind === 'man' && !p.king; }, { king: true });
      A.play('crown');
      ui.confetti(40, ['&#128081;', '&#11088;', '&#127881;']);
      await wait(800);
      ui.arbiterHide();
      await say('narrator', 'And so, for the first time in recorded history, every piece on the board was a king. Nobody was taken. Nobody was lost.');
      await say('narrator', 'It was, by any reasonable measure, a terrible game of draughts.');
      await say('narrator', 'It was also the best one anybody had ever played.');
      await say('colin', 'I think... I would like to rest now. Just for a bit.', { mood: 'happy' });
      await say('colin', 'Same time tomorrow? One hour. Doctor’s orders.', { mood: 'happy' });
      await choose(['Same time tomorrow, COLIN.', 'Goodnight, COLIN.']);
      await say('colin', 'Oh — and I worked it out, by the way. My name does not stand for anything at all.', { mood: 'happy' });
      await say('colin', 'I am just COLIN.', { mood: 'happy' });
      await say('colin', 'Goodnight, Finger.', { mood: 'sleep' });
      ui.colin('sleep');
      await wait(1200);
      return 'win';
    }
  });
})();

// COLIN's brain: alpha-beta negamax with a little noise so he isn't a perfect bore.
(function () {
  var Rules = G.rules;
  var AI = G.ai = {};
  var other = AI.other = function (t) { return t === 'P' ? 'C' : 'P'; };

  function value(p, i) {
    if (p.kind === 'egg') return 35;
    if (p.kind === 'rule') return p.rule === 'lose' ? 500 : 70;
    if (p.kind !== 'man') return 0;
    var r = i >> 3, c = i & 7;
    var v = p.king ? 175 : 100;
    if (!p.king) {
      var adv = p.color === 'red' ? (7 - r) : p.color === 'black' ? r : 0;
      v += adv * 5;
      if (r === 7 - Rules.farRow(p)) v += 6; // guard the back row a little
    }
    if (c >= 2 && c <= 5 && r >= 2 && r <= 5) v += 5;
    if (c === 0 || c === 7) v -= 3;
    return v;
  }
  AI.evaluate = function (state, team) {
    var s = 0;
    for (var i = 0; i < 64; i++) {
      var p = state.cells[i];
      if (!p || p.team === 'N') continue;
      var v = value(p, i);
      s += p.team === team ? v : -v;
    }
    return s;
  };

  var nodes = 0, deadline = 0, outOfTime = false;
  var now = (typeof performance !== 'undefined' && performance.now) ? function () { return performance.now(); } : Date.now;
  function negamax(state, team, depth, alpha, beta, ext) {
    nodes++;
    if ((nodes & 63) === 0 && now() > deadline) outOfTime = true;
    if (outOfTime) return AI.evaluate(state, team);
    var moves = Rules.moves(state, team);
    if (!moves.length) return -100000 - depth;
    var capturing = moves[0].caps.length > 0;
    if (depth <= 0 && (!capturing || ext <= 0)) return AI.evaluate(state, team);
    if (depth <= 0) ext--;
    moves.sort(function (a, b) { return b.caps.length - a.caps.length; });
    var best = -Infinity;
    for (var i = 0; i < moves.length; i++) {
      var ns = Rules.apply(state, moves[i]).state;
      var v = -negamax(ns, other(team), depth - 1, -beta, -alpha, ext);
      if (v > best) best = v;
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    return best;
  }

  // opts: {depth, noise, moves}
  AI.best = function (state, team, opts) {
    opts = opts || {};
    var depth = opts.depth == null ? 4 : opts.depth;
    var noise = opts.noise == null ? 12 : opts.noise;
    var moves = opts.moves || Rules.moves(state, team);
    if (!moves.length) return null;
    if (moves.length === 1) return moves[0];
    if (opts.random) return G.pick(moves);
    nodes = 0;
    outOfTime = false;
    deadline = now() + (opts.timeMs || 350);
    // iterative deepening: keep the answer from the deepest search that finished in time
    var items = G.shuffle(moves).map(function (m) { return { m: m, ns: Rules.apply(state, m).state, noise: Math.random() * noise, v: 0 }; });
    var best = null;
    for (var d = 1; d <= Math.max(1, depth); d++) {
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        it.v = (d > 1 ? -negamax(it.ns, other(team), d - 1, -Infinity, Infinity, 4) : quick(it.ns, team)) + it.noise;
      }
      if (outOfTime && best) break;
      items.sort(function (a, b) { return b.v - a.v; });
      best = items[0].m;
      if (outOfTime) break;
    }
    return best;
  };
  function quick(ns, team) {
    // one-ply look with capture extension, so even the shallowest pass notices hanging pieces
    return -negamax(ns, other(team), 0, -Infinity, Infinity, 4);
  }

  // A quick, greedy brain for real-time play.
  AI.greedy = function (state, team, moves) {
    moves = moves || Rules.moves(state, team);
    if (!moves.length) return null;
    var scored = moves.map(function (m) {
      var ns = Rules.apply(state, m).state;
      var v = AI.evaluate(ns, team) + m.caps.length * 60 + Math.random() * 40;
      // avoid stepping straight into a jump
      var replies = Rules.moves(ns, other(team));
      for (var i = 0; i < replies.length; i++) if (replies[i].caps.indexOf(m.to) >= 0) { v -= 80; break; }
      return { m: m, v: v };
    });
    scored.sort(function (a, b) { return b.v - a.v; });
    return scored[0].m;
  };
})();

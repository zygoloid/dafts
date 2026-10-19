// The rules of draughts, plus every knob the story later twists.
// Board: 64 cells, row 0 at the top. The player (team P, red) moves up the screen.
(function () {
  var Rules = G.rules = {};
  var DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  var ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  var nextId = 1;

  Rules.DIAG = DIAG;
  Rules.DEFAULTS = {
    forced: true,        // "You must take"
    menBack: false,      // men may step backwards
    menCapBack: false,   // men may capture backwards
    flyingKings: false,  // kings slide any distance
    flyingMen: false,
    ortho: false,        // straight-line moves (and the light squares)
    effect: 'remove',    // or 'flip': captured pieces change sides
    singleHop: false,    // no multi-jumps (used when turns are abolished)
    capOnly: false,      // may only move by capturing (the Rules don't walk; they pounce)
    noEdges: false,      // may never stop on an edge square (so it can always be jumped)
    crownContinues: false // a man crowned mid-capture carries on jumping as a king (English rules: it stops)
  };

  Rules.sq = function (r, c) { return r * 8 + c; };
  Rules.row = function (s) { return s >> 3; };
  Rules.col = function (s) { return s & 7; };
  Rules.inB = function (r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; };
  Rules.isDark = function (r, c) { return ((r + c) & 1) === 1; };
  var sq = Rules.sq, inB = Rules.inB, isDark = Rules.isDark;

  Rules.piece = function (o) {
    var p = { id: nextId++, team: 'P', color: 'red', king: false, kind: 'man' };
    for (var k in o) p[k] = o[k];
    return p;
  };
  Rules.clonePiece = function (p, changes) {
    var q = {};
    for (var k in p) q[k] = p[k];
    if (changes) for (var j in changes) q[j] = changes[j];
    return q;
  };
  Rules.state = function () {
    return { cells: new Array(64).fill(null), rules: {}, teamRules: { P: {}, C: {} }, blocked: {}, lockLose: false };
  };
  Rules.cloneState = function (s) {
    return { cells: s.cells.slice(), rules: s.rules, teamRules: s.teamRules, blocked: s.blocked, lockLose: s.lockLose };
  };
  Rules.R = function (state, team, key) {
    var t = state.teamRules && state.teamRules[team];
    if (t && key in t) return t[key];
    if (key in state.rules) return state.rules[key];
    return Rules.DEFAULTS[key];
  };
  var R = Rules.R;

  Rules.standard = function (rowsEach) {
    var s = Rules.state();
    rowsEach = rowsEach || 3;
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
      if (!isDark(r, c)) continue;
      if (r < rowsEach) s.cells[sq(r, c)] = Rules.piece({ team: 'C', color: 'black' });
      else if (r > 7 - rowsEach) s.cells[sq(r, c)] = Rules.piece({ team: 'P', color: 'red' });
    }
    return s;
  };

  function forward(p) { return p.color === 'red' ? -1 : p.color === 'black' ? 1 : 0; }
  Rules.forward = forward;
  Rules.farRow = function (p) { return p.color === 'red' ? 0 : p.color === 'black' ? 7 : -1; };
  function reachesFar(p, row) { return p.kind === 'man' && !p.king && row === Rules.farRow(p); }

  Rules.canMove = function (p) {
    return !!p && (p.kind === 'man' || p.kind === 'rule') && !p.strike && !p.frozen;
  };
  Rules.capturable = function (state, v, byTeam) {
    if (!v || v.team === byTeam || v.team === 'N') return false;
    if (v.strike || v.kind === 'pigeon' || v.kind === 'thing' || v.invuln) return false;
    if (v.rule === 'lose' && state.lockLose) return false;
    return true;
  };
  function usable(state, team, r, c) {
    if (!inB(r, c)) return false;
    if (state.blocked[sq(r, c)]) return false;
    if ((r === 0 || r === 7 || c === 0 || c === 7) && R(state, team, 'noEdges')) return false;
    return isDark(r, c) || R(state, team, 'ortho');
  }
  function dirsFor(state, p, king, capturing) {
    var team = p.team, f = forward(p), ortho = R(state, team, 'ortho');
    var back = capturing ? R(state, team, 'menCapBack') : R(state, team, 'menBack');
    if (king || f === 0) return ortho ? DIAG.concat(ORTH) : DIAG;
    var d = [[f, -1], [f, 1]];
    if (back) d.push([-f, -1], [-f, 1]);
    if (ortho) { d.push([f, 0], [0, -1], [0, 1]); if (back) d.push([-f, 0]); }
    return d;
  }

  function capsFrom(state, origin, p, out) {
    var team = p.team;
    var single = R(state, team, 'singleHop'), carryOn = R(state, team, 'crownContinues');
    function flyingFor(king) { return king ? R(state, team, 'flyingKings') : R(state, team, 'flyingMen'); }
    function occ(s) { return s !== origin && state.cells[s] !== null; }
    function push(path, caps, crown) {
      out.push({ from: origin, to: path[path.length - 1], path: path, caps: caps, crown: crown, pid: p.id });
    }
    function dfs(cur, path, caps, king, crowned) {
      var r = cur >> 3, c = cur & 7, found = false;
      var dirs = dirsFor(state, p, king, true), fly = flyingFor(king);
      for (var i = 0; i < dirs.length; i++) {
        var d = dirs[i];
        var mr = r + d[0], mc = c + d[1];
        if (fly) {
          while (inB(mr, mc) && usable(state, team, mr, mc) && !occ(sq(mr, mc))) { mr += d[0]; mc += d[1]; }
        }
        if (!inB(mr, mc)) continue;
        var mid = sq(mr, mc);
        if (!occ(mid)) continue;
        if (caps.indexOf(mid) >= 0 || !Rules.capturable(state, state.cells[mid], team)) continue;
        var lr = mr + d[0], lc = mc + d[1];
        while (usable(state, team, lr, lc) && !occ(sq(lr, lc))) {
          var land = sq(lr, lc);
          found = true;
          var crown = !king && reachesFar(p, lr);
          var np = path.concat([land]), nc = caps.concat([mid]);
          if ((crown && !carryOn) || single) push(np, nc, crowned || crown);
          else if (!dfs(land, np, nc, king || crown, crowned || crown)) push(np, nc, crowned || crown);
          if (!fly) break;
          lr += d[0]; lc += d[1];
        }
      }
      return found;
    }
    dfs(origin, [origin], [], !!p.king || p.kind === 'rule', false);
  }

  function stepsFrom(state, origin, p, out) {
    var team = p.team, king = !!p.king || p.kind === 'rule';
    var fly = king ? R(state, team, 'flyingKings') : R(state, team, 'flyingMen');
    var dirs = dirsFor(state, p, king, false);
    var r = origin >> 3, c = origin & 7;
    for (var i = 0; i < dirs.length; i++) {
      var rr = r + dirs[i][0], cc = c + dirs[i][1];
      while (usable(state, team, rr, cc) && state.cells[sq(rr, cc)] === null) {
        var crown = !king && reachesFar(p, rr);
        out.push({ from: origin, to: sq(rr, cc), path: [origin, sq(rr, cc)], caps: [], crown: crown, pid: p.id });
        if (!fly || crown) break;
        rr += dirs[i][0]; cc += dirs[i][1];
      }
    }
  }

  // All legal moves for a team (forced capture applied unless switched off).
  Rules.moves = function (state, team, onlyFrom) {
    var caps = [], steps = [];
    for (var s = 0; s < 64; s++) {
      var p = state.cells[s];
      if (!p || p.team !== team || !Rules.canMove(p)) continue;
      capsFrom(state, s, p, caps);
      if (onlyFrom == null || onlyFrom === s) stepsFrom(state, s, p, steps);
    }
    if (R(state, team, 'capOnly')) steps = [];
    if (caps.length && R(state, team, 'forced')) {
      return onlyFrom == null ? caps : caps.filter(function (m) { return m.from === onlyFrom; });
    }
    var all = caps.concat(steps);
    return onlyFrom == null ? all : all.filter(function (m) { return m.from === onlyFrom; });
  };

  Rules.apply = function (state, mv) {
    var ns = Rules.cloneState(state);
    var p = ns.cells[mv.from];
    ns.cells[mv.from] = null;
    var effect = R(state, p.team, 'effect');
    var captured = [], flipped = [];
    for (var i = 0; i < mv.caps.length; i++) {
      var c = mv.caps[i], v = ns.cells[c];
      if (!v) continue;
      if (effect === 'flip' && v.kind === 'man') {
        var nv = Rules.clonePiece(v, { team: p.team, color: p.color });
        if (!nv.king && (c >> 3) === Rules.farRow(nv)) nv.king = true;
        ns.cells[c] = nv; flipped.push(nv);
      } else {
        ns.cells[c] = null; captured.push(v);
      }
    }
    var moved = mv.crown ? Rules.clonePiece(p, { king: true }) : p;
    ns.cells[mv.to] = moved;
    return { state: ns, captured: captured, flipped: flipped, crowned: !!mv.crown, moved: moved };
  };

  Rules.count = function (state, team, pred) {
    var n = 0;
    for (var i = 0; i < 64; i++) {
      var p = state.cells[i];
      if (p && p.team === team && (pred ? pred(p) : (p.kind === 'man' || p.kind === 'rule'))) n++;
    }
    return n;
  };
  Rules.find = function (state, pred) {
    for (var i = 0; i < 64; i++) if (state.cells[i] && pred(state.cells[i], i)) return i;
    return -1;
  };
  Rules.all = function (state, pred) {
    var out = [];
    for (var i = 0; i < 64; i++) if (state.cells[i] && (!pred || pred(state.cells[i], i))) out.push(i);
    return out;
  };
  Rules.emptyDark = function (state) {
    var out = [];
    for (var i = 0; i < 64; i++) if (!state.cells[i] && isDark(i >> 3, i & 7) && !state.blocked[i]) out.push(i);
    return out;
  };
  Rules.neighbours = function (s) {
    var out = [], r = s >> 3, c = s & 7;
    DIAG.forEach(function (d) { if (inB(r + d[0], c + d[1])) out.push(sq(r + d[0], c + d[1])); });
    return out;
  };
})();

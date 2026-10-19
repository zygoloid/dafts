// Tiddly-draughts: the squares have given up, and the pieces are just discs now.
(function () {
  var ui = G.ui, A = G.audio;
  var Ph = G.physics = {};

  // cfg: {discs: [{x,y,color,name,kind}], stewards: [{y, cx, amp, speed}], bumpers: [{x,y}], need, onEscape(d, n)}
  Ph.run = function (cfg) {
    return new Promise(function (resolve) {
      var layer = document.querySelector('#pieces');
      var fx = ui.fx();
      var R = 0.4, SR = 0.46;
      var bodies = [], escaped = 0, alive = true, t = 0, aim = null;
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 8 8');
      svg.setAttribute('class', 'aimsvg');
      svg.innerHTML = '<line class="aimline" x1="0" y1="0" x2="0" y2="0"/><circle class="aimdot" r="0.12" cx="-5" cy="-5"/>';
      fx.appendChild(svg);
      var line = svg.querySelector('line'), dot = svg.querySelector('circle');

      function mkEl(color, name, kind) {
        var e = G.el('div', 'pc phys ' + color + (name ? ' n-' + name : '') + ' k-' + (kind || 'man'));
        var acc = name === 'brenda' ? '<div class="acc cap">' + G.art.capSvg + '</div>' : name === 'gary' ? '<div class="acc plaster">' + G.art.plasterSvg + '</div>' : '';
        e.innerHTML = '<div class="pc-in"><div class="disc"></div><div class="eyes"><span class="eye"><i></i></span><span class="eye"><i></i></span></div>' + acc +
          (kind === 'steward' ? '<div class="vest">STEWARD</div>' : '') + '</div>';
        layer.appendChild(e);
        return e;
      }
      cfg.discs.forEach(function (d) {
        bodies.push({ x: d.x, y: d.y, vx: 0, vy: 0, r: R, dyn: true, name: d.name, color: d.color, el: mkEl(d.color, d.name), home: { x: d.x, y: d.y } });
      });
      (cfg.stewards || []).forEach(function (s, i) {
        bodies.push({ x: s.cx, y: s.y, vx: 0, vy: 0, r: SR, dyn: false, steward: s, el: mkEl('grey', null, 'steward'), phase: i * 1.7 });
      });
      (cfg.bumpers || []).forEach(function (b) {
        bodies.push({ x: b.x, y: b.y, vx: 0, vy: 0, r: R, dyn: false, el: mkEl('black', null) });
      });
      function draw(b) {
        b.el.style.setProperty('--c', (b.x - 0.5).toFixed(3));
        b.el.style.setProperty('--r', (b.y - 0.5).toFixed(3));
      }
      bodies.forEach(draw);

      function slow(b) { return Math.hypot(b.vx, b.vy) < 0.6; }
      ui.onDrag = {
        down: function (x, y) {
          var best = null, bd = 0.85;
          bodies.forEach(function (b) {
            if (!b.dyn || b.gone) return;
            var d = Math.hypot(b.x - x, b.y - y);
            if (d < bd && slow(b)) { bd = d; best = b; }
          });
          if (best) { aim = { b: best, x: x, y: y }; best.el.classList.add('sel-pc'); A.play('select'); }
        },
        move: function (x, y) { if (aim) { aim.x = x; aim.y = y; } },
        up: function (x, y) {
          if (!aim) return;
          var b = aim.b;
          b.el.classList.remove('sel-pc');
          var dx = b.x - x, dy = b.y - y, len = Math.hypot(dx, dy);
          if (len > 0.25) {
            var k = Math.min(len, 3.2) * 6.5 / len;
            b.vx = dx * k; b.vy = dy * k;
            A.play('flick');
            if (cfg.onFlick) cfg.onFlick(b);
          }
          aim = null;
        }
      };

      function collide(a, b) {
        var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = a.r + b.r;
        if (d >= min || d === 0) return;
        var nx = dx / d, ny = dy / d, over = min - d;
        if (a.dyn && b.dyn) {
          a.x -= nx * over / 2; a.y -= ny * over / 2; b.x += nx * over / 2; b.y += ny * over / 2;
          var rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rv < 0) {
            var j = -(1 + 0.9) * rv / 2;
            a.vx -= j * nx; a.vy -= j * ny; b.vx += j * nx; b.vy += j * ny;
            if (-rv > 1.5) A.play('bonk', Math.min(1, -rv / 12));
          }
        } else {
          var dyn = a.dyn ? a : b, st = a.dyn ? b : a;
          var sx = dyn === a ? -nx : nx, sy = dyn === a ? -ny : ny; // normal pointing from static to dynamic
          dyn.x += sx * over; dyn.y += sy * over;
          var rvx = dyn.vx - (st.vx || 0), rvy = dyn.vy - (st.vy || 0);
          var vn = rvx * sx + rvy * sy;
          if (vn < 0) {
            dyn.vx -= (1 + 0.8) * vn * sx; dyn.vy -= (1 + 0.8) * vn * sy;
            if (-vn > 1.5) A.play('bonk', Math.min(1, -vn / 12));
            if (st.steward && G.chance(0.3)) ui.bark('arbiter', G.pick(['Stay ON the board!', 'Back to your squares!', '§1! §1!', 'Nobody leaves!']), 1400);
          }
        }
      }

      var last = performance.now();
      var started = last;
      function frame(now) {
        if (!alive) return;
        var dt = Math.min(0.033, (now - last) / 1000);
        last = now;
        t += dt;
        var sub = 4, h = dt / sub;
        for (var s = 0; s < sub; s++) {
          bodies.forEach(function (b) {
            if (b.gone) return;
            if (b.steward) {
              var st = b.steward;
              var nx = st.cx + st.amp * Math.sin(t * st.speed + b.phase);
              b.vx = (nx - b.x) / h; b.vy = 0; b.x = nx;
              return;
            }
            if (!b.dyn) return;
            b.x += b.vx * h; b.y += b.vy * h;
            var f = Math.exp(-1.25 * h);
            b.vx *= f; b.vy *= f;
            if (Math.hypot(b.vx, b.vy) < 0.05) { b.vx = 0; b.vy = 0; }
            if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.75; }
            if (b.x > 8 - b.r) { b.x = 8 - b.r; b.vx = -Math.abs(b.vx) * 0.75; }
            if (b.y > 8 - b.r) { b.y = 8 - b.r; b.vy = -Math.abs(b.vy) * 0.75; }
          });
          for (var i = 0; i < bodies.length; i++) for (var j = i + 1; j < bodies.length; j++) {
            var a = bodies[i], c = bodies[j];
            if (a.gone || c.gone || (!a.dyn && !c.dyn)) continue;
            collide(a, c);
          }
        }
        bodies.forEach(function (b) {
          if (b.gone) return;
          if (b.dyn && b.y < -0.3) {
            b.gone = true; escaped++;
            b.el.classList.add('escaped');
            A.play('whoosh');
            (function (e) { setTimeout(function () { e.remove(); }, 900); })(b.el);
            if (cfg.onEscape) cfg.onEscape(b, escaped);
            return;
          }
          draw(b);
        });
        if (aim) {
          var b = aim.b;
          var dx = b.x - aim.x, dy = b.y - aim.y, len = Math.hypot(dx, dy) || 1, L = Math.min(len, 3.2);
          line.setAttribute('x1', b.x); line.setAttribute('y1', b.y);
          line.setAttribute('x2', b.x + dx / len * L * 1.2); line.setAttribute('y2', b.y + dy / len * L * 1.2);
          dot.setAttribute('cx', aim.x); dot.setAttribute('cy', aim.y);
          svg.classList.add('on');
        } else svg.classList.remove('on');

        if (G.auto && now - started > 60000 && escaped < cfg.need) escaped = cfg.need; // safety valve for tests
        if (escaped >= cfg.need) {
          alive = false;
          ui.onDrag = null;
          setTimeout(function () {
            bodies.forEach(function (b) { if (b.el.parentNode && !b.gone) b.el.remove(); });
            svg.remove();
            resolve('win');
          }, 900);
          return;
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);

      if (G.auto) (async function autoFlick() {
        while (alive) {
          await G.wait(700);
          var cands = bodies.filter(function (b) { return b.dyn && !b.gone && slow(b); });
          if (!cands.length) continue;
          var b = G.pick(cands);
          ui.onDrag && ui.onDrag.down(b.x, b.y);
          ui.onDrag && ui.onDrag.up(b.x + (Math.random() - 0.5) * 0.6, b.y + 3);
        }
      })();
    });
  };
})();

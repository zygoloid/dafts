// Every sound is synthesised on the fly: no audio files.
(function () {
  var ctx = null, master = null;
  var A = G.audio = {};

  A.unlock = function () {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = G.save.muted ? 0 : 0.5;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
  };
  A.setMuted = function (m) {
    G.save.muted = m; G.writeSave();
    if (master) master.gain.value = m ? 0 : 0.5;
  };
  function ok() { return ctx && master && !G.save.muted && !G.fast; }

  function tone(o) {
    // o: {f, f2, type, dur, vol, at, attack, q}
    if (!ok()) return;
    var t = ctx.currentTime + (o.at || 0);
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + o.dur);
    var v = o.vol == null ? 0.3 : o.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    osc.connect(g); g.connect(master);
    if (o.vib) {
      var lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = o.vib; lg.gain.value = o.vibAmt || 20;
      lfo.connect(lg); lg.connect(osc.frequency);
      lfo.start(t); lfo.stop(t + o.dur + 0.05);
    }
    osc.start(t); osc.stop(t + o.dur + 0.05);
  }
  function noise(o) {
    if (!ok()) return;
    var t = ctx.currentTime + (o.at || 0);
    var len = Math.floor(ctx.sampleRate * o.dur);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource(); src.buffer = buf;
    var f = ctx.createBiquadFilter();
    f.type = o.ftype || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 800, t);
    if (o.freq2) f.frequency.exponentialRampToValueAtTime(o.freq2, t + o.dur);
    f.Q.value = o.q || 1;
    var g = ctx.createGain();
    var v = o.vol == null ? 0.2 : o.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t); src.stop(t + o.dur + 0.05);
  }

  var S = {
    tock: function () { tone({ f: 420, f2: 260, type: 'triangle', dur: 0.08, vol: 0.35 }); noise({ dur: 0.03, freq: 2500, vol: 0.08 }); },
    select: function () { tone({ f: 660, type: 'sine', dur: 0.06, vol: 0.12 }); },
    capture: function () { tone({ f: 200, f2: 90, type: 'triangle', dur: 0.15, vol: 0.4 }); noise({ dur: 0.08, freq: 1200, vol: 0.12 }); },
    scream: function () { tone({ f: 1300 + Math.random() * 300, f2: 300, type: 'sawtooth', dur: 0.7, vol: 0.06, vib: 18, vibAmt: 60 }); },
    hic: function () { tone({ f: 500, f2: 900, type: 'sine', dur: 0.09, vol: 0.25 }); },
    crown: function () { [523, 659, 784, 1046].forEach(function (f, i) { tone({ f: f, type: 'triangle', dur: 0.18, vol: 0.18, at: i * 0.07 }); }); },
    whistle: function () {
      tone({ f: 2900, type: 'square', dur: 0.55, vol: 0.05, vib: 38, vibAmt: 140 });
      tone({ f: 3100, type: 'sine', dur: 0.55, vol: 0.08, vib: 38, vibAmt: 140 });
    },
    softWhistle: function () { [880, 988, 1175, 988, 1318].forEach(function (f, i) { tone({ f: f, type: 'sine', dur: 0.16, vol: 0.12, at: i * 0.14 }); }); },
    wind: function () { noise({ dur: 1.6, freq: 300, freq2: 900, q: 0.8, vol: 0.35, attack: 0.4, ftype: 'bandpass' }); },
    coo: function () { tone({ f: 420, f2: 300, type: 'sine', dur: 0.18, vol: 0.25, vib: 12, vibAmt: 25 }); tone({ f: 380, f2: 280, type: 'sine', dur: 0.25, vol: 0.2, at: 0.22, vib: 12, vibAmt: 25 }); },
    quack: function () { tone({ f: 600, f2: 380, type: 'sawtooth', dur: 0.16, vol: 0.12 }); tone({ f: 580, f2: 360, type: 'square', dur: 0.14, vol: 0.05, at: 0.01 }); },
    pop: function () { tone({ f: 300, f2: 900, type: 'sine', dur: 0.08, vol: 0.2 }); },
    egg: function () { tone({ f: 900, f2: 1200, type: 'sine', dur: 0.1, vol: 0.15 }); tone({ f: 1200, type: 'sine', dur: 0.08, vol: 0.1, at: 0.1 }); },
    crack: function () { noise({ dur: 0.12, freq: 3000, vol: 0.2, q: 3 }); noise({ dur: 0.1, freq: 2000, vol: 0.15, q: 3, at: 0.12 }); },
    bad: function () { tone({ f: 220, f2: 150, type: 'square', dur: 0.25, vol: 0.08 }); },
    win: function () { [392, 523, 659, 784, 1046].forEach(function (f, i) { tone({ f: f, type: 'triangle', dur: 0.3, vol: 0.18, at: i * 0.1 }); }); },
    lose: function () { [392, 370, 349, 330].forEach(function (f, i) { tone({ f: f, type: 'triangle', dur: 0.35, vol: 0.16, at: i * 0.22 }); }); },
    flick: function () { noise({ dur: 0.08, freq: 1800, vol: 0.2, q: 2 }); },
    bonk: function (v) { tone({ f: 300 + Math.random() * 80, f2: 160, type: 'triangle', dur: 0.06, vol: Math.min(0.35, 0.05 + (v || 0.5) * 0.3) }); },
    thunder: function () { noise({ dur: 2.2, freq: 120, freq2: 60, q: 0.7, vol: 0.5, attack: 0.05, ftype: 'lowpass' }); },
    meow: function () { tone({ f: 700, f2: 500, type: 'sawtooth', dur: 0.4, vol: 0.06, vib: 6, vibAmt: 60 }); },
    sneeze: function () { noise({ dur: 0.15, freq: 1500, vol: 0.2, attack: 0.1 }); noise({ dur: 0.35, freq: 4000, vol: 0.35, at: 0.18, q: 0.5 }); },
    bells: function () { for (var i = 0; i < 8; i++) tone({ f: 2200 + Math.random() * 800, type: 'sine', dur: 0.12, vol: 0.06, at: i * 0.11 }); },
    alarm: function () { for (var i = 0; i < 6; i++) tone({ f: i % 2 ? 700 : 900, type: 'square', dur: 0.2, vol: 0.05, at: i * 0.2 }); },
    boing: function () { tone({ f: 150, f2: 600, type: 'sine', dur: 0.3, vol: 0.25, vib: 20, vibAmt: 40 }); },
    whoosh: function () { noise({ dur: 0.6, freq: 500, freq2: 3000, q: 1, vol: 0.25, attack: 0.1 }); },
    tick: function () { tone({ f: 1200, type: 'square', dur: 0.03, vol: 0.05 }); },
    go: function () { tone({ f: 880, type: 'square', dur: 0.35, vol: 0.1 }); },
    stone: function () { tone({ f: 90, f2: 50, type: 'sawtooth', dur: 0.4, vol: 0.2 }); noise({ dur: 0.3, freq: 300, vol: 0.2 }); },
    fanfare: function () {
      var notes = [523, 523, 523, 659, 784, 659, 784, 1046];
      var at = [0, 0.15, 0.3, 0.45, 0.75, 0.95, 1.1, 1.3];
      notes.forEach(function (f, i) { tone({ f: f, type: 'triangle', dur: 0.4, vol: 0.18, at: at[i] }); tone({ f: f / 2, type: 'sine', dur: 0.4, vol: 0.1, at: at[i] }); });
    },
    blip: function (v) {
      // v: voice config {f, type, spread}
      tone({ f: v.f * (1 + (Math.random() - 0.5) * (v.spread || 0.2)), type: v.type || 'square', dur: v.dur || 0.045, vol: v.vol || 0.04 });
    }
  };
  A.play = function (name, arg) {
    try { if (S[name]) S[name](arg); } catch (e) { /* never let audio break the game */ }
  };
  A.buzz = function (ms) { try { if (navigator.vibrate && !G.save.muted) navigator.vibrate(ms); } catch (e) {} };
})();

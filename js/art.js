// Inline SVG portraits for the cast. Moods swap faces, not whole drawings.
(function () {
  var Art = G.art = {};

  // ---------------- COLIN: a beige 1985 monitor ----------------
  var colinFaces = {
    neutral: '<rect x="34" y="31" width="7" height="9"/><rect x="59" y="31" width="7" height="9"/><rect x="40" y="52" width="20" height="3"/>',
    happy: '<path d="M32 39 L37.5 32 L43 39" class="ln"/><path d="M57 39 L62.5 32 L68 39" class="ln"/><path d="M38 50 Q50 60 62 50" class="ln"/>',
    glee: '<path d="M32 39 L37.5 31 L43 39" class="ln"/><path d="M57 39 L62.5 31 L68 39" class="ln"/><path d="M37 48 L63 48 Q60 61 50 61 Q40 61 37 48 Z"/>',
    shock: '<circle cx="37.5" cy="36" r="5" class="ln"/><circle cx="62.5" cy="36" r="5" class="ln"/><circle cx="50" cy="54" r="4.5" class="ln"/>',
    sad: '<rect x="34" y="35" width="7" height="5"/><rect x="59" y="35" width="7" height="5"/><path d="M39 56 Q50 48 61 56" class="ln"/><rect x="66" y="42" width="2.5" height="5" opacity=".8"/>',
    think: '<rect x="37" y="29" width="7" height="8"/><rect x="62" y="29" width="7" height="8"/><rect x="44" y="53" width="12" height="3"/><rect x="70" y="56" width="2.5" height="2.5"/><rect x="74" y="56" width="2.5" height="2.5"/><rect x="78" y="56" width="2.5" height="2.5"/>',
    sleep: '<rect x="33" y="37" width="9" height="2.5"/><rect x="58" y="37" width="9" height="2.5"/><rect x="45" y="53" width="10" height="2.5"/><text x="66" y="30" font-size="11" font-family="monospace" font-weight="bold">z</text><text x="72" y="23" font-size="8" font-family="monospace" font-weight="bold">z</text>',
    angry: '<path d="M32 28 L43 33" class="ln"/><path d="M68 28 L57 33" class="ln"/><rect x="35" y="34" width="7" height="6"/><rect x="58" y="34" width="7" height="6"/><path d="M39 56 L61 56" class="ln"/>',
    sly: '<rect x="34" y="34" width="8" height="4"/><rect x="58" y="34" width="8" height="4"/><path d="M40 52 Q52 58 61 50" class="ln"/>'
  };
  Art.colin = function (mood) {
    var f = colinFaces[mood] || colinFaces.neutral;
    return '<svg viewBox="0 0 100 100" class="colin-svg">' +
      '<rect x="7" y="7" width="86" height="72" rx="10" fill="#d8cdb0" stroke="#8a7f68" stroke-width="3"/>' +
      '<rect x="16" y="15" width="68" height="54" rx="9" fill="#0b1d10" stroke="#5c5545" stroke-width="2"/>' +
      '<rect x="16" y="15" width="68" height="54" rx="9" fill="url(#crtglow)" opacity=".35"/>' +
      '<g class="face" fill="#7dff8a" stroke="#7dff8a">' + f + '</g>' +
      '<rect x="36" y="79" width="28" height="8" fill="#b9ae93"/>' +
      '<rect x="24" y="86" width="52" height="7" rx="3" fill="#a59a80"/>' +
      '<circle cx="82" cy="74" r="2.2" fill="#4cf05a"/>' +
      '<rect x="12" y="72" width="16" height="3" rx="1" fill="#a59a80"/>' +
      '<defs><radialGradient id="crtglow"><stop offset="0" stop-color="#7dff8a" stop-opacity=".5"/><stop offset="1" stop-color="#7dff8a" stop-opacity="0"/></radialGradient></defs>' +
      '</svg>';
  };

  // ---------------- The Arbiter ----------------
  function arbiterHead(mood) {
    var brows = {
      stern: '<path d="M30 38 L44 41" /><path d="M70 38 L56 41" />',
      angry: '<path d="M29 34 L45 42" /><path d="M71 34 L55 42" />',
      shock: '<path d="M30 33 Q37 29 44 33" /><path d="M56 33 Q63 29 70 33" />',
      sad: '<path d="M30 42 L44 37" /><path d="M70 42 L56 37" />',
      smile: '<path d="M30 37 Q37 34 44 37" /><path d="M56 37 Q63 34 70 37" />',
      smug: '<path d="M30 36 L44 39" /><path d="M56 34 Q63 31 70 35" />'
    }[mood] || '';
    var eyes = mood === 'shock'
      ? '<circle cx="38" cy="44" r="3.6" fill="#fff" stroke="#222" stroke-width="1.5"/><circle cx="62" cy="44" r="3.6" fill="#fff" stroke="#222" stroke-width="1.5"/><circle cx="38" cy="44" r="1.4" fill="#222"/><circle cx="62" cy="44" r="1.4" fill="#222"/>'
      : mood === 'smile' ? '<path d="M34 45 Q38 41 42 45" stroke="#222" stroke-width="2" fill="none"/><path d="M58 45 Q62 41 66 45" stroke="#222" stroke-width="2" fill="none"/>'
      : '<circle cx="38" cy="45" r="2.4" fill="#222"/><circle cx="62" cy="45" r="2.4" fill="#222"/>';
    var mouth = {
      shock: '<ellipse cx="50" cy="68" rx="5" ry="6" fill="#5a1f1f"/>',
      angry: '<path d="M42 69 L58 69" stroke="#5a1f1f" stroke-width="3"/>',
      sad: '<path d="M43 71 Q50 66 57 71" stroke="#5a1f1f" stroke-width="2.5" fill="none"/>',
      smile: '<path d="M42 66 Q50 74 58 66" stroke="#5a1f1f" stroke-width="2.5" fill="none"/>'
    }[mood] || '<path d="M44 68 L56 68" stroke="#5a1f1f" stroke-width="2.5"/>';
    var face = mood === 'angry' ? '#f0a58a' : '#f2c7a0';
    return '' +
      '<circle cx="50" cy="50" r="27" fill="' + face + '" stroke="#b8865f" stroke-width="2"/>' +
      '<circle cx="23" cy="52" r="5" fill="' + face + '" stroke="#b8865f" stroke-width="2"/><circle cx="77" cy="52" r="5" fill="' + face + '" stroke="#b8865f" stroke-width="2"/>' +
      '<path d="M22 34 Q50 4 78 34 Z" fill="#1d1d1d"/>' +
      '<path d="M18 34 L82 34 Q86 40 70 39 L30 39 Q14 40 18 34 Z" fill="#111"/>' +
      '<circle cx="50" cy="22" r="3" fill="#e2b33c"/>' +
      '<g stroke="#6b6b6b" stroke-width="4" stroke-linecap="round" fill="none">' + brows + '</g>' +
      eyes +
      '<ellipse cx="50" cy="54" rx="4" ry="5" fill="#e0a982"/>' +
      mouth +
      '<path d="M32 62 Q41 55 50 61 Q59 55 68 62 Q60 66 50 63 Q40 66 32 62 Z" fill="#8a8a8a" stroke="#666" stroke-width="1"/>';
  }
  function stripes(y, h) {
    var s = '';
    for (var x = 0; x < 100; x += 10) s += '<rect x="' + x + '" y="' + y + '" width="5" height="' + h + '" fill="#111"/>';
    return s;
  }
  Art.arbiter = function (mood) {
    return '<svg viewBox="0 0 100 100">' +
      '<path d="M8 100 Q12 80 50 80 Q88 80 92 100 Z" fill="#f4f4f4"/>' +
      '<clipPath id="shoulders"><path d="M8 100 Q12 80 50 80 Q88 80 92 100 Z"/></clipPath>' +
      '<g clip-path="url(#shoulders)">' + stripes(78, 24) + '</g>' +
      '<path d="M40 80 L50 92 L60 80" fill="none" stroke="#333" stroke-width="1.5"/>' +
      arbiterHead(mood) +
      '<rect x="56" y="84" width="10" height="5" rx="2" fill="#cfd4d8" stroke="#888"/>' +
      '</svg>';
  };
  Art.arbiterFull = function (mood, holding) {
    var book = holding === 'none' ? '' :
      '<g transform="rotate(-12 82 140)"><rect x="66" y="118" width="30" height="38" rx="2" fill="#7a1d1d" stroke="#3d0d0d" stroke-width="2"/>' +
      '<rect x="70" y="124" width="22" height="3" fill="#e2b33c"/><text x="81" y="142" font-size="9" text-anchor="middle" fill="#e2b33c" font-family="Georgia,serif" font-weight="bold">§</text></g>';
    return '<svg viewBox="0 0 100 200" class="arb-full">' +
      '<clipPath id="torso"><path d="M14 200 L18 110 Q22 92 50 90 Q78 92 82 110 L86 200 Z"/></clipPath>' +
      '<path d="M14 200 L18 110 Q22 92 50 90 Q78 92 82 110 L86 200 Z" fill="#f4f4f4"/>' +
      '<g clip-path="url(#torso)">' + stripes(88, 112) + '</g>' +
      '<path d="M40 92 L50 106 L60 92" fill="none" stroke="#333" stroke-width="2"/>' +
      '<path d="M50 96 Q54 118 60 124" stroke="#2a5db0" stroke-width="2" fill="none"/>' +
      '<rect x="56" y="122" width="12" height="6" rx="2" fill="#cfd4d8" stroke="#888"/>' +
      '<path d="M18 112 Q4 140 14 160" stroke="#f4f4f4" stroke-width="12" fill="none" stroke-linecap="round"/>' +
      '<path d="M82 112 Q92 128 82 140" stroke="#f4f4f4" stroke-width="12" fill="none" stroke-linecap="round"/>' +
      book +
      '<g transform="translate(0,40)">' + arbiterHead(mood) + '</g>' +
      '</svg>';
  };

  // ---------------- Pieces as portraits ----------------
  function disc(fill, rim, extra, brows) {
    return '<svg viewBox="0 0 100 100">' +
      '<ellipse cx="50" cy="60" rx="40" ry="30" fill="' + rim + '"/>' +
      '<ellipse cx="50" cy="52" rx="40" ry="30" fill="' + fill + '" stroke="' + rim + '" stroke-width="2"/>' +
      '<ellipse cx="50" cy="52" rx="28" ry="20" fill="none" stroke="' + rim + '" stroke-width="3" opacity=".7"/>' +
      '<ellipse cx="39" cy="50" rx="7" ry="9" fill="#fff"/><ellipse cx="61" cy="50" rx="7" ry="9" fill="#fff"/>' +
      '<circle cx="40" cy="52" r="3.6" fill="#111"/><circle cx="62" cy="52" r="3.6" fill="#111"/>' +
      (brows || '') + (extra || '') + '</svg>';
  }
  var DISC = { red: ['#c43a2f', '#7c1d16', '#4a0f0a'], black: ['#2d2d32', '#0e0e10', '#ddd'] };
  Art.gary = function (mood, color) {
    var d = DISC[color] || DISC.red;
    var brows = mood === 'happy'
      ? '<path d="M31 37 Q39 33 46 37" stroke="' + d[2] + '" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M54 37 Q61 33 69 37" stroke="' + d[2] + '" stroke-width="3" fill="none" stroke-linecap="round"/>'
      : mood === 'shock' ? '<path d="M31 33 Q39 28 46 33" stroke="' + d[2] + '" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M54 33 Q61 28 69 33" stroke="' + d[2] + '" stroke-width="3" fill="none" stroke-linecap="round"/>'
      : '<path d="M31 40 L45 35" stroke="' + d[2] + '" stroke-width="3" stroke-linecap="round"/><path d="M69 40 L55 35" stroke="' + d[2] + '" stroke-width="3" stroke-linecap="round"/>';
    var plaster = '<g transform="rotate(30 74 30)"><rect x="62" y="25" width="24" height="9" rx="3" fill="#e8c39a" stroke="#b9936b"/><rect x="70" y="26" width="8" height="7" fill="#d6ab7f"/></g>';
    return disc(d[0], d[1], plaster, brows);
  };
  Art.brenda = function (mood, color) {
    var d = DISC[color] || DISC.black;
    var brows = mood === 'sad'
      ? '<path d="M31 41 L45 37" stroke="' + d[2] + '" stroke-width="3" stroke-linecap="round"/><path d="M69 41 L55 37" stroke="' + d[2] + '" stroke-width="3" stroke-linecap="round"/>'
      : '<path d="M31 37 L45 41" stroke="' + d[2] + '" stroke-width="3" stroke-linecap="round"/><path d="M69 37 L55 41" stroke="' + d[2] + '" stroke-width="3" stroke-linecap="round"/>';
    var cap = '<path d="M16 34 Q22 10 54 12 Q80 14 82 30 L92 33 Q90 38 80 37 Q50 40 18 38 Z" fill="#7b6a4f" stroke="#4d412f" stroke-width="2"/>' +
      '<path d="M24 24 L76 22 M22 30 L80 28" stroke="#5c4f3a" stroke-width="1" opacity=".6"/>';
    return disc(d[0], d[1], cap, brows);
  };
  Art.narrator = function () {
    return '<svg viewBox="0 0 100 100">' +
      '<rect x="47" y="62" width="6" height="26" fill="#555"/><rect x="30" y="86" width="40" height="6" rx="3" fill="#444"/>' +
      '<rect x="33" y="10" width="34" height="54" rx="17" fill="#9aa3ab" stroke="#5b636a" stroke-width="3"/>' +
      '<g stroke="#5b636a" stroke-width="2">' +
      '<line x1="36" y1="22" x2="64" y2="22"/><line x1="34" y1="30" x2="66" y2="30"/><line x1="34" y1="38" x2="66" y2="38"/><line x1="34" y1="46" x2="66" y2="46"/><line x1="36" y1="54" x2="64" y2="54"/></g>' +
      '<rect x="28" y="34" width="44" height="6" rx="2" fill="#6b747b"/>' +
      '</svg>';
  };
  Art.pigeon = function () {
    return '<svg viewBox="0 0 100 100">' +
      '<ellipse cx="54" cy="62" rx="30" ry="20" fill="#9aa0a8"/>' +
      '<path d="M70 58 Q96 56 92 72 Q80 70 72 70 Z" fill="#6e747c"/>' +
      '<path d="M40 64 Q56 54 74 64 Q58 74 40 64 Z" fill="#7d838b"/>' +
      '<ellipse cx="34" cy="44" rx="13" ry="15" fill="#5f8f7c"/>' +
      '<ellipse cx="36" cy="50" rx="12" ry="8" fill="#7a5f92" opacity=".7"/>' +
      '<circle cx="32" cy="32" r="12" fill="#8f96a0"/>' +
      '<circle cx="28" cy="30" r="3.5" fill="#f08a24"/><circle cx="28" cy="30" r="1.5" fill="#111"/>' +
      '<path d="M20 32 L11 35 L20 37 Z" fill="#3a3a3a"/>' +
      '<line x1="48" y1="80" x2="46" y2="92" stroke="#d27373" stroke-width="3"/><line x1="58" y1="80" x2="60" y2="92" stroke="#d27373" stroke-width="3"/>' +
      '</svg>';
  };
  Art.duck = function () {
    return '<svg viewBox="0 0 100 100">' +
      '<ellipse cx="55" cy="64" rx="30" ry="20" fill="#f6d34a"/>' +
      '<path d="M72 54 Q92 48 88 64 Q80 62 74 64 Z" fill="#eec23a"/>' +
      '<circle cx="34" cy="38" r="15" fill="#f6d34a"/>' +
      '<circle cx="30" cy="34" r="3" fill="#111"/>' +
      '<path d="M20 40 Q8 40 10 46 Q18 48 24 45 Z" fill="#f08a24"/>' +
      '<path d="M42 66 Q56 58 70 66" stroke="#e1b52f" stroke-width="3" fill="none"/>' +
      '</svg>';
  };
  Art.emoji = function (ch, bg) {
    return '<div class="emoji-portrait" style="background:' + (bg || '#3a302a') + '">' + ch + '</div>';
  };
  Art.ghost = function () {
    return '<svg viewBox="0 0 100 100"><ellipse cx="50" cy="56" rx="38" ry="28" fill="#cbb7ff" opacity=".55"/><ellipse cx="50" cy="50" rx="38" ry="28" fill="#e4dbff" opacity=".7"/>' +
      '<ellipse cx="39" cy="48" rx="6" ry="8" fill="#fff"/><ellipse cx="61" cy="48" rx="6" ry="8" fill="#fff"/><circle cx="39" cy="50" r="3" fill="#333"/><circle cx="61" cy="50" r="3" fill="#333"/></svg>';
  };
  Art.crownSvg = '<svg viewBox="0 0 60 40"><path d="M4 34 L8 10 L20 22 L30 4 L40 22 L52 10 L56 34 Z" fill="#e2b33c" stroke="#8a6512" stroke-width="3" stroke-linejoin="round"/><circle cx="30" cy="25" r="4" fill="#c43a2f"/></svg>';
  Art.capSvg = '<svg viewBox="0 0 100 50"><path d="M6 40 Q12 6 52 6 Q84 8 86 30 L98 34 Q96 42 84 42 Q50 46 8 44 Z" fill="#7b6a4f" stroke="#4d412f" stroke-width="3"/><path d="M18 24 L80 20 M14 34 L84 30" stroke="#5c4f3a" stroke-width="2" opacity=".6"/></svg>';
  Art.plasterSvg = '<svg viewBox="0 0 60 24"><rect x="2" y="3" width="56" height="18" rx="7" fill="#e8c39a" stroke="#b9936b" stroke-width="2"/><rect x="22" y="5" width="16" height="14" fill="#d6ab7f"/><circle cx="10" cy="12" r="1.5" fill="#b9936b"/><circle cx="50" cy="12" r="1.5" fill="#b9936b"/></svg>';
  Art.pigeonSvg = Art.pigeon;

  // portrait dispatcher
  Art.portrait = function (who, mood, color) {
    switch (who) {
      case 'colin': return Art.colin(mood);
      case 'arbiter': return Art.arbiter(mood || 'stern');
      case 'gary': return Art.gary(mood, color);
      case 'brenda': return Art.brenda(mood, color);
      case 'narrator': return Art.narrator();
      case 'pigeon': return Art.pigeon();
      case 'duck': return Art.duck();
      case 'ghost': return Art.ghost();
      case 'piece': return '<svg viewBox="0 0 100 100"><ellipse cx="50" cy="58" rx="40" ry="30" fill="#7c1d16"/><ellipse cx="50" cy="50" rx="40" ry="30" fill="#c43a2f"/><ellipse cx="39" cy="48" rx="6" ry="8" fill="#fff"/><ellipse cx="61" cy="48" rx="6" ry="8" fill="#fff"/><circle cx="39" cy="50" r="3" fill="#111"/><circle cx="61" cy="50" r="3" fill="#111"/></svg>';
      case 'bpiece': return '<svg viewBox="0 0 100 100"><ellipse cx="50" cy="58" rx="40" ry="30" fill="#0e0e10"/><ellipse cx="50" cy="50" rx="40" ry="30" fill="#2d2d32"/><ellipse cx="39" cy="48" rx="6" ry="8" fill="#fff"/><ellipse cx="61" cy="48" rx="6" ry="8" fill="#fff"/><circle cx="39" cy="50" r="3" fill="#111"/><circle cx="61" cy="50" r="3" fill="#111"/></svg>';
      case 'you': return Art.emoji('&#128070;', '#4a3b32');
      case 'taxman': return Art.emoji('&#127913;', '#33402f');
      case 'boot': return Art.emoji('&#128098;', '#3a302a');
      case 'jigsaw': return Art.emoji('&#129513;', '#2d3c5a');
      case 'die': return Art.emoji('&#127922;', '#4a2d2d');
      case 'sock': return Art.emoji('&#129510;', '#3d2d4a');
      case 'tile': return Art.emoji('<span class="tileQ">Q<sub>10</sub></span>', '#3a302a');
      case 'manual': return Art.emoji('&#128216;', '#2d3a4a');
      case 'cat': return Art.emoji('&#128008;', '#3a302a');
      case 'morris': return Art.emoji('&#128276;', '#2f4030');
      case 'ad': return Art.emoji('&#128226;', '#5a2d4a');
      default: return Art.emoji('?', '#333');
    }
  };
})();

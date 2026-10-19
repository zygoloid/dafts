# Dafts

A perfectly ordinary game of draughts against the computer, for your phone. Nothing unusual happens.

## Playing

Open `index.html` in a browser. There's no build step, no dependencies and no network access, and it works straight from `file://`. To play on a phone, host the folder anywhere static (e.g. GitHub Pages).

Tap a piece, then tap where it should go. All sound is synthesised, and the speaker button mutes it. Progress is saved in your browser.

## Layout

| File | What it does |
| --- | --- |
| `js/rules.js` | English draughts, plus every rule the story later bends: forced capture, flying kings, backwards men, captured pieces changing sides, straight-line moves, capture-only pieces |
| `js/ai.js` | COLIN: iterative-deepening alpha-beta with a time budget and a bit of noise |
| `js/play.js` | Turn loop, tap input, real-time mode, and the reusable mods (wind, eggs, strikes) |
| `js/interludes.js` | Random interruptions, different every playthrough |
| `js/physics.js` | The flicking chapter |
| `js/cutscenes.js` | The zoom out, and the credits |
| `js/story.js` | The ten chapters |
| `js/main.js` | Title screen, menus, chapter flow, House Rules |

## Testing

`index.html?auto&fast#ch=N` plays chapter `N` (0-based) by itself at high speed. `window.__dafts.log` records each chapter's result, and `window.__dafts.errors` collects any errors. Add `&talk=1200` to linger on each line of dialogue.

## Licence

Apache License 2.0. See [LICENSE](LICENSE).

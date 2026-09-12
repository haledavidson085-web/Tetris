# Tetris

A responsive falling-block game built with TypeScript, Vite, Tailwind CSS, and daisyUI. No account or backend is required.

Play the published game on [GitHub Pages](https://haledavidson085-web.github.io/Tetris/).

## Run locally

```sh
bun install
bun run dev
```

Open the local URL printed by Vite. To build for static hosting, run `bun run build`; the output is in `dist/`. Run the game-engine tests with `bun test`.

## Play

- **← / →**: move
- **↑ / X**: rotate clockwise; **Z**: rotate counterclockwise
- **↓**: soft drop
- **Space**: hard drop
- **C**: hold or swap a piece, once per turn
- **P / Escape**: pause or resume
- **Enter**: start a game

Touch buttons are provided on smaller screens. Leaving the browser window automatically pauses the game. Sound is optional and off by default.

**Classic** increases speed every ten lines. **40-line Sprint** ends when you clear forty lines. **Zen** keeps a steady, slower speed. All modes end if pieces reach the top. Personal best scores are saved per mode in this browser using local storage.

The engine uses a shuffled seven-piece bag, ghost previews, basic wall/floor kicks, a 500ms lock delay, and a fifteen-reset lock limit. It is a casual Tetris-style game, not an implementation of every official competitive rule.

## Your profile, scores, and settings

Use the player menu in the header to open:

- **Profile:** Choose a display name and tetromino avatar. View your recorded runs, total lines, playing time, and completed Sprints.
- **High scores:** Your top ten scores for Classic and Zen, fastest ten completed Sprints, and recent runs per mode. Runs are recorded on game over, Sprint completion, or a confirmed restart; restarted runs are labeled in history. The latest twenty runs are retained across modes, while top scores and lifetime totals are retained separately. Existing personal bests from earlier versions are preserved without creating fictional history.
- **Settings:** Select Studio, Midnight, Forest, or Arcade board colors; toggle ghost pieces, the grid, and flat blocks; adjust sound and volume. Changes apply and save immediately. Reset settings restores the defaults without clearing your profile or scores.

Opening a panel pauses an active game; closing it resumes only if it was playing before the panel opened and the browser is still focused. Profile and game settings use local storage on this browser and origin, with no account or cross-device sync. If storage is unavailable, changes work for the current session and the panels explain that they cannot be saved. An unfinished run is not added to history when the page is closed or reloaded.

## Publishing

The `Publish` GitHub Actions workflow runs all tests and creates the production build. A push to `main` deploys that build to GitHub Pages. A semantic version tag creates a GitHub Release with the same build attached as a ZIP:

```sh
git tag v1.0.0
git push origin v1.0.0
```

The workflow can also be started manually with an existing release tag; a manual run performs both publishing steps.

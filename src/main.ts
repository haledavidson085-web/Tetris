import './style.css';
import './personal.css';
import { Game, SHAPES, COLS, ROWS, type Kind, type Mode } from './game';
import { PlayerStore, THEMES, type Run } from './player';
import { mountPersonalFeatures } from './personal-ui';

const icons: Record<string, string> = {
  play: '<path d="m8 5 11 7-11 7Z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  restart: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  sound: '<path d="m11 5-6 4H2v6h3l6 4ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
  mute: '<path d="m11 5-6 4H2v6h3l6 4ZM16 9l6 6m0-6-6 6"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  trophy: '<path d="M8 3h8v6a4 4 0 0 1-8 0ZM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 1v6m-4 2h8"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .5-1.5 1-1.5 2m0 3h.01"/>',
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  leaf: '<path d="M20 4c-9-2-16 3-15 10 1 5 8 7 12 2 3-4 3-8 3-12ZM4 21 15 10"/>',
  keyboard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 15h10"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="var(--color-base-100)"/><circle cx="16" cy="17" r="3" fill="var(--color-base-100)"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
};
const icon = (name: string, size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] ?? icons.spark}</svg>`;
const key = (text: string) => `<kbd class="kbd kbd-sm">${text}</kbd>`;
const controls = `<div class="control-row"><span>Move</span><span>${key('←')}${key('→')}</span></div>
  <div class="control-row"><span>Rotate</span><span>${key('↑')}</span></div>
  <div class="control-row"><span>Soft drop</span><span>${key('↓')}</span></div>
  <div class="control-row"><span>Hard drop</span><span>${key('space')}</span></div>
  <div class="control-row"><span>Hold piece</span><span>${key('C')}</span></div>
  <div class="control-row"><span>Pause</span><span>${key('P')}</span></div>`;

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <header class="site-header">
    <a class="brand" href="./" aria-label="Tetris home"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>tetris<span class="brand-dot">.</span></span></a>
    <span class="header-note">ONE BLOCK AT A TIME.</span>
    <nav class="header-actions" aria-label="Player menu">
      <button class="btn btn-ghost help-button" id="help-button" aria-label="How to play" title="How to play">${icon('help',18)}<span>How to play</span></button>
      <button class="btn btn-ghost help-button" id="scores-button" aria-label="High scores" title="High scores">${icon('trophy',18)}<span>High scores</span></button>
      <button class="btn btn-ghost help-button" id="settings-button" aria-label="Settings" title="Settings">${icon('settings',18)}<span>Settings</span></button>
      <button class="btn profile-button" id="profile-button"><span id="profile-button-avatar"></span><span id="profile-button-name">Player one</span></button>
    </nav>
  </header>
  <main>
    <section class="intro"><div><div class="eyebrow"><span class="little-dot"></span> A CLASSIC, REIMAGINED</div><h1>Find your flow.</h1><p>Clear your mind. Clear some lines.</p></div><div class="intro-aside">Easy to start.<br>Hard to put down.<span>↓</span></div></section>
    <section class="game-layout" aria-label="Tetris game">
      <aside class="left-panel">
        <div class="section-label">YOUR SESSION <span>01</span></div>
        <div class="mode-options" aria-label="Game mode">
          <button class="mode-option selected" data-mode="classic" aria-pressed="true">${icon('spark')}<span><strong>Classic</strong><small>The timeless challenge</small></span><span class="mode-dot"></span></button>
          <button class="mode-option" data-mode="sprint" aria-pressed="false">${icon('clock')}<span><strong>40-line sprint</strong><small>You against the clock</small></span><span class="mode-dot"></span></button>
          <button class="mode-option" data-mode="zen" aria-pressed="false">${icon('leaf')}<span><strong>Zen mode</strong><small>Slow down. Settle in.</small></span><span class="mode-dot"></span></button>
        </div>
        <div class="score-panel"><div class="section-label">SCORE <span>${icon('spark',14)}</span></div><div id="score" class="score-number">000000</div><div class="record-line">${icon('trophy',15)}<span>Personal best</span><strong id="best">0</strong></div></div>
        <div class="session-stats"><div><span class="section-label">LEVEL</span><strong id="level">01</strong></div><div><span class="section-label">LINES</span><strong id="lines">00</strong></div></div>
        <div class="level-progress"><div id="progress"></div></div><p class="progress-caption" id="progress-caption">10 lines to the next level</p>
        <div class="hold-panel"><div class="section-label">HOLD ${key('C')}</div><div id="hold-preview" class="hold-preview"><span>Save a piece for later</span></div></div>
      </aside>
      <div class="board-column">
        <div class="mobile-previews"><div><span>HOLD</span><div id="mobile-hold">—</div></div><div><span>NEXT</span><div id="mobile-next"></div></div></div>
        <div class="board-top"><span><i class="status-dot"></i><span id="game-status">READY WHEN YOU ARE</span></span><span id="timer">00:00</span></div>
        <div class="board-shell">
          <canvas id="board" width="600" height="1200" role="img" aria-label="Tetris game board, 10 columns and 20 rows"></canvas>
          <div class="board-overlay" id="overlay"><div class="overlay-content"><span class="overlay-eyebrow" id="overlay-eyebrow">A MOMENT FOR YOURSELF</span><h2 id="overlay-title">Let’s play.</h2><p id="overlay-description">Make a little space.<br>See how far you can go.</p><button class="btn start-button" id="start-button">${icon('play',17)}<span>Start game</span></button><span class="start-hint" id="start-hint">or press enter</span></div></div>
          <div class="clear-message" id="clear-message" aria-live="polite"></div>
        </div>
        <div class="board-toolbar"><span id="mode-caption">CLASSIC · ENDLESS POSSIBILITIES</span><div><button class="btn btn-ghost btn-square btn-sm" id="sound-button" aria-label="Turn sound on" aria-pressed="false" title="Turn sound on">${icon('mute',17)}</button><span class="toolbar-divider"></span><button class="btn btn-ghost btn-square btn-sm" id="pause-button" aria-label="Pause game" title="Pause (P)" disabled>${icon('pause',17)}</button><button class="btn btn-ghost btn-square btn-sm" id="restart-button" aria-label="Restart game" title="Restart game" disabled>${icon('restart',17)}</button></div></div>
        <div class="touch-controls" aria-label="Touch game controls"><button class="btn" data-action="hold" aria-label="Hold piece">C</button><button class="btn" data-action="left" aria-label="Move left">←</button><button class="btn" data-action="rotate" aria-label="Rotate piece">↻</button><button class="btn" data-action="right" aria-label="Move right">→</button><button class="btn" data-action="down" aria-label="Soft drop">↓</button><button class="btn" data-action="drop" aria-label="Hard drop">⤓</button></div>
      </div>
      <aside class="right-panel"><div class="section-label">UP NEXT <span>03</span></div><div id="next-preview" class="next-preview"></div><section class="controls-panel"><h2 class="section-label">${icon('keyboard',16)} THE CONTROLS</h2>${controls}<div class="control-note">A little practice.<br>A lot of possibility.</div></section><div class="tip"><span>${icon('spark',16)} A SMALL TIP</span><p>Keep your stack low and leave room for the long one.</p></div></aside>
    </section>
    <footer><span>Built for the joy of it.</span><div class="footer-blocks" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span>No rush. Just rhythm.</span></footer>
  </main>
  <dialog id="help-dialog" class="modal" aria-labelledby="help-title"><div class="modal-box"><div class="eyebrow">GET INTO THE GROOVE</div><h2 id="help-title">One block at a time.</h2><p>Move and rotate falling pieces to fill a complete horizontal line. Full lines disappear, giving you room to keep going. The game ends when the stack reaches the top.</p><div class="dialog-controls">${controls}</div><p><strong>Classic:</strong> Clear lines to level up and increase the speed.<br><strong>40-line sprint:</strong> Clear 40 lines as quickly as you can.<br><strong>Zen:</strong> Enjoy a steady, gentler pace.</p><p class="dialog-footnote">Clear 1 / 2 / 3 / 4 lines for 100 / 300 / 500 / 800 points × your level. Press Z to rotate counterclockwise. Hold swaps once per piece. The outline shows where your piece will land.</p><form method="dialog" class="modal-action"><button class="btn">Got it ${icon('arrow',17)}</button></form></div><form method="dialog" class="modal-backdrop"><button>Close instructions</button></form></dialog>
  <dialog id="confirm-dialog" class="modal" aria-labelledby="confirm-title"><div class="modal-box"><div class="eyebrow">A FRESH START</div><h2 id="confirm-title">Start a new game?</h2><p>Your current run will end. Your personal best is always saved.</p><div class="modal-action"><button class="btn" id="cancel-restart">Keep playing</button><button class="btn" id="confirm-restart">New game ${icon('arrow',17)}</button></div></div></dialog>
`;

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const game = new Game();
let browserStorage: Storage | null = null;
try { browserStorage = window.localStorage; } catch { /* Keep playing if storage is blocked. */ }
const player = new PlayerStore(browserStorage);
player.persist();
const canvas = $<HTMLCanvasElement>('board');
const ctx = canvas.getContext('2d')!;
const unit = canvas.width / COLS;
let sound = player.data.settings.sound;
let audioContext: AudioContext | null = null;
let best = readBest('classic');
let pendingMode: Mode = 'classic';
let resumeAfterDialog = false;
let clearUntil = 0;
let previousStatus = '';
let previousPreview = '';
let previousBest = -1;
const keys = new Map<string, { elapsed: number; next: number }>();
const previewKinds: Kind[] = ['T', 'I', 'L'];
let runId: string | null = null;

function readBest(mode: Mode) { return player.data.bests[mode]; }
function saveBest() { if (game.score > best) { best = game.score; player.updateBest(game.mode,best); } }
function recordRun(result: Run['result']) {
  if (!runId) return;
  player.record({id:runId,mode:game.mode,score:game.score,lines:game.lines,level:game.level,elapsed:game.elapsed,endedAt:Date.now(),result});
  runId = null;
}
function applySettings() {
  const settings = player.data.settings, theme = THEMES[settings.theme];
  sound = settings.sound;
  document.documentElement.style.setProperty('--board-bg',theme.background);
  document.documentElement.style.setProperty('--board-frame',theme.frame);
  document.documentElement.style.setProperty('--board-overlay-tint',theme.background+'bb');
  document.body.dataset.boardTheme = settings.theme;
  document.body.classList.toggle('flat-blocks',settings.flat);
  $('sound-button').innerHTML = icon(sound?'sound':'mute',17);
  $('sound-button').setAttribute('aria-label',sound?'Turn sound off':'Turn sound on');
  $('sound-button').title=sound?'Turn sound off':'Turn sound on';
  $('sound-button').setAttribute('aria-pressed',String(sound));
  previousPreview = '';
  render();
}
function tone(frequency: number, length = 0.045) {
  if (!sound || player.data.settings.volume === 0) return;
  try {
    audioContext ??= new AudioContext();
    void audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.09 * player.data.settings.volume / 100, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + length);
    oscillator.connect(gain); gain.connect(audioContext.destination);
    oscillator.start(); oscillator.stop(audioContext.currentTime + length);
  } catch { /* The game remains playable without audio. */ }
}
game.onEvent = event => {
  const notes = { move: 160, rotate: 320, drop: 110, clear: 620, over: 130, hold: 420 };
  tone(notes[event], event === 'clear' ? 0.2 : 0.045);
  if (event === 'clear') {
    $('clear-message').textContent = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS!'][game.lastClear];
    clearUntil = performance.now() + 900;
  }
  if (event === 'over') { saveBest(); recordRun(game.status==='won'?'won':'over'); }
};

function pieceMarkup(kind: Kind, muted = false) {
  const shape = SHAPES[kind].filter(row => row.some(Boolean));
  return `<div class="mini-piece ${muted ? 'piece-muted' : ''}" style="--piece-color:${THEMES[player.data.settings.theme].colors[kind]};grid-template-columns:repeat(${shape[0].length}, 21px)" role="img" aria-label="${kind} piece">${shape.flat().map(cell => `<i class="${cell ? 'filled' : ''}"></i>`).join('')}</div>`;
}
function block(x: number, y: number, kind: Kind, ghost = false) {
  const px = x * unit, py = y * unit;
  const color = THEMES[player.data.settings.theme].colors[kind];
  if (ghost) {
    if (!player.data.settings.ghost) return;
    ctx.strokeStyle = color + '88'; ctx.lineWidth = 2;
    ctx.strokeRect(px + 4, py + 4, unit - 8, unit - 8);
    ctx.fillStyle = color + '0c'; ctx.fillRect(px + 4, py + 4, unit - 8, unit - 8);
  } else {
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(px + 2, py + 2, unit - 4, unit - 4, 3); ctx.fill();
    if (player.data.settings.flat) return;
    ctx.fillStyle = '#ffffff19'; ctx.fillRect(px + 5, py + 5, unit - 10, 3);
    ctx.strokeStyle = '#0000000e'; ctx.lineWidth = 2; ctx.strokeRect(px + 9, py + 9, unit - 18, unit - 18);
  }
}
const demo: (Kind | null)[][] = [
  [null,null,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null,'T'],
  ['J',null,null,null,null,null,null,null,'T','T'],
  ['J',null,null,null,null,null,'S','S','L','T'],
  ['J','J','O','O',null,'S','S','L','L','L'],
  ['Z','Z','O','O',null,'I','I','I','I','S'],
  ['T','Z','Z','L',null,'J','J','J','S','S'],
];
function draw() {
  const theme = THEMES[player.data.settings.theme];
  ctx.fillStyle = theme.background; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = player.data.settings.grid ? theme.grid : theme.background; ctx.lineWidth = 1;
  for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x*unit,0); ctx.lineTo(x*unit,canvas.height); ctx.stroke(); }
  for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0,y*unit); ctx.lineTo(canvas.width,y*unit); ctx.stroke(); }
  if (game.status === 'ready') {
    ctx.globalAlpha = 0.8;
    demo.forEach((row,y) => row.forEach((cell,x) => { if (cell) block(x,ROWS-demo.length+y,cell); }));
    ctx.globalAlpha = 1;
  } else {
    game.board.forEach((row,y) => row.forEach((cell,x) => { if (cell) block(x,y,cell); }));
    if (game.active && game.status !== 'paused') {
      const ghost = game.ghost()!;
      ghost.shape.forEach((row,y) => row.forEach((cell,x) => { if (cell) block(ghost.x+x,ghost.y+y,ghost.kind,true); }));
      game.active.shape.forEach((row,y) => row.forEach((cell,x) => { if (cell) block(game.active!.x+x,game.active!.y+y,game.active!.kind); }));
    }
  }
}
function render() {
  saveBest();
  $('score').textContent = String(game.score).padStart(6, '0');
  $('level').textContent = String(game.level).padStart(2, '0');
  $('lines').textContent = String(game.lines).padStart(2, '0');
  $('timer').textContent = `${String(Math.floor(game.elapsed / 60000)).padStart(2,'0')}:${String(Math.floor(game.elapsed / 1000) % 60).padStart(2,'0')}`;
  if (best !== previousBest) { $('best').textContent = best.toLocaleString(); previousBest = best; }
  $('progress').style.width = `${game.mode === 'sprint' ? Math.min(game.lines / 40 * 100, 100) : game.mode === 'zen' ? 0 : game.lines % 10 * 10}%`;
  $('progress-caption').textContent = game.mode === 'zen' ? 'Your pace. Your space.' : game.mode === 'sprint' ? `${Math.max(0,40-game.lines)} lines to the finish` : `${10-game.lines%10} lines to the next level`;
  const kinds = game.status === 'ready' ? previewKinds : game.queue.slice(0,3);
  const preview = kinds.join('') + game.held + game.holdUsed;
  if (preview !== previousPreview) {
    $('next-preview').innerHTML = kinds.map((kind,i) => `<div class="next-piece">${pieceMarkup(kind)}<span>0${i+1}</span></div>`).join('');
    $('hold-preview').innerHTML = game.held ? pieceMarkup(game.held, game.holdUsed) : '<span>Save a piece for later</span>';
    $('mobile-hold').innerHTML = game.held ? pieceMarkup(game.held, game.holdUsed) : '—';
    $('mobile-next').innerHTML = kinds.slice(0,2).map(kind => pieceMarkup(kind)).join('');
    previousPreview = preview;
  }
  $('clear-message').classList.toggle('visible', performance.now() < clearUntil);
  if (previousStatus !== game.status) {
    document.body.dataset.gameState = game.status;
    const playing = game.status === 'playing';
    $('overlay').hidden = playing;
    $('board').classList.toggle('board-paused', game.status === 'paused');
    $('game-status').textContent = {ready:'READY WHEN YOU ARE',playing:'IN THE FLOW',paused:'TAKE A BREATHER',over:'A GOOD RUN',won:'FINISH LINE REACHED'}[game.status];
    document.querySelector('.status-dot')!.classList.toggle('is-playing', playing);
    $<HTMLButtonElement>('pause-button').disabled = !['playing','paused'].includes(game.status);
    $<HTMLButtonElement>('restart-button').disabled = game.status === 'ready';
    $('pause-button').innerHTML = icon(playing ? 'pause' : 'play',17);
    $('pause-button').setAttribute('aria-label', game.status === 'paused' ? 'Resume game' : 'Pause game');
    $('pause-button').title = playing ? 'Pause (P)' : 'Resume (P)';
    const copy = {
      ready: ['A MOMENT FOR YOURSELF', 'Let’s play.', 'Make a little space.<br>See how far you can go.', 'Start game'],
      paused: ['NO RUSH', 'Take a breath.', 'Your next move can wait.<br>Come back when you’re ready.', 'Resume game'],
      over: ['EVERY RUN IS A FRESH START', 'Nice run.', `${game.score.toLocaleString()} points. ${game.lines} lines cleared.<br>There’s always another round.`, 'Play again'],
      won: ['40 LINES. ALL YOURS.', 'You did it.', `Finished in ${$('timer').textContent}.<br>A little focus goes a long way.`, 'Play again'],
      playing: ['', '', '', ''],
    }[game.status];
    $('overlay-eyebrow').textContent = copy[0]; $('overlay-title').textContent = copy[1]; $('overlay-description').innerHTML = copy[2];
    $('start-button').innerHTML = `${icon('play',17)}<span>${copy[3]}</span>`;
    $('start-hint').textContent = game.status === 'paused' ? 'or press P to resume' : 'or press enter';
    previousStatus = game.status;
  }
  draw();
}
function selectMode(mode: Mode) {
  game.mode = mode; best = readBest(mode);
  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => { const selected = button.dataset.mode === mode; button.classList.toggle('selected',selected); button.setAttribute('aria-pressed',String(selected)); });
  $('mode-caption').textContent = {classic:'CLASSIC · ENDLESS POSSIBILITIES',sprint:'40-LINE SPRINT · MAKE EVERY SECOND COUNT',zen:'ZEN MODE · AT YOUR OWN PACE'}[mode];
}
function start() { keys.clear(); clearUntil = 0; runId = crypto.randomUUID(); game.start(); tone(440,0.1); render(); }
function pause() { keys.clear(); game.pause(); render(); }
function openDialog(dialog: HTMLDialogElement) {
  const wasPlaying = game.status === 'playing';
  if (wasPlaying) pause();
  dialog.addEventListener('close',()=>{ if (wasPlaying && game.status==='paused' && !document.hidden && document.hasFocus()) pause(); },{once:true});
  dialog.showModal();
}
function requestRestart(mode = game.mode) {
  pendingMode = mode;
  if (game.status === 'ready') { selectMode(mode); render(); return; }
  if (['over','won'].includes(game.status)) { selectMode(mode); start(); return; }
  resumeAfterDialog = game.status === 'playing';
  if (resumeAfterDialog) pause();
  $<HTMLDialogElement>('confirm-dialog').showModal();
}
$('start-button').addEventListener('click', () => { if (game.status === 'paused') pause(); else start(); $('start-button').blur(); });
$('pause-button').addEventListener('click', pause);
$('restart-button').addEventListener('click', () => requestRestart());
$('sound-button').addEventListener('click', () => { player.updateSettings({sound:!sound}); applySettings(); personalFeatures.syncSettings(); tone(440); });
document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => button.addEventListener('click', () => { if (button.dataset.mode !== game.mode) requestRestart(button.dataset.mode as Mode); }));
$('help-button').addEventListener('click', () => openDialog($<HTMLDialogElement>('help-dialog')));
$('cancel-restart').addEventListener('click', () => $<HTMLDialogElement>('confirm-dialog').close());
$('confirm-restart').addEventListener('click', () => { resumeAfterDialog = false; $<HTMLDialogElement>('confirm-dialog').close(); recordRun('restarted'); selectMode(pendingMode); start(); });
$('confirm-dialog').addEventListener('close', () => { if (resumeAfterDialog && game.status === 'paused') pause(); resumeAfterDialog = false; });
const actions: Record<string, () => void> = {left:()=>{ game.move(-1); },right:()=>{ game.move(1); },down:()=>game.softDrop(),rotate:()=>game.rotate(),drop:()=>game.hardDrop(),hold:()=>game.hold()};
function action(name: string) { actions[name]?.(); render(); }
document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => button.addEventListener('pointerdown', event => { event.preventDefault(); action(button.dataset.action!); }));
window.addEventListener('keydown', event => {
  if (document.querySelector('dialog[open]')) return;
  const code = event.code;
  if (!['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Space','KeyC','KeyZ','KeyX','KeyP','Escape','Enter'].includes(code)) return;
  if (code === 'Enter' && event.target instanceof HTMLButtonElement) return;
  event.preventDefault();
  if (event.repeat) return;
  if (code === 'Enter' && ['ready','over','won'].includes(game.status)) { start(); return; }
  if (code === 'KeyP' || code === 'Escape') { pause(); return; }
  if (game.status !== 'playing') return;
  const mapped = {ArrowLeft:'left',ArrowRight:'right',ArrowDown:'down',ArrowUp:'rotate',KeyX:'rotate',Space:'drop',KeyC:'hold'}[code];
  if (mapped) action(mapped);
  if (code === 'KeyZ') game.rotate(-1);
  if (['ArrowLeft','ArrowRight','ArrowDown'].includes(code)) keys.set(code,{elapsed:0,next:160});
});
window.addEventListener('keyup', event => keys.delete(event.code));
window.addEventListener('blur', () => { keys.clear(); if (game.status === 'playing') pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && game.status === 'playing') pause(); });
let last = performance.now();
const personalFeatures = mountPersonalFeatures({store:player,icon,openDialog,onSettingsChange:applySettings,currentMode:()=>game.mode});
applySettings();
function frame(now: number) {
  const delta = Math.min(now-last,100); last = now;
  if (game.status === 'playing') {
    for (const [code, state] of keys) {
      state.elapsed += delta;
      while (state.elapsed >= state.next) { state.next += code === 'ArrowDown' ? 35 : 55; action(code === 'ArrowLeft' ? 'left' : code === 'ArrowRight' ? 'right' : 'down'); }
    }
    game.tick(delta);
  }
  render(); requestAnimationFrame(frame);
}
render(); requestAnimationFrame(frame);

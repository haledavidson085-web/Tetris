export const COLS = 10;
export const ROWS = 20;
export const SHAPES = {
  I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  J: [[1,0,0],[1,1,1],[0,0,0]],
  L: [[0,0,1],[1,1,1],[0,0,0]],
  O: [[1,1],[1,1]],
  S: [[0,1,1],[1,1,0],[0,0,0]],
  T: [[0,1,0],[1,1,1],[0,0,0]],
  Z: [[1,1,0],[0,1,1],[0,0,0]],
};
export type Kind = keyof typeof SHAPES;
export type Mode = 'classic' | 'sprint' | 'zen';
export type Status = 'ready' | 'playing' | 'paused' | 'over' | 'won';
export type Cell = Kind | null;
export type Piece = { kind: Kind; shape: number[][]; x: number; y: number };
export const COLORS: Record<Kind, string> = {
  I: '#73b9c5', J: '#638bca', L: '#e6a45c', O: '#d9c365',
  S: '#90af83', T: '#aa91c4', Z: '#d6756a',
};
export const emptyBoard = (): Cell[][] => Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));

export class Game {
  board = emptyBoard();
  active: Piece | null = null;
  queue: Kind[] = [];
  held: Kind | null = null;
  holdUsed = false;
  score = 0;
  lines = 0;
  elapsed = 0;
  status: Status = 'ready';
  mode: Mode = 'classic';
  gravity = 0;
  lockTime = 0;
  lockResets = 0;
  lastClear = 0;
  onEvent: (event: 'move' | 'rotate' | 'drop' | 'clear' | 'over' | 'hold') => void = () => {};

  get level() { return this.mode === 'zen' ? 1 : Math.floor(this.lines / 10) + 1; }
  get interval() { return this.mode === 'zen' ? 1000 : Math.max(80, 850 * Math.pow(0.8, this.level - 1)); }

  start(mode: Mode = this.mode) {
    this.mode = mode;
    this.board = emptyBoard();
    this.queue = [];
    this.held = null;
    this.holdUsed = false;
    this.score = this.lines = this.elapsed = this.gravity = this.lockTime = this.lastClear = 0;
    this.status = 'playing';
    this.spawn();
  }

  refill() {
    while (this.queue.length < 7) {
      const bag = Object.keys(SHAPES) as Kind[];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      this.queue.push(...bag);
    }
  }

  spawn(kind?: Kind) {
    this.refill();
    const next = kind ?? this.queue.shift()!;
    const shape = SHAPES[next].map(row => [...row]);
    this.active = { kind: next, shape, x: Math.floor((COLS - shape.length) / 2), y: 0 };
    this.gravity = this.lockTime = this.lockResets = 0;
    this.refill();
    if (!this.valid(this.active)) this.finish();
  }

  valid(piece: Piece): boolean {
    return piece.shape.every((row, y) => row.every((cell, x) => !cell || (
      piece.x + x >= 0 && piece.x + x < COLS && piece.y + y < ROWS &&
      (piece.y + y < 0 || !this.board[piece.y + y][piece.x + x])
    )));
  }

  move(dx: number, dy = 0): boolean {
    if (this.status !== 'playing' || !this.active) return false;
    const next = { ...this.active, x: this.active.x + dx, y: this.active.y + dy };
    if (!this.valid(next)) return false;
    const grounded = !this.valid({ ...this.active, y: this.active.y + 1 });
    this.active = next;
    if (grounded && this.lockResets < 15) { this.lockTime = 0; this.lockResets++; }
    if (dx) this.onEvent('move');
    return true;
  }

  rotate(direction = 1) {
    if (this.status !== 'playing' || !this.active || this.active.kind === 'O') return;
    const old = this.active.shape;
    const shape = old.map((row, y) => row.map((_, x) => direction === 1 ? old[old.length - 1 - x][y] : old[x][old.length - 1 - y]));
    for (const [dx, dy] of [[0,0],[-1,0],[1,0],[-2,0],[2,0],[0,-1],[-1,-1],[1,-1],[0,-2]]) {
      const next = { ...this.active, shape, x: this.active.x + dx, y: this.active.y + dy };
      if (this.valid(next)) {
        this.active = next;
        if (this.lockResets < 15) { this.lockTime = 0; this.lockResets++; }
        this.onEvent('rotate');
        return;
      }
    }
  }

  ghost(): Piece | null {
    if (!this.active) return null;
    const ghost = { ...this.active };
    while (this.valid({ ...ghost, y: ghost.y + 1 })) ghost.y++;
    return ghost;
  }

  softDrop() { if (this.move(0, 1)) { this.score++; this.gravity = 0; } }

  hardDrop() {
    if (this.status !== 'playing' || !this.active) return;
    const ghost = this.ghost()!;
    this.score += (ghost.y - this.active.y) * 2;
    this.active = ghost;
    this.onEvent('drop');
    this.lock();
  }

  hold() {
    if (this.status !== 'playing' || !this.active || this.holdUsed) return;
    const previous = this.held;
    this.held = this.active.kind;
    this.spawn(previous ?? undefined);
    this.holdUsed = true;
    this.onEvent('hold');
  }

  lock() {
    if (!this.active) return;
    let above = false;
    this.active.shape.forEach((row, y) => row.forEach((cell, x) => {
      if (!cell) return;
      if (this.active!.y + y < 0) above = true;
      else this.board[this.active!.y + y][this.active!.x + x] = this.active!.kind;
    }));
    if (above) { this.finish(); return; }
    const remaining = this.board.filter(row => row.some(cell => !cell));
    const cleared = ROWS - remaining.length;
    this.score += [0, 100, 300, 500, 800][cleared] * this.level;
    this.lines += cleared;
    this.lastClear = cleared;
    this.board = [...Array.from({ length: cleared }, () => Array<Cell>(COLS).fill(null)), ...remaining];
    if (cleared) this.onEvent('clear');
    if (this.mode === 'sprint' && this.lines >= 40) { this.status = 'won'; this.active = null; this.onEvent('over'); return; }
    this.holdUsed = false;
    this.spawn();
  }

  finish() { this.status = 'over'; this.active = null; this.onEvent('over'); }

  pause() { if (this.status === 'playing') this.status = 'paused'; else if (this.status === 'paused') this.status = 'playing'; }

  tick(delta: number) {
    if (this.status !== 'playing' || !this.active) return;
    this.elapsed += delta;
    this.gravity += delta;
    while (this.gravity >= this.interval) { this.gravity -= this.interval; if (!this.move(0, 1)) break; }
    if (!this.valid({ ...this.active, y: this.active.y + 1 })) {
      this.lockTime += delta;
      if (this.lockTime >= 500) this.lock();
    } else this.lockTime = 0;
  }
}

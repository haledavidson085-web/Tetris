import { describe, expect, test } from 'bun:test';
import { Game, ROWS, SHAPES, type Kind } from '../src/game';

describe('Tetris rules', () => {
  test('each bag contains all seven pieces', () => {
    const game = new Game(); game.refill();
    expect(new Set(game.queue.slice(0, 7)).size).toBe(7);
  });

  test('pieces cannot move outside the board or through a stack', () => {
    const game = new Game(); game.start(); game.spawn('O');
    for (let i = 0; i < 15; i++) game.move(-1);
    expect(game.active!.x).toBe(0);
    game.board[2][0] = 'I';
    expect(game.move(0, 1)).toBe(false);
  });

  test('hard drop locks at the ghost position and awards drop points', () => {
    const game = new Game(); game.start(); game.spawn('O');
    const ghost = game.ghost()!;
    game.hardDrop();
    expect(game.board[ghost.y][ghost.x]).toBe('O');
    expect(game.board.flat().filter(Boolean).length).toBe(4);
    expect(game.score).toBe(36);
  });

  test('clears four lines together and scores before leveling up', () => {
    const game = new Game(); game.start(); game.lines = 6;
    for (let y = ROWS - 4; y < ROWS; y++) game.board[y] = Array.from({length:10}, (_,x) => x === 4 ? null : 'J');
    game.active = {kind:'I', shape:[[1],[1],[1],[1]], x:4, y:16};
    game.lock();
    expect(game.lines).toBe(10);
    expect(game.level).toBe(2);
    expect(game.score).toBe(800);
    expect(game.board.flat().every(cell => cell === null)).toBe(true);
  });

  test('hold is limited to once per piece and resets after locking', () => {
    const game = new Game(); game.start();
    const original = game.active!.kind;
    game.hold();
    expect(game.held).toBe(original);
    const next = game.active;
    game.hold(); expect(game.active).toBe(next);
    game.hardDrop(); game.hold();
    expect(game.active!.kind).toBe(original);
    expect(game.holdUsed).toBe(true);
  });

  test('pause freezes the clock and blocks player actions', () => {
    const game = new Game(); game.start(); game.pause();
    const piece = JSON.stringify(game.active);
    game.tick(1000); game.move(1); game.hardDrop(); game.hold(); game.rotate();
    expect(game.elapsed).toBe(0);
    expect(JSON.stringify(game.active)).toBe(piece);
    expect(game.board.flat().filter(Boolean)).toHaveLength(0);
    game.pause(); game.tick(100);
    expect(game.elapsed).toBe(100);
  });

  test('a blocked spawn ends the game', () => {
    const game = new Game(); game.start();
    game.board[0] = Array<Kind>(10).fill('T'); game.spawn('O');
    expect(game.status).toBe('over');
  });

  test('sprint finishes at 40 cleared lines', () => {
    const game = new Game(); game.start('sprint'); game.lines = 39;
    game.board[19] = Array.from({length:10}, (_,x) => x < 2 ? null : 'J');
    game.active = {kind:'O',shape:SHAPES.O,x:0,y:18}; game.lock();
    expect(game.status).toBe('won'); expect(game.lines).toBe(40);
  });

  test('zen keeps a constant speed and restarting resets a run', () => {
    const game = new Game(); game.start('zen'); const speed = game.interval;
    game.lines = 100; expect(game.interval).toBe(speed); expect(game.level).toBe(1);
    game.score = 400; game.hold(); game.start('classic');
    expect(game.score).toBe(0); expect(game.held).toBeNull(); expect(game.lines).toBe(0);
  });

  test('a grounded piece gets a short lock delay', () => {
    const game = new Game(); game.start(); game.spawn('O'); game.active!.y = 18;
    game.tick(499); expect(game.board.flat().filter(Boolean)).toHaveLength(0);
    game.tick(1); expect(game.board.flat().filter(Boolean)).toHaveLength(4);
  });
});

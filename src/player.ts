import { COLORS, type Kind, type Mode } from './game';

export const THEMES = {
  studio: { name: 'Studio', description: 'Soft colors. Familiar flow.', background: '#232a2b', frame: '#35403a', grid: '#ffffff09', colors: COLORS },
  midnight: { name: 'Midnight', description: 'Cool tones after hours.', background: '#141c32', frame: '#293751', grid: '#93b9ff12', colors: { I:'#7dd3fc',J:'#818cf8',L:'#fbbf83',O:'#f6db83',S:'#6ed9bd',T:'#c4a1f5',Z:'#f39aaa' } },
  forest: { name: 'Forest', description: 'A little closer to nature.', background: '#182c24', frame: '#385445', grid: '#b0dcaf10', colors: { I:'#84bfb4',J:'#779fbe',L:'#d59a62',O:'#dbc37b',S:'#99bf74',T:'#b29abf',Z:'#ce8476' } },
  arcade: { name: 'Arcade', description: 'Turn up the nostalgia.', background: '#21152e', frame: '#4b3260', grid: '#ed9dff14', colors: { I:'#43dbea',J:'#7199ff',L:'#ffaa53',O:'#ffe76b',S:'#94e574',T:'#d189f9',Z:'#ff7c9d' } },
} satisfies Record<string, { name: string; description: string; background: string; frame: string; grid: string; colors: Record<Kind,string> }>;
export type Theme = keyof typeof THEMES;
export const MODES: Mode[] = ['classic', 'sprint', 'zen'];
export const MODE_NAMES: Record<Mode,string> = { classic:'Classic', sprint:'40-line Sprint', zen:'Zen' };
export const AVATARS: Kind[] = ['T','I','L','S','O','J','Z'];
export type Settings = { theme: Theme; sound: boolean; volume: number; ghost: boolean; grid: boolean; flat: boolean };
export const DEFAULT_SETTINGS: Settings = { theme:'studio', sound:false, volume:50, ghost:true, grid:true, flat:false };
export type Run = { id: string; mode: Mode; score: number; lines: number; level: number; elapsed: number; endedAt: number; result: 'over' | 'won' | 'restarted' };
export type PlayerData = {
  version: 1;
  profile: { name: string; avatar: Kind; joinedAt: number };
  settings: Settings;
  bests: Record<Mode,number>;
  scores: Record<Mode,Run[]>;
  recent: Run[];
  totals: { runs: number; lines: number; elapsed: number; wins: number };
};
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
export const STORAGE_KEY = 'tetris-player-v1';
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const number = (value: unknown, fallback = 0) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER ? value : fallback;
const choice = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T => allowed.includes(value as T) ? value as T : fallback;
const defaultData = (): PlayerData => ({ version:1, profile:{name:'Player one',avatar:'T',joinedAt:Date.now()}, settings:{...DEFAULT_SETTINGS}, bests:{classic:0,sprint:0,zen:0}, scores:{classic:[],sprint:[],zen:[]}, recent:[], totals:{runs:0,lines:0,elapsed:0,wins:0} });

function parseRun(value: unknown): Run | null {
  const run = object(value);
  if (typeof run.id !== 'string' || !run.id || run.id.length > 100 || !MODES.includes(run.mode as Mode) || !['over','won','restarted'].includes(String(run.result))) return null;
  for (const key of ['score','lines','level','elapsed','endedAt']) if (number(run[key],-1) < 0) return null;
  if (run.result === 'won' && (run.mode !== 'sprint' || Number(run.lines) < 40)) return null;
  if (Number(run.endedAt) > 8.64e15) return null;
  return {id:run.id,mode:run.mode as Mode,score:number(run.score),lines:number(run.lines),level:number(run.level),elapsed:number(run.elapsed),endedAt:number(run.endedAt),result:run.result as Run['result']};
}

export function rankRuns(runs: Run[], mode: Mode): Run[] {
  return runs.filter(run => run.mode === mode && (mode !== 'sprint' || run.result === 'won'))
    .sort((a,b) => (mode === 'sprint' ? a.elapsed-b.elapsed || b.score-a.score : b.score-a.score || b.lines-a.lines) || b.endedAt-a.endedAt).slice(0,10);
}

export function normalizeData(value: unknown): PlayerData {
  const data = defaultData();
  const source = object(value), profile = object(source.profile), settings = object(source.settings);
  if (typeof profile.name === 'string' && profile.name.trim()) data.profile.name = profile.name.trim().slice(0,24);
  data.profile.avatar = choice(profile.avatar, AVATARS, 'T');
  data.profile.joinedAt = Math.min(number(profile.joinedAt,Date.now()),Date.now());
  data.settings.theme = choice(settings.theme, Object.keys(THEMES) as Theme[], 'studio');
  for (const key of ['sound','ghost','grid','flat'] as const) if (typeof settings[key] === 'boolean') data.settings[key] = settings[key];
  data.settings.volume = Math.min(100,number(settings.volume,50));
  const parseList = (items: unknown) => Array.isArray(items) ? items.map(parseRun).filter((run): run is Run => !!run) : [];
  data.recent = parseList(source.recent).sort((a,b)=>b.endedAt-a.endedAt).slice(0,20);
  for (const mode of MODES) {
    const runs = [...parseList(object(source.scores)[mode]),...data.recent];
    data.scores[mode] = rankRuns([...new Map(runs.map(run=>[run.id,run])).values()],mode);
    data.bests[mode] = Math.max(number(object(source.bests)[mode]),...runs.filter(run=>run.mode===mode).map(run=>run.score));
  }
  for (const key of ['runs','lines','elapsed','wins'] as const) data.totals[key] = number(object(source.totals)[key]);
  return data;
}

export class PlayerStore {
  data = defaultData();
  storageAvailable = true;
  constructor(private storage: StorageLike | null) {
    try {
      if (!storage) throw new Error('Storage unavailable');
      const saved = storage.getItem(STORAGE_KEY);
      if (saved) {
        try { this.data = normalizeData(JSON.parse(saved)); } catch { /* Recover from a malformed saved file. */ }
      }
      // Preserve personal bests from versions that did not store individual runs.
      for (const mode of MODES) this.data.bests[mode] = Math.max(this.data.bests[mode], number(Number(storage.getItem(`tetris-best-${mode}`))));
    } catch { this.storageAvailable = false; }
  }
  persist() {
    try { if (!this.storage) throw new Error('Storage unavailable'); this.storage.setItem(STORAGE_KEY,JSON.stringify(this.data)); this.storageAvailable = true; }
    catch { this.storageAvailable = false; }
    return this.storageAvailable;
  }
  updateSettings(update: Partial<Settings>) { this.data.settings = normalizeData({settings:{...this.data.settings,...update}}).settings; return this.persist(); }
  updateProfile(name: string, avatar: Kind) {
    this.data.profile.name = name.trim().slice(0,24) || 'Player one';
    this.data.profile.avatar = choice(avatar,AVATARS,'T');
    return this.persist();
  }
  updateBest(mode: Mode, score: number) { if (score > this.data.bests[mode]) { this.data.bests[mode] = score; this.persist(); } }
  record(run: Run) {
    if (!parseRun(run) || this.data.recent.some(previous=>previous.id===run.id)) return false;
    this.data.recent = [run,...this.data.recent].slice(0,20);
    this.data.scores[run.mode] = rankRuns([...this.data.scores[run.mode],run],run.mode);
    this.data.bests[run.mode] = Math.max(this.data.bests[run.mode],run.score);
    this.data.totals.runs++;
    this.data.totals.lines += run.lines;
    this.data.totals.elapsed += run.elapsed;
    if (run.result === 'won') this.data.totals.wins++;
    this.persist();
    return true;
  }
}

export function formatTime(ms: number, precise = false) {
  const seconds = Math.floor(ms/1000);
  return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}${precise ? `.${String(Math.floor(ms%1000/10)).padStart(2,'0')}` : ''}`;
}

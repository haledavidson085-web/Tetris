import { describe, expect, test } from 'bun:test';
import { PlayerStore, STORAGE_KEY, normalizeData, rankRuns, DEFAULT_SETTINGS, type Run } from '../src/player';

function memoryStorage(initial: Record<string,string> = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem:(key:string)=>values.get(key)??null, setItem:(key:string,value:string)=>{ values.set(key,value); } };
}
const run = (id: string, overrides: Partial<Run> = {}): Run => ({id,mode:'classic',score:100,lines:1,level:1,elapsed:5000,endedAt:Date.now(),result:'over',...overrides});

describe('Player profile and saved records',()=>{
  test('migrates previous bests without inventing run history',()=>{
    const storage = memoryStorage({'tetris-best-classic':'5000','tetris-best-sprint':'Infinity','tetris-best-zen':'200'});
    const player = new PlayerStore(storage);
    expect(player.data.bests).toEqual({classic:5000,sprint:0,zen:200});
    expect(player.data.recent).toHaveLength(0);
    expect(player.data.totals.runs).toBe(0);
    player.persist();
    expect(new PlayerStore(storage).data.bests.classic).toBe(5000);
  });

  test('profile and preferences survive a reload',()=>{
    const storage = memoryStorage(); const player = new PlayerStore(storage);
    player.updateProfile('  Block explorer  ','L');
    player.updateSettings({theme:'midnight',ghost:false,grid:false,sound:true,volume:25,flat:true});
    const restored = new PlayerStore(storage);
    expect(restored.data.profile.name).toBe('Block explorer');
    expect(restored.data.profile.avatar).toBe('L');
    expect(restored.data.settings).toEqual({theme:'midnight',ghost:false,grid:false,sound:true,volume:25,flat:true});
    expect(restored.data.profile.joinedAt).toBe(player.data.profile.joinedAt);
  });

  test('records one run once and keeps modes separate',()=>{
    const player = new PlayerStore(memoryStorage()); const completed = run('one');
    expect(player.record(completed)).toBe(true);
    expect(player.record(completed)).toBe(false);
    player.record(run('two',{mode:'zen',score:900,lines:8,result:'restarted'}));
    expect(player.data.totals).toEqual({runs:2,lines:9,elapsed:10000,wins:0});
    expect(player.data.scores.classic[0].score).toBe(100);
    expect(player.data.scores.zen[0].score).toBe(900);
    expect(player.data.bests.classic).toBe(100);
  });

  test('Sprint ranks only completed runs, by time before score',()=>{
    const slow = run('slow',{mode:'sprint',result:'won',lines:40,elapsed:80000,score:8000});
    const fast = run('fast',{mode:'sprint',result:'won',lines:40,elapsed:60000,score:4000});
    const unfinished = run('unfinished',{mode:'sprint',elapsed:1000,score:9000});
    expect(rankRuns([slow,unfinished,fast],'sprint').map(run=>run.id)).toEqual(['fast','slow']);
    const player = new PlayerStore(memoryStorage());
    for (const item of [slow,fast,unfinished]) player.record(item);
    expect(player.data.totals.wins).toBe(2);
    expect(player.data.recent).toHaveLength(3);
    expect(player.data.scores.sprint).toHaveLength(2);
  });

  test('keeps top scores and lifetime totals after recent history rolls over',()=>{
    const storage = memoryStorage(); const player = new PlayerStore(storage);
    player.record(run('best',{score:10000}));
    for(let i=0;i<30;i++) player.record(run(String(i),{score:i+1}));
    const restored = new PlayerStore(storage);
    expect(restored.data.recent).toHaveLength(20);
    expect(restored.data.scores.classic).toHaveLength(10);
    expect(restored.data.scores.classic[0].id).toBe('best');
    expect(restored.data.totals.runs).toBe(31);
  });

  test('malformed saved data recovers safely and invalid settings are normalized',()=>{
    const player = new PlayerStore(memoryStorage({[STORAGE_KEY]:'{broken'}));
    expect(player.data.settings).toEqual(DEFAULT_SETTINGS);
    const data = normalizeData({profile:{name:' ',avatar:'<script>'},settings:{theme:'__proto__',volume:1000,ghost:'false'},recent:[{},run('fake',{score:-1})],bests:{classic:-5}});
    expect(data.settings.theme).toBe('studio');
    expect(data.settings.volume).toBe(100);
    expect(data.settings.ghost).toBe(true);
    expect(data.profile.avatar).toBe('T');
    expect(data.recent).toHaveLength(0);
    expect(data.bests.classic).toBe(0);
  });

  test('blocked or full storage retains a playable in-memory session',()=>{
    const player = new PlayerStore({getItem:()=>null,setItem:()=>{throw new Error('Quota exceeded');}});
    expect(player.updateProfile('Still playing','S')).toBe(false);
    expect(player.storageAvailable).toBe(false);
    expect(player.data.profile.name).toBe('Still playing');
    player.record(run('one')); expect(player.data.totals.runs).toBe(1);
    const blocked = new PlayerStore(null);
    expect(blocked.updateSettings({theme:'forest'})).toBe(false);
    expect(blocked.data.settings.theme).toBe('forest');
  });
});

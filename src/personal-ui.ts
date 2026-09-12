import { SHAPES, type Kind, type Mode } from './game';
import { AVATARS, DEFAULT_SETTINGS, MODE_NAMES, MODES, THEMES, formatTime, type PlayerStore, type Settings, type Theme } from './player';

type Options = { store: PlayerStore; icon: (name: string, size?: number) => string; openDialog: (dialog: HTMLDialogElement) => void; onSettingsChange: () => void; currentMode: () => Mode; };
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const avatar = (kind: Kind) => `<span class="player-avatar" aria-hidden="true"><span style="grid-template-columns:repeat(${SHAPES[kind][0].length},7px);--avatar-color:${THEMES.studio.colors[kind]}">${SHAPES[kind].filter(row=>row.some(Boolean)).flat().map(cell=>`<i class="${cell?'filled':''}"></i>`).join('')}</span></span>`;
const date = (time: number) => new Date(time).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
const resultName = { over:'Game over', won:'Finished', restarted:'Restarted' };

export function mountPersonalFeatures({store,icon,openDialog,onSettingsChange,currentMode}: Options) {
  let draftAvatar = store.data.profile.avatar;
  let scoreMode: Mode = 'classic';
  const closeButton = (name: string) => `<form method="dialog"><button class="btn btn-ghost btn-square btn-sm close-panel" aria-label="Close ${name}">×</button></form>`;
  document.body.insertAdjacentHTML('beforeend', `
    <dialog class="modal personal-modal" id="profile-dialog" aria-labelledby="profile-title"><div class="modal-box">
      ${closeButton('profile')}<div class="eyebrow">YOUR CORNER OF THE ARCADE</div><h2 id="profile-title">Make it yours.</h2><p>A familiar face. A new personal best.</p>
      <div class="profile-identity"><div id="profile-avatar-preview"></div><div><strong id="profile-display-name"></strong><span id="profile-joined"></span></div></div>
      <form id="profile-form"><label class="field-label" for="player-name">DISPLAY NAME</label><input class="input w-full" id="player-name" name="displayName" maxlength="24" required autocomplete="nickname" aria-describedby="name-hint"/><span id="name-hint" class="field-hint">Up to 24 characters. Just for this browser.</span>
        <fieldset class="avatar-field"><legend class="field-label">PICK YOUR PIECE</legend><div class="avatar-options">${AVATARS.map(kind=>`<button type="button" class="avatar-option" data-avatar="${kind}" aria-label="${kind} piece avatar" aria-pressed="false">${avatar(kind)}</button>`).join('')}</div></fieldset>
        <div class="profile-numbers"><div><strong id="profile-runs">0</strong><span>Runs played</span></div><div><strong id="profile-lines">0</strong><span>Lines cleared</span></div><div><strong id="profile-time">0m</strong><span>Time in the flow</span></div></div>
        <p class="profile-stats-note" id="profile-stats-note"></p><div class="panel-bottom"><span id="profile-feedback" role="status"></span><button class="btn" type="submit">Save profile ${icon('arrow',16)}</button></div>
      </form><p class="local-note">${icon('shield',14)} Your profile and records stay in this browser.</p>
    </div><form method="dialog" class="modal-backdrop"><button>Close profile</button></form></dialog>
    <dialog class="modal personal-modal" id="scores-dialog" aria-labelledby="scores-title"><div class="modal-box scores-box">
      ${closeButton('high scores')}<div class="eyebrow">A LITTLE BETTER, EVERY TIME</div><h2 id="scores-title">Your high scores.</h2><p>Good runs deserve a place to stay.</p>
      <div class="score-filters" aria-label="High score mode">${MODES.map(mode=>`<button class="btn" data-score-mode="${mode}" aria-pressed="false">${MODE_NAMES[mode]}</button>`).join('')}</div>
      <div class="best-run"><span class="best-run-icon">${icon('trophy',24)}</span><div><span id="record-label"></span><strong id="record-value"></strong></div><span id="record-detail"></span></div>
      <p class="ranking-note" id="ranking-note"></p><div id="rankings"></div>
      <section class="recent-section"><h3 class="field-label">RECENT RUNS <span>LAST 5</span></h3><div id="recent-runs"></div></section>
      <p class="local-note">${icon('shield',14)} Personal records on this device. Your top 10 per mode are kept.</p>
    </div><form method="dialog" class="modal-backdrop"><button>Close high scores</button></form></dialog>
    <dialog class="modal personal-modal" id="settings-dialog" aria-labelledby="settings-title"><div class="modal-box settings-box">
      ${closeButton('settings')}<div class="eyebrow">SET THE MOOD</div><h2 id="settings-title">Your kind of flow.</h2><p>Fine-tune your board. Settle into your game.</p>
      <h3 class="field-label">BOARD THEME</h3><div class="theme-options">${Object.entries(THEMES).map(([id,theme])=>`<button class="theme-option" data-board-theme="${id}" aria-pressed="false"><span class="theme-sample" style="--sample-bg:${theme.background};--sample-frame:${theme.frame};--sample-grid:${theme.grid}"><span class="sample-blocks">${(['T','T','I','I','T','O','O','I','L','O','O','S'] as Kind[]).map((kind,i)=>`<i style="background:${theme.colors[kind]};${i===0?'opacity:0':''}"></i>`).join('')}</span><span class="theme-check">✓</span></span><strong>${theme.name}</strong><small>${theme.description}</small></button>`).join('')}</div>
      <h3 class="field-label settings-section-label">ON THE BOARD</h3>
      <label class="setting-row" for="setting-ghost"><span><strong>Ghost piece</strong><small>See where your next piece will land.</small></span><input id="setting-ghost" type="checkbox" class="toggle toggle-sm"/></label>
      <label class="setting-row" for="setting-grid"><span><strong>Board grid</strong><small>A little guidance between the blocks.</small></span><input id="setting-grid" type="checkbox" class="toggle toggle-sm"/></label>
      <label class="setting-row" for="setting-flat"><span><strong>Flat blocks</strong><small>A clean look without the beveled edges.</small></span><input id="setting-flat" type="checkbox" class="toggle toggle-sm"/></label>
      <h3 class="field-label settings-section-label">SOUND & RHYTHM</h3>
      <label class="setting-row" for="setting-sound"><span><strong>Sound effects</strong><small>Soft notes for every move and clear.</small></span><input id="setting-sound" type="checkbox" class="toggle toggle-sm"/></label>
      <div class="volume-row"><label for="setting-volume">Volume</label><input id="setting-volume" type="range" class="range range-xs" min="0" max="100" step="5"/><output id="volume-value" for="setting-volume"></output></div>
      <div class="panel-bottom settings-bottom"><span id="settings-feedback" role="status">Changes save automatically.</span><div class="settings-actions"><button class="btn btn-ghost btn-sm" id="reset-settings">Reset settings</button><form method="dialog"><button class="btn btn-sm">Done ${icon('arrow',15)}</button></form></div></div>
    </div><form method="dialog" class="modal-backdrop"><button>Close settings</button></form></dialog>
  `);

  function storageMessage() { return store.storageAvailable ? '' : 'Browser storage is unavailable. Changes last for this session only.'; }
  function updateHeader() {
    $('profile-button-avatar').innerHTML = avatar(store.data.profile.avatar);
    $('profile-button-name').textContent = store.data.profile.name;
    $('profile-button').setAttribute('aria-label',`Profile: ${store.data.profile.name}`);
  }
  function updateAvatar() {
    $('profile-avatar-preview').innerHTML = avatar(draftAvatar);
    document.querySelectorAll<HTMLButtonElement>('[data-avatar]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.avatar===draftAvatar)));
  }
  function renderProfile() {
    const {profile,totals} = store.data;
    draftAvatar = profile.avatar; updateAvatar();
    $('profile-display-name').textContent = profile.name;
    $('profile-joined').textContent = `Playing since ${date(profile.joinedAt)}`;
    $<HTMLInputElement>('player-name').value = profile.name;
    $<HTMLInputElement>('player-name').setCustomValidity('');
    $('profile-runs').textContent = totals.runs.toLocaleString();
    $('profile-lines').textContent = totals.lines.toLocaleString();
    const minutes = Math.floor(totals.elapsed/60000);
    $('profile-time').textContent = minutes >= 60 ? `${Math.floor(minutes/60)}h ${minutes%60}m` : `${minutes}m`;
    $('profile-stats-note').textContent = `${totals.wins} Sprint${totals.wins===1?'':'s'} finished. Stats update when a run ends or is restarted.`;
    $('profile-feedback').textContent = storageMessage();
  }
  function renderScores() {
    const {scores,bests,recent} = store.data;
    const ranked = scores[scoreMode];
    document.querySelectorAll<HTMLButtonElement>('[data-score-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.scoreMode===scoreMode)));
    $('record-label').textContent = scoreMode==='sprint' ? 'FASTEST FINISH' : 'PERSONAL BEST';
    $('record-value').textContent = scoreMode==='sprint' ? (ranked[0] ? formatTime(ranked[0].elapsed,true) : '—') : bests[scoreMode].toLocaleString();
    $('record-detail').textContent = scoreMode==='sprint' ? '40 lines. One great run.' : `${MODE_NAMES[scoreMode]} · points`;
    $('ranking-note').textContent = scoreMode==='sprint' ? 'Fastest completed 40-line runs first. Unfinished runs appear in recent history.' : 'Highest scores first. Restarted runs count too. Earlier personal bests are preserved above.';
    $('rankings').innerHTML = ranked.length ? `<div class="overflow-x-auto score-table-wrap" tabindex="0" aria-label="High scores table"><table class="table table-sm"><thead><tr><th scope="col">#</th><th scope="col">${scoreMode==='sprint'?'Time':'Score'}</th><th scope="col">Lines</th><th scope="col">${scoreMode==='sprint'?'Score':'Time'}</th><th scope="col">Date</th></tr></thead><tbody>${ranked.map((run,i)=>`<tr><td><span class="rank-number ${i===0?'first':''}">${String(i+1).padStart(2,'0')}</span></td><td class="rank-value">${scoreMode==='sprint'?formatTime(run.elapsed,true):run.score.toLocaleString()}</td><td>${run.lines}</td><td>${scoreMode==='sprint'?run.score.toLocaleString():formatTime(run.elapsed)}</td><td>${date(run.endedAt)}</td></tr>`).join('')}</tbody></table></div>` : `<div class="scores-empty">${icon(scoreMode==='sprint'?'clock':'trophy',28)}<strong>${scoreMode==='sprint'?'The finish line is waiting.':'Your next run belongs here.'}</strong><span>${scoreMode==='sprint'?'Finish a 40-line Sprint to set your first time.':'Play a round to start your score collection.'}</span></div>`;
    const filtered = recent.filter(run=>run.mode===scoreMode).slice(0,5);
    $('recent-runs').innerHTML = filtered.length ? filtered.map(run=>`<div class="recent-run"><span>${icon(run.result==='won'?'trophy':'clock',17)}</span><div><strong>${run.score.toLocaleString()} points <span>· ${run.lines} lines</span></strong><small>${date(run.endedAt)} · ${formatTime(run.elapsed)}</small></div><span class="run-result">${resultName[run.result]}</span></div>`).join('') : '<p class="no-recent">No runs in this mode yet. Take your time.</p>';
  }
  function syncSettings() {
    const settings = store.data.settings;
    document.querySelectorAll<HTMLButtonElement>('[data-board-theme]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.boardTheme===settings.theme)));
    for (const key of ['ghost','grid','flat','sound'] as const) $<HTMLInputElement>(`setting-${key}`).checked = settings[key];
    $<HTMLInputElement>('setting-volume').value = String(settings.volume);
    $('volume-value').textContent = `${settings.volume}%`;
    $('settings-feedback').textContent = storageMessage() || 'Changes save automatically.';
  }
  function changeSettings(update: Partial<Settings>) {
    store.updateSettings(update); syncSettings(); onSettingsChange();
  }
  $('profile-button').addEventListener('click',()=>{ renderProfile(); openDialog($<HTMLDialogElement>('profile-dialog')); });
  $('scores-button').addEventListener('click',()=>{ scoreMode=currentMode(); renderScores(); openDialog($<HTMLDialogElement>('scores-dialog')); });
  $('settings-button').addEventListener('click',()=>{ syncSettings(); openDialog($<HTMLDialogElement>('settings-dialog')); });
  document.querySelectorAll<HTMLButtonElement>('[data-avatar]').forEach(button=>button.addEventListener('click',()=>{ draftAvatar=button.dataset.avatar as Kind; updateAvatar(); }));
  $('player-name').addEventListener('input',()=>{ $<HTMLInputElement>('player-name').setCustomValidity(''); $('profile-feedback').textContent=''; });
  $('profile-form').addEventListener('submit',event=>{
    event.preventDefault();
    const input = $<HTMLInputElement>('player-name');
    if (!input.value.trim()) { input.setCustomValidity('Choose a name with at least one visible character.'); input.reportValidity(); return; }
    store.updateProfile(input.value,draftAvatar); updateHeader(); renderProfile();
    $('profile-feedback').textContent=storageMessage() || 'Profile saved. Looking good.';
  });
  document.querySelectorAll<HTMLButtonElement>('[data-score-mode]').forEach(button=>button.addEventListener('click',()=>{ scoreMode=button.dataset.scoreMode as Mode; renderScores(); }));
  document.querySelectorAll<HTMLButtonElement>('[data-board-theme]').forEach(button=>button.addEventListener('click',()=>changeSettings({theme:button.dataset.boardTheme as Theme})));
  for (const key of ['ghost','grid','flat','sound'] as const) $(`setting-${key}`).addEventListener('change',()=>changeSettings({[key]:$<HTMLInputElement>(`setting-${key}`).checked}));
  $('setting-volume').addEventListener('input',()=>changeSettings({volume:Number($<HTMLInputElement>('setting-volume').value)}));
  $('reset-settings').addEventListener('click',()=>{ changeSettings({...DEFAULT_SETTINGS}); $('settings-feedback').textContent=storageMessage() || 'Default settings restored.'; });
  updateHeader(); syncSettings();
  return { syncSettings };
}

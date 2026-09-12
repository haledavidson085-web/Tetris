import { registerSW } from 'virtual:pwa-register';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function mountPwa(icon: (name: string, size?: number) => string) {
  const installButton = document.getElementById('install-button') as HTMLButtonElement;
  let installPrompt: InstallPromptEvent | null = null;
  let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | undefined;

  const dismiss = () => document.getElementById('pwa-toast')?.remove();
  const showToast = (title: string, message: string, action?: { label: string; run: () => void }) => {
    dismiss();
    const wrapper = document.createElement('div');
    wrapper.id = 'pwa-toast';
    wrapper.className = 'toast toast-end toast-bottom pwa-toast';
    wrapper.setAttribute('role', 'status');
    wrapper.innerHTML = `<div class="pwa-notice"><span class="pwa-notice-icon">${icon(action ? 'download' : 'spark',18)}</span><div><strong></strong><span></span></div>${action ? '<button class="btn btn-sm"></button>' : ''}<button class="btn btn-ghost btn-square btn-sm pwa-dismiss" aria-label="Dismiss">×</button></div>`;
    wrapper.querySelector('strong')!.textContent = title;
    wrapper.querySelector<HTMLSpanElement>('.pwa-notice > div > span')!.textContent = message;
    const actionButton = wrapper.querySelector<HTMLButtonElement>('.pwa-notice > .btn:not(.pwa-dismiss)');
    if (action && actionButton) { actionButton.textContent = action.label; actionButton.addEventListener('click', action.run); }
    wrapper.querySelector<HTMLButtonElement>('.pwa-dismiss')!.addEventListener('click', dismiss);
    document.body.append(wrapper);
    if (!action) window.setTimeout(dismiss, 4500);
  };

  updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      showToast('A fresh version is ready.', 'Refresh when you finish your current run.', { label: 'Update', run: () => void updateServiceWorker?.(true) });
    },
    onOfflineReady() { showToast('Ready for offline play.', 'Tetris is now available without a connection.'); },
    onRegisterError(error) { console.error('Service worker registration failed:', error); },
  });

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event as InstallPromptEvent;
    installButton.hidden = false;
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    installButton.hidden = true;
    showToast('Tetris installed.', 'Your next game is one tap away.');
  });
  installButton.addEventListener('click', async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') installButton.hidden = true;
    installPrompt = null;
  });
  if (window.matchMedia('(display-mode: standalone)').matches) installButton.hidden = true;
}

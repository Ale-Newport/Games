import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { PlatformProvider, ToastBus, type Platform } from './app/platform';
import { AudioEngine } from './core/audio/audio-engine';
import { openDefaultStore } from './core/persistence/kv-store';
import { ProfileStore } from './core/profiles/profile-store';
import { SettingsStore } from './core/settings/settings';
import './styles/global.css';

async function boot() {
  const kv = await openDefaultStore();
  const platform: Platform = {
    kv,
    settings: new SettingsStore(),
    profiles: await ProfileStore.open(kv),
    audio: new AudioEngine(),
    toasts: new ToastBus(),
  };
  const root = document.getElementById('root');
  if (!root) throw new Error('#root missing');
  createRoot(root).render(
    <StrictMode>
      <PlatformProvider platform={platform}>
        <App />
      </PlatformProvider>
    </StrictMode>,
  );
}

void boot();

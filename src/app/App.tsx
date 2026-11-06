import { useEffect, useMemo } from 'react';
import { AppShell } from './layout/AppShell';
import { AiLabPage } from './pages/AiLabPage';
import { GamePage } from './pages/GamePage';
import { HomePage } from './pages/HomePage';
import { LibraryPage } from './pages/LibraryPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProfilePage } from './pages/ProfilePage';
import { RoadmapPage } from './pages/RoadmapPage';
import { SettingsPage } from './pages/SettingsPage';
import { useT } from './platform';
import { useRoute } from './router';

export function App() {
  const route = useRoute();
  const t = useT();
  const [first, second] = route.segments;
  const routeKey = route.path;
  const launchParams = useMemo(() => Object.fromEntries(route.query.entries()), [route.query]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (first !== 'game') document.title = t('brand.name');
  }, [routeKey, first, t]);

  let page;
  if (!first) page = <HomePage />;
  else if (first === 'library') page = <LibraryPage route={route} />;
  else if (first === 'game' && second)
    page = <GamePage gameId={second} launchParams={launchParams} />;
  else if (first === 'ai-lab') page = <AiLabPage />;
  else if (first === 'profile') page = <ProfilePage />;
  else if (first === 'settings') page = <SettingsPage />;
  else if (first === 'roadmap') page = <RoadmapPage />;
  else page = <NotFoundPage />;

  return (
    <AppShell route={route} immersive={first === 'game'}>
      {page}
    </AppShell>
  );
}

import { Footer, Header } from './components/Layout';
import { Toasts } from './components/ui';
import { useCatalogApp } from './hooks/useCatalogApp';
import { AdminView } from './views/AdminView';
import { CatalogView } from './views/CatalogView';
import { HomeView } from './views/HomeView';
import { MerchantView } from './views/MerchantView';

export default function App() {
  const app = useCatalogApp();

  return (
    <div className="flex min-h-dvh flex-col bg-ink-50 text-ink-900 antialiased">
      <Header app={app} />
      <div className="flex-1">
        {app.activePanel === 'home' && <HomeView app={app} />}
        {app.activePanel === 'catalog' && <CatalogView app={app} />}
        {app.activePanel === 'merchant' && <MerchantView app={app} />}
        {app.activePanel === 'admin' && <AdminView app={app} />}
      </div>
      {app.activePanel !== 'catalog' && <Footer />}
      <Toasts toasts={app.toasts} />
    </div>
  );
}

import { Outlet } from 'react-router-dom';
import { PublicHeader } from '../components/public/PublicHeader';
import { PublicFooter } from '../components/public/PublicFooter';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
      <PublicHeader />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}

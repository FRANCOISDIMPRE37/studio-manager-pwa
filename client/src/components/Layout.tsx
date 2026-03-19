/*
 * DESIGN: Studio Nocturne — Sidebar gauche fixe, fond bleu nuit #0A1628
 * Navigation iconographique + labels, accent cyan sur élément actif
 */
import { Link, useLocation } from 'wouter';
import { useApp } from '@/lib/app-context';
import {
  LayoutDashboard, Users, Calendar, FileText, Settings,
  LogOut, Shield, AlertTriangle, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
  { path: '/clients', icon: Users, label: 'Clients' },
  { path: '/agenda', icon: Calendar, label: 'Agenda' },
  { path: '/documents', icon: FileText, label: 'Documents' },
  { path: '/parametres', icon: Settings, label: 'Paramètres' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { state, getDashboardStats, setAuthenticated } = useApp();
  const stats = getDashboardStats();

  const handleLogout = () => {
    setAuthenticated(false);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--brand-navy)' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col w-16 md:w-56 flex-shrink-0 border-r"
        style={{
          background: 'linear-gradient(180deg, #0A1628 0%, #0D1E38 100%)',
          borderColor: 'var(--brand-border)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 py-4 border-b" style={{ borderColor: 'var(--brand-border)' }}>
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/logo_white_d12a3c81.svg"
            alt="Intemporelle"
            className="w-8 h-8 flex-shrink-0"
          />
          <div className="hidden md:block min-w-0">
            <p className="text-xs font-700 text-white leading-tight truncate" style={{ fontFamily: 'Outfit', fontWeight: 700 }}>
              Studio Manager
            </p>
            <p className="text-xs leading-tight truncate" style={{ color: 'var(--brand-cyan)', fontSize: '10px' }}>
              by Intemporelle
            </p>
          </div>
        </div>

        {/* Demo badge */}
        {state.isDemo && (
          <div className="mx-2 mt-2 px-2 py-1 rounded text-center hidden md:block" style={{ background: 'var(--brand-rose-dim)', border: '1px solid var(--brand-rose)' }}>
            <span className="text-xs font-600" style={{ color: 'var(--brand-rose)', fontWeight: 600 }}>MODE DÉMO</span>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-3 space-y-1 px-1 overflow-y-auto">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const isActive = path === '/' ? location === '/' : location.startsWith(path);
            return (
              <Link key={path} href={path}>
                <div
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 cursor-pointer group',
                    isActive
                      ? 'nav-item-active'
                      : 'hover:bg-white/5'
                  )}
                  style={isActive ? { color: 'var(--brand-cyan)' } : { color: 'var(--brand-text-muted)' }}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span className="hidden md:block text-sm font-500 truncate" style={{ fontWeight: 500 }}>{label}</span>
                  {label === 'Clients' && stats.alertesUrgentes > 0 && (
                    <span
                      className="hidden md:flex ml-auto items-center justify-center w-5 h-5 rounded-full text-xs font-700"
                      style={{ background: 'var(--brand-rose)', color: 'white', fontWeight: 700, fontSize: '10px' }}
                    >
                      {stats.alertesUrgentes}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* RGPD Alert */}
        {stats.alertesUrgentes > 0 && (
          <div className="mx-2 mb-2 p-2 rounded hidden md:block" style={{ background: 'rgba(244, 67, 54, 0.1)', border: '1px solid rgba(244, 67, 54, 0.3)' }}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} style={{ color: '#F44336' }} />
              <span className="text-xs" style={{ color: '#F44336' }}>
                {stats.alertesUrgentes} alerte{stats.alertesUrgentes > 1 ? 's' : ''} RGPD
              </span>
            </div>
          </div>
        )}

        {/* Salon info + logout */}
        <div className="border-t p-2" style={{ borderColor: 'var(--brand-border)' }}>
          {state.salonInfo && (
            <div className="hidden md:block px-2 py-1 mb-1">
              <p className="text-xs font-600 truncate" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>{state.salonInfo.nom}</p>
              <p className="text-xs truncate" style={{ color: 'var(--brand-text-muted)' }}>{state.salonInfo.ville}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md transition-all duration-200 hover:bg-white/5"
            style={{ color: 'var(--brand-text-muted)' }}
          >
            <LogOut size={16} className="flex-shrink-0" />
            <span className="hidden md:block text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--brand-navy)' }}>
        <div className="page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}

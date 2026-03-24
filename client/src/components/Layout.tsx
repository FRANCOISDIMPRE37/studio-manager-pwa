/*
 * DESIGN: Studio Nocturne — Sidebar gauche fixe, fond bleu nuit #0A1628
 * Navigation iconographique + labels, accent cyan sur élément actif
 */
import { Link, useLocation } from 'wouter';
import { useRef } from 'react';
import { useApp } from '@/lib/app-context';
import {
  LayoutDashboard, Users, FileText, Settings, Archive, Shield, Info,
  LogOut, AlertTriangle, ExternalLink, FileSpreadsheet, FileDown, FileUp, RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { exportClientsCSV, exportClientsExcel, importClientsFromFile } from '@/lib/clientExportImport';
import { nanoid } from 'nanoid';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
  { path: '/rgpd-salarie', icon: Shield, label: 'Engagement Confidentialité' },
  { path: '/info-client-rgpd', icon: Info, label: 'Info Client RGPD' },
  { path: '/clients', icon: Users, label: 'Clients' },
  { path: '/documents', icon: FileText, label: 'Documents' },
  { path: '/archives', icon: Archive, label: 'Archives' },
  { path: '/parametres', icon: Settings, label: 'Paramètres' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { state, getDashboardStats, setAuthenticated, addClient } = useApp();
  const stats = getDashboardStats();
  const importRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    setAuthenticated(false);
  };

  const handleExportCSV = () => {
    if (!state.clients.length) { toast.error('Aucun client à exporter'); return; }
    exportClientsCSV(state.clients);
    toast.success(`${state.clients.length} client(s) exporté(s) en CSV`);
  };

  const handleExportExcel = () => {
    if (!state.clients.length) { toast.error('Aucun client à exporter'); return; }
    exportClientsExcel(state.clients);
    toast.success(`${state.clients.length} client(s) exporté(s) en Excel`);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importClientsFromFile(
      file,
      ({ imported, errors }) => {
        if (errors.length) {
          errors.forEach(err => toast.warning(err));
        }
        if (!imported.length) {
          toast.error('Aucun client valide trouvé dans le fichier');
          return;
        }
        const today = new Date().toISOString().split('T')[0];
        const daysFromNow = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };
        imported.forEach(partial => {
          addClient({
            nom: partial.nom || '',
            prenom: partial.prenom || '',
            dateNaissance: partial.dateNaissance || '',
            telephone: partial.telephone || '',
            email: partial.email,
            adresse: partial.adresse || '',
            codePostal: partial.codePostal || '',
            ville: partial.ville || '',
            pieceIdentiteType: partial.pieceIdentiteType,
            pieceIdentiteNumero: partial.pieceIdentiteNumero,
            estMineur: partial.estMineur || false,
            estArchive: partial.estArchive || false,
            dateConsentement: partial.dateConsentement || today,
            dateSuppressionPrevue: partial.dateSuppressionPrevue || daysFromNow(365 * 5),
            rgpdDroitsExerces: [],
            prestations: [],
            documentsAssocies: [],
            documents: [],
            photos: [],
          });
        });
        toast.success(`${imported.length} client(s) importé(s) avec succès`);
      },
      (msg) => toast.error(msg)
    );
    e.target.value = '';
  };

  return (
    <div className="flex h-screen overflow-hidden print:block print:h-auto print:overflow-visible" style={{ background: 'var(--brand-navy)' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col w-44 md:w-56 flex-shrink-0 border-r"
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
          <div className="block min-w-0">
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
                  <span className="block text-sm font-500 truncate" style={{ fontWeight: 500 }}>{label}</span>
                  {label === 'Clients' && stats.alertesUrgentes > 0 && (
                    <span
                      className="flex ml-auto items-center justify-center w-5 h-5 rounded-full text-xs font-700"
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

        {/* Export / Import clients CSV/Excel */}
        <div className="px-1 pb-1">
          <p className="hidden md:block px-3 text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--brand-text-muted)', fontSize: '9px', opacity: 0.6 }}>Clients</p>
          <input ref={importRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImportFile} />
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md transition-all duration-200 hover:bg-white/5 group"
            style={{ color: 'var(--brand-text-muted)' }}
            title="Exporter clients CSV"
          >
            <FileDown size={15} className="flex-shrink-0" style={{ color: '#34d399', opacity: 0.8 }} />
            <span className="hidden md:block text-xs truncate group-hover:text-white transition-colors">Exporter CSV</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md transition-all duration-200 hover:bg-white/5 group"
            style={{ color: 'var(--brand-text-muted)' }}
            title="Exporter clients Excel"
          >
            <FileSpreadsheet size={15} className="flex-shrink-0" style={{ color: '#34d399', opacity: 0.8 }} />
            <span className="hidden md:block text-xs truncate group-hover:text-white transition-colors">Exporter Excel</span>
          </button>
          <button
            onClick={() => importRef.current?.click()}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md transition-all duration-200 hover:bg-white/5 group"
            style={{ color: 'var(--brand-text-muted)' }}
            title="Importer clients CSV/Excel"
          >
            <FileUp size={15} className="flex-shrink-0" style={{ color: '#fb923c', opacity: 0.8 }} />
            <span className="hidden md:block text-xs truncate group-hover:text-white transition-colors">Importer CSV/Excel</span>
          </button>
        </div>

        {/* Liens externes */}
        <div className="px-1 pb-2 space-y-1">
          <p className="hidden md:block px-3 text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--brand-text-muted)', fontSize: '9px', opacity: 0.6 }}>Ressources</p>
          {[
            { href: 'https://www.intemporelle.eu/', label: 'Intemporelle' },
            { href: 'https://www.ars.sante.fr/', label: 'ARS Santé' },
            { href: 'https://www.cnil.fr/fr', label: 'CNIL' },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 hover:bg-white/5 group"
              style={{ color: 'var(--brand-text-muted)' }}
            >
              <ExternalLink size={15} className="flex-shrink-0" style={{ color: 'var(--brand-cyan)', opacity: 0.7 }} />
              <span className="hidden md:block text-xs truncate group-hover:text-white transition-colors" style={{ fontWeight: 400 }}>{label}</span>
            </a>
          ))}
        </div>

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
            <div className="block px-2 py-1 mb-1">
              <p className="text-xs font-600 truncate" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>{state.salonInfo.nom}</p>
              <p className="text-xs truncate" style={{ color: 'var(--brand-text-muted)' }}>{state.salonInfo.ville}</p>
            </div>
          )}
          <button
            onClick={() => { toast.info('Actualisation...'); window.location.reload(); }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md transition-all duration-200 hover:bg-white/5"
            style={{ color: 'var(--brand-cyan)' }}
            title="Actualiser l'application (F5)"
          >
            <RotateCcw size={16} className="flex-shrink-0" />
            <span className="block text-sm">Actualiser</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md transition-all duration-200 hover:bg-white/5"
            style={{ color: 'var(--brand-text-muted)' }}
          >
            <LogOut size={16} className="flex-shrink-0" />
            <span className="block text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto print:overflow-visible print:h-auto" style={{ background: 'var(--brand-navy)' }}>
        <div className="page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}

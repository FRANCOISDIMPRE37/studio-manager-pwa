/**
 * DESIGN: Studio Nocturne — Sidebar gauche fixe, fond bleu nuit #0A1628
 * Navigation iconographique + labels, accent cyan sur élément actif
 */
import React, { useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useApp } from '@/lib/app-context';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Users, FileText, Settings, Archive, Shield, Info,
  LogOut, AlertTriangle, ExternalLink, FileSpreadsheet, FileDown, FileUp, RotateCcw, BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { exportClientsCSV, exportClientsExcel, importClientsFromFile } from '@/lib/clientExportImport';
import { nanoid } from 'nanoid';
import LanguageSelector from '@/components/LanguageSelector';

const MODE_EMPLOI_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/mode_emploi_studio_manager_6b84fbf9.pdf';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { state, getDashboardStats, setAuthenticated, addClient } = useApp();
  const stats = getDashboardStats();
  const importRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  // Nav items using translation keys
  // Navigation organisée par sections
  const NAV_SECTIONS = [
    {
      sectionKey: null, // pas de label de section pour la première
      items: [
        { path: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
        { path: '/clients', icon: Users, labelKey: 'nav.clients' },
        { path: '/documents', icon: FileText, labelKey: 'nav.documents' },
      ],
    },
    {
      sectionKey: 'nav.section_rgpd',
      items: [
        { path: '/rgpd-salarie', icon: Shield, labelKey: 'nav.rgpd_employee' },
        { path: '/info-client-rgpd', icon: Info, labelKey: 'nav.client_info' },
        { path: '/archives', icon: Archive, labelKey: 'nav.archives' },
      ],
    },
    {
      sectionKey: 'nav.section_admin',
      items: [
        { path: '/parametres', icon: Settings, labelKey: 'nav.settings' },
      ],
    },
  ];

  const handleLogout = () => {
    setAuthenticated(false);
  };

  const handleExportCSV = () => {
    if (!state.clients.length) { toast.error(t('common.no_data')); return; }
    exportClientsCSV(state.clients);
    toast.success(`${state.clients.length} client(s) exporté(s) en CSV`);
  };

  const handleExportExcel = () => {
    if (!state.clients.length) { toast.error(t('common.no_data')); return; }
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
    <div className="flex overflow-hidden print:block print:h-auto print:overflow-visible" style={{ background: 'var(--brand-navy)', height: '100dvh' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col w-44 md:w-56 flex-shrink-0 border-r"
        style={{
          background: 'linear-gradient(180deg, #0A1628 0%, #0D1E38 100%)',
          borderColor: 'var(--brand-border)',
          height: '100dvh',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch' as any,
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--brand-border)' }}>
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
            <span className="text-xs font-600" style={{ color: 'var(--brand-rose)', fontWeight: 600 }}>{t('nav.mode_demo')}</span>
          </div>
        )}

        {/* Navigation par sections */}
        <nav className="py-3 px-1">
          {NAV_SECTIONS.map((section, sIdx) => (
            <div key={sIdx} className={sIdx > 0 ? 'mt-3 pt-3 border-t' : ''} style={sIdx > 0 ? { borderColor: 'var(--brand-border)' } : {}}>
              {section.sectionKey && (
                <p className="px-3 text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--brand-text-muted)', fontSize: '9px', opacity: 0.5, fontWeight: 600 }}>
                  {t(section.sectionKey)}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(({ path, icon: Icon, labelKey }) => {
                  const isActive = path === '/' ? location === '/' : location.startsWith(path);
                  const label = t(labelKey);
                  return (
                    <Link key={path} href={path}>
                      <div
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 cursor-pointer group',
                          isActive ? 'nav-item-active' : 'hover:bg-white/5'
                        )}
                        style={isActive ? { color: 'var(--brand-cyan)' } : { color: 'var(--brand-text-muted)' }}
                      >
                        <Icon size={18} className="flex-shrink-0" />
                        <span className="block text-sm font-500 truncate" style={{ fontWeight: 500 }}>{label}</span>
                        {labelKey === 'nav.clients' && stats.alertesUrgentes > 0 && (
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
              </div>
            </div>
          ))}

          {/* Mode d'emploi — séparé en bas de nav */}
          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--brand-border)' }}>
            <a
              href={MODE_EMPLOI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 hover:bg-white/5 group"
              style={{ color: 'var(--brand-text-muted)' }}
            >
              <BookOpen size={18} className="flex-shrink-0" style={{ color: 'var(--brand-cyan)', opacity: 0.85 }} />
              <span className="block text-sm font-500 truncate group-hover:text-white transition-colors" style={{ fontWeight: 500 }}>{t('nav.mode_emploi')}</span>
            </a>
          </div>
        </nav>

        {/* Export / Import clients CSV/Excel */}
        <div className="px-1 pb-1 flex-shrink-0">
          <p className="block px-3 text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--brand-text-muted)', fontSize: '9px', opacity: 0.6 }}>{t('nav.clients_section')}</p>
          <input ref={importRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImportFile} />
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md transition-all duration-200 hover:bg-white/5 group"
            style={{ color: 'var(--brand-text-muted)' }}
            title={t('nav.export_csv')}
          >
            <FileDown size={15} className="flex-shrink-0" style={{ color: '#34d399', opacity: 0.8 }} />
            <span className="block text-xs truncate group-hover:text-white transition-colors">{t('nav.export_csv')}</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md transition-all duration-200 hover:bg-white/5 group"
            style={{ color: 'var(--brand-text-muted)' }}
            title={t('nav.export_excel')}
          >
            <FileSpreadsheet size={15} className="flex-shrink-0" style={{ color: '#34d399', opacity: 0.8 }} />
            <span className="block text-xs truncate group-hover:text-white transition-colors">{t('nav.export_excel')}</span>
          </button>
          <button
            onClick={() => importRef.current?.click()}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md transition-all duration-200 hover:bg-white/5 group"
            style={{ color: 'var(--brand-text-muted)' }}
            title={t('nav.import_csv')}
          >
            <FileUp size={15} className="flex-shrink-0" style={{ color: '#fb923c', opacity: 0.8 }} />
            <span className="block text-xs truncate group-hover:text-white transition-colors">{t('nav.import_csv')}</span>
          </button>
        </div>

        {/* Liens externes */}
        <div className="px-1 pb-2 space-y-1 flex-shrink-0">
          <p className="block px-3 text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--brand-text-muted)', fontSize: '9px', opacity: 0.6 }}>{t('nav.resources')}</p>
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
              <span className="block text-xs truncate group-hover:text-white transition-colors" style={{ fontWeight: 400 }}>{label}</span>
            </a>
          ))}
        </div>

        {/* RGPD Alert */}
        {stats.alertesUrgentes > 0 && (
          <div className="mx-2 mb-2 p-2 rounded hidden md:block" style={{ background: 'rgba(244, 67, 54, 0.1)', border: '1px solid rgba(244, 67, 54, 0.3)' }}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} style={{ color: '#F44336' }} />
              <span className="text-xs" style={{ color: '#F44336' }}>
                {stats.alertesUrgentes} {stats.alertesUrgentes > 1 ? t('nav.rgpd_alerts') : t('nav.rgpd_alert')}
              </span>
            </div>
          </div>
        )}

        {/* Salon info + logout */}
        <div className="border-t p-2 flex-shrink-0" style={{ borderColor: 'var(--brand-border)' }}>
          {state.salonInfo && (
            <div className="block px-2 py-1 mb-1">
              <p className="text-xs font-600 truncate" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>{state.salonInfo.nom}</p>
              <p className="text-xs truncate" style={{ color: 'var(--brand-text-muted)' }}>{state.salonInfo.ville}</p>
            </div>
          )}
          {/* Sélecteur de langue — menu déroulant toutes langues européennes */}
          <LanguageSelector />
          <button
            onClick={() => { toast.info('Actualisation...'); window.location.reload(); }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md transition-all duration-200 hover:bg-white/5"
            style={{ color: 'var(--brand-cyan)' }}
            title={t('nav.refresh')}
          >
            <RotateCcw size={16} className="flex-shrink-0" />
            <span className="block text-sm">{t('nav.refresh')}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md transition-all duration-200 hover:bg-white/5"
            style={{ color: 'var(--brand-text-muted)' }}
          >
            <LogOut size={16} className="flex-shrink-0" />
            <span className="block text-sm">{t('nav.logout')}</span>
          </button>
          {/* Liens légaux */}
          <div className="flex gap-3 px-3 pt-2 pb-1 flex-wrap">
            <Link href="/confidentialite" className="text-xs hover:underline" style={{ color: 'var(--brand-text-muted)', fontSize: '10px' }}>{t('nav.confidentiality')}</Link>
            <Link href="/mentions-legales" className="text-xs hover:underline" style={{ color: 'var(--brand-text-muted)', fontSize: '10px' }}>{t('nav.legal_cgu')}</Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto print:overflow-visible print:h-auto" style={{ background: 'var(--brand-navy)', height: '100dvh', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <div className="page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}

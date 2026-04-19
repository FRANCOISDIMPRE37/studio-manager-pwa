/**
 * DESIGN: Studio Nocturne — Sidebar gauche fixe, fond bleu nuit #0A1628
 * Navigation iconographique + labels, accent cyan sur élément actif
 */
import React from 'react';
import { Link, useLocation } from 'wouter';
import { useApp } from '@/lib/app-context';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Users, FileText, Settings, Archive, Shield, Info,
  LogOut, AlertTriangle, ExternalLink, RotateCcw, BookOpen, Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import LanguageSelector from '@/components/LanguageSelector';

const MODE_EMPLOI_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/mode_emploi_studio_manager_v4_a4dac9ab.html';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { state, getDashboardStats, setAuthenticated, syncFromCloud } = useApp();
  const stats = getDashboardStats();
  const { t } = useTranslation();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifsQuery = trpc.notifications.getMy.useQuery(undefined, { refetchInterval: 30000 });
  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => notifsQuery.refetch() });
  const notifs = notifsQuery.data ?? [];
  const unread = notifs.filter(n => !n.lu).length;

  // Nav items using translation keys
  // Navigation organisée par sections
  const NAV_SECTIONS = [
    {
      sectionKey: null, // pas de label de section pour la première
      items: [
        { path: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
        { path: '/clients', icon: Users, labelKey: 'nav.clients' },
        { path: '/rgpd-salarie', icon: Users, labelKey: 'nav.salaries' },
        { path: '/documents', icon: FileText, labelKey: 'nav.documents' },
      ],
    },
    {
      sectionKey: 'nav.section_rgpd',
      items: [
        { path: '/info-client-rgpd', icon: Info, labelKey: 'nav.client_info' },
        { path: '/archives', icon: Archive, labelKey: 'nav.archives' },
        { path: '/archives-numerisees', icon: Archive, labelKey: 'nav.archives_numerisees' },
      ],
    },
    {
      sectionKey: 'nav.section_admin',
      items: [
        { path: '/engagements', icon: FileText, labelKey: 'nav.engagements' },
        { path: '/parametres', icon: Settings, labelKey: 'nav.settings' },

      ],
    },
  ];

  const handleLogout = () => {
    setAuthenticated(false);
  };


  return (
    <div className="flex overflow-hidden print:block print:h-auto print:overflow-visible" style={{ background: 'var(--brand-navy)', height: '100dvh' }}>
      {/* Panneau notifications */}
      {showNotifs && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: 320, height: '100vh', background: '#13131a', borderLeft: '1px solid #2a2a3a', zIndex: 1000, overflowY: 'auto', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>🔔 Notifications</span>
            <button onClick={() => setShowNotifs(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: 20 }}>✕</button>
          </div>
          {notifs.length === 0 ? (
            <p style={{ color: '#555', fontSize: 13, textAlign: 'center', marginTop: 40 }}>Aucune notification</p>
          ) : notifs.map(n => (
            <div key={n.id} onClick={() => !n.lu && markRead.mutate({ id: n.id })}
              style={{ background: n.lu ? '#1a1a2e' : '#1e1e3a', border: `1px solid ${n.lu ? '#2a2a3a' : '#7c3aed'}`, borderRadius: 10, padding: 14, marginBottom: 10, cursor: n.lu ? 'default' : 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: n.lu ? '#666' : '#a855f7', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{n.type}</span>
                {!n.lu && <span style={{ background: '#7c3aed', color: '#fff', fontSize: 9, padding: '2px 6px', borderRadius: 10 }}>NOUVEAU</span>}
              </div>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{n.titre}</p>
              <p style={{ color: '#888', fontSize: 12, lineHeight: 1.5 }}>{n.message}</p>
              <p style={{ color: '#444', fontSize: 10, marginTop: 6 }}>{new Date(n.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
          ))}
        </div>
      )}
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
        <div className="flex flex-col items-center px-3 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--brand-border)' }}>
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/logo_intemporelle_293813dd.jpg"
            alt="Intemporelle RGPD & Cybersécurité"
            className="w-full rounded-md"
            style={{ maxHeight: '52px', objectFit: 'contain' }}
          />
          <p className="text-xs mt-2 text-center leading-tight" style={{ color: 'var(--brand-cyan)', fontSize: '10px', fontFamily: 'Outfit' }}>
            {state.salonInfo?.nom || 'Studio Manager'}
          </p>
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

          {/* Cloche notifications */}
        <div style={{ padding: '8px 12px', marginBottom: 4 }}>
          <button onClick={() => setShowNotifs(s => !s)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: showNotifs ? 'rgba(124,58,237,0.15)' : 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Bell size={18} style={{ color: unread > 0 ? '#a855f7' : 'var(--brand-text-muted)' }} />
              {unread > 0 && (
                <span style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unread}</span>
              )}
            </div>
            <span style={{ color: unread > 0 ? '#a855f7' : 'var(--brand-text-muted)', fontSize: 12, fontWeight: unread > 0 ? 600 : 400 }}>
              Notifications{unread > 0 ? ` (${unread})` : ''}
            </span>
          </button>
        </div>
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

        {/* Liens externes */}
        <div className="px-1 pb-2 space-y-1 flex-shrink-0">
          <p className="block px-3 text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--brand-text-muted)', fontSize: '9px', opacity: 0.6 }}>{t('nav.resources')}</p>
          {[
            { href: 'https://www.intemporelle.eu/', label: 'Intemporelle' },
            { href: 'https://www.ars.sante.fr/recherche-globale?search_ars=tatouage%20et%20piercing&ars_site=&submit_search=Filtrer&sort_by=date_desc', label: 'ARS Santé' },
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
            onClick={async () => {
              toast.info('Synchronisation en cours...');
              try {
                await syncFromCloud();
                toast.success('Données synchronisées !');
              } catch {
                toast.error('Erreur de synchronisation');
              }
            }}
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

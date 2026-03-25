/**
 * DESIGN: Studio Nocturne — Page Archives RGPD
 * Liste tous les clients archivés (automatiquement ou manuellement)
 */
import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Archive, Search, User, Calendar, Lock, RotateCcw, ChevronRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function Archives() {
  const { state, updateClient } = useApp();
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState('');

  const clientsArchives = state.clients
    .filter(c => c.estArchive)
    .sort((a, b) => {
      const da = a.dateArchivage || a.dateCreation;
      const db = b.dateArchivage || b.dateCreation;
      return db.localeCompare(da);
    });

  const filtered = clientsArchives.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.nom + ' ' + c.prenom).toLowerCase().includes(q) ||
      (c.numeroClient || '').toLowerCase().includes(q) ||
      (c.telephone || '').includes(q)
    );
  });

  const handleDesarchiver = (id: string) => {
    const client = state.clients.find(c => c.id === id);
    if (!client) return;
    if (!confirm(`Désarchiver ${client.prenom} ${client.nom} ? Ses données redeviendront actives.`)) return;
    updateClient({ ...client, estArchive: false, dateArchivage: undefined });
    toast.success('Client désarchivé');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-navy)' }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg" style={{ background: 'rgba(131,208,245,0.1)' }}>
            <Archive size={18} style={{ color: 'var(--brand-cyan)' }} />
          </div>
          <div>
            <h1 className="text-base font-bold" style={{ color: 'var(--brand-text)' }}>{t('archives.title', 'Archives RGPD')}</h1>
            <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
              {clientsArchives.length} client{clientsArchives.length !== 1 ? 's' : ''} archivé{clientsArchives.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Info RGPD */}
      <div className="mx-4 mt-4 p-3 rounded-xl flex items-start gap-3" style={{ background: 'rgba(131,208,245,0.05)', border: '1px solid rgba(131,208,245,0.2)' }}>
        <ShieldCheck size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--brand-cyan)' }} />
        <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
          Les clients sont archivés automatiquement <strong style={{ color: 'var(--brand-text)' }}>3 ans</strong> après leur création. Leurs données personnelles sont anonymisées. Seules les données de traçabilité médicale sont conservées.
        </p>
      </div>

      {/* Barre de recherche */}
      <div className="p-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)' }}>
          <Search size={14} style={{ color: 'var(--brand-text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('archives.search', 'Rechercher dans les archives...')}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--brand-text)' }}
          />
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Archive size={40} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--brand-text-muted)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--brand-text-muted)' }}>
              {search ? t('common.no_data') : t('archives.no_archived', 'Aucun client archivé')}
            </p>
            {!search && (
              <p className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)', opacity: 0.6 }}>
                Les clients seront archivés automatiquement après 3 ans
              </p>
            )}
          </div>
        ) : (
          filtered.map(client => {
            const dateArchivage = client.dateArchivage
              ? new Date(client.dateArchivage).toLocaleDateString('fr-FR')
              : '—';
            const dateCreation = new Date(client.dateCreation).toLocaleDateString('fr-FR');
            const age = Math.floor((Date.now() - new Date(client.dateNaissance).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

            return (
              <div
                key={client.id}
                className="rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <Lock size={14} style={{ color: 'var(--brand-text-muted)' }} />
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>
                        {client.prenom} {client.nom}
                      </span>
                      {client.numeroClient && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--brand-text-muted)', border: '1px solid var(--brand-border)' }}>
                          {client.numeroClient}
                        </span>
                      )}
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(158,158,158,0.1)', color: '#9E9E9E', border: '1px solid rgba(158,158,158,0.3)' }}>
                        {t('archives.archived', 'Archivé')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      <span className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
                        <User size={10} className="inline mr-1" />{age} ans{client.estMineur ? ' (mineur)' : ''}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
                        <Calendar size={10} className="inline mr-1" />Créé le {dateCreation}
                      </span>
                      <span className="text-xs" style={{ color: '#9E9E9E' }}>
                        <Archive size={10} className="inline mr-1" />Archivé le {dateArchivage}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleDesarchiver(client.id)}
                      className="p-1.5 rounded-lg transition-all hover:bg-white/10"
                      title="Désarchiver"
                    >
                      <RotateCcw size={13} style={{ color: 'var(--brand-text-muted)' }} />
                    </button>
                    <button
                      onClick={() => navigate(`/clients/${client.id}`)}
                      className="p-1.5 rounded-lg transition-all hover:bg-white/10"
                      title="Voir la fiche"
                    >
                      <ChevronRight size={13} style={{ color: 'var(--brand-text-muted)' }} />
                    </button>
                  </div>
                </div>

                {/* Documents */}
                {client.documentsAssocies.length > 0 && (
                  <div className="mt-2 pt-2 flex flex-wrap gap-1" style={{ borderTop: '1px solid var(--brand-border)' }}>
                    <span className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
                      {client.documentsAssocies.length} document{client.documentsAssocies.length > 1 ? 's' : ''} conservé{client.documentsAssocies.length > 1 ? 's' : ''}
                    </span>
                    <span className="text-xs ml-1" style={{ color: 'var(--brand-text-muted)', opacity: 0.6 }}>
                      — {client.documents?.filter(d => d.status === 'signed').length || 0} signé{(client.documents?.filter(d => d.status === 'signed').length || 0) > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

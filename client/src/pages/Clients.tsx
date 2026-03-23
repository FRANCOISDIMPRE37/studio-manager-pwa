/*
 * DESIGN: Studio Nocturne — Liste clients avec recherche, filtres RGPD, cartes
 */
import { useState, useMemo } from 'react';
import { useApp } from '@/lib/app-context';
import { useLocation } from 'wouter';
import { Search, Plus, Filter, ChevronRight, UserX, Archive } from 'lucide-react';
import { Client, RGPDStatus } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AddClientModal from '@/components/AddClientModal';

type FilterType = 'all' | 'mineurs' | 'alertes' | 'archives';

const RGPD_COLORS: Record<RGPDStatus, string> = {
  ok: '#4CAF50', warning: '#FF9800', urgent: '#F44336', expired: '#9C27B0'
};
const RGPD_LABELS: Record<RGPDStatus, string> = {
  ok: 'OK', warning: '90j', urgent: '30j', expired: 'Expiré'
};

function ClientCard({ client, onClick }: { client: Client; onClick: () => void }) {
  const initials = (client.prenom[0] || '') + (client.nom[0] || '');
  const lastPrestation = client.prestations[client.prestations.length - 1];
  const rgpdColor = RGPD_COLORS[client.rgpdStatus];

  return (
    <div
      className="studio-card p-4 cursor-pointer"
      onClick={onClick}
      style={{ opacity: client.estArchive ? 0.6 : 1 }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-700"
          style={{
            background: client.estArchive ? 'rgba(255,255,255,0.05)' : 'var(--brand-navy-mid)',
            color: client.estArchive ? 'var(--brand-text-muted)' : 'var(--brand-cyan)',
            fontWeight: 700,
          }}
        >
          {initials.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-600 truncate" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>
              {client.prenom} {client.nom}
            </span>
            {client.estMineur && (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#9C27B022', color: '#9C27B0', border: '1px solid #9C27B0' }}>
                Mineur
              </span>
            )}
            {client.estArchive && (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--brand-text-muted)', border: '1px solid var(--brand-border)' }}>
                Archivé
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--brand-text-muted)' }}>
            {client.numeroClient && <span style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>{client.numeroClient} · </span>}
            {client.telephone}
            {lastPrestation ? ` · ${lastPrestation.type} · ${lastPrestation.zone}` : ''}
          </p>
          <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
            {client.documents.length} doc{client.documents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ChevronRight size={14} style={{ color: 'var(--brand-text-muted)' }} />
        </div>
      </div>
    </div>
  );
}

export default function Clients() {
  const { state, deleteClient } = useApp();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = useMemo(() => {
    return state.clients.filter(c => {
      const matchSearch = search
        ? (c.nom + ' ' + c.prenom).toLowerCase().includes(search.toLowerCase()) ||
          c.telephone.includes(search)
        : true;
      const matchFilter =
        filter === 'all' ? !c.estArchive :
        filter === 'mineurs' ? c.estMineur && !c.estArchive :
        filter === 'alertes' ? false :
        filter === 'archives' ? c.estArchive : true;
      return matchSearch && matchFilter;
    });
  }, [state.clients, search, filter]);

  const FILTERS: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'Tous', count: state.clients.filter(c => !c.estArchive).length },
    { key: 'mineurs', label: 'Mineurs', count: state.clients.filter(c => c.estMineur && !c.estArchive).length },

    { key: 'archives', label: 'Archives', count: state.clients.filter(c => c.estArchive).length },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-700" style={{ color: 'var(--brand-text)', fontFamily: 'Outfit', fontWeight: 700 }}>
          Clients
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-600 transition-all active:scale-95"
          style={{
            background: 'var(--brand-cyan)',
            color: 'var(--brand-navy)',
            fontWeight: 600,
          }}
        >
          <Plus size={16} />
          <span className="hidden md:inline">Nouveau client</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--brand-text-muted)' }} />
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all"
          style={{
            background: 'var(--brand-navy-light)',
            border: '1px solid var(--brand-border)',
            color: 'var(--brand-text)',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--brand-cyan)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--brand-border)')}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-500 whitespace-nowrap transition-all"
            style={{
              background: filter === f.key ? 'var(--brand-cyan-dim)' : 'var(--brand-navy-light)',
              border: `1px solid ${filter === f.key ? 'var(--brand-cyan)' : 'var(--brand-border)'}`,
              color: filter === f.key ? 'var(--brand-cyan)' : 'var(--brand-text-muted)',
              fontWeight: 500,
            }}
          >
            {f.label}
            {f.count > 0 && (
              <span
                className="px-1.5 py-0.5 rounded-full text-xs"
                style={{
                  background: filter === f.key ? 'var(--brand-cyan)' : 'rgba(255,255,255,0.1)',
                  color: filter === f.key ? 'var(--brand-navy)' : 'var(--brand-text-muted)',
                }}
              >
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Client list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <UserX size={40} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--brand-text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>
            {search ? 'Aucun client trouvé' : 'Aucun client dans cette catégorie'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={() => navigate(`/clients/${client.id}`)}
            />
          ))}
        </div>
      )}

      {showAddModal && <AddClientModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}

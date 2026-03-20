/*
 * DESIGN: Studio Nocturne — Dashboard avec stats cards, RDV du jour, alertes RGPD
 * Cartes avec élévation au hover, badges colorés, typographie Outfit
 */
import { useMemo, useState } from 'react';
import { useApp } from '@/lib/app-context';
import { useLocation } from 'wouter';
import {
  Users, Calendar, AlertTriangle, Shield, ChevronRight,
  TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, Search, X
} from 'lucide-react';
import { RDV_TYPE_LABELS, RDV_STATUT_LABELS, RDV_STATUT_COLORS } from '@/lib/types';

function StatCard({ icon: Icon, label, value, color, sub }: {
  icon: React.ElementType; label: string; value: number | string;
  color: string; sub?: string;
}) {
  return (
    <div
      className="studio-card p-4 flex items-start gap-4"
      style={{ cursor: 'default' }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: color + '22' }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-700" style={{ color: 'var(--brand-text)', fontFamily: 'Outfit', fontWeight: 700 }}>{value}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--brand-text-muted)' }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color }}>{sub}</p>}
      </div>
    </div>
  );
}

function RDVCard({ rdv, clientName, onClick }: { rdv: any; clientName: string; onClick: () => void }) {
  const statutColor = RDV_STATUT_COLORS[rdv.statut as keyof typeof RDV_STATUT_COLORS];
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white/5"
      onClick={onClick}
      style={{ border: '1px solid var(--brand-border)' }}
    >
      <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: statutColor }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-600" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>
            {rdv.heureDebut} – {rdv.heureFin}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: statutColor + '22', color: statutColor, border: `1px solid ${statutColor}` }}
          >
            {RDV_STATUT_LABELS[rdv.statut as keyof typeof RDV_STATUT_LABELS]}
          </span>
        </div>
        <p className="text-sm truncate" style={{ color: 'var(--brand-text)' }}>{clientName}</p>
        <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
          {RDV_TYPE_LABELS[rdv.type as keyof typeof RDV_TYPE_LABELS]}{rdv.zone ? ` · ${rdv.zone}` : ''}
        </p>
      </div>
      <ChevronRight size={14} style={{ color: 'var(--brand-text-muted)' }} />
    </div>
  );
}

export default function Dashboard() {
  const { state, getDashboardStats } = useApp();
  const [, navigate] = useLocation();
  const stats = getDashboardStats();
  const [searchQuery, setSearchQuery] = useState('');

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const todayRDV = useMemo(() =>
    state.rendezVous.filter(r => r.date === today).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut)),
    [state.rendezVous, today]
  );

  const urgentClients = useMemo(() =>
    state.clients.filter(c => !c.estArchive && (c.rgpdStatus === 'urgent' || c.rgpdStatus === 'expired')).slice(0, 5),
    [state.clients]
  );

  const recentClients = useMemo(() =>
    state.clients.filter(c => !c.estArchive).slice(0, 5),
    [state.clients]
  );

  const todayStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return state.clients
      .filter(c => !c.estArchive)
      .filter(c =>
        c.nom.toLowerCase().includes(q) ||
        c.prenom.toLowerCase().includes(q) ||
        `${c.prenom} ${c.nom}`.toLowerCase().includes(q) ||
        `${c.nom} ${c.prenom}`.toLowerCase().includes(q) ||
        (c.telephone || '').includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [searchQuery, state.clients]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-700" style={{ color: 'var(--brand-text)', fontFamily: 'Outfit', fontWeight: 700 }}>
            Tableau de bord
          </h1>
          <p className="text-sm capitalize" style={{ color: 'var(--brand-text-muted)' }}>{todayStr}</p>
        </div>
        {state.isDemo && (
          <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--brand-rose-dim)', color: 'var(--brand-rose)', border: '1px solid var(--brand-rose)' }}>
            MODE DÉMO
          </span>
        )}
      </div>

      {/* Barre de recherche client */}
      <div className="relative">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--brand-border)' }}>
          <Search size={16} style={{ color: 'var(--brand-cyan)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Rechercher un client par nom, prénom, téléphone ou email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--brand-text)' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ color: 'var(--brand-text-muted)' }}>
              <X size={14} />
            </button>
          )}
        </div>
        {/* Résultats de recherche */}
        {searchResults.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
            style={{ background: '#0D1E38', border: '1px solid var(--brand-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
          >
            {searchResults.map(client => (
              <div
                key={client.id}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => { navigate(`/clients/${client.id}`); setSearchQuery(''); }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-700"
                  style={{ background: 'var(--brand-cyan-dim)', color: 'var(--brand-cyan)', fontWeight: 700 }}
                >
                  {client.prenom[0]}{client.nom[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-600 truncate" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>
                    {client.prenom} {client.nom}
                    {client.estMineur && <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: '#9C27B022', color: '#9C27B0' }}>Mineur</span>}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--brand-text-muted)' }}>
                    {client.telephone}{client.email ? ` · ${client.email}` : ''}
                  </p>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--brand-text-muted)' }} />
              </div>
            ))}
          </div>
        )}
        {searchQuery.trim() && searchResults.length === 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-1 rounded-xl px-4 py-3 z-50"
            style={{ background: '#0D1E38', border: '1px solid var(--brand-border)' }}
          >
            <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>Aucun client trouvé pour « {searchQuery} »</p>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Clients actifs" value={stats.clientsActifs} color="var(--brand-cyan)" />
        <StatCard icon={Calendar} label="RDV aujourd'hui" value={todayRDV.length} color="#4CAF50" />
        <StatCard
          icon={AlertTriangle}
          label="Alertes RGPD"
          value={stats.alertesRGPD}
          color={stats.alertesUrgentes > 0 ? '#F44336' : '#FF9800'}
          sub={stats.alertesUrgentes > 0 ? `${stats.alertesUrgentes} urgent${stats.alertesUrgentes > 1 ? 's' : ''}` : undefined}
        />
        <StatCard icon={Shield} label="Clients mineurs" value={stats.clientsMineurs} color="#9C27B0" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RDV du jour */}
        <div className="studio-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-600" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>
              <Clock size={14} className="inline mr-2" style={{ color: 'var(--brand-cyan)' }} />
              Rendez-vous du jour
            </h2>
            <button
              onClick={() => navigate('/agenda')}
              className="text-xs hover:opacity-80 transition-opacity"
              style={{ color: 'var(--brand-cyan)' }}
            >
              Voir l'agenda →
            </button>
          </div>
          {todayRDV.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--brand-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>Aucun rendez-vous aujourd'hui</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayRDV.map(rdv => {
                const client = rdv.clientId ? state.clients.find(c => c.id === rdv.clientId) : null;
                const name = client ? `${client.prenom} ${client.nom}` : (rdv.clientNom || 'Client inconnu');
                return (
                  <RDVCard
                    key={rdv.id}
                    rdv={rdv}
                    clientName={name}
                    onClick={() => navigate('/agenda')}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Alertes RGPD */}
        <div className="studio-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-600" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>
              <AlertTriangle size={14} className="inline mr-2" style={{ color: '#F44336' }} />
              Alertes RGPD
            </h2>
            <button
              onClick={() => navigate('/clients')}
              className="text-xs hover:opacity-80 transition-opacity"
              style={{ color: 'var(--brand-cyan)' }}
            >
              Voir les clients →
            </button>
          </div>
          {urgentClients.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={32} className="mx-auto mb-2" style={{ color: '#4CAF50', opacity: 0.5 }} />
              <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>Aucune alerte RGPD urgente</p>
            </div>
          ) : (
            <div className="space-y-2">
              {urgentClients.map(client => {
                const isExpired = client.rgpdStatus === 'expired';
                const color = isExpired ? '#9C27B0' : '#F44336';
                const suppDate = new Date(client.dateSuppressionPrevue);
                const diffDays = Math.floor((suppDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div
                    key={client.id}
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-all"
                    onClick={() => navigate(`/clients/${client.id}`)}
                    style={{ border: `1px solid ${color}33` }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-700"
                      style={{ background: color + '22', color, fontWeight: 700 }}
                    >
                      {(client.prenom[0] || '') + (client.nom[0] || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-500 truncate" style={{ color: 'var(--brand-text)', fontWeight: 500 }}>
                        {client.prenom} {client.nom}
                      </p>
                      <p className="text-xs" style={{ color }}>
                        {isExpired ? 'Suppression dépassée' : `Suppression dans ${diffDays}j`}
                      </p>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--brand-text-muted)' }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Clients récents */}
      <div className="studio-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-600" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>
            <Users size={14} className="inline mr-2" style={{ color: 'var(--brand-cyan)' }} />
            Clients récents
          </h2>
          <button
            onClick={() => navigate('/clients')}
            className="text-xs hover:opacity-80 transition-opacity"
            style={{ color: 'var(--brand-cyan)' }}
          >
            Voir tous →
          </button>
        </div>
        {recentClients.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>Aucun client enregistré</p>
            <button
              onClick={() => navigate('/clients')}
              className="mt-3 text-sm px-4 py-2 rounded-lg transition-all"
              style={{ background: 'var(--brand-cyan-dim)', color: 'var(--brand-cyan)', border: '1px solid var(--brand-cyan)' }}
            >
              Ajouter un client
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--brand-border)' }}>
            {recentClients.map(client => {
              const lastPrestation = client.prestations[client.prestations.length - 1];
              const rgpdColors: Record<string, string> = { ok: '#4CAF50', warning: '#FF9800', urgent: '#F44336', expired: '#9C27B0' };
              const rgpdLabels: Record<string, string> = { ok: 'OK', warning: '90j', urgent: '30j', expired: 'Expiré' };
              return (
                <div
                  key={client.id}
                  className="flex items-center gap-3 py-3 cursor-pointer hover:bg-white/5 transition-all rounded-lg px-2"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-700"
                    style={{ background: 'var(--brand-navy-mid)', color: 'var(--brand-cyan)', fontWeight: 700 }}
                  >
                    {(client.prenom[0] || '') + (client.nom[0] || '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-500 truncate" style={{ color: 'var(--brand-text)', fontWeight: 500 }}>
                        {client.prenom} {client.nom}
                      </p>
                      {client.estMineur && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#9C27B022', color: '#9C27B0', border: '1px solid #9C27B0' }}>
                          Mineur
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--brand-text-muted)' }}>
                      {lastPrestation
                        ? `${lastPrestation.type.charAt(0).toUpperCase() + lastPrestation.type.slice(1)} · ${lastPrestation.zone}`
                        : 'Aucune prestation'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-600"
                      style={{
                        background: rgpdColors[client.rgpdStatus] + '22',
                        color: rgpdColors[client.rgpdStatus],
                        border: `1px solid ${rgpdColors[client.rgpdStatus]}`,
                        fontWeight: 600,
                      }}
                    >
                      {rgpdLabels[client.rgpdStatus]}
                    </span>
                    <ChevronRight size={14} style={{ color: 'var(--brand-text-muted)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

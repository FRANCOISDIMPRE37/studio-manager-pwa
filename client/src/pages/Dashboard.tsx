/*
 * DESIGN: Studio Nocturne — Dashboard avec stats cards, RDV du jour, alertes RGPD
 * Cartes avec élévation au hover, badges colorés, typographie Outfit
 */
import { useMemo, useState, useRef } from 'react';
import { useApp } from '@/lib/app-context';
import { useLocation } from 'wouter';
import {
  Users, Calendar, AlertTriangle, Shield, ChevronRight,
  TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, Search, X,
  Camera, Image, Trash2, ZoomIn, Mail, Send, Loader2
} from 'lucide-react';

import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

function StatCard({ icon: Icon, label, value, color, sub }: {
  icon: React.ElementType; label: string; value: number | string;
  color: string; sub?: string;
}) {
  return (
    <div
      className="studio-card p-3 flex items-center gap-3"
      style={{ cursor: 'default', minWidth: 0 }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: color + '22' }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p className="text-xl font-700 leading-tight" style={{ color: 'var(--brand-text)', fontFamily: 'Outfit', fontWeight: 700 }}>{value}</p>
        <p className="text-xs mt-0.5 leading-tight" style={{ color: 'var(--brand-text-muted)', whiteSpace: 'normal', wordBreak: 'break-word' }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color }}>{sub}</p>}
      </div>
    </div>
  );
}



export default function Dashboard() {
  const { state, getDashboardStats } = useApp();
  const [, navigate] = useLocation();
  const stats = getDashboardStats();
  const [searchQuery, setSearchQuery] = useState('');
  type PhotoItem = { id: string; name: string; dataUrl: string; date: string };
  const [photos, setPhotos] = useState<PhotoItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('sm_tracabilite_photos') || '[]'); } catch { return []; }
  });
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const savePhotos = (newPhotos: typeof photos) => {
    setPhotos(newPhotos);
    localStorage.setItem('sm_tracabilite_photos', JSON.stringify(newPhotos));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newPhoto = {
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          name: file.name,
          dataUrl: ev.target?.result as string,
          date: new Date().toLocaleDateString('fr-FR'),
        };
        setPhotos((prev: PhotoItem[]) => {
          const updated = [...prev, newPhoto];
          localStorage.setItem('sm_tracabilite_photos', JSON.stringify(updated));
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleDeletePhoto = (id: string) => {
    if (!window.confirm('Supprimer cette photo ?')) return;
    savePhotos(photos.filter((p: PhotoItem) => p.id !== id));
  };

  const urgentClients = useMemo(() =>
    state.clients.filter(c => !c.estArchive && (c.rgpdStatus === 'urgent' || c.rgpdStatus === 'expired')).slice(0, 5),
    [state.clients]
  );

  const recentClients = useMemo(() =>
    state.clients.filter(c => !c.estArchive).slice(0, 5),
    [state.clients]
  );

  // ─── Alertes RGPD 30 jours (calculé depuis le state local) ───
  const [sentAlerts, setSentAlerts] = useState<Set<string>>(new Set());
  const rgpdAlerts = useMemo(() => {
    const now = Date.now();
    return state.clients
      .filter(c => !c.estArchive && c.dateSuppressionPrevue)
      .map(c => {
        const suppDate = new Date(c.dateSuppressionPrevue).getTime();
        const diffDays = Math.floor((suppDate - now) / (1000 * 60 * 60 * 24));
        return { ...c, diffDays };
      })
      .filter(c => c.diffDays <= 30)
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [state.clients]);
  const sendRgpdAlert = trpc.smtp.sendRgpdAlert.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`Alerte RGPD envoyée à ${vars.clientPrenom} ${vars.clientNom}`);
      setSentAlerts(prev => new Set(Array.from(prev).concat(vars.clientId)));
    },
    onError: (err) => toast.error(err.message),
  });
  const [sendingAll, setSendingAll] = useState(false);
  const handleSendAllAlerts = async () => {
    if (!rgpdAlerts || rgpdAlerts.length === 0) return;
    const eligible = rgpdAlerts.filter(c => c.email && !sentAlerts.has(c.id));
    if (eligible.length === 0) { toast.info('Toutes les alertes ont déjà été envoyées'); return; }
    setSendingAll(true);
    for (const c of eligible) {
      if (!c.email) continue;
      try {
        await sendRgpdAlert.mutateAsync({
          clientId: c.id,
          clientNom: c.nom,
          clientPrenom: c.prenom,
          clientEmail: c.email,
          dateSuppressionPrevue: c.dateSuppressionPrevue,
          diffDays: c.diffDays,
        });
      } catch {}
    }
    setSendingAll(false);
    toast.success(`${eligible.length} alerte${eligible.length > 1 ? 's' : ''} envoyée${eligible.length > 1 ? 's' : ''}`);
  };

  const todayStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { clients: [], rdv: [], documents: [] };
    const q = searchQuery.toLowerCase().trim();

    // Recherche clients
    const clients = state.clients
      .filter(c => !c.estArchive)
      .filter(c =>
        c.nom.toLowerCase().includes(q) ||
        c.prenom.toLowerCase().includes(q) ||
        `${c.prenom} ${c.nom}`.toLowerCase().includes(q) ||
        `${c.nom} ${c.prenom}`.toLowerCase().includes(q) ||
        (c.telephone || '').includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      )
      .slice(0, 5);

    // Recherche rendez-vous (par type, zone, notes, nom client)
    const rdv = state.rendezVous
      .filter(r => {
        const client = r.clientId ? state.clients.find(c => c.id === r.clientId) : null;
        const clientName = client ? `${client.prenom} ${client.nom}`.toLowerCase() : (r.clientNom || '').toLowerCase();
        return (
          clientName.includes(q) ||
          (r.type || '').toLowerCase().includes(q) ||
          (r.zone || '').toLowerCase().includes(q) ||
          (r.notes || '').toLowerCase().includes(q) ||
          (r.date || '').includes(q)
        );
      })
      .slice(0, 3);

    // Recherche documents (par type de document, nom client)
    const documents: { clientId: string; clientName: string; docType: string; docLabel: string }[] = [];
    state.clients
      .filter(c => !c.estArchive)
      .forEach(c => {
        (c.documents || []).forEach((doc: any) => {
          const label = (doc.type || '').toLowerCase();
          const clientName = `${c.prenom} ${c.nom}`.toLowerCase();
          if (label.includes(q) || clientName.includes(q)) {
            documents.push({
              clientId: c.id,
              clientName: `${c.prenom} ${c.nom}`,
              docType: doc.type,
              docLabel: doc.type.replace(/_/g, ' '),
            });
          }
        });
      });

    return { clients, rdv, documents: documents.slice(0, 3) };
  }, [searchQuery, state.clients, state.rendezVous]);

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
            placeholder="Rechercher un client, un rendez-vous ou un document..."
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
        {/* Résultats de recherche globale */}
        {(searchResults.clients.length > 0 || searchResults.rdv.length > 0 || searchResults.documents.length > 0) && (
          <div
            className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
            style={{ background: '#0D1E38', border: '1px solid var(--brand-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxHeight: '420px', overflowY: 'auto' }}
          >
            {/* Section Clients */}
            {searchResults.clients.length > 0 && (
              <>
                <div className="px-4 py-2" style={{ background: 'rgba(131,208,245,0.06)', borderBottom: '1px solid var(--brand-border)' }}>
                  <span className="text-xs font-600" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>Clients</span>
                </div>
                {searchResults.clients.map(client => (
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
              </>
            )}
            {/* Section RDV */}
            {searchResults.rdv.length > 0 && (
              <>
                <div className="px-4 py-2" style={{ background: 'rgba(76,175,80,0.06)', borderBottom: '1px solid var(--brand-border)', borderTop: searchResults.clients.length > 0 ? '1px solid var(--brand-border)' : undefined }}>
                  <span className="text-xs font-600" style={{ color: '#4CAF50', fontWeight: 600 }}>Rendez-vous</span>
                </div>
                {searchResults.rdv.map(rdv => {
                  const rdvClient = rdv.clientId ? state.clients.find(c => c.id === rdv.clientId) : null;
                  const rdvName = rdvClient ? `${rdvClient.prenom} ${rdvClient.nom}` : (rdv.clientNom || 'Client inconnu');
                  return (
                    <div
                      key={rdv.id}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => { navigate('/agenda'); setSearchQuery(''); }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(76,175,80,0.15)', color: '#4CAF50' }}
                      >
                        <Calendar size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-600 truncate" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>{rdvName}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--brand-text-muted)' }}>
                          {rdv.date} · {rdv.heureDebut} – {rdv.heureFin}{rdv.zone ? ` · ${rdv.zone}` : ''}
                        </p>
                      </div>
                      <ChevronRight size={14} style={{ color: 'var(--brand-text-muted)' }} />
                    </div>
                  );
                })}
              </>
            )}
            {/* Section Documents */}
            {searchResults.documents.length > 0 && (
              <>
                <div className="px-4 py-2" style={{ background: 'rgba(255,152,0,0.06)', borderBottom: '1px solid var(--brand-border)', borderTop: '1px solid var(--brand-border)' }}>
                  <span className="text-xs font-600" style={{ color: '#FF9800', fontWeight: 600 }}>Documents</span>
                </div>
                {searchResults.documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => { navigate(`/clients/${doc.clientId}/document/${doc.docType}`); setSearchQuery(''); }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,152,0,0.15)', color: '#FF9800' }}
                    >
                      <Shield size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-600 truncate" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>{doc.clientName}</p>
                      <p className="text-xs truncate capitalize" style={{ color: 'var(--brand-text-muted)' }}>{doc.docLabel}</p>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--brand-text-muted)' }} />
                  </div>
                ))}
              </>
            )}
          </div>
        )}
        {searchQuery.trim() && searchResults.clients.length === 0 && searchResults.rdv.length === 0 && searchResults.documents.length === 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-1 rounded-xl px-4 py-3 z-50"
            style={{ background: '#0D1E38', border: '1px solid var(--brand-border)' }}
          >
            <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>Aucun résultat pour « {searchQuery} »</p>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Users} label="Clients actifs" value={stats.clientsActifs} color="var(--brand-cyan)" />
        <StatCard icon={Users} label="Majeurs" value={stats.clientsMajeurs} color="#34d399" />
        <StatCard icon={Shield} label="Mineurs" value={stats.clientsMineurs} color="#9C27B0" />
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

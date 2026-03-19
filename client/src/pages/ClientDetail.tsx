/*
 * DESIGN: Studio Nocturne — Détail client avec onglets: infos, prestations, documents, RGPD
 */
import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, Phone, Mail, MapPin, CreditCard, Calendar, FileText, Shield, Trash2, Archive, AlertTriangle, CheckCircle } from 'lucide-react';
import { DOCUMENT_LABELS, RGPDStatus } from '@/lib/types';
import { toast } from 'sonner';

const RGPD_COLORS: Record<RGPDStatus, string> = { ok: '#4CAF50', warning: '#FF9800', urgent: '#F44336', expired: '#9C27B0' };
const RGPD_LABELS: Record<RGPDStatus, string> = { ok: 'Conforme', warning: 'Attention (90j)', urgent: 'Urgent (30j)', expired: 'Expiré' };

type Tab = 'infos' | 'prestations' | 'documents' | 'rgpd';

export default function ClientDetail() {
  const params = useParams<{ id: string }>();
  const { getClientById, updateClient, deleteClient } = useApp();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>('infos');

  const client = getClientById(params.id);

  if (!client) {
    return (
      <div className="p-6 text-center">
        <p style={{ color: 'var(--brand-text-muted)' }}>Client introuvable</p>
        <button onClick={() => navigate('/clients')} className="mt-3 text-sm" style={{ color: 'var(--brand-cyan)' }}>← Retour aux clients</button>
      </div>
    );
  }

  const age = Math.floor((Date.now() - new Date(client.dateNaissance).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  const rgpdColor = RGPD_COLORS[client.rgpdStatus];
  const suppDate = new Date(client.dateSuppressionPrevue);
  const diffDays = Math.floor((suppDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const handleArchive = () => {
    updateClient({ ...client, estArchive: !client.estArchive, dateArchivage: client.estArchive ? undefined : new Date().toISOString().split('T')[0] });
    toast.success(client.estArchive ? 'Client désarchivé' : 'Client archivé');
  };

  const handleDelete = () => {
    if (confirm(`Supprimer définitivement ${client.prenom} ${client.nom} ? Cette action est irréversible.`)) {
      deleteClient(client.id);
      navigate('/clients');
      toast.success('Client supprimé');
    }
  };

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'infos', label: 'Infos', icon: CreditCard },
    { key: 'prestations', label: 'Prestations', icon: Calendar },
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'rgpd', label: 'RGPD', icon: Shield },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b sticky top-0 z-10" style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-navy)' }}>
        <button onClick={() => navigate('/clients')} className="p-2 rounded-lg hover:bg-white/10 transition-all">
          <ArrowLeft size={18} style={{ color: 'var(--brand-text-muted)' }} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-700 truncate" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>
              {client.prenom} {client.nom}
            </h1>
            {client.estMineur && <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: '#9C27B022', color: '#9C27B0', border: '1px solid #9C27B0' }}>Mineur</span>}
            {client.estArchive && <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--brand-text-muted)', border: '1px solid var(--brand-border)' }}>Archivé</span>}
          </div>
          <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>{age} ans · {client.telephone}</p>
        </div>
        <span className="text-xs px-2 py-1 rounded font-600 flex-shrink-0" style={{ background: rgpdColor + '22', color: rgpdColor, border: `1px solid ${rgpdColor}`, fontWeight: 600 }}>
          {RGPD_LABELS[client.rgpdStatus]}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b overflow-x-auto" style={{ borderColor: 'var(--brand-border)' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-4 py-3 text-sm whitespace-nowrap transition-all border-b-2"
            style={{
              color: tab === t.key ? 'var(--brand-cyan)' : 'var(--brand-text-muted)',
              borderBottomColor: tab === t.key ? 'var(--brand-cyan)' : 'transparent',
              fontWeight: tab === t.key ? 600 : 400,
            }}>
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === 'infos' && (
          <>
            <div className="studio-card p-4 space-y-3">
              <p className="text-xs font-600 uppercase tracking-wide" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>Identité</p>
              {[
                { icon: CreditCard, label: 'Né(e) le', value: new Date(client.dateNaissance).toLocaleDateString('fr-FR') + ` (${age} ans)` },
                { icon: Phone, label: 'Téléphone', value: client.telephone },
                { icon: Mail, label: 'Email', value: client.email || '—' },
                { icon: MapPin, label: 'Adresse', value: [client.adresse, client.codePostal, client.ville].filter(Boolean).join(', ') || '—' },
                { icon: CreditCard, label: 'Pièce d\'identité', value: client.pieceIdentiteType ? `${client.pieceIdentiteType} ${client.pieceIdentiteNumero || ''}` : '—' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <item.icon size={14} style={{ color: 'var(--brand-text-muted)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>{item.label}</p>
                    <p className="text-sm" style={{ color: 'var(--brand-text)' }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={handleArchive} className="flex-1 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-muted)' }}>
                <Archive size={14} />{client.estArchive ? 'Désarchiver' : 'Archiver'}
              </button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all"
                style={{ background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)', color: '#F44336' }}>
                <Trash2 size={14} />Supprimer
              </button>
            </div>
          </>
        )}

        {tab === 'prestations' && (
          <div>
            {client.prestations.length === 0 ? (
              <div className="text-center py-12">
                <Calendar size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--brand-text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>Aucune prestation enregistrée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {client.prestations.map(p => (
                  <div key={p.id} className="studio-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded capitalize" style={{ background: 'var(--brand-cyan-dim)', color: 'var(--brand-cyan)', border: '1px solid rgba(131,208,245,0.3)' }}>{p.type}</span>
                      <span className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>{new Date(p.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <p className="text-sm font-600" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>{p.zone}</p>
                    {p.description && <p className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>{p.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'documents' && (
          <div>
            {client.documentsAssocies.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--brand-text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>Aucun document associé</p>
              </div>
            ) : (
              <div className="space-y-2">
                {client.documentsAssocies.map(docType => {
                  const doc = client.documents.find(d => d.type === docType);
                  const status = doc?.status || 'empty';
                  const statusColors = { empty: '#FF9800', filled: 'var(--brand-cyan)', signed: '#4CAF50' };
                  const statusLabels = { empty: 'À remplir', filled: 'Rempli', signed: 'Signé' };
                  return (
                    <div key={docType} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
                      <FileText size={14} style={{ color: 'var(--brand-text-muted)', flexShrink: 0 }} />
                      <span className="flex-1 text-sm" style={{ color: 'var(--brand-text)' }}>{DOCUMENT_LABELS[docType]}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: statusColors[status] + '22', color: statusColors[status], border: `1px solid ${statusColors[status]}` }}>
                        {statusLabels[status]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'rgpd' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ background: rgpdColor + '11', border: `1px solid ${rgpdColor}33` }}>
              <div className="flex items-center gap-2 mb-2">
                {client.rgpdStatus === 'ok' ? <CheckCircle size={16} style={{ color: rgpdColor }} /> : <AlertTriangle size={16} style={{ color: rgpdColor }} />}
                <span className="text-sm font-600" style={{ color: rgpdColor, fontWeight: 600 }}>{RGPD_LABELS[client.rgpdStatus]}</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
                Suppression prévue le {suppDate.toLocaleDateString('fr-FR')}
                {diffDays >= 0 ? ` (dans ${diffDays} jours)` : ` (dépassée de ${Math.abs(diffDays)} jours)`}
              </p>
            </div>

            <div className="studio-card p-4 space-y-3">
              <p className="text-xs font-600 uppercase tracking-wide" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>Dates clés</p>
              {[
                { label: 'Date de création', value: client.dateCreation ? new Date(client.dateCreation).toLocaleDateString('fr-FR') : '—' },
                { label: 'Date de consentement', value: client.dateConsentement ? new Date(client.dateConsentement).toLocaleDateString('fr-FR') : '—' },
                { label: 'Suppression prévue', value: suppDate.toLocaleDateString('fr-FR') },
              ].map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>{item.label}</span>
                  <span className="text-sm" style={{ color: 'var(--brand-text)' }}>{item.value}</span>
                </div>
              ))}
            </div>

            {client.rgpdDroitsExerces.length > 0 && (
              <div className="studio-card p-4">
                <p className="text-xs font-600 uppercase tracking-wide mb-3" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>Droits exercés</p>
                <div className="space-y-2">
                  {client.rgpdDroitsExerces.map((droit, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded capitalize" style={{ background: 'var(--brand-cyan-dim)', color: 'var(--brand-cyan)' }}>{droit.type}</span>
                      <span className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>{new Date(droit.date).toLocaleDateString('fr-FR')}</span>
                      {droit.note && <span className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>— {droit.note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(client.rgpdStatus === 'urgent' || client.rgpdStatus === 'expired') && (
              <button
                onClick={() => {
                  const d = new Date();
                  d.setFullYear(d.getFullYear() + 5);
                  updateClient({ ...client, dateConsentement: new Date().toISOString().split('T')[0], dateSuppressionPrevue: d.toISOString().split('T')[0] });
                  toast.success('Consentement renouvelé — suppression repoussée à 5 ans');
                }}
                className="w-full py-3 rounded-xl text-sm font-600 transition-all"
                style={{ background: '#4CAF5022', border: '1px solid #4CAF50', color: '#4CAF50', fontWeight: 600 }}
              >
                Renouveler le consentement
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

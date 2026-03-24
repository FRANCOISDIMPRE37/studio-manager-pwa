/*
 * DESIGN: Studio Nocturne — Détail client avec onglets: infos, prestations, documents, RGPD
 */
import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, Phone, Mail, CreditCard, FileText, Trash2, Archive, Edit, PlusCircle, Send, X, Loader2, StickyNote, ShieldCheck, Clock, AlertTriangle, CheckCircle2, Lock, Printer } from 'lucide-react';
import { DOCUMENT_LABELS, DocumentType } from '@/lib/types';

// Ordre canonique des documents (01 avant 02, etc.)
const DOC_ORDER: DocumentType[] = [
  // Mineurs (01, 02)
  'questionnaire_mineur',
  'autorisation_parentale',
  // Majeurs piercing (03, 04, puis soins)
  'questionnaire_majeur',
  'fiche_seance_piercing',
  'soins_oreilles',
  'soins_nez',
  'soins_bouche_levres',
  'soins_nombril',
  'soins_mamelons',
  'soins_arcade_sourcil',
  'soins_surface_dermal',
  // Tatouage
  'questionnaire_tatouage_majeur',
  'consentement_soins_tatouage',
  'fiche_seance_tatouage',
  // Dermographie
  'questionnaire_dermographe',
  'soins_dermographe',
  'fiche_seance_dermographe',
  // Divers
  'engagement_confidentialite',
  'affichage_salon',
];
function sortDocs(docs: DocumentType[]): DocumentType[] {
  return [...docs].sort((a, b) => {
    const ia = DOC_ORDER.indexOf(a);
    const ib = DOC_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

type Tab = 'infos' | 'documents' | 'rgpd';

export default function ClientDetail() {
  const params = useParams<{ id: string }>();
  const { getClientById, updateClient, deleteClient } = useApp();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>('infos');
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierEmail, setDossierEmail] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [editingPrestations, setEditingPrestations] = useState(false);
  const [prestationsTemp, setPrestationsTemp] = useState<string[]>([]);

  const PRESTATIONS_OPTIONS = [
    'Oreilles', 'Nez', 'Nombril', 'Mamelons',
    'Arcade / Sourcil', 'Surface / Dermal', 'Tatouage', 'Dermographie',
  ];

  const openEditPrestations = () => {
    setPrestationsTemp(client?.prestationsSouhaitees || []);
    setEditingPrestations(true);
  };

  const togglePrestationTemp = (p: string) => {
    setPrestationsTemp(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const savePrestations = () => {
    updateClient({ ...client!, prestationsSouhaitees: prestationsTemp });
    setEditingPrestations(false);
    toast.success('Prestations mises à jour');
  };
  const sendDossier = trpc.smtp.sendClientDossier.useMutation({
    onSuccess: () => {
      toast.success('Dossier envoyé avec succès !');
      setShowDossierModal(false);
    },
    onError: (err) => toast.error(err.message),
  });

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


  const handleArchive = () => {
    updateClient({ ...client, estArchive: !client.estArchive, dateArchivage: client.estArchive ? undefined : new Date().toISOString().split('T')[0] });
    toast.success(client.estArchive ? 'Client désarchivé' : 'Client archivé');
  };

  const handleSendDossier = () => {
    if (!dossierEmail) { toast.error('Veuillez saisir une adresse email'); return; }
    const docs = client!.documentsAssocies.map(docType => {
      const doc = client!.documents?.find(d => d.type === docType);
      return {
        id: doc?.id || docType,
        type: docType,
        label: DOCUMENT_LABELS[docType] || docType,
        signed: doc?.status === 'signed',
        updatedAt: (doc as any)?.updatedAt,
      };
    });
    sendDossier.mutate({
      to: dossierEmail,
      clientId: client!.id,
      clientNom: client!.nom,
      clientPrenom: client!.prenom,
      clientDateNaissance: client!.dateNaissance ? new Date(client!.dateNaissance).toLocaleDateString('fr-FR') : undefined,
      clientTelephone: client!.telephone || undefined,
      documents: docs,
    });
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
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'rgpd', label: 'RGPD', icon: ShieldCheck },
  ];

  return (
    <>
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
          <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>{age} ans · {client.telephone}{client.numeroClient ? ` · ${client.numeroClient}` : ''}</p>
        </div>

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
                ...(client.numeroClient ? [{ icon: CreditCard, label: 'N° client', value: client.numeroClient }] : []),
                { icon: CreditCard, label: 'Né(e) le', value: new Date(client.dateNaissance).toLocaleDateString('fr-FR') + ` (${age} ans)` },
                { icon: Phone, label: 'Téléphone', value: client.telephone },

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

            {/* Bloc Prestations souhaitées */}
            <div className="studio-card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-600 uppercase tracking-wide" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>Prestations souhaitées</p>
                <button
                  onClick={openEditPrestations}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all"
                  style={{ color: 'var(--brand-cyan)', background: 'rgba(131,208,245,0.08)', border: '1px solid rgba(131,208,245,0.2)' }}
                >
                  <Edit size={11} /> Modifier
                </button>
              </div>
              {client.prestationsSouhaitees && client.prestationsSouhaitees.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {client.prestationsSouhaitees.map(p => (
                    <span
                      key={p}
                      className="px-3 py-1 rounded-full text-xs"
                      style={{ background: 'rgba(131,208,245,0.12)', color: 'var(--brand-cyan)', border: '1px solid rgba(131,208,245,0.3)', fontWeight: 600 }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>Aucune prestation sélectionnée</p>
              )}
            </div>

            {/* Modal modification prestations */}
            {editingPrestations && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
                <div className="w-full max-w-sm rounded-xl p-5" style={{ background: 'var(--brand-navy-light)', border: '1px solid var(--brand-border)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-700" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>Modifier les prestations</h3>
                    <button onClick={() => setEditingPrestations(false)} className="p-1 rounded-lg hover:bg-white/10">
                      <X size={16} style={{ color: 'var(--brand-text-muted)' }} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {PRESTATIONS_OPTIONS.map(p => {
                      const selected = prestationsTemp.includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => togglePrestationTemp(p)}
                          className="px-3 py-1.5 rounded-full text-xs transition-all"
                          style={{
                            background: selected ? 'rgba(131,208,245,0.18)' : 'rgba(255,255,255,0.04)',
                            color: selected ? 'var(--brand-cyan)' : 'var(--brand-text-muted)',
                            border: selected ? '1px solid rgba(131,208,245,0.5)' : '1px solid var(--brand-border)',
                            fontWeight: selected ? 700 : 400,
                          }}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingPrestations(false)}
                      className="flex-1 py-2 rounded-lg text-sm"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--brand-text-muted)', border: '1px solid var(--brand-border)' }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={savePrestations}
                      className="flex-1 py-2 rounded-lg text-sm font-700"
                      style={{ background: 'var(--brand-cyan)', color: '#0a1628', fontWeight: 700 }}
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bloc Notes */}
            <div className="studio-card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-600 uppercase tracking-wide" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>
                  <StickyNote size={12} className="inline mr-1.5" />Notes
                </p>
                {!editingNotes ? (
                  <button
                    onClick={() => { setNotesValue(client.notes || ''); setEditingNotes(true); }}
                    className="text-xs px-2 py-1 rounded transition-all"
                    style={{ color: 'var(--brand-cyan)', background: 'var(--brand-cyan-dim)' }}
                  >
                    <Edit size={11} className="inline mr-1" />Modifier
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingNotes(false)}
                      className="text-xs px-2 py-1 rounded transition-all"
                      style={{ color: 'var(--brand-text-muted)', background: 'rgba(255,255,255,0.05)' }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => { updateClient({ ...client, notes: notesValue }); setEditingNotes(false); toast.success('Notes sauvegardées'); }}
                      className="text-xs px-2 py-1 rounded transition-all"
                      style={{ color: 'var(--brand-navy)', background: 'var(--brand-cyan)', fontWeight: 600 }}
                    >
                      Sauvegarder
                    </button>
                  </div>
                )}
              </div>
              {editingNotes ? (
                <textarea
                  value={notesValue}
                  onChange={e => setNotesValue(e.target.value)}
                  rows={4}
                  placeholder="Allergies, préférences, observations post-séance..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }}
                />
              ) : (
                <p className="text-sm whitespace-pre-wrap" style={{ color: client.notes ? 'var(--brand-text)' : 'var(--brand-text-muted)' }}>
                  {client.notes || 'Aucune note — appuyez sur Modifier pour en ajouter.'}
                </p>
              )}
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


        {tab === 'rgpd' && (() => {
          const now = new Date();
          const dateCreation = new Date(client.dateCreation);
          const dateArchivageAuto = new Date(dateCreation);
          dateArchivageAuto.setFullYear(dateArchivageAuto.getFullYear() + 3);
          const joursRestants = Math.ceil((dateArchivageAuto.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const dejaArchive = client.estArchive;
          const expireOuBientot = joursRestants <= 30 && !dejaArchive;
          const expire = joursRestants <= 0 && !dejaArchive;

          const statusColor = dejaArchive ? '#9E9E9E' : expire ? '#F44336' : expireOuBientot ? '#FF9800' : '#4CAF50';
          const statusLabel = dejaArchive ? 'Archivé' : expire ? 'Archivage requis' : expireOuBientot ? 'Archivage imminent' : 'Données actives';
          const StatusIcon = dejaArchive ? Lock : expire ? AlertTriangle : expireOuBientot ? AlertTriangle : CheckCircle2;

          return (
            <div className="space-y-4">
              {/* Statut RGPD */}
              <div className="p-4 rounded-xl" style={{ background: statusColor + '15', border: `1px solid ${statusColor}40` }}>
                <div className="flex items-center gap-3 mb-3">
                  <StatusIcon size={18} style={{ color: statusColor }} />
                  <span className="text-sm font-semibold" style={{ color: statusColor }}>{statusLabel}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p style={{ color: 'var(--brand-text-muted)' }}>Date de création</p>
                    <p className="font-semibold mt-0.5" style={{ color: 'var(--brand-text)' }}>{dateCreation.toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--brand-text-muted)' }}>Archivage automatique</p>
                    <p className="font-semibold mt-0.5" style={{ color: dejaArchive ? 'var(--brand-text-muted)' : statusColor }}>
                      {dejaArchive ? (client.dateArchivage ? new Date(client.dateArchivage).toLocaleDateString('fr-FR') : '—') : dateArchivageAuto.toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                {!dejaArchive && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid ' + statusColor + '30' }}>
                    <div className="flex items-center gap-2">
                      <Clock size={12} style={{ color: statusColor }} />
                      <span className="text-xs" style={{ color: statusColor }}>
                        {expire ? 'Délai de conservation dépassé — archivage requis' : `${joursRestants} jour${joursRestants > 1 ? 's' : ''} avant archivage automatique`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Informations RGPD */}
              <div className="p-4 rounded-xl space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
                <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>Informations légales</p>
                <div className="space-y-2 text-xs" style={{ color: 'var(--brand-text-muted)' }}>
                  <p>• Durée de conservation : <span style={{ color: 'var(--brand-text)' }}>3 ans</span> à compter de la création du dossier</p>
                  <p>• Base légale : <span style={{ color: 'var(--brand-text)' }}>Consentement (Art. 6.1.a RGPD)</span></p>
                  <p>• Responsable du traitement : <span style={{ color: 'var(--brand-text)' }}>Studio de piercing / tatouage</span></p>
                  <p>• Après archivage : les données personnelles sont anonymisées, seules les données de traçabilité médicale sont conservées</p>
                </div>
              </div>

              {/* Droits exercés */}
              {client.rgpdDroitsExerces && client.rgpdDroitsExerces.length > 0 && (
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
                  <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>Droits exercés</p>
                  <div className="space-y-2">
                    {client.rgpdDroitsExerces.map((droit, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#4CAF50' }} />
                        <div>
                          <span style={{ color: 'var(--brand-text)' }}>{droit.type}</span>
                          {droit.date && <span className="ml-2" style={{ color: 'var(--brand-text-muted)' }}>— {new Date(droit.date).toLocaleDateString('fr-FR')}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleArchive}
                  className="flex-1 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all"
                  style={dejaArchive
                    ? { background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-muted)' }
                    : { background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)', color: '#F44336' }
                  }
                >
                  <Archive size={14} />{dejaArchive ? 'Désarchiver' : 'Archiver maintenant'}
                </button>
              </div>
              <p className="text-xs text-center" style={{ color: 'var(--brand-text-muted)' }}>
                L'archivage anonymise les données personnelles et déplace le client dans la section Archives.
              </p>
            </div>
          );
        })()}

        {tab === 'documents' && (
          <div className="space-y-3">

            {client.documentsAssocies.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--brand-text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>Aucun document associé</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortDocs(client.documentsAssocies).map(docType => {
                  const doc = client.documents?.find(d => d.type === docType);
                  const status = doc?.status || 'empty';
                  const statusColors = { empty: '#FF9800', filled: 'var(--brand-cyan)', signed: '#4CAF50' };
                  const statusLabels = { empty: 'À remplir', filled: 'Rempli', signed: 'Signé' };
                  const canPrint = status === 'filled' || status === 'signed';
                  return (
                    <div
                      key={docType}
                      className="w-full flex items-center gap-2 p-3 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}
                    >
                      <button
                        onClick={() => navigate(`/clients/${client.id}/document/${docType}`)}
                        className="flex items-center gap-3 flex-1 text-left transition-all hover:opacity-80"
                      >
                        <FileText size={14} style={{ color: 'var(--brand-text-muted)', flexShrink: 0 }} />
                        <span className="flex-1 text-sm" style={{ color: 'var(--brand-text)' }}>{DOCUMENT_LABELS[docType]}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: statusColors[status] + '22', color: statusColors[status], border: `1px solid ${statusColors[status]}` }}>
                          {statusLabels[status]}
                        </span>
                        <Edit size={12} style={{ color: 'var(--brand-text-muted)', flexShrink: 0 }} />
                      </button>
                      {canPrint && (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/clients/${client.id}/document/${docType}?print=1`); }}
                          title="Imprimer ce document"
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all hover:opacity-80 flex-shrink-0"
                          style={{ background: 'rgba(131,208,245,0.1)', border: '1px solid rgba(131,208,245,0.3)', color: 'var(--brand-cyan)' }}
                        >
                          <Printer size={13} />
                          <span className="text-xs font-medium">Imprimer</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {/* Bouton ajouter un document */}
            <button
              onClick={() => navigate('/documents')}
              className="w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
              style={{ background: 'rgba(131,208,245,0.05)', border: '1px dashed rgba(131,208,245,0.3)', color: 'var(--brand-cyan)' }}
            >
              <PlusCircle size={14} />
              Voir tous les documents disponibles
            </button>
          </div>
        )}


      </div>
    </div>
    {/* Modal envoi dossier complet */}
    {showDossierModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
        <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: 'var(--brand-navy)', border: '1px solid var(--brand-border)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send size={18} style={{ color: 'var(--brand-cyan)' }} />
              <h3 className="text-base" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>Envoyer le dossier complet</h3>
            </div>
            <button onClick={() => setShowDossierModal(false)} className="p-1.5 rounded-lg hover:bg-white/10">
              <X size={16} style={{ color: 'var(--brand-text-muted)' }} />
            </button>
          </div>

          <div className="p-3 rounded-lg" style={{ background: 'rgba(131,208,245,0.05)', border: '1px solid rgba(131,208,245,0.15)' }}>
            <p className="text-sm" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>{client.prenom} {client.nom}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>
              {client.documentsAssocies.length} document{client.documentsAssocies.length > 1 ? 's' : ''}
              {' — '}{client.documents?.filter(d => d.status === 'signed').length || 0} signé{(client.documents?.filter(d => d.status === 'signed').length || 0) > 1 ? 's' : ''}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs" style={{ color: 'var(--brand-text-muted)', fontWeight: 600 }}>Adresse email du destinataire</label>
            <input
              type="email"
              value={dossierEmail}
              onChange={e => setDossierEmail(e.target.value)}
              placeholder="email@exemple.fr"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }}
            />
          </div>

          <div className="max-h-44 overflow-y-auto space-y-1">
            <p className="text-xs mb-2" style={{ color: 'var(--brand-text-muted)', fontWeight: 600 }}>Documents inclus :</p>
            {sortDocs(client.documentsAssocies).map(docType => {
              const doc = client.documents?.find(d => d.type === docType);
              const signed = doc?.status === 'signed';
              return (
                <div key={docType} className="flex items-center justify-between py-1.5 px-2 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-xs flex-1 truncate" style={{ color: 'var(--brand-text)' }}>{DOCUMENT_LABELS[docType] || docType}</span>
                  <span className="text-xs ml-2 flex-shrink-0" style={{ color: signed ? '#4CAF50' : '#FF9800' }}>
                    {signed ? '✓ Signé' : '○ Non signé'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setShowDossierModal(false)}
              className="flex-1 py-2.5 rounded-lg text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-muted)' }}
            >
              Annuler
            </button>
            <button
              onClick={handleSendDossier}
              disabled={sendDossier.isPending || !dossierEmail}
              className="flex-1 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all"
              style={{ background: 'rgba(131,208,245,0.15)', border: '1px solid rgba(131,208,245,0.4)', color: 'var(--brand-cyan)', fontWeight: 600, opacity: !dossierEmail ? 0.5 : 1 }}
            >
              {sendDossier.isPending ? <><Loader2 size={14} className="animate-spin" />Envoi...</> : <><Send size={14} />Envoyer</>}
            </button>
          </div>
        </div>
      </div>
    )}


    </>
  );
}

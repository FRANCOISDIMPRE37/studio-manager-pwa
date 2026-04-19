/*
 * DESIGN: Studio Nocturne — Page documents avec sélecteur de client et navigation vers formulaires
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Eye, Shield, User, Baby, ChevronRight, Search, X } from 'lucide-react';
import { DOCUMENT_LABELS, DocumentType } from '@/lib/types';
import { useApp } from '@/lib/app-context';
import { useLocation } from 'wouter';

const DOC_CATEGORY_KEYS = [
  {
    titleKey: 'doc_categories.piercing_mineurs',
    icon: Baby,
    color: '#9C27B0',
    docs: ['questionnaire_mineur'] as DocumentType[],
    forMineur: true,
  },
  {
    titleKey: 'doc_categories.piercing_majeurs',
    icon: User,
    color: 'var(--brand-cyan)',
    docs: ['questionnaire_majeur', 'fiche_seance_piercing'] as DocumentType[],
    forMineur: false,
  },
  {
    titleKey: 'doc_categories.soins_piercing',
    icon: Shield,
    color: '#4CAF50',
    docs: ['soins_oreilles', 'soins_nez', 'soins_bouche_levres', 'soins_nombril', 'soins_mamelons', 'soins_arcade_sourcil', 'soins_surface_dermal'] as DocumentType[],
    forMineur: null,
  },
  {
    titleKey: 'doc_categories.tatouage',
    icon: FileText,
    color: '#FF5722',
    docs: ['questionnaire_tatouage_mineur', 'questionnaire_tatouage_majeur', 'fiche_seance_tatouage', 'consentement_soins_tatouage', 'soins_detatouage_laser'] as DocumentType[],
    forMineur: null,
  },
  {
    titleKey: 'doc_categories.dermographie',
    icon: FileText,
    color: '#FF9800',
    docs: ['questionnaire_patch_test', 'questionnaire_dermographe_mineur', 'questionnaire_dermographe', 'fiche_seance_dermographe', 'soins_dermographe', 'fiche_retouche_dermographie'] as DocumentType[],
    forMineur: null,
  },
  {
    titleKey: 'doc_categories.rgpd',
    icon: Shield,
    color: '#E53935',
    docs: ['engagement_confidentialite', 'affichage_salon'] as DocumentType[],
  },
  {
    titleKey: 'doc_categories.archives',
    icon: FileText,
    color: '#607D8B',
    docs: ['archivage_dossier_papier'] as DocumentType[],
    forMineur: null,
  },
];

export default function Documents() {
  const { state } = useApp();
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [selectedDoc, setSelectedDoc] = useState<DocumentType | null>(null);

  // Catégories avec titres traduits dynamiquement
  const specialites = state.salonInfo?.specialites ?? { piercing: true, tatouage: true, dermographie: true };
  const DOC_CATEGORIES = DOC_CATEGORY_KEYS.map(cat => ({
    ...cat,
    title: t(cat.titleKey),
  })).filter(cat => {
    const key = cat.titleKey;
    if (key.includes('piercing') || key.includes('soins_piercing')) return specialites.piercing;
    if (key.includes('tatouage')) return specialites.tatouage;
    if (key.includes('dermographie')) return specialites.dermographie;
    return true;
  });
  const [clientSearch, setClientSearch] = useState('');

  const activeClients = state.clients.filter(c => !c.estArchive);

  const filteredClients = activeClients.filter(c => {
    const q = clientSearch.toLowerCase();
    return (
      c.nom.toLowerCase().includes(q) ||
      c.prenom.toLowerCase().includes(q) ||
      (c.telephone && c.telephone.includes(q))
    );
  });

  const handlePreview = (doc: DocumentType) => {
    setSelectedDoc(doc);
    setClientSearch('');
  };

  const handleSelectClient = (clientId: string) => {
    if (!selectedDoc) return;
    navigate(`/clients/${clientId}/document/${selectedDoc}`);
    setSelectedDoc(null);
  };

  const handleOpenWithoutClient = () => {
    if (!selectedDoc) return;
    navigate(`/document/${selectedDoc}`);
    setSelectedDoc(null);
  };

  const handleOpenWithoutSalarie = () => {
    navigate('/rgpd-salarie');
    setSelectedDoc(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-700" style={{ color: 'var(--brand-text)', fontFamily: 'Outfit', fontWeight: 700 }}>{t('documents.title')}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>{t('documents.subtitle', 'Fiches réglementaires et formulaires RGPD')}</p>
      </div>

      {/* Info RGPD */}
      <div className="p-4 rounded-xl" style={{ background: 'rgba(131, 208, 245, 0.05)', border: '1px solid rgba(131, 208, 245, 0.2)' }}>
        <div className="flex items-start gap-3">
          <Shield size={18} style={{ color: 'var(--brand-cyan)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-600" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>{t('documents.rgpd_title', 'Conformité RGPD')}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>
              {t('documents.rgpd_desc', 'Tous les documents sont conformes au RGPD. Les données collectées sont conservées 5 ans maximum. Les clients peuvent exercer leurs droits d\'accès, rectification et effacement à tout moment.')}
            </p>
          </div>
        </div>
      </div>

      {/* Document categories */}
      {DOC_CATEGORIES.map(cat => (
        <div key={cat.title} className="studio-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: cat.color + '22' }}>
              <cat.icon size={16} style={{ color: cat.color }} />
            </div>
            <h2 className="text-sm font-600" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>{cat.title}</h2>
            <span className="text-xs px-1.5 py-0.5 rounded ml-auto" style={{ background: cat.color + '22', color: cat.color }}>
              {cat.docs.length} {t('documents.sheet', 'fiche')}{cat.docs.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-2">
            {cat.docs.map(doc => (
              <div
                key={doc}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}
              >
                <FileText size={14} style={{ color: 'var(--brand-text-muted)', flexShrink: 0 }} />
                <span className="flex-1 text-sm" style={{ color: 'var(--brand-text)' }}>{t(`doc_labels.${doc}`, DOCUMENT_LABELS[doc])}</span>
                <button
                  onClick={() => handlePreview(doc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-600 transition-all hover:opacity-80"
                  style={{
                    background: 'rgba(131, 208, 245, 0.1)',
                    color: 'var(--brand-cyan)',
                    fontWeight: 600,
                    border: '1px solid rgba(131, 208, 245, 0.2)',
                  }}
                  title="Ouvrir pour un client"
                >
                  <Eye size={12} />
                  {t('common.view', 'Ouvrir')}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="text-center py-4">
        <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
          Documents fournis par <span style={{ color: 'var(--brand-cyan)' }}>Intemporelle</span> — RGPD & Cybersécurité · Tours (37)
        </p>
      </div>

      {/* Modal sélecteur de client */}
      {selectedDoc && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedDoc(null); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-5 space-y-4"
            style={{ background: 'var(--brand-card)', border: '1px solid var(--brand-border)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-700 text-base" style={{ color: 'var(--brand-text)', fontWeight: 700, fontFamily: 'Outfit' }}>
                  {t('documents.open_doc', 'Ouvrir le document')}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--brand-text-muted)' }}>
                  {t(`doc_labels.${selectedDoc}`, DOCUMENT_LABELS[selectedDoc])}
                </p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-2 rounded-lg hover:bg-white/10 transition-all"
                style={{ color: 'var(--brand-text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Bouton accès rapide sans client */}
            <button
              onClick={handleOpenWithoutClient}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:opacity-80"
              style={{ background: 'rgba(131,208,245,0.1)', border: '1px solid rgba(131,208,245,0.3)' }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(131,208,245,0.2)' }}>
                <FileText size={16} style={{ color: 'var(--brand-cyan)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-600" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>{t('documents.open_without_client', 'Ouvrir sans client')}</p>
                <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>{t('documents.open_without_client_desc', 'Remplir manuellement · Impression rapide')}</p>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--brand-cyan)', flexShrink: 0 }} />
            </button>

            {selectedDoc === 'archivage_dossier_papier' && (
              <button
                onClick={() => navigate('/archives-numerisees')}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:opacity-80"
                style={{ background: 'rgba(96,125,139,0.15)', border: '1px solid rgba(96,125,139,0.4)' }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(96,125,139,0.2)' }}>
                  <Search size={16} style={{ color: '#607D8B' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-600" style={{ color: '#607D8B', fontWeight: 600 }}>📁 Voir les archives numérisées</p>
                  <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>Rechercher un ancien dossier papier</p>
                </div>
                <ChevronRight size={16} style={{ color: '#607D8B', flexShrink: 0 }} />
              </button>
            )}
            {selectedDoc === 'engagement_confidentialite' && (
              <button
                onClick={handleOpenWithoutSalarie}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:opacity-80"
                style={{ background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.35)' }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,193,7,0.2)' }}>
                  <User size={16} style={{ color: '#FFC107' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-600" style={{ color: '#FFC107', fontWeight: 600 }}>Ouvrir sans salarié</p>
                  <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>Gérer les salariés · RGPD Art. 29</p>
                </div>
                <ChevronRight size={16} style={{ color: '#FFC107', flexShrink: 0 }} />
              </button>
            )}

            {/* Séparateur */}
            <div className="flex items-center gap-2">
              <div className="h-px flex-1" style={{ background: 'var(--brand-border)' }} />
              <span className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>{t('documents.or_choose_client', 'ou choisir un client')}</span>
              <div className="h-px flex-1" style={{ background: 'var(--brand-border)' }} />
            </div>

            {/* Recherche */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--brand-text-muted)' }} />
              <input
                type="text"
                placeholder={t('common.search') + '...'}
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--brand-border)',
                  color: 'var(--brand-text)',
                }}
              />
            </div>

            {/* Liste clients */}
            <div className="overflow-y-auto flex-1 space-y-1.5" style={{ minHeight: 0 }}>
              {filteredClients.length === 0 ? (
                <div className="text-center py-8" style={{ color: 'var(--brand-text-muted)' }}>
                  <User size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t('clients.no_clients', 'Aucun client trouvé')}</p>
                  <button
                    onClick={() => navigate('/clients')}
                    className="mt-3 text-xs underline"
                    style={{ color: 'var(--brand-cyan)' }}
                  >
                    {t('clients.create_new', 'Créer un nouveau client')}
                  </button>
                </div>
              ) : (
                filteredClients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => handleSelectClient(client.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:bg-white/10"
                    style={{ border: '1px solid var(--brand-border)' }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-700 flex-shrink-0"
                      style={{
                        background: client.estMineur ? 'rgba(156, 39, 176, 0.2)' : 'rgba(131, 208, 245, 0.15)',
                        color: client.estMineur ? '#9C27B0' : 'var(--brand-cyan)',
                        fontWeight: 700,
                        fontFamily: 'Outfit',
                      }}
                    >
                      {client.prenom[0]}{client.nom[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-600 truncate" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>
                        {client.prenom} {client.nom}
                        {client.estMineur && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(156, 39, 176, 0.15)', color: '#9C27B0' }}>
                            Mineur
                          </span>
                        )}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--brand-text-muted)' }}>
                        {client.telephone || client.email || 'Aucun contact'}
                      </p>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--brand-text-muted)', flexShrink: 0 }} />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

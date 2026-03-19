/*
 * DESIGN: Studio Nocturne — Page documents avec liste des fiches RGPD disponibles
 */
import { FileText, Download, Eye, Shield, User, Baby } from 'lucide-react';
import { DOCUMENT_LABELS, DocumentType } from '@/lib/types';
import { toast } from 'sonner';

const DOC_CATEGORIES = [
  {
    title: 'Mineurs',
    icon: Baby,
    color: '#9C27B0',
    docs: ['questionnaire_mineur', 'autorisation_parentale'] as DocumentType[],
  },
  {
    title: 'Majeurs',
    icon: User,
    color: 'var(--brand-cyan)',
    docs: ['questionnaire_majeur', 'fiche_seance_piercing'] as DocumentType[],
  },
  {
    title: 'Soins Piercing',
    icon: Shield,
    color: '#4CAF50',
    docs: ['soins_oreilles', 'soins_nez', 'soins_bouche_levres', 'soins_nombril', 'soins_mamelons', 'soins_arcade_sourcil', 'soins_surface_dermal'] as DocumentType[],
  },
  {
    title: 'Tatouage & Dermographie',
    icon: FileText,
    color: '#FF9800',
    docs: ['cicatrisation_tatouage', 'cicatrisation_dermographie'] as DocumentType[],
  },
];

export default function Documents() {
  const handlePreview = (doc: DocumentType) => {
    toast.info(`Aperçu de "${DOCUMENT_LABELS[doc]}" — Fonctionnalité disponible dans la version complète`);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-700" style={{ color: 'var(--brand-text)', fontFamily: 'Outfit', fontWeight: 700 }}>Documents</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>Fiches réglementaires et formulaires RGPD</p>
      </div>

      {/* Info RGPD */}
      <div className="p-4 rounded-xl" style={{ background: 'rgba(131, 208, 245, 0.05)', border: '1px solid rgba(131, 208, 245, 0.2)' }}>
        <div className="flex items-start gap-3">
          <Shield size={18} style={{ color: 'var(--brand-cyan)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-600" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>Conformité RGPD</p>
            <p className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>
              Tous les documents sont conformes au RGPD. Les données collectées sont conservées 5 ans maximum.
              Les clients peuvent exercer leurs droits d'accès, rectification et effacement à tout moment.
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
              {cat.docs.length} fiche{cat.docs.length > 1 ? 's' : ''}
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
                <span className="flex-1 text-sm" style={{ color: 'var(--brand-text)' }}>{DOCUMENT_LABELS[doc]}</span>
                <button
                  onClick={() => handlePreview(doc)}
                  className="p-1.5 rounded hover:bg-white/10 transition-all"
                  title="Aperçu"
                >
                  <Eye size={14} style={{ color: 'var(--brand-text-muted)' }} />
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
    </div>
  );
}

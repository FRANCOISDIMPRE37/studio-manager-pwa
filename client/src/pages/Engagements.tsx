import { FileText, Shield, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Engagements() {
  const [, navigate] = useLocation();

  const documents = [
    {
      title: '15 — Engagement de Confidentialité',
      subtitle: 'Engagement RGPD à signer',
      path: '/rgpd-salarie',
      accent: '#00bcd4',
    },
    {
      title: '16 — Information Client — Protection des Données (RGPD)',
      subtitle: 'Document copié dans Engagements',
      path: '/document/affichage_salon',
      accent: '#00bcd4',
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Shield size={22} color="#00bcd4" />
        <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: 0 }}>Engagements</h1>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginBottom: 24 }}>
        Documents d'engagement et informations RGPD.
      </p>

      {documents.map((doc) => (
        <button
          key={doc.title}
          onClick={() => navigate(doc.path)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '16px 18px', marginBottom: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, cursor: 'pointer', textAlign: 'left', color: 'white' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(0,188,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: doc.accent, flexShrink: 0 }}>
              <FileText size={18} />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: 'white', fontSize: 14 }}>{doc.title}</p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{doc.subtitle}</p>
            </div>
          </div>
          <ChevronRight size={18} color="rgba(255,255,255,0.45)" />
        </button>
      ))}
    </div>
  );
}

/**
 * PAGE À PROPOS — Propriété Intemporelle
 * Version améliorée : carte interlocuteur, badge CNIL, bouton appel direct,
 * adresse physique, chiffres clés, mentions légales propriété logiciel
 */
import { Phone, Mail, Globe, Shield, Lock, Info, ExternalLink, MapPin, Award, Users, Activity, HardDrive } from 'lucide-react';

export default function APropos() {
  const card: React.CSSProperties = {
    background: 'rgba(15, 32, 64, 0.6)',
    border: '1px solid var(--brand-border)',
    borderRadius: '0.75rem',
    padding: '1.25rem',
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl">
      <h1 className="text-xl font-700" style={{ color: 'var(--brand-text)', fontFamily: 'Outfit', fontWeight: 700 }}>
        À propos
      </h1>

      {/* ── BLOC IDENTITÉ INTEMPORELLE ── */}
      <div style={{
        ...card,
        background: 'linear-gradient(135deg, rgba(10,22,40,0.97) 0%, rgba(17,32,64,0.97) 100%)',
        border: '1px solid rgba(201,168,76,0.35)',
      }}>
        {/* Logo + nom */}
        <div className="flex items-center gap-4 mb-4">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/logo_white_d12a3c81.svg"
            alt="Intemporelle"
            className="w-14 h-14 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-700 leading-tight" style={{ color: 'white', fontFamily: 'Outfit', fontWeight: 700 }}>
              Studio Manager
            </h2>
            <p className="text-sm" style={{ color: 'rgba(201,168,76,0.9)' }}>by Société Intemporelle</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--brand-text-muted)' }}>RGPD & Cybersécurité · Tours (37)</p>
          </div>
          {/* Badge CNIL */}
          <div
            className="flex-shrink-0 flex flex-col items-center justify-center px-3 py-2 rounded-lg text-center"
            style={{ background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.4)', minWidth: 72 }}
          >
            <Award size={16} style={{ color: '#4CAF50', marginBottom: 2 }} />
            <span className="block text-xs font-700" style={{ color: '#4CAF50', fontWeight: 700, lineHeight: 1.2 }}>Agréé</span>
            <span className="block text-xs font-700" style={{ color: '#4CAF50', fontWeight: 700, lineHeight: 1.2 }}>CNIL</span>
            <span className="block" style={{ color: 'rgba(76,175,80,0.7)', fontSize: 10 }}>2019</span>
          </div>
        </div>

        {/* Mention propriété */}
        <div className="p-3 rounded-lg mb-4" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
          <p className="text-xs" style={{ color: 'rgba(201,168,76,0.9)', lineHeight: 1.7 }}>
            ⚖️ Cette application est la <strong>propriété exclusive de la Société Intemporelle</strong>.
            La tablette et le logiciel sont mis à disposition sous licence. Toute reproduction,
            modification ou redistribution est strictement interdite sans autorisation écrite.
          </p>
        </div>

        {/* Chiffres clés */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { icon: Users, value: '+387', label: 'Clients protégés', color: 'var(--brand-cyan)' },
            { icon: Activity, value: '+3 329', label: 'Menaces détectées', color: '#fb923c' },
            { icon: HardDrive, value: '100%', label: 'Données récupérées', color: '#4CAF50' },
          ].map(({ icon: Icon, value, label, color }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center p-2.5 rounded-lg text-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--brand-border)' }}
            >
              <Icon size={14} style={{ color, marginBottom: 4 }} />
              <span className="block font-700 text-sm leading-tight" style={{ color: 'white', fontWeight: 700 }}>{value}</span>
              <span className="block mt-0.5" style={{ color: 'var(--brand-text-muted)', fontSize: 10, lineHeight: 1.3 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CARTE INTERLOCUTEUR ── */}
      <div style={{ ...card, border: '1px solid rgba(131,208,245,0.25)' }}>
        <p className="text-xs font-600 uppercase tracking-wider mb-3" style={{ color: 'var(--brand-text-muted)', fontWeight: 600, fontSize: '10px' }}>
          Votre interlocuteur
        </p>
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar initiales */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-700"
            style={{
              background: 'linear-gradient(135deg, var(--brand-cyan) 0%, rgba(131,208,245,0.5) 100%)',
              color: 'var(--brand-navy)',
              fontFamily: 'Outfit',
              fontWeight: 700,
            }}
          >
            FD
          </div>
          <div>
            <p className="font-700 text-base" style={{ color: 'var(--brand-text)', fontFamily: 'Outfit', fontWeight: 700 }}>
              François DIMPRE
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--brand-cyan)' }}>Direction Générale</p>
            <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>Service Technique & Formation</p>
          </div>
        </div>

        {/* Bouton appel direct — proéminent */}
        <a
          href="tel:+33617074169"
          className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl mb-3 transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, var(--brand-cyan) 0%, rgba(131,208,245,0.8) 100%)',
            color: 'var(--brand-navy)',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 15,
            fontFamily: 'Outfit',
            boxShadow: '0 4px 20px rgba(131,208,245,0.25)',
          }}
        >
          <Phone size={18} />
          <span>06 17 07 41 69</span>
        </a>

        {/* Email + site */}
        <div className="space-y-2">
          {[
            { icon: Mail, label: 'contact@intemporelle.eu', href: 'mailto:contact@intemporelle.eu', sub: 'Support & questions' },
            { icon: Globe, label: 'www.intemporelle.eu', href: 'https://www.intemporelle.eu', sub: 'Site officiel' },
          ].map(({ icon: Icon, label, href, sub }) => (
            <a
              key={href}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand-cyan)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--brand-border)')}
            >
              <Icon size={15} style={{ color: 'var(--brand-cyan)', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <span className="block text-sm truncate">{label}</span>
                <span className="block text-xs" style={{ color: 'var(--brand-text-muted)' }}>{sub}</span>
              </div>
              {href.startsWith('http') && <ExternalLink size={12} style={{ color: 'var(--brand-text-muted)', flexShrink: 0 }} />}
            </a>
          ))}
        </div>

        {/* Adresse physique */}
        <div
          className="flex items-start gap-3 mt-3 p-3 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--brand-border)' }}
        >
          <MapPin size={15} style={{ color: 'var(--brand-cyan)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <span className="block text-sm" style={{ color: 'var(--brand-text)' }}>1, impasse du Palais</span>
            <span className="block text-sm" style={{ color: 'var(--brand-text)' }}>37000 TOURS</span>
            <span className="block text-xs mt-0.5" style={{ color: 'var(--brand-text-muted)' }}>Siège social</span>
          </div>
        </div>
      </div>

      {/* ── DONNÉES CLIENTS ── */}
      <div style={card}>
        <div className="flex items-center gap-2 mb-3">
          <Lock size={16} style={{ color: 'var(--brand-cyan)' }} />
          <h3 className="text-sm font-600" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>Vos données clients</h3>
        </div>
        <p className="text-xs" style={{ color: 'var(--brand-text-muted)', lineHeight: 1.7 }}>
          Toutes les données de vos clients sont stockées{' '}
          <strong style={{ color: 'var(--brand-text)' }}>exclusivement sur cette tablette</strong>,
          dans le navigateur local. Elles ne sont jamais transmises à des serveurs externes.
          Vous en êtes le seul propriétaire et responsable de traitement au sens du RGPD.
        </p>
      </div>

      {/* ── CONFORMITÉ RGPD ── */}
      <div style={card}>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} style={{ color: 'var(--brand-cyan)' }} />
          <h3 className="text-sm font-600" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>Conformité RGPD</h3>
        </div>
        <div className="space-y-2">
          {[
            "Conforme à l'Arrêté du 3 décembre 2008 (piercing & tatouage)",
            'Gestion des durées de conservation (3 ans)',
            'Exercice des droits RGPD (accès, rectification, effacement)',
            "Engagement de confidentialité Art. 29 pour collaborateurs",
            'Agréé CNIL depuis 2019',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span style={{ color: '#4CAF50', flexShrink: 0, marginTop: 1 }}>✓</span>
              <span className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── INFORMATIONS TECHNIQUES ── */}
      <div style={{ ...card, padding: '1rem' }}>
        <div className="flex items-center gap-2 mb-3">
          <Info size={14} style={{ color: 'var(--brand-text-muted)' }} />
          <span className="text-xs font-600" style={{ color: 'var(--brand-text-muted)', fontWeight: 600 }}>Informations techniques</span>
        </div>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs" style={{ color: 'var(--brand-text-muted)' }}>
          {[
            ['Version', 'Mars 2026'],
            ['Propriétaire', 'Société Intemporelle'],
            ['Siège', 'Tours (37)'],
            ['Certification', 'CNIL 2019'],
            ['Licence', 'Usage exclusif — non transférable'],
            ['Support', '06 17 07 41 69'],
          ].map(([k, v]) => (
            <>
              <span key={`k-${k}`}>{k}</span>
              <span key={`v-${k}`} style={{ color: k === 'Support' ? 'var(--brand-cyan)' : 'var(--brand-text)' }}>{v}</span>
            </>
          ))}
        </div>
      </div>
    </div>
  );
}

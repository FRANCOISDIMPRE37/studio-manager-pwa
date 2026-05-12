/**
 * ONBOARDING — Configuration initiale Studio Manager
 * S'affiche uniquement au premier lancement
 * Le client saisit les infos de son salon, crée son PIN, puis démarre l'app
 */
import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { SalonInfo } from '@/lib/types';
import { toast } from 'sonner';
import { Building2, MapPin, Phone, Mail, Hash, User, Lock, ChevronRight, ChevronLeft, Check, ImageIcon } from 'lucide-react';

type Step = 'bienvenue' | 'sterilisation' | 'salon' | 'praticiens' | 'pin' | 'termine';

export default function Onboarding() {
  const { updateSalonInfo, setPin, setAuthenticated } = useApp();
  const [step, setStep] = useState<Step>('bienvenue');
  const [form, setForm] = useState<SalonInfo>({
    nom: '', raisonSociale: '', adresse: '', codePostal: '', ville: '',
    telephone: '', email: '', siret: '', nomPierceur: '', nomTatoueur: '',
    nomDermographe: '', logo: '', siteWeb: '', mentionsLegales: '',
  });
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
  const [pinError, setPinError] = useState('');

  // Pré-remplir depuis les cookies
  useEffect(() => {
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : '';
    };
    const nom = getCookie('ts_nom');
    const email = getCookie('ts_email');
    if (nom) setForm(f => ({ ...f, nom }));
    if (email) setForm(f => ({ ...f, email }));
  }, []);
  const [sterChecks, setSterChecks] = useState({
    engagement: false,
  });
  const logoRef = useRef<HTMLInputElement>(null);

  const field = (label: string, key: keyof SalonInfo, type = 'text', placeholder = '', required = false) => (
    <div>
      <label className="block text-xs mb-1 font-500" style={{ color: 'var(--brand-text-muted)', fontWeight: 500 }}>
        {label}{required && <span style={{ color: 'var(--brand-rose)' }}> *</span>}
      </label>
      <input
        type={type}
        value={(form[key] as string) || ''}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--brand-border)',
          color: 'var(--brand-text)',
          borderRadius: '0.5rem',
          padding: '0.6rem 0.75rem',
          width: '100%',
          fontSize: '14px',
          outline: 'none',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--brand-cyan)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--brand-border)')}
      />
    </div>
  );

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo max 2 Mo'); return; }
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, logo: ev.target?.result as string }));
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePinDigit = (digit: string) => {
    if (pinStep === 'enter') {
      const next = pin1 + digit;
      if (next.length <= 4) {
        setPin1(next);
        if (next.length === 4) setTimeout(() => setPinStep('confirm'), 300);
      }
    } else {
      const next = pin2 + digit;
      if (next.length <= 4) {
        setPin2(next);
        if (next.length === 4) {
          setTimeout(() => {
            if (next === pin1) {
              setPinError('');
              setStep('termine');
            } else {
              setPinError('Les codes ne correspondent pas. Recommencez.');
              setPin1(''); setPin2(''); setPinStep('enter');
            }
          }, 300);
        }
      }
    }
  };

  const handlePinDelete = () => {
    if (pinStep === 'enter') setPin1(p => p.slice(0, -1));
    else setPin2(p => p.slice(0, -1));
  };

  const handleFinish = () => {
    updateSalonInfo(form);
    setPin(pin1);
    setAuthenticated(true);
    toast.success('Studio Manager configuré ! Bienvenue 🎉');
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(15, 32, 64, 0.85)',
    border: '1px solid var(--brand-border)',
    borderRadius: '1rem',
    backdropFilter: 'blur(12px)',
    padding: '2rem',
    width: '100%',
    maxWidth: '480px',
  };

  const btnPrimary: React.CSSProperties = {
    background: 'var(--brand-cyan)',
    color: 'var(--brand-navy)',
    border: 'none',
    borderRadius: '0.5rem',
    padding: '0.75rem 1.5rem',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const btnSecondary: React.CSSProperties = {
    background: 'transparent',
    color: 'var(--brand-text-muted)',
    border: '1px solid var(--brand-border)',
    borderRadius: '0.5rem',
    padding: '0.75rem 1.5rem',
    fontWeight: 500,
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const steps: Step[] = ['bienvenue', 'sterilisation', 'salon', 'praticiens', 'pin', 'termine'];
  const stepIndex = steps.indexOf(step);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-8"
      style={{ background: 'var(--brand-navy)' }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/hero-login-bg-hLRj6RMZ79APYJzwLEuAnp.webp)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,22,40,0.7) 0%, rgba(10,22,40,0.97) 100%)' }} />

      <div className="relative z-10 w-full flex flex-col items-center gap-6">
        {/* Logo + titre */}
        <div className="flex flex-col items-center">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/logo_intemporelle_293813dd.jpg"
            alt="Intemporelle RGPD & Cybersécurité"
            className="rounded-lg mb-3"
            style={{ width: '200px', objectFit: 'contain' }}
          />
          <h1 className="text-2xl font-800 text-white text-center" style={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            studio.intemporelle.eu
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--brand-cyan)' }}>Configuration initiale</p>
        </div>

        {/* Indicateur d'étapes */}
        {step !== 'termine' && (
          <div className="flex items-center gap-2">
            {['Bienvenue', 'Stérilisation', 'Salon', 'Praticiens', 'PIN'].map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-700"
                  style={{
                    background: i < stepIndex ? 'var(--brand-cyan)' : i === stepIndex ? 'var(--brand-cyan)' : 'rgba(255,255,255,0.1)',
                    color: i <= stepIndex ? 'var(--brand-navy)' : 'var(--brand-text-muted)',
                    fontWeight: 700,
                    fontSize: '10px',
                  }}
                >
                  {i < stepIndex ? <Check size={12} /> : i + 1}
                </div>
                <span className="text-xs hidden sm:block" style={{ color: i === stepIndex ? 'var(--brand-cyan)' : 'var(--brand-text-muted)' }}>
                  {label}
                </span>
                {i < 4 && <div className="w-6 h-px" style={{ background: i < stepIndex ? 'var(--brand-cyan)' : 'var(--brand-border)' }} />}
              </div>
            ))}
          </div>
        )}

        {/* ===== ÉTAPE 1 : BIENVENUE ===== */}
        {step === 'bienvenue' && (
          <div style={cardStyle}>
            <h2 className="text-lg font-700 mb-2" style={{ color: 'var(--brand-text)', fontFamily: 'Outfit', fontWeight: 700 }}>
              {form.nom ? `Bienvenue sur ${form.nom}` : 'Bienvenue sur studio.intemporelle.eu'}
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--brand-text-muted)', lineHeight: 1.7 }}>
              Cet assistant va vous guider pour configurer votre application en <strong style={{ color: 'var(--brand-cyan)' }}>2 minutes</strong>.
            </p>
            <div className="space-y-3 mb-6">
              {[
                { icon: Building2, text: 'Informations de votre salon' },
                { icon: User, text: 'Noms de vos praticiens' },
                { icon: Lock, text: 'Création de votre code PIN sécurisé' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(131,208,245,0.05)', border: '1px solid rgba(131,208,245,0.1)' }}>
                  <Icon size={16} style={{ color: 'var(--brand-cyan)', flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: 'var(--brand-text)' }}>{text}</span>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-lg mb-6" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
              <p className="text-xs" style={{ color: 'rgba(201,168,76,0.9)', lineHeight: 1.6 }}>
                🔒 Vos données sont stockées de manière sécurisée sur nos serveurs OVH en France, conformément au RGPD.
              </p>
            </div>
            <div className="flex justify-end">
              <button style={btnPrimary} onClick={() => setStep('sterilisation')}>
                Continuer <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}


        {/* ===== ÉTAPE STÉRILISATION ===== */}
        {step === 'sterilisation' && (
          <div style={cardStyle}>
            <div className="flex items-center gap-2 mb-2">
              <span style={{ fontSize: 20 }}>🧴</span>
              <h2 className="text-base font-700" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>Traçabilité — Stérilisation</h2>
            </div>
            <div className="p-3 rounded-lg mb-5" style={{ background: 'rgba(244,67,54,0.08)', border: '1px solid rgba(244,67,54,0.25)' }}>
              <p className="text-xs" style={{ color: 'rgba(255,180,170,0.95)', lineHeight: 1.7 }}>
                ⚠️ <strong>Obligation ARS</strong> — Afin de garantir la traçabilité, il est impératif de bien renseigner le numéro de lot, la date de stérilisation et la date de présentation pour chaque prestation.
              </p>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--brand-text-muted)', lineHeight: 1.6 }}>
              Confirmez que vous avez bien pris connaissance des obligations de traçabilité :
            </p>
            <div className="space-y-3 mb-6">
              {[
                { key: 'engagement', label: 'Je m\'engage à respecter la traçabilité obligatoire demandée par l\'ARS (Art. R1311-1 à R1311-4 du Code de la Santé Publique) et décharge la société Intemporelle de toute responsabilité en cas de manquement de ma part.' },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-start gap-3 p-3 rounded-lg cursor-pointer"
                  style={{
                    background: sterChecks[key as keyof typeof sterChecks] ? 'rgba(131,208,245,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${sterChecks[key as keyof typeof sterChecks] ? 'var(--brand-cyan)' : 'var(--brand-border)'}`,
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: sterChecks[key as keyof typeof sterChecks] ? 'var(--brand-cyan)' : 'transparent',
                      border: `2px solid ${sterChecks[key as keyof typeof sterChecks] ? 'var(--brand-cyan)' : 'var(--brand-border)'}`,
                    }}
                    onClick={() => setSterChecks(s => ({ ...s, [key]: !s[key as keyof typeof sterChecks] }))}
                  >
                    {sterChecks[key as keyof typeof sterChecks] && <Check size={12} style={{ color: 'var(--brand-navy)' }} />}
                  </div>
                  <span className="text-sm" style={{ color: 'var(--brand-text)', lineHeight: 1.5 }}>{label}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-between">
              <button style={btnSecondary} onClick={() => setStep('bienvenue')}><ChevronLeft size={16} /> Retour</button>
              <button
                style={{
                  ...btnPrimary,
                  opacity: Object.values(sterChecks).every(Boolean) ? 1 : 0.4,
                  cursor: Object.values(sterChecks).every(Boolean) ? 'pointer' : 'not-allowed',
                }}
                onClick={() => {
                  if (!Object.values(sterChecks).every(Boolean)) {
                    toast.error('Veuillez cocher toutes les cases avant de continuer');
                    return;
                  }
                  setStep('salon');
                }}
              >
                Suivant <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ===== ÉTAPE 2 : INFOS SALON ===== */}
        {step === 'salon' && (
          <div style={cardStyle}>
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={18} style={{ color: 'var(--brand-cyan)' }} />
              <h2 className="text-base font-700" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>Informations du salon</h2>
            </div>
            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-2 gap-3">
                {field('Nom du salon', 'nom', 'text', 'Ex : Ink & Soul', true)}
                {field('Raison sociale', 'raisonSociale', 'text', 'Ex : SARL INK & SOUL')}
              </div>
              {field('Adresse', 'adresse', 'text', '14 rue des Arts')}
              <div className="grid grid-cols-2 gap-3">
                {field('Code postal', 'codePostal', 'text', '75011')}
                {field('Ville', 'ville', 'text', 'Paris')}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {field('Téléphone', 'telephone', 'tel', '06 00 00 00 00')}
                {field('Email', 'email', 'email', 'contact@monsalon.fr')}
              </div>
              {field('SIRET', 'siret', 'text', '123 456 789 00012')}
              {/* Logo */}
              <div>
                <label className="block text-xs mb-1 font-500" style={{ color: 'var(--brand-text-muted)', fontWeight: 500 }}>Logo du salon</label>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <div className="flex items-center gap-3">
                  {form.logo ? (
                    <img src={form.logo} alt="Logo" className="w-14 h-14 rounded-lg object-contain" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--brand-border)' }} />
                  ) : (
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed var(--brand-border)' }}>
                      <ImageIcon size={20} style={{ color: 'var(--brand-text-muted)' }} />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => logoRef.current?.click()}
                    className="text-xs px-3 py-2 rounded-lg"
                    style={{ background: 'var(--brand-cyan-dim)', color: 'var(--brand-cyan)', border: '1px solid var(--brand-cyan)' }}
                  >
                    {form.logo ? 'Changer' : 'Ajouter un logo'}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <button style={btnSecondary} onClick={() => setStep('bienvenue')}><ChevronLeft size={16} /> Retour</button>
              <button
                style={btnPrimary}
                onClick={() => {
                  if (!form.nom.trim()) { toast.error('Le nom du salon est obligatoire'); return; }
                  setStep('praticiens');
                }}
              >
                Suivant <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ===== ÉTAPE 3 : PRATICIENS ===== */}
        {step === 'praticiens' && (
          <div style={cardStyle}>
            <div className="flex items-center gap-2 mb-4">
              <User size={18} style={{ color: 'var(--brand-cyan)' }} />
              <h2 className="text-base font-700" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>Praticiens</h2>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--brand-text-muted)' }}>
              Ces noms seront pré-remplis dans les fiches de séance. Renseignez uniquement les activités de votre salon.
            </p>
            <div className="space-y-3 mb-6">
              {field('Nom du pierceur', 'nomPierceur', 'text', 'Ex : Marie Dupont')}
              {field('Nom du tatoueur', 'nomTatoueur', 'text', 'Ex : Julien Martin')}
              {field('Nom du dermographe', 'nomDermographe', 'text', 'Ex : Sophie Laurent')}
            </div>
            <div className="flex justify-between">
              <button style={btnSecondary} onClick={() => setStep('sterilisation')}><ChevronLeft size={16} /> Retour</button>
              <button style={btnPrimary} onClick={() => setStep('pin')}>
                Suivant <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ===== ÉTAPE 4 : PIN ===== */}
        {step === 'pin' && (
          <div style={cardStyle}>
            <div className="flex items-center gap-2 mb-4">
              <Lock size={18} style={{ color: 'var(--brand-cyan)' }} />
              <h2 className="text-base font-700" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>
                {pinStep === 'enter' ? 'Créez votre code PIN' : 'Confirmez votre code PIN'}
              </h2>
            </div>
            <p className="text-xs mb-5" style={{ color: 'var(--brand-text-muted)' }}>
              {pinStep === 'enter'
                ? 'Choisissez un code à 4 chiffres pour sécuriser l\'accès à vos données.'
                : 'Saisissez à nouveau votre code PIN pour confirmer.'}
            </p>
            {pinError && (
              <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)' }}>
                <p className="text-xs" style={{ color: '#F44336' }}>{pinError}</p>
              </div>
            )}
            {/* Dots */}
            <div className="flex justify-center gap-4 mb-6">
              {[0, 1, 2, 3].map(i => {
                const current = pinStep === 'enter' ? pin1 : pin2;
                const filled = i < current.length;
                return (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full transition-all duration-200"
                    style={{
                      background: filled ? 'var(--brand-cyan)' : 'transparent',
                      border: `2px solid ${filled ? 'var(--brand-cyan)' : 'var(--brand-border)'}`,
                      boxShadow: filled ? '0 0 8px rgba(131,208,245,0.5)' : 'none',
                    }}
                  />
                );
              })}
            </div>
            {/* Clavier */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <button
                  key={n}
                  onClick={() => handlePinDigit(String(n))}
                  className="h-14 rounded-lg text-xl font-600 transition-all duration-150 active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)', fontFamily: 'Outfit', fontWeight: 600 }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(131,208,245,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                >
                  {n}
                </button>
              ))}
              <div />
              <button
                onClick={() => handlePinDigit('0')}
                className="h-14 rounded-lg text-xl font-600 transition-all duration-150 active:scale-95"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)', fontFamily: 'Outfit', fontWeight: 600 }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(131,208,245,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              >
                0
              </button>
              <button
                onClick={handlePinDelete}
                className="h-14 rounded-lg transition-all duration-150 active:scale-95 flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-muted)' }}
              >
                ⌫
              </button>
            </div>
            <div className="flex justify-start">
              <button style={btnSecondary} onClick={() => { setStep('praticiens'); setPin1(''); setPin2(''); setPinStep('enter'); setPinError(''); }}>
                <ChevronLeft size={16} /> Retour
              </button>
            </div>
          </div>
        )}

        {/* ===== ÉTAPE 5 : TERMINÉ ===== */}
        {step === 'termine' && (
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(76,175,80,0.15)', border: '2px solid #4CAF50' }}
            >
              <Check size={32} style={{ color: '#4CAF50' }} />
            </div>
            <h2 className="text-xl font-700 mb-2" style={{ color: 'var(--brand-text)', fontFamily: 'Outfit', fontWeight: 700 }}>
              Tout est prêt !
            </h2>
            <p className="text-sm mb-2" style={{ color: 'var(--brand-text-muted)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--brand-cyan)' }}>{form.nom || 'Votre salon'}</strong> est configuré.
            </p>
            <p className="text-xs mb-6" style={{ color: 'var(--brand-text-muted)', lineHeight: 1.6 }}>
              Votre code PIN est enregistré. Vous pouvez commencer à utiliser {form.nom || 'Studio Manager'}.
            </p>
            <div className="p-3 rounded-lg mb-6" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
              <p className="text-xs" style={{ color: 'rgba(201,168,76,0.9)', lineHeight: 1.6 }}>
                💡 Vous pourrez modifier toutes ces informations à tout moment dans <strong>Paramètres</strong>.
              </p>
            </div>
            <button style={{ ...btnPrimary, width: '100%', justifyContent: 'center' }} onClick={handleFinish}>
              Démarrer {form.nom || 'Studio Manager'} <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Mention propriété Intemporelle */}
        <p className="text-xs text-center" style={{ color: 'var(--brand-text-muted)', opacity: 0.5, maxWidth: 320 }}>
          Application propriété de la Société Intemporelle · 06.17.07.41.69
        </p>
      </div>
    </div>
  );
}

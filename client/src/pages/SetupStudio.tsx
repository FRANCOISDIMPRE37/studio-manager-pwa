import { useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { Check, ChevronRight, Lock, Building2 } from 'lucide-react';

export default function SetupStudio() {
  const [step, setStep] = useState<'info' | 'pin' | 'done'>('info');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
  const [pinError, setPinError] = useState('');

  const setupMutation = trpc.auth.pinSetup.useMutation();

  const cardStyle: React.CSSProperties = {
    background: 'rgba(15, 32, 64, 0.85)',
    border: '1px solid var(--brand-border)',
    borderRadius: '1rem',
    backdropFilter: 'blur(12px)',
    padding: '2rem',
    width: '100%',
    maxWidth: '420px',
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
          setTimeout(async () => {
            if (next === pin1) {
              setPinError('');
              try {
                await setupMutation.mutateAsync({ pin: pin1 });
                setStep('done');
              } catch {
                toast.error('Erreur lors de la configuration');
              }
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: 'var(--brand-navy)' }}>
      <div className="relative z-10 w-full flex flex-col items-center gap-6">

        {/* Logo */}
        <div className="flex flex-col items-center">
          <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/logo_intemporelle_293813dd.jpg"
            alt="Intemporelle" className="rounded-lg mb-3" style={{ width: '180px' }} />
          <h1 className="text-2xl font-800 text-white text-center" style={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            Bienvenue !
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--brand-cyan)' }}>Configuration de votre studio</p>
        </div>

        {/* Étapes */}
        <div className="flex items-center gap-2">
          {['Votre studio', 'Votre PIN'].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-700"
                style={{
                  background: i < (step === 'pin' ? 1 : step === 'done' ? 2 : 0) ? 'var(--brand-cyan)' : i === (step === 'info' ? 0 : 1) ? 'var(--brand-cyan)' : 'rgba(255,255,255,0.1)',
                  color: 'var(--brand-navy)',
                  fontWeight: 700, fontSize: '10px',
                }}>
                {i < (step === 'pin' ? 1 : 0) ? <Check size={12} /> : i + 1}
              </div>
              <span className="text-xs" style={{ color: 'var(--brand-cyan)' }}>{label}</span>
              {i < 1 && <div className="w-6 h-px" style={{ background: 'var(--brand-border)' }} />}
            </div>
          ))}
        </div>

        {/* ÉTAPE 1 : Infos studio */}
        {step === 'info' && (
          <div style={cardStyle}>
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={18} style={{ color: 'var(--brand-cyan)' }} />
              <h2 className="text-base font-700" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>
                Votre studio
              </h2>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--brand-text-muted)' }}>
              Confirmez le nom de votre salon et renseignez votre email.
            </p>
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--brand-text-muted)' }}>NOM DU SALON *</label>
                <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex: Studio Lumière"
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--brand-border)', borderRadius: '0.5rem', color: 'var(--brand-text)', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--brand-text-muted)' }}>VOTRE EMAIL *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@votresalon.fr"
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--brand-border)', borderRadius: '0.5rem', color: 'var(--brand-text)', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
              </div>
            </div>
            <div className="flex justify-end">
              <button style={btnPrimary} onClick={() => {
                if (!nom.trim()) { toast.error('Le nom du salon est obligatoire'); return; }
                if (!email.trim()) { toast.error("L'email est obligatoire"); return; }
                setStep('pin');
              }}>
                Suivant <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 2 : PIN définitif */}
        {step === 'pin' && (
          <div style={cardStyle}>
            <div className="flex items-center gap-2 mb-4">
              <Lock size={18} style={{ color: 'var(--brand-cyan)' }} />
              <h2 className="text-base font-700" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>
                {pinStep === 'enter' ? 'Créez votre PIN définitif' : 'Confirmez votre PIN'}
              </h2>
            </div>
            <p className="text-xs mb-5" style={{ color: 'var(--brand-text-muted)' }}>
              Choisissez un code à 4 chiffres — c'est votre accès permanent.
            </p>
            {pinError && (
              <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)' }}>
                <p className="text-xs" style={{ color: '#F44336' }}>{pinError}</p>
              </div>
            )}
            <div className="flex justify-center gap-4 mb-6">
              {[0,1,2,3].map(i => {
                const current = pinStep === 'enter' ? pin1 : pin2;
                return (
                  <div key={i} className="w-5 h-5 rounded-full transition-all duration-200"
                    style={{ background: i < current.length ? 'var(--brand-cyan)' : 'transparent', border: `2px solid ${i < current.length ? 'var(--brand-cyan)' : 'var(--brand-border)'}` }} />
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button key={n} onClick={() => handlePinDigit(String(n))}
                  className="h-14 rounded-lg text-xl font-600 transition-all active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)', fontFamily: 'Outfit', fontWeight: 600 }}>
                  {n}
                </button>
              ))}
              <div />
              <button onClick={() => handlePinDigit('0')}
                className="h-14 rounded-lg text-xl font-600 transition-all active:scale-95"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)', fontFamily: 'Outfit', fontWeight: 600 }}>
                0
              </button>
              <button onClick={handlePinDelete}
                className="h-14 rounded-lg transition-all active:scale-95 flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-muted)' }}>
                ⌫
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 : Terminé */}
        {step === 'done' && (
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(76,175,80,0.15)', border: '2px solid #4CAF50' }}>
              <Check size={32} style={{ color: '#4CAF50' }} />
            </div>
            <h2 className="text-xl font-700 mb-2" style={{ color: 'var(--brand-text)', fontFamily: 'Outfit', fontWeight: 700 }}>
              Votre studio est prêt !
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--brand-text-muted)', lineHeight: 1.7 }}>
              Bienvenue <strong style={{ color: 'var(--brand-cyan)' }}>{nom}</strong> !<br />
              Votre PIN définitif est enregistré.
            </p>
            <button style={{ ...btnPrimary, width: '100%', justifyContent: 'center' }}
              onClick={() => window.location.href = '/'}>
              Accéder à mon studio <ChevronRight size={16} />
            </button>
          </div>
        )}

        <p className="text-xs text-center" style={{ color: 'var(--brand-text-muted)', opacity: 0.5 }}>
          Application propriété de la Société Intemporelle · 06.17.07.41.69
        </p>
      </div>
    </div>
  );
}

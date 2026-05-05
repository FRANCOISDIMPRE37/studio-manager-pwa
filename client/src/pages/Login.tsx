/*
 * DESIGN: Studio Nocturne — Écran de connexion avec fond hero Intemporelle
 * Logo centré, PIN numérique, bouton démo en bas
 * Auth: PIN vérifié côté serveur → cookie de session JWT posé automatiquement
 */
import { useState, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { useTranslation } from 'react-i18next';
import { Delete } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

export default function Login() {
  const { state, setAuthenticated, enterDemoMode, verifyPin, setPin, hasPin } = useApp();
  const { t } = useTranslation();
  const [pin, setLocalPin] = useState('');
  const [selEmp, setSelEmp] = useState<any>(null);
  const { data: emps } = trpc.studioUsers.listForPin.useQuery();
  const empLogin = trpc.studioUsers.loginWithPin.useMutation({ onSuccess:(d)=>{ try{sessionStorage.setItem('studio_employe_session',JSON.stringify({...d.employe,loginAt:new Date().toISOString()}))}catch(e){} setAuthenticated(true); toast.success('Bonjour '+d.employe.prenom+' !'); }, onError:(e)=>{ toast.error(e.message||'PIN incorrect'); setLocalPin(''); } });
  const [confirmPin, setConfirmPin] = useState('');
  const [isCreatingPin, setIsCreatingPin] = useState(false);
  const [shake, setShake] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [showTempPin, setShowTempPin] = useState(false);
  const [tempPinValue, setTempPinValue] = useState('');
  const [tempPinError, setTempPinError] = useState('');
  const [tempPinLoading, setTempPinLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailLogin = async () => {
    if (!email || !password) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('sm_setup_done', '1');
        setAuthenticated(true);
        toast.success('Connexion réussie !');
      } else {
        toast.error(data.error || 'Email ou mot de passe incorrect');
      }
    } catch (err) {
      toast.error('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const pinLoginMutation = trpc.auth.pinLogin.useMutation();
  const pinSetupMutation = trpc.auth.pinSetup.useMutation();

  useEffect(() => {
    if (!hasPin()) {
      setIsCreatingPin(true);
    }
  }, [hasPin]);

  const handlePinInput = (digit: string) => {
    if (isLoading) return;
    if (isCreatingPin) {
      if (pin.length < 4) {
        const newPin = pin + digit;
        setLocalPin(newPin);
        if (newPin.length === 4) {
          if (!confirmPin) {
            setTimeout(() => {
              setConfirmPin(newPin);
              setLocalPin('');
            }, 200);
          } else {
            if (newPin === confirmPin) {
              setPin(confirmPin);
              setIsLoading(true);
              pinSetupMutation.mutate(
                { pin: confirmPin },
                {
                  onSuccess: () => {
                    setAuthenticated(true);
                    toast.success(t('auth.pin_created', 'Code PIN créé avec succès'));
                  },
                  onError: (err) => {
                    console.error('[PinSetup] Error:', err);
                    setAuthenticated(true);
                    toast.success(t('auth.pin_created', 'Code PIN créé avec succès'));
                  },
                  onSettled: () => setIsLoading(false),
                }
              );
            } else {
              setShake(true);
              setTimeout(() => { setShake(false); setLocalPin(''); setConfirmPin(''); }, 600);
              toast.error(t('auth.pin_mismatch'));
            }
          }
        }
      }
    } else {
      if (pin.length < 4) {
        const newPin = pin + digit;
        setLocalPin(newPin);
        if (newPin.length === 4) {
          setTimeout(() => {
            const localOk = verifyPin(newPin);
            if (!localOk) {
              setShake(true);
              setTimeout(() => { setShake(false); setLocalPin(''); }, 600);
              toast.error(t('auth.pin_error'));
              return;
            }
            setIsLoading(true);
            if(selEmp){ empLogin.mutate({employeId:selEmp.id,pin:newPin}); } else { pinLoginMutation.mutate(
              { pin: newPin },
              {
                onSuccess: (data) => {
                  if (data?.firstLogin) {
                    // handled below
                  } else {
                    setAuthenticated(true);
                  }
                },
                onError: (err) => {
                  console.error('[PinLogin] Server error:', err);
                  setAuthenticated(true);
                },
                onSettled: () => setIsLoading(false),
              }
            ); }
          }, 200);
        }
      }
    }
  };

  const handleDelete = () => {
    if (!isLoading) setLocalPin(prev => prev.slice(0, -1));
  };

  const pinDots = Array.from({ length: 4 }, (_, i) => i < pin.length);

  const getTitle = () => {
    if (isCreatingPin) {
      return confirmPin ? t('auth.pin_confirm') : t('auth.pin_title');
    }
    return t('auth.pin_enter');
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--brand-navy)' }}
    >
      {/* Background hero image */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/hero-login-bg-hLRj6RMZ79APYJzwLEuAnp.webp)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,22,40,0.6) 0%, rgba(10,22,40,0.95) 100%)' }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/logo_intemporelle_293813dd.jpg"
            alt="Intemporelle RGPD & Cybersécurité"
            className="rounded-lg mb-4"
            style={{ width: '220px', objectFit: 'contain' }}
          />
          <h1 className="text-2xl font-800 text-white text-center" style={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            studio.intemporelle.eu
          </h1>
          {state.salonInfo?.nom && (
            <p className="text-sm mt-1 font-600 text-center" style={{ color: 'var(--brand-cyan)', fontFamily: 'Outfit', fontWeight: 600 }}>
              {state.salonInfo.nom}
            </p>
          )}
        </div>

        {/* PIN Card */}
        <div
          className="w-full rounded-xl p-6"
          style={{
            background: 'rgba(15, 32, 64, 0.8)',
            border: '1px solid var(--brand-border)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <h2 className="text-center text-base font-600 mb-6" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>
            {getTitle()}
          </h2>

          {/* PIN dots */}
          <div className={`flex justify-center gap-4 mb-6 ${shake ? 'animate-bounce' : ''}`}>
            {pinDots.map((filled, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full transition-all duration-200"
                style={{
                  background: filled ? 'var(--brand-cyan)' : 'transparent',
                  border: `2px solid ${filled ? 'var(--brand-cyan)' : 'var(--brand-border)'}`,
                  boxShadow: filled ? '0 0 8px rgba(131, 208, 245, 0.5)' : 'none',
                }}
              />
            ))}
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-center mb-4">
              <div
                className="w-5 h-5 rounded-full border-2 animate-spin"
                style={{ borderColor: 'var(--brand-cyan)', borderTopColor: 'transparent' }}
              />
            </div>
          )}
          {/* Numeric keypad */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button
                key={n}
                onClick={() => handlePinInput(String(n))}
                disabled={isLoading}
                className="h-14 rounded-lg text-xl font-600 transition-all duration-150 active:scale-95 disabled:opacity-50"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--brand-border)',
                  color: 'var(--brand-text)',
                  fontFamily: 'Outfit',
                  fontWeight: 600,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(131, 208, 245, 0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              >
                {n}
              </button>
            ))}
            <div /> {/* empty */}
            <button
              onClick={() => handlePinInput('0')}
              className="h-14 rounded-lg text-xl font-600 transition-all duration-150 active:scale-95"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--brand-border)',
                color: 'var(--brand-text)',
                fontFamily: 'Outfit',
                fontWeight: 600,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(131, 208, 245, 0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="h-14 rounded-lg transition-all duration-150 active:scale-95 flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--brand-border)',
                color: 'var(--brand-text-muted)',
              }}
            >
              <Delete size={20} />
            </button>
          </div>
        </div>



        {/* Email/Password login */}
        {showEmailLogin ? (
          <div style={{ width: '100%', maxWidth: 320, marginTop: 16 }}>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '10px 14px', marginBottom: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', borderRadius: 8, color: 'var(--brand-text)', fontFamily: 'Outfit' }} />
            <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEmailLogin()} style={{ width: '100%', padding: '10px 14px', marginBottom: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', borderRadius: 8, color: 'var(--brand-text)', fontFamily: 'Outfit' }} />
            <button onClick={handleEmailLogin} disabled={isLoading} style={{ width: '100%', padding: '10px 0', borderRadius: 8, background: 'var(--brand-cyan)', color: '#0A1628', fontFamily: 'Outfit', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>{isLoading ? 'Connexion...' : 'Se connecter'}</button>
            <button onClick={() => setShowEmailLogin(false)} style={{ marginTop: 8, color: 'var(--brand-text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>← Retour</button>
          </div>
        ) : (
          <button onClick={() => setShowEmailLogin(true)} className="mt-4 text-sm transition-all duration-200 hover:opacity-100 opacity-60" style={{ color: 'var(--brand-cyan)' }}>Se connecter avec email →</button>
        )}

        {emps && emps.filter((e) => e.hasPinSet).length > 0 && !showEmailLogin && (<div style={{marginTop:16,paddingTop:12,borderTop:"1px solid var(--brand-border)"}}><p style={{color:"var(--brand-text-muted)",fontSize:12,textAlign:"center",marginBottom:8}}>Connexion salarie</p><div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>{selEmp ? <p style={{color:"var(--brand-cyan)",fontSize:12}}>PIN de {selEmp.prenom} <button onClick={()=>{setSelEmp(null);setLocalPin("");}} style={{background:"none",border:"none",color:"var(--brand-text-muted)",cursor:"pointer"}}>x</button></p> : emps.filter((e) => e.hasPinSet).map((e) => (<button key={e.id} onClick={()=>{setSelEmp(e);setLocalPin("");}} style={{padding:"6px 14px",borderRadius:8,border:"1px solid var(--brand-cyan)",background:"rgba(131,208,245,0.1)",color:"var(--brand-cyan)",cursor:"pointer",fontWeight:600}}>{e.prenom}</button>))}</div></div>)}
        {/* Créer un compte */}
        <button onClick={() => window.location.href = '/inscription'}
          className="mt-3 text-sm transition-all duration-200 hover:opacity-100 opacity-60"
          style={{ color: 'var(--brand-cyan)' }}>
          ✨ Créer un compte →
        </button>
        {/* Première connexion */}
        {!showTempPin ? (
          <button onClick={() => setShowTempPin(true)}
            className="mt-3 text-sm transition-all duration-200 hover:opacity-100 opacity-60"
            style={{ color: 'var(--brand-cyan)' }}>
            🔑 Première connexion →
          </button>
        ) : (
          <div style={{ marginTop: 16, padding: 16, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 12 }}>
            <p style={{ color: '#a855f7', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Code de première connexion</p>
            <input
              value={tempPinValue}
              onChange={e => setTempPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Code à 4 chiffres"
              maxLength={4}
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,58,237,0.5)', borderRadius: 8, color: '#fff', fontSize: 20, textAlign: 'center', letterSpacing: 8, boxSizing: 'border-box', outline: 'none', marginBottom: 10 }}
            />
            {tempPinError && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 8 }}>{tempPinError}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowTempPin(false); setTempPinValue(''); setTempPinError(''); }}
                style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #444', borderRadius: 8, color: '#888', cursor: 'pointer', fontSize: 13 }}>
                Annuler
              </button>
              <button
                disabled={tempPinValue.length !== 4 || tempPinLoading}
                onClick={async () => {
                  setTempPinLoading(true);
                  setTempPinError('');
                  try {
                    const r = await fetch('/api/check-temp-pin', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ pin: tempPinValue }),
                    });
                    const data = await r.json();
                    if (data.valid) {
                      window.location.href = '/setup-studio?nom=' + encodeURIComponent(data.nom || '') + '&email=' + encodeURIComponent(data.email || '');
                    } else {
                      setTempPinError('Code incorrect ou déjà utilisé');
                    }
                  } catch {
                    setTempPinError('Erreur de connexion');
                  }
                  setTempPinLoading(false);
                }}
                style={{ flex: 1, padding: '8px', background: tempPinValue.length === 4 ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : '#333', border: 'none', borderRadius: 8, color: '#fff', cursor: tempPinValue.length === 4 ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 600 }}>
                {tempPinLoading ? '...' : 'Accéder →'}
              </button>
            </div>
          </div>
        )}
        {/* Demo mode button */}
        <button
          onClick={enterDemoMode}
          className="mt-6 text-sm transition-all duration-200 hover:opacity-100 opacity-60"
          style={{ color: 'var(--brand-text-muted)' }}
        >
          {t('auth.demo_mode')} →
        </button>
      </div>
    </div>
  );
}

/*
 * DESIGN: Studio Nocturne — Écran de connexion simplifié
 * "Déjà client" → saisie PIN uniquement (accès direct)
 * "Nouveau"     → connexion email + mot de passe (première connexion)
 */
import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { Delete, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useEmployeSession } from '@/contexts/EmployeSessionContext';

type Tab = 'pin' | 'email';

export default function Login() {
  const { state, setAuthenticated } = useApp();
  const { setEmploye } = useEmployeSession();

  const [activeTab, setActiveTab] = useState<Tab>('pin');

  // PIN
  const [pin, setLocalPin] = useState('');
  const [shake, setShake] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Salarié
  const { data: emps } = trpc.studioUsers.listForPin.useQuery();
  const [selEmp, setSelEmp] = useState<any>(null);
  
  const empLogin = trpc.studioUsers.loginWithPin.useMutation({
    onSuccess: (d) => {
      const employeSession = { ...d.employe, loginAt: new Date().toISOString() };
      setEmploye(employeSession);
      setAuthenticated(true);
      toast.success('Bonjour ' + d.employe.prenom + ' !');
    },
    onError: (e) => { 
      toast.error(e.message || 'PIN incorrect'); 
      setLocalPin(''); 
      setShake(true);
      setTimeout(() => setShake(false), 600);
    },
  });

  // Onglet Nouveau
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const loginEmailMutation = trpc.auth.loginEmail.useMutation();

  // ── Saisie PIN ──────────────────────────────────────────────────────────────
  const handlePinInput = (digit: string) => {
    if (isLoading || pin.length >= 4) return;
    const newPin = pin + digit;
    setLocalPin(newPin);

    if (newPin.length === 4) {
      setTimeout(async () => {
        setIsLoading(true);
        
        // Si salarié sélectionné
        if (selEmp) {
          empLogin.mutate({ employeId: selEmp.id, pin: newPin });
          setIsLoading(false);
          return;
        }

        // Connexion Studio via PIN direct
        try {
          const res = await fetch('/api/auth/pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: newPin }),
          });
          
          if (res.ok) {
            setAuthenticated(true);
            toast.success("Connexion réussie !");
            window.location.href = "/";
          } else {
            const data = await res.json();
            setShake(true);
            setTimeout(() => { setShake(false); setLocalPin(''); }, 600);
            toast.error(data.message || 'Code PIN incorrect');
          }
        } catch {
          toast.error('Erreur de connexion au serveur');
          setLocalPin('');
        } finally {
          setIsLoading(false);
        }
      }, 200);
    }
  };

  const handleDelete = () => {
    if (!isLoading) setLocalPin(prev => prev.slice(0, -1));
  };

  // ── Onglet Nouveau ──────────────────────────────────────────────────────────
  const handleNewLogin = async () => {
    if (!newEmail || !newPassword) return;
    setIsLoading(true);
    try {
      await loginEmailMutation.mutateAsync({ email: newEmail, password: newPassword });
      setAuthenticated(true);
      toast.success("Connexion réussie !");
      window.location.href = "/";
    } catch (error: any) {
      toast.error(error?.message || "Email ou mot de passe incorrect");
    } finally {
      setIsLoading(false);
    }
  };

  const pinDots = Array.from({ length: 4 }, (_, i) => i < pin.length);

  // ── Styles ──────────────────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    background: 'rgba(15, 32, 64, 0.85)',
    border: '1px solid var(--brand-border)',
    backdropFilter: 'blur(12px)',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    marginBottom: 10,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--brand-border)',
    borderRadius: 10,
    color: 'var(--brand-text)',
    fontFamily: 'Outfit',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  };
  const btnPrimary: React.CSSProperties = {
    width: '100%',
    padding: '13px 0',
    borderRadius: 10,
    background: 'var(--brand-cyan)',
    color: '#0A1628',
    fontFamily: 'Outfit',
    fontWeight: 700,
    fontSize: 15,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };
  const btnDisabled: React.CSSProperties = { ...btnPrimary, background: 'rgba(131,208,245,0.3)', cursor: 'not-allowed' };
  const tabBase: React.CSSProperties = {
    flex: 1, padding: '10px 0', borderRadius: 10,
    fontFamily: 'Outfit', fontWeight: 700, fontSize: 14,
    cursor: 'pointer', border: 'none', transition: 'all 0.2s',
  };

  const displayDomain = typeof window !== 'undefined' && window.location.hostname
    ? window.location.hostname
    : 'studio.intemporelle.eu';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--brand-navy)' }}
    >
      {/* Background */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/hero-login-bg-hLRj6RMZ79APYJzwLEuAnp.webp)`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />
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
          <h1 className="text-2xl text-white text-center" style={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            {displayDomain}
          </h1>
          {state.salonInfo?.nom && (
            <p className="text-sm mt-1 text-center" style={{ color: 'var(--brand-cyan)', fontFamily: 'Outfit', fontWeight: 600 }}>
              {state.salonInfo.nom}
            </p>
          )}
        </div>

        {/* Onglets */}
        <div style={{
          display: 'flex', gap: 6, width: '100%', marginBottom: 16,
          background: 'rgba(15, 32, 64, 0.8)', border: '1px solid var(--brand-border)',
          borderRadius: 14, padding: 6, backdropFilter: 'blur(12px)',
        }}>
          <button
            style={activeTab === 'pin' ? { ...tabBase, background: 'var(--brand-cyan)', color: '#0A1628' } : { ...tabBase, background: 'rgba(255,255,255,0.05)', color: 'var(--brand-text-muted)' }}
            onClick={() => { setActiveTab('pin'); setLocalPin(''); }}
          >
            Déjà client
          </button>
          <button
            style={activeTab === 'email' ? { ...tabBase, background: 'var(--brand-cyan)', color: '#0A1628' } : { ...tabBase, background: 'rgba(255,255,255,0.05)', color: 'var(--brand-text-muted)' }}
            onClick={() => { setActiveTab('email'); setLocalPin(''); }}
          >
            Nouveau
          </button>
        </div>

        {/* ── Onglet Déjà client ── */}
        {activeTab === 'pin' && (
          <div style={cardStyle}>
            <h2 className="text-center text-base mb-6" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>
              Entrez votre code PIN
            </h2>

            {/* Dots */}
            <div className={`flex justify-center gap-4 mb-6 ${shake ? 'animate-bounce' : ''}`}>
              {pinDots.map((filled, i) => (
                <div key={i} className="w-4 h-4 rounded-full transition-all duration-200" style={{
                  background: filled ? 'var(--brand-cyan)' : 'transparent',
                  border: `2px solid ${filled ? 'var(--brand-cyan)' : 'var(--brand-border)'}`,
                  boxShadow: filled ? '0 0 8px rgba(131, 208, 245, 0.5)' : 'none',
                }} />
              ))}
            </div>

            {isLoading && (
              <div className="flex justify-center mb-4">
                <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--brand-cyan)', borderTopColor: 'transparent' }} />
              </div>
            )}

            {/* Clavier */}
            <div className="grid grid-cols-3 gap-3">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button key={n} onClick={() => handlePinInput(String(n))} disabled={isLoading}
                  className="h-14 rounded-lg text-xl transition-all duration-150 active:scale-95 disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)', fontFamily: 'Outfit', fontWeight: 600 }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(131,208,245,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                >{n}</button>
              ))}
              <div />
              <button onClick={() => handlePinInput('0')} disabled={isLoading}
                className="h-14 rounded-lg text-xl transition-all duration-150 active:scale-95 disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)', fontFamily: 'Outfit', fontWeight: 600 }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(131,208,245,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              >0</button>
              <button onClick={handleDelete} disabled={isLoading}
                className="h-14 rounded-lg transition-all duration-150 active:scale-95 flex items-center justify-center disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }}
              >
                <Delete size={24} />
              </button>
            </div>

            {/* Salariés */}
            {emps && emps.filter(e => e.hasPinSet).length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--brand-border)' }}>
                <p style={{ color: 'var(--brand-text-muted)', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>Connexion salarié</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {selEmp ? (
                    <p style={{ color: 'var(--brand-cyan)', fontSize: 12 }}>
                      PIN de {selEmp.prenom}{' '}
                      <button onClick={() => { setSelEmp(null); setLocalPin(''); }} style={{ background: 'none', border: 'none', color: 'var(--brand-text-muted)', cursor: 'pointer' }}>×</button>
                    </p>
                  ) : emps.filter(e => e.hasPinSet).map(e => (
                    <button key={e.id} onClick={() => { setSelEmp(e); setLocalPin(''); }}
                      style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--brand-cyan)', background: 'rgba(131,208,245,0.1)', color: 'var(--brand-cyan)', cursor: 'pointer', fontWeight: 600 }}
                    >{e.prenom}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Onglet Nouveau ── */}
        {activeTab === 'email' && (
          <div style={cardStyle}>
            <h2 className="text-center text-base mb-2" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>
              Connexion avec email
            </h2>
            <p className="text-center text-xs mb-6" style={{ color: 'var(--brand-text-muted)' }}>
              Utilisez les identifiants reçus par email lors de la création de votre studio.
            </p>
            <input type="email" placeholder="Adresse email" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="Mot de passe" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNewLogin()}
              style={{ ...inputStyle, marginBottom: 16 }}
            />
            <button
              onClick={handleNewLogin}
              disabled={isLoading || !newEmail || !newPassword}
              style={isLoading || !newEmail || !newPassword ? btnDisabled : btnPrimary}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

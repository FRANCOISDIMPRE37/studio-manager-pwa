/*
 * DESIGN: Studio Nocturne — Écran de connexion avec fond hero Intemporelle
 * Logo centré, PIN numérique, bouton démo en bas
 */
import { useState, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { Shield, Delete, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Login() {
  const { state, setAuthenticated, enterDemoMode, verifyPin, setPin, hasPin } = useApp();
  const [pin, setLocalPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isCreatingPin, setIsCreatingPin] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!hasPin()) {
      setIsCreatingPin(true);
    }
  }, [hasPin]);

  const handlePinInput = (digit: string) => {
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
              setAuthenticated(true);
              toast.success('Code PIN créé avec succès');
            } else {
              setShake(true);
              setTimeout(() => { setShake(false); setLocalPin(''); setConfirmPin(''); }, 600);
              toast.error('Les codes PIN ne correspondent pas');
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
            if (verifyPin(newPin)) {
              setAuthenticated(true);
            } else {
              setShake(true);
              setTimeout(() => { setShake(false); setLocalPin(''); }, 600);
              toast.error('Code PIN incorrect');
            }
          }, 200);
        }
      }
    }
  };

  const handleDelete = () => {
    setLocalPin(prev => prev.slice(0, -1));
  };

  const pinDots = Array.from({ length: 4 }, (_, i) => i < pin.length);

  const getTitle = () => {
    if (isCreatingPin) {
      return confirmPin ? 'Confirmez votre code PIN' : 'Créez votre code PIN';
    }
    return 'Entrez votre code PIN';
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
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/logo_white_d12a3c81.svg"
            alt="Intemporelle"
            className="w-20 h-20 mb-4"
          />
          <h1 className="text-2xl font-800 text-white text-center" style={{ fontFamily: 'Outfit', fontWeight: 800 }}>
            Studio Manager
          </h1>
          <p className="text-sm mt-1 text-center" style={{ color: 'var(--brand-cyan)' }}>
            by Intemporelle — RGPD & Cybersécurité
          </p>
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

          {/* Numeric keypad */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button
                key={n}
                onClick={() => handlePinInput(String(n))}
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

        {/* Demo mode button */}
        <button
          onClick={enterDemoMode}
          className="mt-6 text-sm transition-all duration-200 hover:opacity-100 opacity-60"
          style={{ color: 'var(--brand-text-muted)' }}
        >
          Essayer en mode démo →
        </button>
      </div>
    </div>
  );
}

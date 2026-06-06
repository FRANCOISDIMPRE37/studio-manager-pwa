/**
 * ONBOARDING SIMPLIFIÉ — Studio Manager by Intemporelle
 * S'affiche uniquement à la première utilisation (flag sm_onboarding_done absent)
 * Flux : Engagements → Démarrer
 * Les informations du salon sont déjà configurées par le Super-Admin côté serveur.
 */
import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Check, ChevronRight, ShieldCheck } from 'lucide-react';

export default function Onboarding() {
  const { syncFromCloud } = useApp();
  const completeOnboarding = trpc.salon.completeOnboarding.useMutation();
  const utils = trpc.useUtils();

  const [engagements, setEngagements] = useState({
    sterilisation: false,
    rgpd: false,
    responsabilite: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  const allChecked = Object.values(engagements).every(Boolean);

  const toggle = (key: keyof typeof engagements) => {
    setEngagements(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDemarrer = async () => {
    if (!allChecked) {
      toast.error('Veuillez cocher tous les engagements avant de continuer');
      return;
    }
    setIsLoading(true);
    try {
      // Marquer l'onboarding comme terminé côté serveur (studios.firstLogin = false)
      await completeOnboarding.mutateAsync();
      // Invalider le cache pour que App.tsx recharge firstLogin
      await utils.salon.getFirstLogin.invalidate();
      // Synchroniser les données depuis le serveur
      await syncFromCloud();
      toast.success('Bienvenue sur Studio Pierceur Tatoueur Dermographe !');
      setTimeout(() => {
        window.location.href = '/';
      }, 800);
    } catch {
      // Même en cas d'erreur, on invalide quand même
      await utils.salon.getFirstLogin.invalidate();
      window.location.href = '/';
    } finally {
      setIsLoading(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(15, 32, 64, 0.85)',
    border: '1px solid var(--brand-border)',
    borderRadius: '1rem',
    backdropFilter: 'blur(12px)',
    padding: '2rem',
    width: '100%',
    maxWidth: '520px',
  };

  const engagementItems = [
    {
      key: 'sterilisation' as const,
      icon: '🧴',
      titre: 'Obligation ARS — Traçabilité',
      texte: "Je m'engage à respecter la traçabilité obligatoire demandée par l'ARS (Art. R1311-1 à R1311-4 du Code de la Santé Publique) et décharge la société Intemporelle de toute responsabilité en cas de manquement de ma part.",
    },
    {
      key: 'rgpd' as const,
      icon: '🔒',
      titre: 'Protection des données (RGPD)',
      texte: "Je m'engage à traiter les données personnelles de mes clients conformément au Règlement Général sur la Protection des Données (RGPD) et à ne pas les divulguer à des tiers non autorisés.",
    },
    {
      key: 'responsabilite' as const,
      icon: '✅',
      titre: 'Responsabilité professionnelle',
      texte: "Je certifie exercer mon activité dans le respect des règles d'hygiène et de sécurité en vigueur, et prends l'entière responsabilité des actes réalisés dans mon établissement.",
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-8"
      style={{ background: 'var(--brand-navy)' }}
    >
      {/* Fond */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/hero-login-bg-hLRj6RMZ79APYJzwLEuAnp.webp)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, rgba(10,22,40,0.7) 0%, rgba(10,22,40,0.97) 100%)' }}
      />

      <div className="relative z-10 w-full flex flex-col items-center gap-6">

        {/* Logo + titre */}
        <div className="flex flex-col items-center">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/logo_intemporelle_293813dd.jpg"
            alt="Intemporelle RGPD & Cybersécurité"
            className="rounded-lg mb-3"
            style={{ width: '200px', objectFit: 'contain' }}
          />
          <h1
            className="text-2xl font-800 text-white text-center"
            style={{ fontFamily: 'Outfit', fontWeight: 800 }}
          >
            studio.studiomanagereurope.eu
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--brand-cyan)' }}>
            Première utilisation — Engagements professionnels
          </p>
        </div>

        {/* Carte engagements */}
        <div style={cardStyle}>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={20} style={{ color: 'var(--brand-cyan)', flexShrink: 0 }} />
            <h2
              className="text-base font-700"
              style={{ color: 'var(--brand-text)', fontWeight: 700 }}
            >
              Engagements professionnels
            </h2>
          </div>

          <p className="text-xs mb-5" style={{ color: 'var(--brand-text-muted)', lineHeight: 1.6 }}>
            Avant de commencer, veuillez lire et accepter les engagements suivants. Ces engagements sont obligatoires pour utiliser l'application.
          </p>

          <div className="space-y-3 mb-6">
            {engagementItems.map(({ key, icon, titre, texte }) => (
              <label
                key={key}
                className="flex items-start gap-3 p-3 rounded-lg cursor-pointer"
                style={{
                  background: engagements[key]
                    ? 'rgba(131,208,245,0.06)'
                    : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${engagements[key] ? 'var(--brand-cyan)' : 'var(--brand-border)'}`,
                  transition: 'all 0.2s',
                }}
                onClick={() => toggle(key)}
              >
                {/* Checkbox */}
                <div
                  className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: engagements[key] ? 'var(--brand-cyan)' : 'transparent',
                    border: `2px solid ${engagements[key] ? 'var(--brand-cyan)' : 'var(--brand-border)'}`,
                    transition: 'all 0.2s',
                  }}
                >
                  {engagements[key] && (
                    <Check size={12} style={{ color: 'var(--brand-navy)' }} />
                  )}
                </div>

                {/* Texte */}
                <div className="flex-1">
                  <p
                    className="text-xs font-600 mb-1"
                    style={{ color: 'var(--brand-text)', fontWeight: 600 }}
                  >
                    {icon} {titre}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--brand-text-muted)', lineHeight: 1.5 }}>
                    {texte}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {/* Compteur d'engagements */}
          {!allChecked && (
            <div
              className="p-3 rounded-lg mb-4"
              style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}
            >
              <p className="text-xs" style={{ color: 'rgba(201,168,76,0.9)', lineHeight: 1.6 }}>
                ⚠️ Vous devez cocher les <strong>{Object.values(engagements).filter(Boolean).length}/3</strong> engagements pour continuer.
              </p>
            </div>
          )}

          {/* Bouton démarrer */}
          <button
            onClick={handleDemarrer}
            disabled={!allChecked || isLoading}
            style={{
              width: '100%',
              background: allChecked ? 'var(--brand-cyan)' : 'rgba(131,208,245,0.2)',
              color: allChecked ? 'var(--brand-navy)' : 'var(--brand-text-muted)',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.85rem 1.5rem',
              fontWeight: 700,
              fontSize: '15px',
              cursor: allChecked && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            {isLoading ? (
              <>
                <div
                  className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: 'var(--brand-navy)', borderTopColor: 'transparent' }}
                />
                Chargement...
              </>
            ) : (
              <>
                Démarrer Studio Pierceur Tatoueur Dermographe
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>

        {/* Mention propriété Intemporelle */}
        <p
          className="text-xs text-center"
          style={{ color: 'var(--brand-text-muted)', opacity: 0.5, maxWidth: 320 }}
        >
          Application propriété de la Société Intemporelle · 06.17.07.41.69
        </p>
      </div>
    </div>
  );
}

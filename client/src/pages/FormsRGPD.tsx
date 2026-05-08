import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/lib/app-context';
import { X } from 'lucide-react';
import SignaturePad from '@/components/SignaturePad';
import { Client } from '@/lib/types';
import { FormSection, FormField, DateSlashField, LegalBox, PrintHeader, PrintFooter } from './FormsCommuns';

function FormEngagementConfidentialite({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
  return (
    <>
      {/* En-tête */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-900 mb-1" style={{ color: '#1b5e20', fontFamily: 'Outfit', fontWeight: 900, letterSpacing: '-0.02em' }}>ENGAGEMENT DE CONFIDENTIALITÉ</h2>
        <p className="text-sm italic mb-1" style={{ color: '#C8860A' }}>Données personnelles clients — RGPD Art. 29</p>
        <p className="text-xs" style={{ color: '#1e293b', fontWeight: 600 }}>À signer par tout employé, stagiaire ou prestataire ayant accès aux données clients</p>
      </div>

      {/* Identité du signataire */}
      <div className="mb-4">
        <div className="px-3 py-2 mb-3" style={{ background: 'var(--brand-navy)', borderRadius: 6 }}>
          <p className="text-xs font-700 uppercase tracking-wider" style={{ color: '#fff', fontWeight: 700 }}>IDENTITÉ DU SIGNATAIRE</p>
        </div>
        <div className="space-y-3">
          <FormField label="Nom et Prénom" value={data.nomSignataire || ''} onChange={v => update('nomSignataire', v)} required />
          <FormField label="Poste / Fonction" value={data.posteSignataire || ''} onChange={v => update('posteSignataire', v)} required />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Type de contrat" value={data.typeContrat || ''} onChange={v => update('typeContrat', v)} required />
            <DateSlashField label="Date de début de mission" value={data.dateDebutMission || ''} onChange={v => update('dateDebutMission', v)} required />
          </div>
          <DateSlashField label="Date de fin de mission (si connue)" value={data.dateFinMission || ''} onChange={v => update('dateFinMission', v)} />
          <FormField label="Nom du salon / Établissement" value={data.nomSalon || ''} onChange={v => update('nomSalon', v)} required />
        </div>
      </div>

      {/* Préambule */}
      <div className="mb-4">
        <div className="px-3 py-2 mb-3" style={{ background: 'var(--brand-navy)', borderRadius: 6 }}>
          <p className="text-xs font-700 uppercase tracking-wider" style={{ color: '#fff', fontWeight: 700 }}>PRÉAMBULE</p>
        </div>
        <div className="p-4 rounded-xl text-xs leading-relaxed space-y-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', lineHeight: 1.7 }}>
          <p>Dans le cadre de ses fonctions au sein du salon de piercing, le signataire est amené à accéder à des données personnelles de clients, incluant notamment des <strong style={{ color: 'var(--brand-cyan)' }}>données de santé</strong> au sens de l'article 9 du RGPD (Règlement UE 2016/679). Ces données sont strictement confidentielles et font l'objet d'une protection renforcée en droit français et européen.</p>
          <p>Conformément à l'article 29 du RGPD, les personnes agissant sous l'autorité du responsable de traitement ne peuvent traiter ces données que sur instruction de ce dernier, sauf obligation légale contraire.</p>
        </div>
      </div>

      {/* Obligations */}
      <div className="mb-4">
        <div className="px-3 py-2 mb-3" style={{ background: 'var(--brand-navy)', borderRadius: 6 }}>
          <p className="text-xs font-700 uppercase tracking-wider" style={{ color: '#fff', fontWeight: 700 }}>OBLIGATIONS DU SIGNATAIRE</p>
        </div>
        <div className="space-y-3">
          {[
            { num: '1', titre: 'SECRET PROFESSIONNEL ET DISCRÉTION ABSOLUE', texte: "Le signataire s'engage à garder strictement confidentielles toutes les informations personnelles des clients : identité, coordonnées, données de santé (allergies, antécédents médicaux, traitements). Cette obligation s'applique pendant toute la durée de la mission et sans limitation de durée après sa cessation." },
            { num: '2', titre: 'UTILISATION STRICTEMENT LIMITÉE AUX BESOINS PROFESSIONNELS', texte: "Les données clients ne peuvent être consultées ou utilisées qu'à des fins strictement nécessaires à l'exécution des prestations du salon. Toute utilisation à des fins personnelles ou commerciales est formellement interdite." },
            { num: '3', titre: 'INTERDICTION DE COPIE ET D’EXTRACTION', texte: "Il est strictement interdit de copier, photographier, télécharger ou extraire des données clients sur tout support personnel (téléphone, clé USB, email personnel, cloud privé…) sans autorisation écrite préalable du responsable. Toute violation constitue une infraction pénale." },
            { num: '4', titre: 'OBLIGATION DE SIGNALEMENT', texte: "Le signataire s'engage à signaler immédiatement toute violation ou suspicion de violation de données personnelles (accès non autorisé, perte de document, divulgation accidentelle). Toute violation doit être notifiée à la CNIL dans les 72 heures (Art. 33 RGPD)." },
            { num: '5', titre: 'RESPECT DES PROCÉDURES INTERNES', texte: "Le signataire s'engage à respecter l'ensemble des procédures internes relatives à la protection des données : utilisation des outils agréés (JotForm EU, serveurs sécurisés), non-utilisation de supports non sécurisés, verrouillage des écrans." },
            { num: '6', titre: 'DROITS DES PERSONNES CONCERNÉES', texte: "En cas de demande d'un client visant à exercer ses droits RGPD (accès, rectification, effacement, opposition), le signataire s'engage à transmettre immédiatement cette demande au responsable du salon sans y répondre directement." },
          ].map((item) => (
            <div key={item.num} className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <p className="text-xs font-700 mb-1" style={{ color: '#0369a1', fontWeight: 700 }}>
                {item.num} — {item.titre}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#0f172a', lineHeight: 1.7 }}>{item.texte}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Avertissement pénal */}
      <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.3)' }}>
        <p className="text-xs leading-relaxed" style={{ color: '#0f172a', lineHeight: 1.7 }}>
          ■ Tout manquement expose le signataire à des sanctions disciplinaires pouvant aller jusqu'au licenciement pour faute grave, sans préjudice des poursuites pénales au titre de l'article 226-13 du Code pénal (violation du secret professionnel : <strong style={{ color: '#E53935' }}>1 an d'emprisonnement et 15 000 € d'amende</strong>).
        </p>
      </div>

      {/* Durée de l'engagement */}
      <div className="mb-4">
        <div className="px-3 py-2 mb-3" style={{ background: 'var(--brand-navy)', borderRadius: 6 }}>
          <p className="text-xs font-700 uppercase tracking-wider" style={{ color: '#fff', fontWeight: 700 }}>DURÉE DE L'ENGAGEMENT</p>
        </div>
        <div className="p-4 rounded-xl text-xs leading-relaxed" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', lineHeight: 1.7 }}>
          <p>Le présent engagement prend effet à la date de signature et s'applique pendant toute la durée de la relation contractuelle. Les obligations de confidentialité <strong style={{ color: 'var(--brand-cyan)' }}>survivent à la cessation du contrat, sans limitation de durée</strong>, pour toutes les informations auxquelles le signataire a eu accès.</p>
        </div>
      </div>

      {/* Signatures */}
      <div className="mb-4">
        <div className="px-3 py-2 mb-3" style={{ background: 'var(--brand-navy)', borderRadius: 6 }}>
          <p className="text-xs font-700 uppercase tracking-wider" style={{ color: '#fff', fontWeight: 700 }}>SIGNATURES</p>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <div className="p-4 rounded-xl space-y-3" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
            <p className="text-xs font-700" style={{ color: '#1b5e20', fontWeight: 700 }}>LE SIGNATAIRE — Lu et approuvé</p>
            <FormField label="Nom, Prénom" value={data.signataireNomSignature || ''} onChange={v => update('signataireNomSignature', v)} />
            <DateSlashField label="Date" value={data.signataireDate || ''} onChange={v => update('signataireDate', v)} required />
            <SignaturePad
              label="Signature du signataire"
              value={data.signatureImageSignataire || ''}
              onChange={v => update('signatureImageSignataire', v ?? '')}
            />
          </div>
        </div>
      </div>
      <div className="text-center mt-4">
        <p className="text-xs italic" style={{ color: '#1e293b', fontWeight: 600 }}>Document à établir en deux exemplaires originaux — Un exemplaire conservé par le salon, un exemplaire remis au signataire.</p>
      </div>
    </>
  );
}
// ─── Formulaire Affichage Salon ───
function FormAffichageSalon({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
  const blocs = [    {
      titre: 'Pourquoi ces informations vous sont demandées ?',
      texte: "Nous collectons certaines informations afin d'assurer votre sécurité lors de la réalisation du tatouage ou du piercing. (Article 5 RGPD – principe de finalité)",
      borderColor: '#E53935',
      titleColor: '#E53935',
    },
    {
      titre: 'Quelles données sont concernées ?',
      texte: "Des informations générales peuvent être demandées (ex : allergies ou contre-indications connues). Ces données sont limitées au strict nécessaire. (Article 5 RGPD – minimisation des données)",
      borderColor: '#1565C0',
      titleColor: '#1565C0',
    },
    {
      titre: 'Vos garanties',
      texte: "Données confidentielles • Accès limité au professionnel • Conservation limitée • Aucune transmission à des tiers (Article 32 RGPD – sécurité des données)",
      borderColor: '#2E7D32',
      titleColor: '#2E7D32',
    },
    {
      titre: 'Votre consentement',
      texte: "Les données de santé ne sont collectées qu'avec votre consentement explicite. (Article 9 RGPD – données sensibles) Vous êtes libre de ne pas répondre. (Article 7 RGPD – conditions du consentement)",
      borderColor: '#E65100',
      titleColor: '#E65100',
    },
    {
      titre: 'Vos droits',
      texte: "Vous disposez des droits suivants : • Accès (Article 15) • Rectification (Article 16) • Effacement (Article 17) • Limitation (Article 18)",
      borderColor: '#4527A0',
      titleColor: '#4527A0',
    },
    {
      titre: 'Engagement du professionnel',
      texte: "Le professionnel s'engage à respecter le RGPD et à ne collecter que les données strictement nécessaires. (Article 24 RGPD – responsabilité du responsable de traitement)",
      borderColor: '#546E7A',
      titleColor: '#546E7A',
    },
  ];

  return (
    <>
      {/* En-tête */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-900 mb-1" style={{ color: '#1b5e20', fontFamily: 'Outfit', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
          INFORMATION CLIENT – PROTECTION DE VOS DONNÉES (RGPD)
        </h2>
      </div>

      {/* Blocs colorés */}
      <div className="space-y-3 mb-6">
        {blocs.map((bloc, i) => (
          <div
            key={i}
            className="p-4 rounded-xl"
            style={{
              background: '#ffffff',
              border: `2px solid ${bloc.borderColor}`,
            }}
          >
            <p className="text-sm font-700 mb-2" style={{ color: bloc.titleColor, fontWeight: 700 }}>
              {bloc.titre}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: '#1e293b', lineHeight: 1.7 }}>
              {bloc.texte}
            </p>
          </div>
        ))}
      </div>

      {/* Personnalisation salon */}
      <div className="mb-4">
        <div className="px-3 py-2 mb-3" style={{ background: 'var(--brand-navy)', borderRadius: 6 }}>
          <p className="text-xs font-700 uppercase tracking-wider" style={{ color: '#fff', fontWeight: 700 }}>INFORMATIONS DU SALON</p>
        </div>
        <div className="space-y-3">
          <FormField label="Nom du salon" value={data.nomSalon || ''} onChange={v => update('nomSalon', v)} />
          <FormField label="Responsable du traitement (Nom, Prénom)" value={data.responsableTraitement || ''} onChange={v => update('responsableTraitement', v)} />
          <FormField label="Email de contact RGPD" value={data.emailRgpd || ''} onChange={v => update('emailRgpd', v)} type="email" />
          <FormField label="Durée de conservation des données" value={data.dureeConservation || '5 ans'} onChange={v => update('dureeConservation', v)} />
        </div>
      </div>

      <div className="p-4 rounded-xl" style={{ background: 'rgba(229,57,53,0.05)', border: '1px solid rgba(229,57,53,0.2)' }}>
        <p className="text-xs" style={{ color: 'var(--brand-text)', lineHeight: 1.7 }}>
          <strong style={{ color: '#E53935' }}>Base légale :</strong> Règlement (UE) 2016/679 du Parlement européen et du Conseil du 27 avril 2016 (RGPD). Ce document est destiné à être affiché dans le salon ou remis au client lors de chaque prestation.
        </p>
      </div>
    </>
  );
}


export { FormEngagementConfidentialite, FormAffichageSalon };

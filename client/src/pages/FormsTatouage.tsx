import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/lib/app-context';
import { Eye, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import SignaturePad from '@/components/SignaturePad';
import { Client } from '@/lib/types';
import { FormSection, FormField, RadioField, DateSlashField, CheckboxField, LegalBox, RgpdMentions, WarningBox, AgeVerif, PrintHeader, PrintFooter } from './FormsCommuns';

function FormFicheSeance({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
  const { state: _s } = useApp();
  const salonInfo = _s.salonInfo;
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  const photos: string[] = data.photosTracabilite || [];

  const formatBirthDateForInput = (dateNaissance: string): string => {
    if (!dateNaissance) return '';
    const value = String(dateNaissance).trim();
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
    return value;
  };

  const normalizeBirthDateInput = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    const year = digits.slice(4, 8);
    return [day, month, year].filter(Boolean).join('/');
  };

  // Calcul automatique de l'âge
  const calculateAge = (dateNaissance: string): string => {
    if (!dateNaissance) return '';
    const value = String(dateNaissance).trim();
    let birth: Date;
    const frMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (frMatch) {
      birth = new Date(Number(frMatch[3]), Number(frMatch[2]) - 1, Number(frMatch[1]));
    } else {
      birth = new Date(value);
    }
    if (isNaN(birth.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 0 ? String(age) : '';
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const b64 = e.target?.result as string;
        update('photosTracabilite', [...(data.photosTracabilite || []), b64]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (idx: number) => {
    const updated = [...photos];
    updated.splice(idx, 1);
    update('photosTracabilite', updated);
  };

  return (
    <>
      <LegalBox>
        <strong>Fiche de Traçabilité Matériel Stérile</strong><br />
        Conforme ARS — Arrêté du 13 mars 2009 & Décret 2008-149
      </LegalBox>

      <FormSection title="1 — IDENTITÉ DU CLIENT" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nom de famille" value={data.nomClient || client.nom} onChange={v => update('nomClient', v)} required />
        <FormField label="Prénom(s)" value={data.prenomClient || client.prenom} onChange={v => update('prenomClient', v)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="mb-3">
          <label className="block text-xs mb-1" style={{ color: '#111111', fontWeight: 700 }}>Date de naissance</label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="bday"
            placeholder="JJ/MM/AAAA"
            value={formatBirthDateForInput(data.dateNaissanceClient || client.dateNaissance || '')}
            onChange={e => {
              const formatted = normalizeBirthDateInput(e.target.value);
              update('dateNaissanceClient', formatted);
              update('ageClient', calculateAge(formatted));
            }}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              background: '#f8f9fa',
              border: '1px solid #aaaaaa',
              color: '#111111',
              fontFamily: 'Outfit',
              WebkitAppearance: 'none',
              touchAction: 'manipulation',
            }}
          />
        </div>
        <div className="mb-3">
          <label className="block text-xs mb-1" style={{ color: '#111111', fontWeight: 700 }}>Âge (calculé automatiquement)</label>
          <div className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--brand-border)', color: '#1b5e20', opacity: 0.8 }}>
            {data.ageClient || calculateAge(data.dateNaissanceClient || client.dateNaissance || '') || '—'} {(data.ageClient || calculateAge(data.dateNaissanceClient || client.dateNaissance || '')) ? 'ans' : ''}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Téléphone" value={data.telephoneClient || client.telephone || ''} onChange={v => update('telephoneClient', v)} type="tel" required />
        <FormField label="Courriel" value={data.emailClient || client.email || ''} onChange={v => update('emailClient', v)} type="email" required />
      </div>

      <FormSection title="2 — TRAÇABILITÉ DU MATÉRIEL RÉUTILISABLE STÉRILISÉ" />
      <WarningBox>Photographiez les étiquettes de traçabilité du matériel stérile. L'emballage stérile est ouvert devant le client. Conserver les photos 5 ans minimum.</WarningBox>




      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setLightboxPhoto(null)}
        >
          <img src={lightboxPhoto} alt="Agrandissement" className="max-w-full max-h-full rounded-xl" style={{ maxWidth: '90vw', maxHeight: '90vh' }} />
          <button
            type="button"
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-lg"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
            onClick={() => setLightboxPhoto(null)}
          >×</button>
        </div>
      )}




      <FormSection title="3 — SIGNATURE DU PIERCEUR" />
      <div className="grid grid-cols-1 gap-3">
        <FormField label="Nom du pierceur" value={data.nomPierceur || salonInfo?.nomTatoueur || ''} onChange={v => update('nomPierceur', v)} />
        <FormField label="Date" value={data.datePierceur || new Date().toLocaleDateString('fr-FR')} onChange={v => update('datePierceur', v)} />
        <div className="mt-3">
          <SignaturePad
            label="Signature du pierceur"
            value={data.signaturePierceur || ''}
            onChange={v => update('signaturePierceur', v ?? '')}
          />
        </div>
      </div>

      <LegalBox>
        <em>Conservation : 5 ans minimum à compter de la dernière prestation (Art. R 1311-7 CSP + Arrêté 13/03/2009). Copie conservée par le salon. VOS DROITS RGPD — Pour exercer vos droits : {salonInfo?.email || "contact@votresalon.fr"}<br />
        Support : L'écrit électronique a la même force probante que l'écrit papier (Art. 1366 du Code civil).</em>
      </LegalBox>



      <RgpdMentions />

    </>
  );
}

// ─── Page principale DocumentForm ────────────────────────────────────────────


// ─── Formulaire Consentement & Soins Post-Tatouage ───────────────────────────

const CICATRISATION_JOURS = [
  {
    phase: 'Phase 1 — Inflammation aiguë',
    jours: 'J1 — J3',
    couleur: '#F44336',
    etapes: [
      { jour: 'J1', titre: 'Immédiatement après la séance', instructions: "Le film protecteur (Dermalize / Saniderm / film alimentaire) est posé par le tatoueur. Ne pas retirer avant 2 à 4 heures minimum. La zone est rouge, légèrement gonflée et peut suinter un liquide clair ou légèrement rosé : c'est normal. Ne pas toucher, ne pas frotter." },
      { jour: 'J1 soir', titre: 'Premier nettoyage', instructions: "Retirer délicatement le film sous l'eau tiède. Laver doucement avec un savon surgras non parfumé (Dove, Neutrogena, Sanex doux) en mouvements circulaires très légers. Rincer abondamment à l'eau tiède. Sécher en tamponnant (ne jamais frotter) avec une compresse stérile ou un essuie-tout propre. Appliquer une fine couche de crème cicatrisante (Bepanthen, Cicalfate, Tattoo Goo) — couche légère, pas épaisse." },
      { jour: 'J2', titre: 'Inflammation normale', instructions: "La zone reste rouge, chaude au toucher, légèrement gonflée. Continuer : 2 à 3 nettoyages par jour au savon surgras doux + application fine de crème cicatrisante. Ne pas remettre de film occlusif. Éviter tout contact avec des vêtements serrés sur la zone. Boire beaucoup d'eau pour favoriser la régénération cellulaire." },
      { jour: 'J3', titre: 'Début de la desquamation', instructions: "Les premières pellicules fines peuvent apparaître : c'est la peau morte qui se détache naturellement. Ne jamais arracher, gratter ou peler ces pellicules — risque de décoloration et d'infection. Continuer le protocole de nettoyage 2×/jour. La crème cicatrisante peut être appliquée 3 fois par jour si la peau tire fortement." },
    ],
  },
  {
    phase: 'Phase 2 — Desquamation & Régénération',
    jours: 'J4 — J14',
    couleur: '#FF9800',
    etapes: [
      { jour: 'J4 — J7', titre: 'Desquamation active', instructions: "La peau pèle comme après un coup de soleil : fines lamelles qui tombent naturellement. Les couleurs peuvent sembler ternes ou voilées sous la couche de peau morte — c'est temporaire. Continuer 2 nettoyages/jour + crème cicatrisante. Si des démangeaisons apparaissent : tapoter doucement (ne jamais gratter). Éviter absolument l'exposition solaire directe sur la zone." },
      { jour: 'J8 — J10', titre: 'Fin de la desquamation', instructions: 'La majorité des pellicules sont tombées. La peau retrouve progressivement son aspect normal. Les couleurs commencent à réapparaître plus nettement. Réduire la crème cicatrisante à 1 à 2 applications/jour. Continuer le nettoyage doux 1×/jour. La zone peut encore être légèrement sensible au toucher.' },
      { jour: 'J11 — J14', titre: 'Peau régénérée en surface', instructions: 'La couche superficielle de la peau est régénérée. Le tatouage est visible dans ses couleurs finales (ou presque). Continuer à hydrater avec une crème neutre non parfumée (Lubriderm, Aveeno, Cetaphil). Éviter le soleil, la piscine, la mer et les bains prolongés. La peau peut encore être légèrement brillante ou tendue.' },
    ],
  },
  {
    phase: 'Phase 3 — Cicatrisation profonde',
    jours: 'J15 — J30',
    couleur: '#4CAF50',
    etapes: [
      { jour: 'J15 — J21', titre: 'Cicatrisation dermique', instructions: 'La surface est cicatrisée mais les couches profondes du derme continuent de se régénérer. Hydrater 1×/jour avec une crème neutre. Appliquer un écran solaire SPF 50+ à chaque exposition au soleil (obligatoire pendant 3 mois). La piscine et la mer sont autorisées avec précaution (rincer immédiatement après). Éviter les bains prolongés (baignoire, hammam, sauna).' },
      { jour: 'J22 — J30', titre: 'Fin de la cicatrisation visible', instructions: "Le tatouage est pleinement cicatrisé en surface. Les couleurs sont stabilisées. Continuer l'hydratation quotidienne pour maintenir la qualité de l'encre sur le long terme. Protection solaire SPF 50+ obligatoire à chaque exposition pendant encore 2 mois. En cas de doute sur la cicatrisation, contacter le tatoueur ou un médecin." },
    ],
  },
];

function FormConsentementSoinsTatouage({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
  const { state: _s } = useApp();
  const salonInfo = _s.salonInfo;
  return (
    <>
      {/* Cadre légal */}
      <LegalBox color="orange">
        <strong>■ Cadre légal — Arrêté du 3 décembre 2008 (ARS) + Règlement UE 2020/2081</strong><br />
        ■ Toute prestation de tatouage est soumise à la réglementation sanitaire française.<br />
        ■ Les encres utilisées sont conformes au Règlement UE 2020/2081 (en vigueur depuis le 4 janvier 2022).<br />
        ■ Conservation du dossier : <strong>5 ans</strong> minimum à compter de la dernière prestation (Art. R 1311-7 CSP).
      </LegalBox>
      <LegalBox color="cyan">
        <em>VOS DROITS RGPD — Art. 15 Droit d'accès · Art. 16 Rectification · Art. 17 Effacement · Art. 21 Opposition.<br />
        Pour exercer vos droits : {salonInfo?.email || "contact@votresalon.fr"} — L'écrit électronique a la même force probante que l'écrit papier (Art. 1366 Code civil).</em>
      </LegalBox>

      {/* Identité client */}
      <FormSection title="1 — IDENTITÉ DU CLIENT" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nom de famille" value={data.nom || client.nom} onChange={v => update('nom', v)} required />
        <FormField label="Prénom(s)" value={data.prenom || client.prenom} onChange={v => update('prenom', v)} required />
      </div>
      <FormField label="Date de naissance (JJ/MM/AAAA)" value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} required />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />
      <FormField label="Téléphone" value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" required />

      {/* Consentement éclairé */}
      <FormSection title="2 — CONSENTEMENT ÉCLAIRÉ" />
      <LegalBox color="green">
        En signant ce document, le client déclare avoir été informé(e) des éléments suivants et y consent librement :
      </LegalBox>
      <CheckboxField label="Je suis majeur(e) et en pleine capacité juridique" value={data.consent_majeur || false} onToggle={() => update('consent_majeur', !data.consent_majeur)} required />
      <CheckboxField label="J'ai répondu honnêtement au questionnaire médical" value={data.consent_honnete || false} onToggle={() => update('consent_honnete', !data.consent_honnete)} required />
      <CheckboxField label="J'ai été informé(e) des risques : infection, allergie, chéloïde, décoloration, retouche possible" value={data.consent_risques || false} onToggle={() => update('consent_risques', !data.consent_risques)} required />
      <CheckboxField label="J'ai été informé(e) que le résultat définitif est visible après cicatrisation complète (3 à 4 semaines)" value={data.consent_resultat || false} onToggle={() => update('consent_resultat', !data.consent_resultat)} required />
      <CheckboxField label="J'accepte que le tatouage est permanent et que les retouches peuvent nécessiter une séance supplémentaire" value={data.consent_permanent || false} onToggle={() => update('consent_permanent', !data.consent_permanent)} required />
      <CheckboxField label="J'ai reçu et lu la fiche de soins post-tatouage" value={data.consent_ficheRecue || false} onToggle={() => update('consent_ficheRecue', !data.consent_ficheRecue)} required />
      <CheckboxField label="Je m'engage à respecter le protocole de cicatrisation" value={data.consent_protocole || false} onToggle={() => update('consent_protocole', !data.consent_protocole)} required />
      <CheckboxField label="Je consens librement à la réalisation de cette prestation" value={data.consent_libre || false} onToggle={() => update('consent_libre', !data.consent_libre)} required />
      <CheckboxField label="Je consens expressement au traitement de mes donnees de sante par le salon (Art. 9 RGPD)" value={data.consentDonneesSante || false} onToggle={() => update('consentDonneesSante', !data.consentDonneesSante)} required />

      <FormSection title="6 — PROTOCOLE DE CICATRISATION — J1 À J30" />
      <LegalBox color="cyan">
        <strong>Ce protocole est remis au client à l'issue de chaque séance.</strong> Il constitue la fiche de soins officielle conforme à l'Arrêté du 3 décembre 2008. Le respect de ces consignes conditionne la qualité du résultat et prévient tout risque infectieux.
      </LegalBox>

      {CICATRISATION_JOURS.map((phase, pi) => (
        <div key={pi} className="mb-4">
          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1" style={{ background: phase.couleur + '44' }} />
            <span className="text-xs font-700 px-3 py-1 rounded-full" style={{
              color: phase.couleur,
              background: phase.couleur + '18',
              fontWeight: 700,
              fontFamily: 'Outfit',
              border: `1px solid ${phase.couleur}44`,
            }}>
              {phase.phase} — {phase.jours}
            </span>
            <div className="h-px flex-1" style={{ background: phase.couleur + '44' }} />
          </div>
          {phase.etapes.map((etape, ei) => (
            <div key={ei} className="mb-3 p-3 rounded-xl" style={{
              background: phase.couleur + '08',
              border: `1px solid ${phase.couleur}28`,
            }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-700 px-2 py-0.5 rounded" style={{
                  background: phase.couleur + '22',
                  color: phase.couleur,
                  fontWeight: 700,
                  fontFamily: 'Outfit',
                }}>{etape.jour}</span>
                <span className="text-xs font-600" style={{ color: '#1b5e20', fontWeight: 600 }}>{etape.titre}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#1e293b', lineHeight: 1.7 }}>{etape.instructions}</p>
            </div>
          ))}
        </div>
      ))}

      {/* Règles absolues */}
      <FormSection title="7 — RÈGLES ABSOLUES PENDANT TOUTE LA CICATRISATION" />
      <div className="grid grid-cols-1 gap-3 mb-4">
        <div className="p-3 rounded-xl" style={{ background: 'rgba(244,67,54,0.05)', border: '1px solid rgba(244,67,54,0.2)' }}>
          <p className="text-xs font-700 mb-2" style={{ color: '#F44336', fontWeight: 700 }}>INTERDICTIONS ABSOLUES (J1 à J30)</p>
          {[
            "Gratter, frotter ou peler la peau — risque de décoloration et d'infection",
            'Exposition solaire directe sans protection SPF 50+ — décoloration irréversible',
            'Bain prolongé (baignoire, hammam, sauna, jacuzzi) — macération et infection',
            'Piscine chlorée les 15 premiers jours — produits chimiques agressifs',
            'Mer les 10 premiers jours — bactéries et sel irritants',
            'Vêtements synthétiques serrés sur la zone — frottements et étouffement',
            'Crèmes parfumées, alcool, eau oxygénée, bétadine sur la zone',
            'Rasage de la zone tatouée avant cicatrisation complète',
            'Sport de contact ou activité provoquant une transpiration excessive J1-J7',
          ].map((item, i) => (
            <p key={i} className="text-xs mb-1" style={{ color: '#1e293b' }}>✗ {item}</p>
          ))}
        </div>
        <div className="p-3 rounded-xl" style={{ background: 'rgba(76,175,80,0.05)', border: '1px solid rgba(76,175,80,0.2)' }}>
          <p className="text-xs font-700 mb-2" style={{ color: '#4CAF50', fontWeight: 700 }}>BONNES PRATIQUES (J1 à J30)</p>
          {[
            'Laver les mains avant tout contact avec la zone tatouée',
            'Utiliser uniquement un savon surgras non parfumé (Dove, Neutrogena doux)',
            'Sécher en tamponnant avec une compresse stérile ou essuie-tout propre',
            'Appliquer une fine couche de crème cicatrisante (Bepanthen, Cicalfate, Tattoo Goo)',
            'Hydrater quotidiennement avec une crème neutre non parfumée après J14',
            'Appliquer SPF 50+ à chaque exposition solaire pendant 3 mois',
            'Porter des vêtements amples en coton sur la zone',
            "Boire suffisamment d'eau pour favoriser la régénération cellulaire",
          ].map((item, i) => (
            <p key={i} className="text-xs mb-1" style={{ color: '#1e293b', fontWeight: 600 }}>✓ {item}</p>
          ))}
        </div>
      </div>

      {/* Signes d'alerte */}
      <FormSection title="8 — SIGNES D'ALERTE — CONSULTER UN MÉDECIN" />
      <WarningBox>
        Consultez immédiatement un médecin si vous observez : fièvre &gt; 38°C · rougeur qui s'étend au-delà de la zone tatouée · pus ou écoulement malodorant · douleur intense et croissante · gonflement important après J3 · éruption cutanée généralisée · difficultés respiratoires (choc allergique).
      </WarningBox>
      <FormField label="Contact d'urgence du tatoueur" value={data.contactUrgence || ''} onChange={v => update('contactUrgence', v)} type="tel" />

      {/* Retouche */}
      <FormSection title="9 — RETOUCHE & SUIVI" />
      <LegalBox color="green">
        Une retouche gratuite peut être réalisée <strong>3 mois après la séance</strong>, une fois la cicatrisation complète. Passé ce délai, la retouche peut être facturée. Contactez le salon pour convenir d'un rendez-vous de contrôle.
      </LegalBox>
      <RadioField label="RDV de contrôle proposé" options={['Oui — dans 3 mois', 'Non']} value={data.rdvControle || 'Oui — dans 3 mois'} onChange={v => update('rdvControle', v)} />
      <FormField label="Date du RDV de contrôle (si planifié)" value={data.dateRdvControle || ''} onChange={v => update('dateRdvControle', v)} />
      <FormField label="Observations post-séance" value={data.observationsPostseance || ''} onChange={v => update('observationsPostseance', v)} multiline />

      {/* Documents remis */}
      <FormSection title="10 — DOCUMENTS REMIS AU CLIENT" />
      <CheckboxField label="Fiche de consentement et de soins signée (ce document)" value={data.docConsentement || false} onToggle={() => update('docConsentement', !data.docConsentement)} required />
      <CheckboxField label="Protocole de cicatrisation J1-J30 remis" value={data.docCicatrisation || false} onToggle={() => update('docCicatrisation', !data.docCicatrisation)} required />
      <CheckboxField label="Informations sur les encres (conformité UE 2020/2081)" value={data.docEncres || false} onToggle={() => update('docEncres', !data.docEncres)} required />
      <CheckboxField label="Coordonnées du professionnel remises" value={data.docCoordonnees || false} onToggle={() => update('docCoordonnees', !data.docCoordonnees)} required />

      <LegalBox color="cyan">
        <em>Conservation : 5 ans minimum à compter de la dernière prestation (Art. R 1311-7 CSP + Arrêté 13/03/2009). Copie conservée par le salon. VOS DROITS RGPD — Pour exercer vos droits : {salonInfo?.email || "contact@votresalon.fr"}<br />
        Support : L'écrit électronique a la même force probante que l'écrit papier (Art. 1366 du Code civil).</em>
      </LegalBox>

      <RgpdMentions />
      <FormSection title="11 — SIGNATURES" />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du client — Lu et approuvé" value={data.nomClientSign || client.nom || ''} onChange={v => update('nomClientSign', v)} />
          <FormField label="Date" value={data.dateSignatureClient || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureClient', v)} />
          <div className="mt-3">
            <SignaturePad
              label="Signature du client"
              value={data.signatureImageClient || ''}
              onChange={v => update('signatureImageClient', v ?? '')}
            />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du tatoueur" value={data.nomTatoueurSign || salonInfo?.nomTatoueur || ''} onChange={v => update('nomTatoueurSign', v)} />
          <FormField label="Date" value={data.dateSignatureTatoueur || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureTatoueur', v)} />
          <div className="mt-3">
            <SignaturePad
              label="Signature du tatoueur"
              value={data.signatureImageTatoueur || ''}
              onChange={v => update('signatureImageTatoueur', v ?? '')}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Formulaire Fiche de Séance Tatouage ─────────────────────────────────

function FormFicheSeanceTatouage({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
  const { state: _s } = useApp();
  const salonInfo = _s.salonInfo;
  return (
    <>
      <LegalBox color="green">
        <strong>Cadre réglementaire :</strong> Arrêté du 3 décembre 2008 (traitement tatouage) • Règlement UE 2020/2081 (pigments) • Art. L.1311-1 CSP • RGPD Art. 9 (données santé)
      </LegalBox>

      <FormSection title="1 — IDENTITÉ DU CLIENT" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nom" value={data.nom || client.nom || ''} onChange={v => update('nom', v)} required />
        <FormField label="Prénom" value={data.prenom || client.prenom || ''} onChange={v => update('prenom', v)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Date de naissance" value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} type="date" />
        <FormField label="Téléphone" value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" required />
      </div>
      <FormSection title="2 — INFORMATIONS SÉANCE" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Date de la séance" value={data.dateSeance || ''} onChange={v => update('dateSeance', v)} type="date" required />
        <FormField label="Durée (heures)" value={data.dureeSeance || ''} onChange={v => update('dureeSeance', v)} placeholder="ex : 3h30" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Heure de début" value={data.heureDebut || ''} onChange={v => update('heureDebut', v)} type="time" />
        <FormField label="Heure de fin" value={data.heureFin || ''} onChange={v => update('heureFin', v)} type="time" />
      </div>
      <FormField label="Numéro de séance" value={data.numeroSeance || ''} onChange={v => update('numeroSeance', v)} placeholder="ex : Séance 1/3" />
      <FormField label="Tatoueur / Artiste" value={data.tatoueur || ''} onChange={v => update('tatoueur', v)} placeholder="Nom de l'artiste" required />

      <FormSection title="3 — DESCRIPTION DU TATOUAGE" />
      <FormField label="Zone(s) tatouée(s)" value={data.zones || ''} onChange={v => update('zones', v)} placeholder="ex : avant-bras gauche, épaule droite..." required />
      <FormField label="Description du motif" value={data.motif || ''} onChange={v => update('motif', v)} multiline placeholder="Description du design, style, dimensions approximatives..." />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Dimensions (cm)" value={data.dimensions || ''} onChange={v => update('dimensions', v)} placeholder="ex : 15 x 10 cm" />
        <RadioField label="Style" options={['Traditionnel', 'Réaliste', 'Japonais', 'Tribal', 'Aquarelle', 'Géométrique', 'Lettering', 'Autre']} value={data.style || ''} onChange={v => update('style', v)} />
      </div>
      <FormField label="Séance précédente (observations)" value={data.seancePrecedente || ''} onChange={v => update('seancePrecedente', v)} multiline placeholder="État de la cicatrisation, retouches nécessaires..." />

      <FormSection title="4 — TRAÇABILITÉ DES ENCRES" />
      <LegalBox color="orange">
        <strong>Obligation légale :</strong> Arrêté du 3 déc. 2008 + Règlement UE 2020/2081 — traçabilité obligatoire de chaque encre utilisée (fabricant, référence, N° lot, date péremption). Conservation 5 ans minimum.
      </LegalBox>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="p-3 rounded-lg mb-2" style={{ background: 'rgba(255,152,0,0.04)', border: '1px solid rgba(255,152,0,0.15)' }}>
          <p className="text-xs font-600 mb-2" style={{ color: '#FF9800', fontWeight: 600 }}>Encre n°{i}</p>
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Couleur" value={data[`encre${i}_couleur`] || ''} onChange={v => update(`encre${i}_couleur`, v)} placeholder="ex : Noir, Rouge..." />
            <FormField label="Fabricant" value={data[`encre${i}_fabricant`] || ''} onChange={v => update(`encre${i}_fabricant`, v)} placeholder="Marque" required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Référence / Code" value={data[`encre${i}_ref`] || ''} onChange={v => update(`encre${i}_ref`, v)} placeholder="Réf. produit" required />
            <FormField label="N° de lot" value={data[`encre${i}_lot`] || ''} onChange={v => update(`encre${i}_lot`, v)} placeholder="N° lot" required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Date de péremption" value={data[`encre${i}_peremption`] || ''} onChange={v => update(`encre${i}_peremption`, v)} type="date" required />
            <FormField label="Quantité utilisée (ml)" value={data[`encre${i}_quantite`] || ''} onChange={v => update(`encre${i}_quantite`, v)} placeholder="ml" />
          </div>
        </div>
      ))}

      <FormSection title="5 — MATÉRIEL UTILISÉ" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Machine / Type" value={data.machine || ''} onChange={v => update('machine', v)} placeholder="ex : Rotative, Bobine, Stylo..." />
        <FormField label="Marque de la machine" value={data.marqueMachine || ''} onChange={v => update('marqueMachine', v)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Aiguille(s) utilisée(s)" value={data.aiguilles || ''} onChange={v => update('aiguilles', v)} placeholder="ex : 7RL, 5M1, 9M1..." />
        <FormField label="N° lot aiguilles" value={data.lotAiguilles || ''} onChange={v => update('lotAiguilles', v)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Péremption aiguilles" value={data.peremptionAiguilles || ''} onChange={v => update('peremptionAiguilles', v)} type="date" />
        <FormField label="Cartouches (N° lot)" value={data.lotCartouches || ''} onChange={v => update('lotCartouches', v)} />
      </div>
      <FormField label="Autres consommables (gants, film, savon...)" value={data.autresConsommables || ''} onChange={v => update('autresConsommables', v)} multiline placeholder="Marque, référence, lot..." />

      <FormSection title="6 — DÉROULEMENT DE LA SÉANCE" />
      <RadioField
        label="État de la peau avant séance"
        options={['Excellent', 'Bon', 'Correct', 'Sensible', 'Problème signalé']}
        value={data.etatPeau || ''}
        onChange={v => update('etatPeau', v)}
      />
      <FormField label="Test d'allergie préalable" value={data.testAllergie || ''} onChange={v => update('testAllergie', v)} placeholder="Date et résultat du test patch si réalisé" />
      <FormField label="Préparation de la zone" value={data.preparation || ''} onChange={v => update('preparation', v)} multiline placeholder="Rasage, désinfection, transfert du gabarit..." />
      <FormField label="Observations en cours de séance" value={data.observationsSeance || ''} onChange={v => update('observationsSeance', v)} multiline placeholder="Réactions, pauses, ajustements..." />
      <RadioField
        label="Résultat de la séance"
        options={['Terminée', 'Partielle — à continuer', 'Interrompue', 'Retouche nécessaire']}
        value={data.resultatSeance || ''}
        onChange={v => update('resultatSeance', v)}
      />
      <FormField label="Prochaine séance prévue" value={data.prochaineSeance || ''} onChange={v => update('prochaineSeance', v)} type="date" />

      <FormSection title="7 — SOINS REMIS AU CLIENT" />
      <LegalBox color="cyan">
        Documents remis au client après la séance (Arrêté du 3 déc. 2008, Art. 7).
      </LegalBox>
      <CheckboxField label="Fiche de soins post-tatouage remise" value={!!data.fichesSoinsRemise} onToggle={() => update('fichesSoinsRemise', !data.fichesSoinsRemise)} required />
      <CheckboxField label="Informations sur les encres communiquées" value={!!data.infosEncresRemises} onToggle={() => update('infosEncresRemises', !data.infosEncresRemises)} required />
      <CheckboxField label="Conseils de cicatrisation expliqués oralement" value={!!data.conseilsOraux} onToggle={() => update('conseilsOraux', !data.conseilsOraux)} required />
      <FormField label="Autres documents remis" value={data.autresDocuments || ''} onChange={v => update('autresDocuments', v)} placeholder="Préciser si nécessaire" />


      <FormSection title="8 — SIGNATURE" />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du tatoueur" value={data.signatureTatoueur || salonInfo?.nomTatoueur || ''} onChange={v => update('signatureTatoueur', v)} />
          <div className="mt-3">
            <SignaturePad
              label="Signature du tatoueur"
              value={data.signatureImageTatoueur || ''}
              onChange={v => update('signatureImageTatoueur', v ?? '')}
            />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Lu et approuvé — Nom du client" value={data.signatureClient || client.nom || ''} onChange={v => update('signatureClient', v)} />
          <div className="mt-3">
            <SignaturePad
              label="Signature du client"
              value={data.signatureImageClient || ''}
              onChange={v => update('signatureImageClient', v ?? '')}
            />
          </div>
        </div>
      </div>
    </>
  );
}
// ─── Formulaire Questionnaire Médical Tatouage Mineur ────────────────────────

function FormQuestionnaireTatouageMineur({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
  const { state: _s } = useApp();
  const salonInfo = _s.salonInfo;
  const { t } = useTranslation();
  const yesNo = [t('forms.no'), t('forms.yes')];
  return (
    <>
      <LegalBox color="orange">{t('legal.minor_legal_frame')}</LegalBox>
      <LegalBox color="cyan"><em>{t('legal.rgpd_minor')}</em></LegalBox>
      <LegalBox color="green"><em>{t('legal.eu_ink_regulation')}</em></LegalBox>
      <FormField label={t('forms.salon_name')} value={data.nomSalon || ''} onChange={v => update('nomSalon', v)} />
      <FormSection title={t('q01.section_minor_identity')} />
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('forms.last_name')} value={data.nom || client.nom} onChange={v => update('nom', v)} required />
        <FormField label={t('forms.first_name')} value={data.prenom || client.prenom} onChange={v => update('prenom', v)} required />
      </div>
      <FormField label={t('forms.dob')} value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} required />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />
      <FormField label={t('forms.phone')} value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" required />
      <FormSection title="Représentant légal" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nom du représentant légal" value={data.nomRepresentant || client.nomRepresentantLegal || ''} onChange={v => update('nomRepresentant', v)} required />
        <FormField label="Prénom du représentant légal" value={data.prenomRepresentant || client.prenomRepresentantLegal || ''} onChange={v => update('prenomRepresentant', v)} required />
      </div>
      <FormField label="Lien avec le mineur" value={data.lienRepresentant || client.lienRepresentantLegal || ''} onChange={v => update('lienRepresentant', v)} required />
      <FormField label="Téléphone du représentant légal" value={data.telephoneRepresentant || client.telephoneRepresentantLegal || client.telephone || ''} onChange={v => update('telephoneRepresentant', v)} type="tel" required />
      <FormSection title={t('q05.section_tattoo_project')} />
      <FormField label={t('q05.zone_to_tattoo')} value={data.zoneTatouage || ''} onChange={v => update('zoneTatouage', v)} required />
      <FormField label={t('q05.motif_description')} value={data.descriptionMotif || ''} onChange={v => update('descriptionMotif', v)} multiline />
      <RadioField label={t('q05.first_tattoo')} options={[t('forms.yes'), t('forms.no')]} value={data.premierTatouage || t('forms.no')} onChange={v => update('premierTatouage', v)} />
      <FormSection title={t('q05.section_health')} />
      <WarningBox>{t('q01.warning_health')}</WarningBox>
      <RadioField label={t('q01.skin_diseases')} options={yesNo} value={data.maladiesPeau || t('forms.no')} onChange={v => update('maladiesPeau', v)} />
      <RadioField label={t('q01.diabetes')} options={yesNo} value={data.diabete || t('forms.no')} onChange={v => update('diabete', v)} />
      <RadioField label={t('q01.coagulation')} options={yesNo} value={data.troublesCoagulation || t('forms.no')} onChange={v => update('troublesCoagulation', v)} />
      <RadioField label={t('q01.keloid')} options={yesNo} value={data.cheloide || t('forms.no')} onChange={v => update('cheloide', v)} />
      <RadioField label={t('q01.allergy_inks')} options={yesNo} value={data.allergieEncres || t('forms.no')} onChange={v => update('allergieEncres', v)} />
      <RadioField label={t('q01.allergy_latex')} options={yesNo} value={data.allergieLatex || t('forms.no')} onChange={v => update('allergieLatex', v)} />
      <FormField label={t('forms.additional_medical_info')} value={data.autresInfosMedicales || ''} onChange={v => update('autresInfosMedicales', v)} multiline />
      <RadioField label="Pièce d'identité du représentant légal" options={['CNI', 'Passeport', 'Titre de séjour', 'Non présentée']} value={data.pieceIdRepresentantType || ''} onChange={v => update('pieceIdRepresentantType', v)} required />
      {data.pieceIdRepresentantType && data.pieceIdRepresentantType !== 'Non présentée' && (
        <FormField label="Numéro de la pièce d'identité" value={data.pieceIdRepresentantNumero || ''} onChange={v => update('pieceIdRepresentantNumero', v)} required />
      )}
      <FormSection title="Consentement du représentant légal" />
      <CheckboxField label="Le représentant légal a répondu honnêtement au questionnaire médical" value={data.reponduHonnetement || false} onToggle={() => update('reponduHonnetement', !data.reponduHonnetement)} required />
      <CheckboxField label="Le représentant légal donne son consentement pour le tatouage du mineur" value={data.consentementLibre || false} onToggle={() => update('consentementLibre', !data.consentementLibre)} required />
      <CheckboxField label="Le représentant légal assume la responsabilité du suivi des soins" value={data.assumeResponsabilite || false} onToggle={() => update('assumeResponsabilite', !data.assumeResponsabilite)} required />
      <CheckboxField label="Confirme la présence physique du représentant légal lors de la séance" value={data.presenceRepresentant || false} onToggle={() => update('presenceRepresentant', !data.presenceRepresentant)} required />
      <RgpdMentions />
      <FormSection title={t('q05.section_signatures')} />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <p className="text-xs mb-3" style={{ color: '#1e293b', fontWeight: 600 }}>Signature du mineur</p>
          <FormField label="Nom du mineur" value={data.nomMineurSign || `${client.prenom} ${client.nom}`} onChange={v => update('nomMineurSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureMineur || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureMineur', v)} />
          <div className="mt-3">
            <SignaturePad label="Signature du mineur" value={data.signatureImageMineur || ''} onChange={v => update('signatureImageMineur', v ?? '')} />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <p className="text-xs mb-3" style={{ color: '#1e293b', fontWeight: 600 }}>Signature du représentant légal</p>
          <FormField label="Nom du représentant légal" value={data.nomRepresentantSign || data.nomRepresentant || data.nomRep || client.nomRepresentantLegal || ''} onChange={v => update('nomRepresentantSign', v)} required />
          <FormField label={t('forms.date')} value={data.dateSignatureRepresentant || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureRepresentant', v)} required />
          <div className="mt-3">
            <SignaturePad label="Signature du représentant légal" value={data.signatureImageRepresentant || ''} onChange={v => update('signatureImageRepresentant', v ?? '')} />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <FormField label={t('forms.tattoo_artist_name')} value={data.nomTatoueurSign || salonInfo?.nomTatoueur || ''} onChange={v => update('nomTatoueurSign', v)} required />
          <FormField label={t('forms.date')} value={data.dateSignatureTatoueur || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureTatoueur', v)} required />
          <div className="mt-3">
            <SignaturePad label={t('forms.tattoo_artist_signature')} value={data.signatureImageTatoueur || ''} onChange={v => update('signatureImageTatoueur', v ?? '')} />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Formulaire Questionnaire Médical Dermographe Mineur ─────────────────────

function FormQuestionnaireDermographeMineur({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
  const { state: _s } = useApp();
  const salonInfo = _s.salonInfo;
  const { t } = useTranslation();
  const yesNo = [t('forms.no'), t('forms.yes')];
  return (
    <>
      <LegalBox color="orange">{t('legal.minor_legal_frame')}</LegalBox>
      <LegalBox color="cyan"><em>{t('legal.rgpd_minor')}</em></LegalBox>

      <FormField label={t('forms.salon_name')} value={data.nomSalon || ''} onChange={v => update('nomSalon', v)} />

      <FormSection title={t('q01.section_minor_identity')} />
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('forms.last_name')} value={data.nom || client.nom} onChange={v => update('nom', v)} required />
        <FormField label={t('forms.first_name')} value={data.prenom || client.prenom} onChange={v => update('prenom', v)} required />
      </div>
      <FormField label={t('forms.dob')} value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} required />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />
      <FormField label={t('forms.phone')} value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" required />

      <FormSection title="Représentant légal" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nom du représentant légal" value={data.nomRepresentant || client.nomRepresentantLegal || ''} onChange={v => update('nomRepresentant', v)} required />
        <FormField label="Prénom du représentant légal" value={data.prenomRepresentant || client.prenomRepresentantLegal || ''} onChange={v => update('prenomRepresentant', v)} required />
      </div>
      <FormField label="Lien avec le mineur" value={data.lienRepresentant || client.lienRepresentantLegal || ''} onChange={v => update('lienRepresentant', v)} required />
      <FormField label="Téléphone du représentant légal" value={data.telephoneRepresentant || client.telephoneRepresentantLegal || client.telephone || ''} onChange={v => update('telephoneRepresentant', v)} type="tel" required />

      <FormSection title="Zone de dermographie" />
      <RadioField
        label="Zone à traiter"
        options={['Sourcils', 'Lèvres', 'Eye-liner supérieur', 'Eye-liner inférieur', 'Autre']}
        value={data.zoneDermographie || ''}
        onChange={v => update('zoneDermographie', v)}
        required
      />

      <FormSection title="Santé du mineur" />
      <WarningBox>Répondez honnêtement. Ces informations sont essentielles pour la sécurité du mineur.</WarningBox>
      <RadioField label={t('q01.skin_diseases')} options={yesNo} value={data.maladiesPeau || t('forms.no')} onChange={v => update('maladiesPeau', v)} />
      <RadioField label={t('q01.diabetes')} options={yesNo} value={data.diabete || t('forms.no')} onChange={v => update('diabete', v)} />
      <RadioField label={t('q01.coagulation')} options={yesNo} value={data.troublesCoagulation || t('forms.no')} onChange={v => update('troublesCoagulation', v)} />
      <RadioField label={t('q01.keloid')} options={yesNo} value={data.cheloide || t('forms.no')} onChange={v => update('cheloide', v)} />
      <RadioField label="Herpès labial" options={[t('forms.no'), t('forms.yes'), 'Non applicable']} value={data.herpesLabial || 'Non applicable'} onChange={v => update('herpesLabial', v)} />
      <RadioField label={t('q01.allergy_inks')} options={yesNo} value={data.allergieEncres || t('forms.no')} onChange={v => update('allergieEncres', v)} />
      <RadioField label={t('q01.allergy_latex')} options={yesNo} value={data.allergieLatex || t('forms.no')} onChange={v => update('allergieLatex', v)} />
      <FormField label={t('forms.additional_medical_info')} value={data.autresInfosMedicales || ''} onChange={v => update('autresInfosMedicales', v)} multiline />

      <RadioField label="Pièce d'identité du représentant légal" options={['CNI', 'Passeport', 'Titre de séjour', 'Non présentée']} value={data.pieceIdRepresentantType || ''} onChange={v => update('pieceIdRepresentantType', v)} required />
      {data.pieceIdRepresentantType && data.pieceIdRepresentantType !== 'Non présentée' && (
        <FormField label="Numéro de la pièce d'identité" value={data.pieceIdRepresentantNumero || ''} onChange={v => update('pieceIdRepresentantNumero', v)} required />
      )}
      <FormSection title="Consentement du représentant légal" />
      <CheckboxField label="Le représentant légal a répondu honnêtement au questionnaire médical" value={data.reponduHonnetement || false} onToggle={() => update('reponduHonnetement', !data.reponduHonnetement)} required />
      <CheckboxField label="Le représentant légal autorise la prestation de dermographie sur le mineur" value={data.consentementLibre || false} onToggle={() => update('consentementLibre', !data.consentementLibre)} required />
      <CheckboxField label="Le représentant légal assume la responsabilité du suivi des soins" value={data.assumeResponsabilite || false} onToggle={() => update('assumeResponsabilite', !data.assumeResponsabilite)} required />
      <CheckboxField label="Confirme la présence physique du représentant légal lors de la séance" value={data.presenceRepresentant || false} onToggle={() => update('presenceRepresentant', !data.presenceRepresentant)} required />

      <RgpdMentions />
      <FormSection title="Signatures" />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <p className="text-xs mb-3" style={{ color: '#1e293b', fontWeight: 600 }}>Signature du mineur</p>
          <FormField label="Nom du mineur" value={data.nomMineurSign || `${client.prenom} ${client.nom}`} onChange={v => update('nomMineurSign', v)} />
          <FormField label="Date" value={data.dateSignatureMineur || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureMineur', v)} />
          <div className="mt-3">
            <SignaturePad label="Signature du mineur" value={data.signatureImageMineur || ''} onChange={v => update('signatureImageMineur', v ?? '')} />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <p className="text-xs mb-3" style={{ color: '#1e293b', fontWeight: 600 }}>Signature du représentant légal</p>
          <FormField label="Nom du représentant légal" value={data.nomRepresentantSign || data.nomRepresentant || data.nomRep || client.nomRepresentantLegal || ''} onChange={v => update('nomRepresentantSign', v)} required />
          <FormField label="Date" value={data.dateSignatureRepresentant || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureRepresentant', v)} required />
          <div className="mt-3">
            <SignaturePad label="Signature du représentant légal" value={data.signatureImageRepresentant || ''} onChange={v => update('signatureImageRepresentant', v ?? '')} />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du dermographe" value={data.nomDermographeSign || salonInfo?.nomDermographe || ''} onChange={v => update('nomDermographeSign', v)} required />
          <FormField label="Date" value={data.dateSignatureDermographe || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureDermographe', v)} required />
          <div className="mt-3">
            <SignaturePad label="Signature du dermographe" value={data.signatureImageDermographe || ''} onChange={v => update('signatureImageDermographe', v ?? '')} />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Formulaire Autorisation Parentale Dermographie ──────────────────────────

function FormAutorisationParentaleDermographie({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
  const { state: _s } = useApp();
  const salonInfo = _s.salonInfo;
  const { t } = useTranslation();
  return (
    <>
      <LegalBox color="green">
        <em>Ce document constitue l'autorisation parentale pour la réalisation d'une prestation de dermographie (maquillage permanent) sur un mineur, conformément à la réglementation en vigueur.</em>
      </LegalBox>

      <FormField label={t('forms.salon_name')} value={data.nomSalon || ''} onChange={v => update('nomSalon', v)} />

      <FormSection title="Identité du mineur" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('forms.last_name')} value={data.nom || client.nom} onChange={v => update('nom', v)} required />
        <FormField label={t('forms.first_name')} value={data.prenom || client.prenom} onChange={v => update('prenom', v)} required />
      </div>
      <FormField label={t('forms.dob')} value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} required />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />

      <FormSection title="Représentant légal" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nom du représentant légal" value={data.nomRepresentant || client.nomRepresentantLegal || ''} onChange={v => update('nomRepresentant', v)} required />
        <FormField label="Prénom du représentant légal" value={data.prenomRepresentant || client.prenomRepresentantLegal || ''} onChange={v => update('prenomRepresentant', v)} required />
      </div>
      <FormField label="Lien avec le mineur" value={data.lienRepresentant || client.lienRepresentantLegal || ''} onChange={v => update('lienRepresentant', v)} required />
      <FormField label="Téléphone" value={data.telephoneRepresentant || client.telephoneRepresentantLegal || client.telephone || ''} onChange={v => update('telephoneRepresentant', v)} type="tel" required />

      <FormSection title="Détails de la prestation" />
      <RadioField
        label="Zone à traiter"
        options={['Sourcils', 'Lèvres', 'Eye-liner supérieur', 'Eye-liner inférieur', 'Autre']}
        value={data.zoneDermographie || ''}
        onChange={v => update('zoneDermographie', v)}
        required
      />
      <FormField label="Date de la séance" value={data.dateSeance || ''} onChange={v => update('dateSeance', v)} required />
      <FormField label="Nom du dermographe" value={data.nomDermographe || salonInfo?.nomDermographe || ''} onChange={v => update('nomDermographe', v)} required />

      <FormSection title="Engagement du représentant légal" />
      <CheckboxField label="Je certifie avoir pris connaissance des risques liés à la dermographie sur un mineur" value={data.connaitRisques || false} onToggle={() => update('connaitRisques', !data.connaitRisques)} required />
      <CheckboxField label="Je m'engage à superviser les soins post-dermographie du mineur" value={data.engageSoins || false} onToggle={() => update('engageSoins', !data.engageSoins)} required />
      <CheckboxField label="Je confirme donner mon autorisation parentale pour cette prestation" value={data.autorisationDonnee || false} onToggle={() => update('autorisationDonnee', !data.autorisationDonnee)} required />
      <CheckboxField label="Je confirme ma présence physique lors de la séance" value={data.presenceConfirmee || false} onToggle={() => update('presenceConfirmee', !data.presenceConfirmee)} required />

      <RgpdMentions />
      <FormSection title="Signatures" />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <p className="text-xs mb-3" style={{ color: '#1e293b', fontWeight: 600 }}>Signature du représentant légal</p>
          <FormField label="Nom du représentant légal" value={data.nomRepresentantSign || data.nomRepresentant || data.nomRep || client.nomRepresentantLegal || ''} onChange={v => update('nomRepresentantSign', v)} required />
          <FormField label="Date" value={data.dateSignatureRepresentant || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureRepresentant', v)} required />
          <div className="mt-3">
            <SignaturePad label="Signature du représentant légal" value={data.signatureImageRepresentant || ''} onChange={v => update('signatureImageRepresentant', v ?? '')} />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du dermographe" value={data.nomDermographeSign || salonInfo?.nomDermographe || ''} onChange={v => update('nomDermographeSign', v)} required />
          <FormField label="Date" value={data.dateSignatureDermographe || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureDermographe', v)} required />
          <div className="mt-3">
            <SignaturePad label="Signature du dermographe" value={data.signatureImageDermographe || ''} onChange={v => update('signatureImageDermographe', v ?? '')} />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Formulaire Questionnaire Médical Tatouage Majeur ────────────────────────

function FormQuestionnaireTatouageMajeur({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
  const { state: _s } = useApp();
  const salonInfo = _s.salonInfo;
  const { t } = useTranslation();
  const yesNo = [t('forms.no'), t('forms.yes')];
  const yesNoMaybe = [t('forms.no'), t('forms.yes'), t('forms.dont_know')];
  return (
    <>
      <LegalBox color="green">
        <em>{t('legal.rgpd_tattoo')}</em>
      </LegalBox>
      <LegalBox color="orange">
        {t('legal.eu_ink_regulation')}
      </LegalBox>

      <FormField label={t('forms.salon_name')} value={data.nomSalon || ''} onChange={v => update('nomSalon', v)} />

      <FormSection title={t('q05.section_client_identity')} />
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('forms.last_name')} value={data.nom || client.nom} onChange={v => update('nom', v)} required />
        <FormField label={t('forms.first_name')} value={data.prenom || client.prenom} onChange={v => update('prenom', v)} required />
      </div>
      <FormField label={t('forms.dob')} value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} required />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />
      <FormField label={t('forms.phone')} value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" required />
      <RadioField label={t('forms.id_piece')} options={t('forms.id_options_adult', { returnObjects: true }) as string[]} value={data.pieceIdType || ''} onChange={v => update('pieceIdType', v)} required />
      {data.pieceIdType && (
        <FormField label={t('forms.id_number')} value={data.pieceIdNumero || ''} onChange={v => update('pieceIdNumero', v)} required />
      )}

      <FormSection title={t('q05.section_tattoo_project')} />
      <FormField label={t('q05.zone_to_tattoo')} value={data.zoneTatouage || ''} onChange={v => update('zoneTatouage', v)} required />
      <FormField label={t('q05.motif_description')} value={data.descriptionMotif || ''} onChange={v => update('descriptionMotif', v)} multiline />
      <RadioField label={t('q05.tattoo_type')} options={t('q05.tattoo_type_options', { returnObjects: true }) as string[]} value={data.typeTatouage || ''} onChange={v => update('typeTatouage', v)} />
      <RadioField label={t('q05.first_tattoo')} options={[t('forms.yes'), t('forms.no')]} value={data.premierTatouage || t('forms.no')} onChange={v => update('premierTatouage', v)} />

      <FormSection title={t('q05.section_health')} />
      <WarningBox>{t('q01.warning_health')}</WarningBox>

      <FormSection title={t('q01.section_medical_history')} />
      <RadioField label={t('q01.skin_diseases')} options={yesNo} value={data.maladiesPeau || t('forms.no')} onChange={v => update('maladiesPeau', v)} />
      <RadioField label={t('q01.autoimmune')} options={yesNo} value={data.maladiesAutoImmunes || t('forms.no')} onChange={v => update('maladiesAutoImmunes', v)} />
      <RadioField label={t('q01.diabetes')} options={yesNo} value={data.diabete || t('forms.no')} onChange={v => update('diabete', v)} />
      <RadioField label={t('q01.cardiac')} options={yesNo} value={data.pathologieCardiaque || t('forms.no')} onChange={v => update('pathologieCardiaque', v)} />
      <RadioField label={t('q01.renal_hepatic')} options={yesNo} value={data.insuffisanceRenaleHepatique || t('forms.no')} onChange={v => update('insuffisanceRenaleHepatique', v)} />
      <RadioField label={t('q01.immunodepression')} options={yesNo} value={data.immunodepression || t('forms.no')} onChange={v => update('immunodepression', v)} />
      <RadioField label={t('q01.coagulation')} options={yesNo} value={data.troublesCoagulation || t('forms.no')} onChange={v => update('troublesCoagulation', v)} />
      <RadioField label={t('q01.keloid')} options={yesNo} value={data.cheloide || t('forms.no')} onChange={v => update('cheloide', v)} />
      <RadioField label={t('q01.herpes_history')} options={yesNo} value={data.antecedentsHerpes || t('forms.no')} onChange={v => update('antecedentsHerpes', v)} />
      <RadioField label={t('q01.hepatitis')} options={yesNo} value={data.hepatite || t('forms.no')} onChange={v => update('hepatite', v)} />
      <RadioField label={t('q01.epilepsy')} options={yesNo} value={data.epilepsie || t('forms.no')} onChange={v => update('epilepsie', v)} />
      <RadioField label={t('q05.vitiligo')} options={yesNo} value={data.vitiligo || t('forms.no')} onChange={v => update('vitiligo', v)} />
      <RadioField label={t('q05.previous_tattoo_reaction')} options={yesNo} value={data.reactionTatouage || t('forms.no')} onChange={v => update('reactionTatouage', v)} />
      {data.reactionTatouage === t('forms.yes') && (
        <FormField label={t('forms.describe_reaction')} value={data.reactionTatouageDetail || ''} onChange={v => update('reactionTatouageDetail', v)} multiline />
      )}

      <FormSection title={t('q01.section_medications')} />
      <RadioField label={t('q01.anticoagulants')} options={yesNo} value={data.anticoagulants || t('forms.no')} onChange={v => update('anticoagulants', v)} />
      <RadioField label={t('q01.aspirin')} options={yesNo} value={data.aspirineAntiInflammatoires || t('forms.no')} onChange={v => update('aspirineAntiInflammatoires', v)} />
      <RadioField label={t('q01.roaccutane')} options={yesNo} value={data.roaccutane || t('forms.no')} onChange={v => update('roaccutane', v)} />
      <RadioField label={t('q01.corticoids')} options={yesNo} value={data.corticoides || t('forms.no')} onChange={v => update('corticoides', v)} />
      <RadioField label={t('q01.antibiotics')} options={yesNo} value={data.antibiotiques || t('forms.no')} onChange={v => update('antibiotiques', v)} />
      {(data.anticoagulants === t('forms.yes') || data.aspirineAntiInflammatoires === t('forms.yes') || data.roaccutane === t('forms.yes') || data.corticoides === t('forms.yes') || data.antibiotiques === t('forms.yes')) && (
        <FormField label={t('forms.specify_medication')} value={data.traitementMedicalDetail || ''} onChange={v => update('traitementMedicalDetail', v)} multiline />
      )}

      <FormSection title={t('q01.section_allergies')} />
      <RadioField label={t('q01.allergy_inks')} options={yesNo} value={data.allergieEncres || t('forms.no')} onChange={v => update('allergieEncres', v)} />
      <RadioField label={t('q05.allergy_metals')} options={yesNo} value={data.allergieMetaux || t('forms.no')} onChange={v => update('allergieMetaux', v)} />
      <RadioField label={t('q01.allergy_latex')} options={yesNo} value={data.allergieLatex || t('forms.no')} onChange={v => update('allergieLatex', v)} />
      <RadioField label={t('q05.allergy_disinfectants')} options={yesNo} value={data.allergieDesinfectants || t('forms.no')} onChange={v => update('allergieDesinfectants', v)} />
      <RadioField label={t('q01.allergy_anesthetics')} options={yesNo} value={data.allergieAnesthesiants || t('forms.no')} onChange={v => update('allergieAnesthesiants', v)} />
      {(data.allergieEncres === t('forms.yes') || data.allergieMetaux === t('forms.yes') || data.allergieLatex === t('forms.yes') || data.allergieDesinfectants === t('forms.yes') || data.allergieAnesthesiants === t('forms.yes')) && (
        <FormField label={t('forms.specify_allergy')} value={data.allergiesDetail || ''} onChange={v => update('allergiesDetail', v)} multiline />
      )}

      <FormSection title={t('q01.section_special')} />
      <RadioField label={t('q01.pregnancy')} options={yesNoMaybe} value={data.grossesse || t('forms.no')} onChange={v => update('grossesse', v)} />
      <RadioField label={t('q01.alcohol')} options={yesNo} value={data.alcool || t('forms.no')} onChange={v => update('alcool', v)} />
      <RadioField label={t('q01.ate_well')} options={[t('forms.yes'), t('forms.no')]} value={data.aBienMange || t('forms.yes')} onChange={v => update('aBienMange', v)} />
      <RadioField label={t('q05.lesion_zone')} options={yesNo} value={data.lesionZone || t('forms.no')} onChange={v => update('lesionZone', v)} />
      <RadioField label={t('q05.sun_exposure')} options={yesNo} value={data.expositionSolaire || t('forms.no')} onChange={v => update('expositionSolaire', v)} />
      <FormField label={t('forms.additional_medical_info')} value={data.autresInfosMedicales || ''} onChange={v => update('autresInfosMedicales', v)} multiline />

      <FormSection title="Consentement" />
      <CheckboxField label="Le représentant légal a répondu honnêtement au questionnaire médical" value={data.reponduHonnetement || false} onToggle={() => update('reponduHonnetement', !data.reponduHonnetement)} required />
      <CheckboxField label="Le représentant légal donne son consentement éclairé pour la réalisation du tatouage sur le mineur" value={data.consentementLibre || false} onToggle={() => update('consentementLibre', !data.consentementLibre)} required />
      <CheckboxField label="Le représentant légal assume la responsabilité du suivi des soins post-tatouage" value={data.assumeResponsabilite || false} onToggle={() => update('assumeResponsabilite', !data.assumeResponsabilite)} required />
      <CheckboxField label="Confirme la présence physique du représentant légal lors de la séance" value={data.presenceRepresentant || false} onToggle={() => update('presenceRepresentant', !data.presenceRepresentant)} required />
      <CheckboxField label="Je consens expressément au traitement des données de santé du mineur par le salon (Art. 9 RGPD)" value={data.consentDonneesSante || false} onToggle={() => update('consentDonneesSante', !data.consentDonneesSante)} required />

      <RgpdMentions />
      <FormSection title={t('q05.section_signatures')} />
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du client — Lu et approuvé" value={data.nomClientSign || client.nom || ''} onChange={v => update('nomClientSign', v)} />
          <FormField label="Date" value={data.dateSignatureClient || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureClient', v)} />
          <div className="mt-3">
            <SignaturePad label="Signature du client" value={data.signatureImageClient || ''} onChange={v => update('signatureImageClient', v ?? '')} />
          </div>
        </div>
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <FormField label={t('forms.tattoo_artist_name')} value={data.nomTatoueurSign || salonInfo?.nomTatoueur || ''} onChange={v => update('nomTatoueurSign', v)} required />
          <FormField label={t('forms.date')} value={data.dateSignatureTatoueur || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureTatoueur', v)} required />
          <div className="mt-3">
            <SignaturePad label={t('forms.tattoo_artist_signature')} value={data.signatureImageTatoueur || ''} onChange={v => update('signatureImageTatoueur', v ?? '')} />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Formulaire Autorisation Parentale Soins Post-Tatouage ───────────────────

function FormAutorisationParentaleTatouage({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
  const { state: _s } = useApp();
  const salonInfo = _s.salonInfo;
  const { t } = useTranslation();
  return (
    <>
      <LegalBox color="green">
        <em>Ce document constitue l'autorisation parentale pour les soins post-tatouage d'un mineur, conformément à la réglementation en vigueur.</em>
      </LegalBox>

      <FormField label={t('forms.salon_name')} value={data.nomSalon || ''} onChange={v => update('nomSalon', v)} />

      <FormSection title="Identité du mineur" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('forms.last_name')} value={data.nom || client.nom} onChange={v => update('nom', v)} required />
        <FormField label={t('forms.first_name')} value={data.prenom || client.prenom} onChange={v => update('prenom', v)} required />
      </div>
      <FormField label={t('forms.dob')} value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} required />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />

      <FormSection title="Représentant légal" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nom du représentant légal" value={data.nomRepresentant || client.nomRepresentantLegal || ''} onChange={v => update('nomRepresentant', v)} required />
        <FormField label="Prénom du représentant légal" value={data.prenomRepresentant || client.prenomRepresentantLegal || ''} onChange={v => update('prenomRepresentant', v)} required />
      </div>
      <FormField label="Lien avec le mineur" value={data.lienRepresentant || client.lienRepresentantLegal || ''} onChange={v => update('lienRepresentant', v)} required />
      <FormField label="Téléphone" value={data.telephoneRepresentant || client.telephoneRepresentantLegal || client.telephone || ''} onChange={v => update('telephoneRepresentant', v)} type="tel" required />

      <FormSection title="Détails du tatouage" />
      <FormField label="Zone tatouée" value={data.zoneTatouage || ''} onChange={v => update('zoneTatouage', v)} required />
      <FormField label="Date de la séance" value={data.dateSeance || ''} onChange={v => update('dateSeance', v)} required />
      <FormField label="Nom du tatoueur" value={data.nomTatoueur || salonInfo?.nomTatoueur || ''} onChange={v => update('nomTatoueur', v)} required />

      <FormSection title="Instructions de soins post-tatouage" />
      <LegalBox color="cyan">
        <strong>Soins à effectuer durant les 2 premières semaines :</strong>
        <ul style={{ marginTop: 8, paddingLeft: 16 }}>
          <li>Laver délicatement le tatouage 2 à 3 fois par jour avec un savon doux</li>
          <li>Appliquer une crème cicatrisante fine (Bepanthen ou équivalent)</li>
          <li>Ne pas gratter, frotter ou arracher les croûtes</li>
          <li>Éviter toute exposition au soleil, piscine, mer et sauna</li>
          <li>Porter des vêtements amples et propres sur la zone</li>
          <li>Ne pas couvrir avec un film plastique après les 24 premières heures</li>
        </ul>
      </LegalBox>

      <FormSection title="Engagement du représentant légal" />
      <CheckboxField label="Je certifie avoir pris connaissance des instructions de soins post-tatouage" value={data.connaitSoins || false} onToggle={() => update('connaitSoins', !data.connaitSoins)} required />
      <CheckboxField label="Je m'engage à superviser et assurer les soins post-tatouage du mineur" value={data.engageSoins || false} onToggle={() => update('engageSoins', !data.engageSoins)} required />
      <CheckboxField label="Je reconnais avoir reçu les informations nécessaires sur les risques éventuels" value={data.informeRisques || false} onToggle={() => update('informeRisques', !data.informeRisques)} required />
      <CheckboxField label="Je confirme donner mon autorisation parentale pour ce tatouage" value={data.autorisationDonnee || false} onToggle={() => update('autorisationDonnee', !data.autorisationDonnee)} required />

      <RgpdMentions />
      <FormSection title={t('q05.section_signatures')} />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <p className="text-xs mb-3" style={{ color: '#1e293b', fontWeight: 600 }}>Signature du représentant légal</p>
          <FormField label="Nom du représentant légal" value={data.nomRepresentantSign || data.nomRepresentant || data.nomRep || client.nomRepresentantLegal || ''} onChange={v => update('nomRepresentantSign', v)} required />
          <FormField label={t('forms.date')} value={data.dateSignatureRepresentant || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureRepresentant', v)} required />
          <div className="mt-3">
            <SignaturePad label="Signature du représentant légal" value={data.signatureImageRepresentant || ''} onChange={v => update('signatureImageRepresentant', v ?? '')} />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <FormField label={t('forms.tattoo_artist_name')} value={data.nomTatoueurSign || salonInfo?.nomTatoueur || ''} onChange={v => update('nomTatoueurSign', v)} required />
          <FormField label={t('forms.date')} value={data.dateSignatureTatoueur || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureTatoueur', v)} required />
          <div className="mt-3">
            <SignaturePad label={t('forms.tattoo_artist_signature')} value={data.signatureImageTatoueur || ''} onChange={v => update('signatureImageTatoueur', v ?? '')} />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Formulaire Fiche de Séance Dermographe ───────────────────────────────────────────


export { FormFicheSeance, FormConsentementSoinsTatouage, FormFicheSeanceTatouage, FormQuestionnaireTatouageMineur, FormQuestionnaireDermographeMineur, FormAutorisationParentaleDermographie, FormQuestionnaireTatouageMajeur, FormAutorisationParentaleTatouage };

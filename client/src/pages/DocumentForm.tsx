/*
 * DESIGN: Studio Nocturne — Formulaires de documents RGPD complets
 * Palette: bleu marine #0A1628, cyan #83D0F5, rose #C0396A
 * Typographie: Outfit
 */
import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useApp } from '@/lib/app-context';
import { DocumentType, DOCUMENT_LABELS, Client } from '@/lib/types';
import { ArrowLeft, Save, CheckCircle, AlertTriangle, Info, Phone } from 'lucide-react';
import { toast } from 'sonner';

// ─── Composants de formulaire ───────────────────────────────────────────────

function FormSection({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="h-px flex-1" style={{ background: 'var(--brand-border)' }} />
      <span className="text-xs font-700 px-2 py-1 rounded" style={{
        color: 'var(--brand-cyan)',
        background: 'rgba(131,208,245,0.08)',
        fontWeight: 700,
        fontFamily: 'Outfit',
        letterSpacing: '0.05em',
      }}>{title}</span>
      <div className="h-px flex-1" style={{ background: 'var(--brand-border)' }} />
    </div>
  );
}

function FormField({
  label, value, onChange, placeholder, multiline, type, required
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; type?: string; required?: boolean;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs mb-1" style={{ color: 'var(--brand-text-muted)', fontWeight: 500 }}>
        {label}{required && <span style={{ color: 'var(--brand-rose)' }}> *</span>}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 rounded-lg text-sm resize-none outline-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--brand-border)',
            color: 'var(--brand-text)',
            fontFamily: 'Outfit',
          }}
        />
      ) : (
        <input
          type={type || 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--brand-border)',
            color: 'var(--brand-text)',
            fontFamily: 'Outfit',
          }}
        />
      )}
    </div>
  );
}

function RadioField({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs mb-2" style={{ color: 'var(--brand-text-muted)', fontWeight: 500 }}>{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{
              background: value === opt ? 'rgba(131,208,245,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${value === opt ? 'var(--brand-cyan)' : 'var(--brand-border)'}`,
              color: value === opt ? 'var(--brand-cyan)' : 'var(--brand-text-muted)',
              fontFamily: 'Outfit',
              fontWeight: value === opt ? 600 : 400,
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function CheckboxField({ label, value, onToggle, warning }: {
  label: string; value: boolean; onToggle: () => void; warning?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-start gap-3 w-full text-left mb-2 p-2 rounded-lg transition-all"
      style={{ background: value ? 'rgba(131,208,245,0.05)' : 'transparent' }}
    >
      <div
        className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center mt-0.5"
        style={{
          background: value ? (warning ? 'rgba(255,152,0,0.2)' : 'rgba(131,208,245,0.2)') : 'rgba(255,255,255,0.05)',
          border: `2px solid ${value ? (warning ? '#FF9800' : 'var(--brand-cyan)') : 'var(--brand-border)'}`,
        }}
      >
        {value && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke={warning ? '#FF9800' : 'var(--brand-cyan)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className="text-sm" style={{ color: warning && value ? '#FF9800' : 'var(--brand-text)', fontFamily: 'Outfit' }}>
        {label}
      </span>
    </button>
  );
}

function LegalBox({ children, color = 'cyan' }: { children: React.ReactNode; color?: 'cyan' | 'orange' | 'green' | 'red' }) {
  const colors = {
    cyan: { bg: 'rgba(131,208,245,0.05)', border: 'rgba(131,208,245,0.2)', text: '#83D0F5' },
    orange: { bg: 'rgba(255,152,0,0.05)', border: 'rgba(255,152,0,0.2)', text: '#FF9800' },
    green: { bg: 'rgba(76,175,80,0.05)', border: 'rgba(76,175,80,0.2)', text: '#4CAF50' },
    red: { bg: 'rgba(244,67,54,0.05)', border: 'rgba(244,67,54,0.2)', text: '#F44336' },
  };
  const c = colors[color];
  return (
    <div className="p-3 rounded-xl mb-3 text-xs" style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text, fontFamily: 'Outfit', lineHeight: 1.6 }}>
      {children}
    </div>
  );
}

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl mb-3" style={{ background: 'rgba(244,67,54,0.05)', border: '1px solid rgba(244,67,54,0.2)' }}>
      <AlertTriangle size={14} style={{ color: '#F44336', flexShrink: 0, marginTop: 2 }} />
      <span className="text-xs" style={{ color: '#F44336', fontFamily: 'Outfit', lineHeight: 1.6 }}>{children}</span>
    </div>
  );
}

function AgeVerif({ dateNaissance }: { dateNaissance: string }) {
  if (!dateNaissance || dateNaissance.length < 8) return null;
  const parts = dateNaissance.includes('/') ? dateNaissance.split('/') : dateNaissance.split('-');
  const dateObj = dateNaissance.includes('/')
    ? new Date(+parts[2], +parts[1] - 1, +parts[0])
    : new Date(dateNaissance);
  if (isNaN(dateObj.getTime())) return null;
  const ageYears = Math.floor((Date.now() - dateObj.getTime()) / (365.25 * 24 * 3600 * 1000));
  const isMajeur = ageYears >= 18;
  return (
    <div className="flex items-center gap-2 mt-1 px-2 py-1 rounded text-xs" style={{
      background: isMajeur ? 'rgba(76,175,80,0.1)' : 'rgba(255,152,0,0.1)',
      color: isMajeur ? '#4CAF50' : '#FF9800',
    }}>
      {isMajeur ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
      <span>{ageYears} ans — {isMajeur ? 'MAJEUR ✓' : 'MINEUR ⚠'}</span>
    </div>
  );
}

// ─── Formulaire Questionnaire Médical Mineur ─────────────────────────────────

function FormQuestionnaireMineur({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
  return (
    <>
      <LegalBox color="orange">
        <strong>■ Cadre légal — Art. 371-1 et suivants du Code civil</strong><br />
        ■ Toute prestation de piercing sur un mineur est soumise au consentement écrit du ou des titulaires de l'autorité parentale.<br />
        ■ La présence physique d'un représentant légal est obligatoire pendant toute la durée de la séance.<br />
        Conservation : 3 ans minimum à compter de la majorité du mineur (Art. L1110-4 CSP).
      </LegalBox>
      <LegalBox color="cyan">
        <strong>VOS DROITS RGPD</strong><br />
        Art. 15 Droit d'accès · Art. 16 Rectification · Art. 17 Effacement · Art. 21 Opposition<br />
        Conservation : données de santé 3 ans. Support électronique valide (Art. 1366 du Code civil).
      </LegalBox>

      <FormField label="Nom du salon" value={data.nomSalon || ''} onChange={v => update('nomSalon', v)} />

      <FormSection title="1 — IDENTITÉ DU MINEUR" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nom de famille" value={data.nom || client.nom} onChange={v => update('nom', v)} required />
        <FormField label="Prénom(s)" value={data.prenom || client.prenom} onChange={v => update('prenom', v)} required />
      </div>
      <FormField label="Date de naissance (JJ/MM/AAAA)" value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />
      <FormField label="Adresse complète" value={data.adresse || client.adresse || ''} onChange={v => update('adresse', v)} />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Code postal" value={data.codePostal || client.codePostal || ''} onChange={v => update('codePostal', v)} />
        <FormField label="Ville" value={data.ville || client.ville || ''} onChange={v => update('ville', v)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Téléphone" value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" />
        <FormField label="Email" value={data.email || client.email || ''} onChange={v => update('email', v)} type="email" />
      </div>
      <RadioField label="Pièce d'identité du mineur (optionnel)" options={['CNI', 'Passeport', 'Titre de séjour', 'Non présentée']} value={data.pieceIdMineurType || ''} onChange={v => update('pieceIdMineurType', v)} />
      {data.pieceIdMineurType && data.pieceIdMineurType !== 'Non présentée' && (
        <FormField label="Numéro de la pièce d'identité" value={data.pieceIdMineurNumero || ''} onChange={v => update('pieceIdMineurNumero', v)} />
      )}

      <FormSection title="2 — PIERCING DEMANDÉ" />
      <FormField label="Zone à percer" value={data.zonePiercing || ''} onChange={v => update('zonePiercing', v)} required />

      <FormSection title="3 — ÉTAT DE SANTÉ — QUESTIONNAIRE MÉDICAL COMPLET" />
      <WarningBox>Toute réponse « Oui » peut suspendre la prestation jusqu'à avis médical. Répondez honnêtement à chaque question. (Arrêté du 3 décembre 2008 — ARS)</WarningBox>

      <FormSection title="3.1 — Antécédents médicaux" />
      <RadioField label="Maladies de peau en cours (eczéma, psoriasis, acné, herpès, infection cutanée)" options={['Non', 'Oui']} value={data.maladiesPeau || 'Non'} onChange={v => update('maladiesPeau', v)} />
      <RadioField label="Maladies auto-immunes (lupus, sclérose en plaques, maladie de Crohn, polyarthrite rhumatoïde…)" options={['Non', 'Oui']} value={data.maladiesAutoImmunes || 'Non'} onChange={v => update('maladiesAutoImmunes', v)} />
      <RadioField label="Diabète (type 1 ou type 2)" options={['Non', 'Oui']} value={data.diabete || 'Non'} onChange={v => update('diabete', v)} />
      <RadioField label="Maladie cardiaque ou prothèse cardiaque / pacemaker" options={['Non', 'Oui']} value={data.pathologieCardiaque || 'Non'} onChange={v => update('pathologieCardiaque', v)} />
      <RadioField label="Insuffisance rénale ou hépatique" options={['Non', 'Oui']} value={data.insuffisanceRenaleHepatique || 'Non'} onChange={v => update('insuffisanceRenaleHepatique', v)} />
      <RadioField label="Immunodépression (VIH/SIDA, greffe d'organe, chimiothérapie)" options={['Non', 'Oui']} value={data.immunodepression || 'Non'} onChange={v => update('immunodepression', v)} />
      <RadioField label="Troubles de la coagulation (hémophilie, thrombopénie)" options={['Non', 'Oui']} value={data.troublesCoagulation || 'Non'} onChange={v => update('troublesCoagulation', v)} />
      <RadioField label="Tendance aux cicatrices chéloïdes (boursouflées, hypertrophiques)" options={['Non', 'Oui']} value={data.cheloide || 'Non'} onChange={v => update('cheloide', v)} />
      <RadioField label="Antécédents d'herpès (labial ou génital)" options={['Non', 'Oui']} value={data.antecedentsHerpes || 'Non'} onChange={v => update('antecedentsHerpes', v)} />
      <RadioField label="Porteur(se) d'une hépatite B ou C" options={['Non', 'Oui']} value={data.hepatite || 'Non'} onChange={v => update('hepatite', v)} />
      <RadioField label="Asthme ou allergies graves (anaphylaxie)" options={['Non', 'Oui']} value={data.asthmeAllergiesGraves || 'Non'} onChange={v => update('asthmeAllergiesGraves', v)} />
      <RadioField label="Épilepsie" options={['Non', 'Oui']} value={data.epilepsie || 'Non'} onChange={v => update('epilepsie', v)} />

      <FormSection title="3.2 — Traitements médicamenteux en cours" />
      <RadioField label="Anticoagulants (Warfarine, Xarelto, Eliquis, Pradaxa, Héparine…)" options={['Non', 'Oui']} value={data.anticoagulants || 'Non'} onChange={v => update('anticoagulants', v)} />
      <RadioField label="Aspirine ou anti-inflammatoires (Ibuprofène, Kétoprofène…)" options={['Non', 'Oui']} value={data.aspirineAntiInflammatoires || 'Non'} onChange={v => update('aspirineAntiInflammatoires', v)} />
      <RadioField label="Vitamine A acide / Roaccutane® (isotrétinoïne)" options={['Non', 'Oui']} value={data.roaccutane || 'Non'} onChange={v => update('roaccutane', v)} />
      <RadioField label="Corticoïdes (cortisone, prednisone…) ou immunosuppresseurs" options={['Non', 'Oui']} value={data.corticoides || 'Non'} onChange={v => update('corticoides', v)} />
      <RadioField label="Antibiotiques en cours" options={['Non', 'Oui']} value={data.antibiotiques || 'Non'} onChange={v => update('antibiotiques', v)} />
      <RadioField label="Autres médicaments affectant la cicatrisation ou la coagulation" options={['Non', 'Oui']} value={data.autresMedicaments || 'Non'} onChange={v => update('autresMedicaments', v)} />
      {(data.anticoagulants === 'Oui' || data.aspirineAntiInflammatoires === 'Oui' || data.roaccutane === 'Oui' || data.corticoides === 'Oui' || data.antibiotiques === 'Oui' || data.autresMedicaments === 'Oui') && (
        <FormField label="Préciser le(s) médicament(s)" value={data.traitementMedicalDetail || ''} onChange={v => update('traitementMedicalDetail', v)} multiline />
      )}

      <FormSection title="3.3 — Allergies connues" />
      <RadioField label="Allergie aux métaux (nickel, cobalt, chrome, acier chirurgical, titane)" options={['Non', 'Oui']} value={data.allergieMetaux || 'Non'} onChange={v => update('allergieMetaux', v)} />
      <RadioField label="Allergie aux encres de tatouage ou pigments de maquillage permanent" options={['Non', 'Oui']} value={data.allergieEncres || 'Non'} onChange={v => update('allergieEncres', v)} />
      <RadioField label="Allergie au latex" options={['Non', 'Oui']} value={data.allergieLatex || 'Non'} onChange={v => update('allergieLatex', v)} />
      <RadioField label="Allergie aux produits désinfectants (alcool, chlorhexidine, Bétadine)" options={['Non', 'Oui']} value={data.allergieDesinfectants || 'Non'} onChange={v => update('allergieDesinfectants', v)} />
      <RadioField label="Allergie aux anesthésiants topiques (crème EMLA, lidocaïne)" options={['Non', 'Oui']} value={data.allergieAnesthesiants || 'Non'} onChange={v => update('allergieAnesthesiants', v)} />
      {(data.allergieMetaux === 'Oui' || data.allergieEncres === 'Oui' || data.allergieLatex === 'Oui' || data.allergieDesinfectants === 'Oui' || data.allergieAnesthesiants === 'Oui') && (
        <FormField label="Préciser toute allergie connue" value={data.allergiesDetail || ''} onChange={v => update('allergiesDetail', v)} multiline />
      )}

      <FormSection title="3.4 — Situation particulière" />
      <RadioField label="Enceinte ou allaitante" options={['Non', 'Oui', 'Ne sait pas']} value={data.grossesse || 'Non'} onChange={v => update('grossesse', v)} />
      <RadioField label="Consommation d'alcool dans les 24h précédant la prestation" options={['Non', 'Oui']} value={data.alcool || 'Non'} onChange={v => update('alcool', v)} />
      <RadioField label="Consommation de drogues ou substances psychoactives" options={['Non', 'Oui']} value={data.drogues || 'Non'} onChange={v => update('drogues', v)} />
      <RadioField label="A bien mangé dans les 4h précédant la prestation" options={['Oui', 'Non']} value={data.aBienMange || 'Oui'} onChange={v => update('aBienMange', v)} />
      <RadioField label="A dormi suffisamment la nuit précédente" options={['Oui', 'Non']} value={data.aDormi || 'Oui'} onChange={v => update('aDormi', v)} />
      <RadioField label="Lésion, plaie ou irritation sur la zone à traiter" options={['Non', 'Oui']} value={data.lesionZone || 'Non'} onChange={v => update('lesionZone', v)} />
      <RadioField label="Réaction lors d'une prestation antérieure" options={['Non', 'Oui']} value={data.reactionAnterieure || 'Non'} onChange={v => update('reactionAnterieure', v)} />
      {data.reactionAnterieure === 'Oui' && (
        <FormField label="Décrire la réaction" value={data.reactionAnterieureDetail || ''} onChange={v => update('reactionAnterieureDetail', v)} multiline />
      )}
      <FormField label="Informations médicales complémentaires" value={data.autresInfosMedicales || ''} onChange={v => update('autresInfosMedicales', v)} multiline />

      <FormSection title="5 — AVIS DU MINEUR (obligatoire dès 12 ans)" />
      <CheckboxField label="Confirme vouloir ce piercing de son plein gré" value={data.avisMineur || false} onToggle={() => update('avisMineur', !data.avisMineur)} />

      <FormSection title="5b — CONTACT D'URGENCE" />
      <div className="flex items-start gap-2 p-3 rounded-xl mb-3" style={{ background: 'rgba(100,181,246,0.05)', border: '1px solid rgba(100,181,246,0.2)' }}>
        <Phone size={14} style={{ color: '#64B5F6', flexShrink: 0, marginTop: 2 }} />
        <span className="text-xs" style={{ color: '#64B5F6' }}>Personne à contacter en cas d'urgence pendant la séance</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nom / Prénom" value={data.urgenceNom || ''} onChange={v => update('urgenceNom', v)} />
        <FormField label="Lien avec le mineur" value={data.urgenceLien || ''} onChange={v => update('urgenceLien', v)} placeholder="Ex : mère, père, tuteur" />
      </div>
      <FormField label="Téléphone d'urgence" value={data.urgenceTelephone || ''} onChange={v => update('urgenceTelephone', v)} type="tel" />

      <FormSection title="6 — REPRÉSENTANT(S) LÉGAL/AUX" />
      <div>
        <FormField label="Représentant légal — Nom / Prénom" value={data.representantNom || ''} onChange={v => update('representantNom', v)} required />
        <RadioField label="Lien" options={['Mère', 'Père', 'Tuteur légal', 'Autre']} value={data.representantLien || ''} onChange={v => update('representantLien', v)} />
        <FormField label="Téléphone représentant" value={data.representantTelephone || ''} onChange={v => update('representantTelephone', v)} type="tel" />
        <RadioField label="Pièce d'identité" options={['CNI', 'Passeport', 'Titre de séjour']} value={data.representantPieceId || ''} onChange={v => update('representantPieceId', v)} />
      </div>

      <FormSection title="7 — CONSENTEMENT PARENTAL ÉCLAIRÉ" />
      <CheckboxField label="Exerce l'autorité parentale sur le mineur" value={data.exerceAutoriteParentale || false} onToggle={() => update('exerceAutoriteParentale', !data.exerceAutoriteParentale)} />
      <CheckboxField label="A répondu honnêtement au questionnaire" value={data.reponduHonnetement || false} onToggle={() => update('reponduHonnetement', !data.reponduHonnetement)} />
      <CheckboxField label="Informé(e) des risques liés au piercing" value={data.informeRisques || false} onToggle={() => update('informeRisques', !data.informeRisques)} />
      <CheckboxField label="Reçu la fiche de soins post-piercing" value={data.recuFicheSoins || false} onToggle={() => update('recuFicheSoins', !data.recuFicheSoins)} />
      <CheckboxField label="Donne son consentement libre et éclairé" value={data.consentementLibre || false} onToggle={() => update('consentementLibre', !data.consentementLibre)} />
      <CheckboxField label="Assume la responsabilité du suivi des soins" value={data.assumeResponsabilite || false} onToggle={() => update('assumeResponsabilite', !data.assumeResponsabilite)} />
      <CheckboxField label="Présent(e) physiquement pendant la séance" value={data.presencePhysique || false} onToggle={() => update('presencePhysique', !data.presencePhysique)} />
    </>
  );
}

// ─── Formulaire Questionnaire Médical Majeur ─────────────────────────────────

function FormQuestionnaireMajeur({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
  return (
    <>
      <LegalBox color="green">
        Copie conservée par le salon — Pièces jointes : copie de la/des pièce(s) d'identité.<br />
        <strong>VOS DROITS RGPD :</strong> Art. 15 Accès · Art. 16 Rectification · Art. 17 Effacement · Art. 21 Opposition.<br />
        Conservation : données de santé 3 ans.
      </LegalBox>

      <FormSection title="1 — IDENTITÉ DU CLIENT" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nom de famille" value={data.nom || client.nom} onChange={v => update('nom', v)} required />
        <FormField label="Prénom(s)" value={data.prenom || client.prenom} onChange={v => update('prenom', v)} required />
      </div>
      <FormField label="Date de naissance (JJ/MM/AAAA)" value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Adresse complète" value={data.adresse || client.adresse || ''} onChange={v => update('adresse', v)} />
        <div>
          <FormField label="Code postal" value={data.codePostal || client.codePostal || ''} onChange={v => update('codePostal', v)} />
          <FormField label="Ville" value={data.ville || client.ville || ''} onChange={v => update('ville', v)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Téléphone" value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" />
        <FormField label="Email" value={data.email || client.email || ''} onChange={v => update('email', v)} type="email" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Pièce d'identité (CNI / Passeport)" value={data.pieceId || ''} onChange={v => update('pieceId', v)} />
        <FormField label="Numéro de la pièce d'identité" value={data.numeroPiece || ''} onChange={v => update('numeroPiece', v)} />
      </div>

      <FormSection title="2 — PIERCING DEMANDÉ" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Zone à percer" value={data.zonePiercing || ''} onChange={v => update('zonePiercing', v)} required />
        <FormField label="Premier piercing ?" value={data.premierPiercing || ''} onChange={v => update('premierPiercing', v)} />
      </div>
      <FormField label="Zone(s) de piercing(s) existant(s)" value={data.piercingsActuels || ''} onChange={v => update('piercingsActuels', v)} />

      <FormSection title="3 — ÉTAT DE SANTÉ" />
      <WarningBox>Toute réponse "Oui" dans les sections 3.1 et 3.2 peut suspendre la prestation jusqu'à avis médical</WarningBox>

      <FormSection title="3.1 — Antécédents médicaux" />
      <RadioField label="Maladie de peau (eczéma, psoriasis, dermatite atopique)" options={['Non', 'Oui']} value={data.maladiePeau || 'Non'} onChange={v => update('maladiePeau', v)} />
      <RadioField label="Maladie auto-immune (lupus, sclérodermie, polyarthrite)" options={['Non', 'Oui']} value={data.maladieAutoImmune || 'Non'} onChange={v => update('maladieAutoImmune', v)} />
      <RadioField label="Diabète (type 1 ou type 2)" options={['Non', 'Oui']} value={data.diabete || 'Non'} onChange={v => update('diabete', v)} />
      <RadioField label="Maladie cardiaque / pacemaker / valvulopathie" options={['Non', 'Oui']} value={data.maladieCardiaque || 'Non'} onChange={v => update('maladieCardiaque', v)} />
      <RadioField label="Immunodépression (VIH, chimiothérapie, greffe d'organe)" options={['Non', 'Oui']} value={data.immunodepression || 'Non'} onChange={v => update('immunodepression', v)} />
      <RadioField label="Troubles de la coagulation / hémophilie" options={['Non', 'Oui']} value={data.troublesCoagulation || 'Non'} onChange={v => update('troublesCoagulation', v)} />
      <RadioField label="Tendance aux chéloïdes (cicatrices boursouflées)" options={['Non', 'Oui']} value={data.cheloïdes || 'Non'} onChange={v => update('cheloïdes', v)} />
      {data.cheloïdes === 'Oui' && (
        <FormField label="Zone(s) concernée(s)" value={data.cheloïdesZones || ''} onChange={v => update('cheloïdesZones', v)} />
      )}
      <RadioField label="Herpès labial ou génital récurrent" options={['Non', 'Oui']} value={data.herpes || 'Non'} onChange={v => update('herpes', v)} />
      <RadioField label="Hépatite B ou C" options={['Non', 'Oui']} value={data.hepatite || 'Non'} onChange={v => update('hepatite', v)} />
      <RadioField label="Asthme ou allergies graves" options={['Non', 'Oui']} value={data.asthmeAllergiesGraves || 'Non'} onChange={v => update('asthmeAllergiesGraves', v)} />
      <RadioField label="Épilepsie" options={['Non', 'Oui']} value={data.epilepsie || 'Non'} onChange={v => update('epilepsie', v)} />
      <RadioField label="Autre pathologie chronique" options={['Non', 'Oui']} value={data.autrePathologie || 'Non'} onChange={v => update('autrePathologie', v)} />
      {data.autrePathologie === 'Oui' && (
        <FormField label="Préciser" value={data.autrePathologieDetail || ''} onChange={v => update('autrePathologieDetail', v)} />
      )}

      <FormSection title="3.2 — Traitements médicamenteux en cours" />
      <RadioField label="Anticoagulants (Warfarine, Xarelto, Eliquis, Pradaxa…)" options={['Non', 'Oui']} value={data.anticoagulants || 'Non'} onChange={v => update('anticoagulants', v)} />
      <RadioField label="Aspirine ou anti-inflammatoires (Ibuprofène, Advil…)" options={['Non', 'Oui']} value={data.aspirineAntiInflammatoires || 'Non'} onChange={v => update('aspirineAntiInflammatoires', v)} />
      <RadioField label="Roaccutane / Isotrétinoïne" options={['Non', 'Oui']} value={data.roaccutane || 'Non'} onChange={v => update('roaccutane', v)} />
      <RadioField label="Corticoïdes (cortisone, prednisone…)" options={['Non', 'Oui']} value={data.corticoides || 'Non'} onChange={v => update('corticoides', v)} />
      <RadioField label="Antibiotiques en cours" options={['Non', 'Oui']} value={data.antibiotiques || 'Non'} onChange={v => update('antibiotiques', v)} />
      <RadioField label="Autres médicaments affectant la cicatrisation ou la coagulation" options={['Non', 'Oui']} value={data.autresMedicaments || 'Non'} onChange={v => update('autresMedicaments', v)} />
      {(data.anticoagulants === 'Oui' || data.aspirineAntiInflammatoires === 'Oui' || data.roaccutane === 'Oui' || data.corticoides === 'Oui' || data.antibiotiques === 'Oui' || data.autresMedicaments === 'Oui') && (
        <FormField label="Préciser le(s) médicament(s)" value={data.traitementMedicalDetail || ''} onChange={v => update('traitementMedicalDetail', v)} multiline />
      )}

      <FormSection title="3.3 — Allergies connues" />
      <RadioField label="Allergie aux métaux (nickel, cobalt, chrome, acier chirurgical, titane)" options={['Non', 'Oui']} value={data.allergieMetaux || 'Non'} onChange={v => update('allergieMetaux', v)} />
      <RadioField label="Allergie aux encres de tatouage ou pigments de maquillage permanent" options={['Non', 'Oui']} value={data.allergieEncres || 'Non'} onChange={v => update('allergieEncres', v)} />
      <RadioField label="Allergie au latex" options={['Non', 'Oui']} value={data.allergieLatex || 'Non'} onChange={v => update('allergieLatex', v)} />
      <RadioField label="Allergie aux produits désinfectants (alcool, chlorhexidine, Bétadine)" options={['Non', 'Oui']} value={data.allergieDesinfectants || 'Non'} onChange={v => update('allergieDesinfectants', v)} />
      <RadioField label="Allergie aux anesthésiants topiques (crème EMLA, lidocaïne)" options={['Non', 'Oui']} value={data.allergieAnesthesiants || 'Non'} onChange={v => update('allergieAnesthesiants', v)} />
      {(data.allergieMetaux === 'Oui' || data.allergieEncres === 'Oui' || data.allergieLatex === 'Oui' || data.allergieDesinfectants === 'Oui' || data.allergieAnesthesiants === 'Oui') && (
        <FormField label="Préciser toute allergie connue" value={data.allergiesDetail || ''} onChange={v => update('allergiesDetail', v)} multiline />
      )}

      <FormSection title="3.4 — Situation particulière" />
      <RadioField label="Enceinte, allaitante ou susceptible de l'être" options={['Non', 'Oui', 'Ne sait pas']} value={data.grossesse || 'Non'} onChange={v => update('grossesse', v)} />
      <RadioField label="Consommation d'alcool dans les 24h précédant la prestation" options={['Non', 'Oui']} value={data.alcool || 'Non'} onChange={v => update('alcool', v)} />
      <RadioField label="Consommation de drogues ou substances psychoactives" options={['Non', 'Oui']} value={data.drogues || 'Non'} onChange={v => update('drogues', v)} />
      <RadioField label="A bien mangé dans les 4h précédant la prestation" options={['Oui', 'Non']} value={data.aBienMange || 'Oui'} onChange={v => update('aBienMange', v)} />
      <RadioField label="A dormi suffisamment la nuit précédente" options={['Oui', 'Non']} value={data.aDormi || 'Oui'} onChange={v => update('aDormi', v)} />
      <RadioField label="Lésion, plaie ou irritation sur la zone à traiter" options={['Non', 'Oui']} value={data.lesionZone || 'Non'} onChange={v => update('lesionZone', v)} />
      <RadioField label="Réaction lors d'une prestation antérieure" options={['Non', 'Oui']} value={data.reactionAnterieure || 'Non'} onChange={v => update('reactionAnterieure', v)} />
      {data.reactionAnterieure === 'Oui' && (
        <FormField label="Décrire la réaction" value={data.reactionAnterieureDetail || ''} onChange={v => update('reactionAnterieureDetail', v)} multiline />
      )}
      <FormField label="Informations médicales complémentaires" value={data.autresInfosMedicales || ''} onChange={v => update('autresInfosMedicales', v)} multiline />

      <FormSection title="4 — CONTACT D'URGENCE" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nom et prénom" value={data.urgenceNom || ''} onChange={v => update('urgenceNom', v)} />
        <FormField label="Téléphone" value={data.urgenceTelephone || ''} onChange={v => update('urgenceTelephone', v)} type="tel" />
      </div>
      <FormField label="Lien avec le client (conjoint, parent, ami…)" value={data.urgenceLien || ''} onChange={v => update('urgenceLien', v)} />

      <FormSection title="6 — CONSENTEMENT ÉCLAIRÉ" />
      <CheckboxField label="Être majeur(e) et avoir capacité juridique" value={data.consent_majeur || false} onToggle={() => update('consent_majeur', !data.consent_majeur)} />
      <CheckboxField label="A répondu honnêtement" value={data.consent_honnete || false} onToggle={() => update('consent_honnete', !data.consent_honnete)} />
      <CheckboxField label="Informé(e) des risques" value={data.consent_informe || false} onToggle={() => update('consent_informe', !data.consent_informe)} />
      <CheckboxField label="Reçu fiche de soins post-piercing" value={data.consent_ficheRecue || false} onToggle={() => update('consent_ficheRecue', !data.consent_ficheRecue)} />
      <CheckboxField label="Consent librement" value={data.consent_librement || false} onToggle={() => update('consent_librement', !data.consent_librement)} />
      <CheckboxField label="S'engage à respecter le protocole de soins" value={data.consent_protocole || false} onToggle={() => update('consent_protocole', !data.consent_protocole)} />

      <FormSection title="7 — DOCUMENTS REMIS" />
      <CheckboxField label="Fiche de soins post-piercing remise" value={data.ficheRemise || false} onToggle={() => update('ficheRemise', !data.ficheRemise)} />
      <CheckboxField label="Informations matériaux communiquées" value={data.infosMateriauxRemises || false} onToggle={() => update('infosMateriauxRemises', !data.infosMateriauxRemises)} />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="N° de traçabilité du bijou" value={data.tracabilite || ''} onChange={v => update('tracabilite', v)} />
        <FormField label="Lot" value={data.lot || ''} onChange={v => update('lot', v)} />
      </div>
    </>
  );
}

// ─── Formulaire Autorisation Parentale ───────────────────────────────────────

function FormAutorisationParentale({ data, update, client, salonInfo }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client; salonInfo: any }) {
  return (
    <>
      <FormSection title="1 — IDENTITÉ DU SALON" />
      <FormField label="Nom du salon" value={data.nomSalon || salonInfo?.nom || ''} onChange={v => update('nomSalon', v)} required />
      <FormField label="Adresse" value={data.adresseSalon || salonInfo?.adresse || ''} onChange={v => update('adresseSalon', v)} />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Téléphone" value={data.telSalon || salonInfo?.telephone || ''} onChange={v => update('telSalon', v)} type="tel" />
        <FormField label="N° SIRET" value={data.siret || salonInfo?.siret || ''} onChange={v => update('siret', v)} />
      </div>
      <FormField label="Nom du pierceur" value={data.nomPierceur || salonInfo?.nomPierceur || ''} onChange={v => update('nomPierceur', v)} />

      <FormSection title="2 — IDENTITÉ DU MINEUR" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nom" value={data.nomMineur || client.nom} onChange={v => update('nomMineur', v)} required />
        <FormField label="Prénom" value={data.prenomMineur || client.prenom} onChange={v => update('prenomMineur', v)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Date de naissance (JJ/MM/AAAA)" value={data.dateNaissanceMineur || client.dateNaissance || ''} onChange={v => update('dateNaissanceMineur', v)} />
        <FormField label="Âge" value={data.ageMineur || ''} onChange={v => update('ageMineur', v)} />
      </div>

      <FormSection title="3 — REPRÉSENTANT(S) LÉGAL(AUX)" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nom" value={data.nomRep || ''} onChange={v => update('nomRep', v)} required />
        <FormField label="Prénom" value={data.prenomRep || ''} onChange={v => update('prenomRep', v)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Lien avec le mineur" value={data.lienRep || ''} onChange={v => update('lienRep', v)} />
        <FormField label="Téléphone" value={data.telRep || ''} onChange={v => update('telRep', v)} type="tel" />
      </div>
      <p className="text-xs mb-2" style={{ color: 'var(--brand-text-muted)' }}>Qualité :</p>
      <CheckboxField label="Père / Mère" value={data.qualitePere || false} onToggle={() => update('qualitePere', !data.qualitePere)} />
      <CheckboxField label="Tuteur(trice) légal(e)" value={data.qualiteTuteur || false} onToggle={() => update('qualiteTuteur', !data.qualiteTuteur)} />
      <FormField label="Autre (préciser)" value={data.qualiteAutre || ''} onChange={v => update('qualiteAutre', v)} />

      <FormSection title="4 — DESCRIPTION DU PIERCING" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Zone percée" value={data.zonePiercing || ''} onChange={v => update('zonePiercing', v)} required />
        <FormField label="Type de bijou" value={data.typeBijou || ''} onChange={v => update('typeBijou', v)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Matériau du bijou" value={data.materiau || ''} onChange={v => update('materiau', v)} />
        <FormField label="Longueur / diamètre" value={data.taille || ''} onChange={v => update('taille', v)} />
      </div>
      <CheckboxField label="Aucune allergie connue" value={data.aucuneAllergie || false} onToggle={() => update('aucuneAllergie', !data.aucuneAllergie)} />
      <FormField label="Allergie(s)" value={data.allergies || ''} onChange={v => update('allergies', v)} />
      <FormField label="Traitement médical en cours" value={data.traitements || ''} onChange={v => update('traitements', v)} />

      <FormSection title="5 — DÉCLARATIONS ET CONSENTEMENT" />
      <LegalBox>Je soussigné(e), représentant(e) légal(e) du mineur désigné ci-dessus :</LegalBox>
      <CheckboxField label="Certifie être titulaire de l'autorité parentale / tutelle légale." value={data.decl_0 || false} onToggle={() => update('decl_0', !data.decl_0)} />
      <CheckboxField label="Autorise expressément la réalisation du piercing décrit ci-dessus." value={data.decl_1 || false} onToggle={() => update('decl_1', !data.decl_1)} />
      <CheckboxField label="Atteste avoir pris connaissance des risques liés à cette pratique (infection, allergie, rejet)." value={data.decl_2 || false} onToggle={() => update('decl_2', !data.decl_2)} />
      <CheckboxField label="Confirme que le mineur ne présente pas de contre-indication médicale à cette intervention." value={data.decl_3 || false} onToggle={() => update('decl_3', !data.decl_3)} />
      <CheckboxField label="M'engage à faire respecter au mineur le protocole de soins post-piercing remis par le professionnel." value={data.decl_4 || false} onToggle={() => update('decl_4', !data.decl_4)} />
      <CheckboxField label="Reconnais avoir reçu et lu la fiche de soins post-piercing." value={data.decl_5 || false} onToggle={() => update('decl_5', !data.decl_5)} />

      <FormSection title="6 — PRÉSENCE PENDANT LA SÉANCE" />
      <CheckboxField label="Était présent(e) physiquement lors de la réalisation du piercing." value={data.presencePhysique || false} onToggle={() => update('presencePhysique', !data.presencePhysique)} />
      <CheckboxField label="A donné son autorisation écrite mais n'était pas présent(e) — copie de CNI jointe." value={data.presenceEcrite || false} onToggle={() => update('presenceEcrite', !data.presenceEcrite)} />

      <FormSection title="8 — PIÈCES JOINTES (à conserver avec ce document)" />
      <CheckboxField label="Copie CNI / passeport du mineur" value={data.copieMineur || false} onToggle={() => update('copieMineur', !data.copieMineur)} />
      <CheckboxField label="Copie CNI / passeport du représentant légal" value={data.copieRep || false} onToggle={() => update('copieRep', !data.copieRep)} />
      <CheckboxField label="Fiche de soins post-piercing signée" value={data.ficheSoins || false} onToggle={() => update('ficheSoins', !data.ficheSoins)} />
      <FormField label="Autre" value={data.autresPieces || ''} onChange={v => update('autresPieces', v)} />
    </>
  );
}

// ─── Fiche de soins générique ─────────────────────────────────────────────────

const SOINS_DATA: Record<string, { title: string; zones: { zone: string; desc: string; cica: string }[]; faire: string[]; eviter: string[] }> = {
  soins_oreilles: {
    title: 'OREILLES',
    zones: [
      { zone: 'Lobe (simple)', desc: 'Partie charnue inférieure de l\'oreille. Bijou : Stud, anneau.', cica: '6 à 8 semaines' },
      { zone: 'Lobe (épais / double)', desc: 'Lobe plus épais ou double perforation. Bijou : Stud, anneau.', cica: '2 à 4 mois' },
      { zone: 'Hélix', desc: 'Bord supérieur du cartilage. Bijou : Stud, anneau.', cica: '6 à 12 mois' },
      { zone: 'Hélix avant (Forward Helix)', desc: 'Partie avant du cartilage supérieur. Bijou : Stud.', cica: '6 à 12 mois' },
      { zone: 'Tragus', desc: 'Petite saillie cartilagineuse devant le canal auditif. Bijou : Stud, anneau.', cica: '6 à 12 mois' },
      { zone: 'Anti-tragus', desc: 'Saillie en face du tragus. Bijou : Stud, anneau.', cica: '8 à 16 mois' },
      { zone: 'Conque (interne / externe)', desc: 'Cuvette centrale de l\'oreille. Bijou : Stud, anneau.', cica: '6 à 12 mois' },
      { zone: 'Daith', desc: 'Pli de cartilage au-dessus du canal auditif. Bijou : Anneau.', cica: '6 à 12 mois' },
      { zone: 'Rook', desc: 'Pli de cartilage entre hélix et anti-hélix. Bijou : Barbell courbé.', cica: '6 à 18 mois' },
      { zone: 'Industrial (Scaffold)', desc: 'Barre traversant deux points du cartilage. Bijou : Barbell droit.', cica: '6 à 12 mois' },
    ],
    faire: [
      'Nettoyer 2×/jour au sérum physiologique NaCl 0,9%.',
      'Sécher avec une compresse stérile non pelucheuse.',
      'Se laver les mains avant tout contact avec la zone.',
      'Dormir sur le côté opposé ou utiliser un oreiller percé.',
    ],
    eviter: [
      'Alcool, bétadine, eau oxygénée — dangereux pour la cicatrisation.',
      'Tourner ou manipuler le bijou.',
      'Piscine, mer, hammam pendant la cicatrisation.',
      'Changer le bijou avant guérison complète.',
      'Téléphone contre l\'oreille percée (utiliser oreillette).',
    ],
  },
  soins_nez: {
    title: 'NEZ',
    zones: [
      { zone: 'Narine (Nostril)', desc: 'Côté de la narine, courbe du cartilage externe. Bijou : Stud, anneau, vis.', cica: '4 à 6 mois' },
      { zone: 'Narine haute (High Nostril)', desc: 'Plus haut sur le cartilage narinaire. Bijou : Stud, vis.', cica: '6 à 9 mois' },
      { zone: 'Septum', desc: 'Sweet spot entre les narines, sous le cartilage central. Bijou : Anneau, fer à cheval.', cica: '6 à 8 sem.' },
      { zone: 'Bridge (Earl)', desc: 'Arête du nez entre les yeux. Bijou : Barbell droit.', cica: '2 à 3 mois' },
      { zone: 'Rhino (Vertical Tip)', desc: 'Pointe du nez de bas en haut. Bijou : Barbell courbé.', cica: '9 à 12 mois' },
    ],
    faire: [
      'Nettoyer 2×/jour au sérum physiologique NaCl 0,9%.',
      'Sécher avec une compresse stérile non pelucheuse.',
      'Moucher délicatement sans pression sur le bijou.',
      'Se laver les mains avant tout contact avec la zone.',
    ],
    eviter: [
      'Alcool, bétadine, eau oxygénée — dangereux.',
      'Crèmes, maquillage ou fond de teint près des narines.',
      'Piscine, mer, hammam pendant la cicatrisation.',
      'Changer ou manipuler le bijou avant guérison.',
      'Moucher violemment ou se frotter le nez.',
    ],
  },
  soins_bouche_levres: {
    title: 'BOUCHE & LÈVRES',
    zones: [
      { zone: 'Labret (central bas)', desc: 'Sous la lèvre inférieure, au centre. Bijou : Labret plat.', cica: '6 à 8 sem.' },
      { zone: 'Monroe / Madonna', desc: 'Au-dessus de la lèvre supérieure, côté gauche ou droit. Bijou : Labret plat.', cica: '6 à 8 sem.' },
      { zone: 'Méduse (Philtrum)', desc: 'Sous le sillon philtral, centre de la lèvre supérieure. Bijou : Labret plat.', cica: '6 à 8 sem.' },
      { zone: 'Langue', desc: 'Centre de la langue. Bijou : Barbell droit.', cica: '4 à 6 sem.' },
      { zone: 'Smiley (Frenulum)', desc: 'Frein de la lèvre supérieure. Bijou : Anneau.', cica: '4 à 8 sem.' },
    ],
    faire: [
      'Rincer à l\'eau saline après chaque repas.',
      'Utiliser un bain de bouche sans alcool 2×/jour.',
      'Manger des aliments froids et mous les premiers jours.',
      'Hydrater les lèvres avec un baume neutre.',
    ],
    eviter: [
      'Alcool, tabac, épices, aliments trop chauds.',
      'Embrasser ou contact buccal pendant la cicatrisation.',
      'Toucher le bijou avec les mains non lavées.',
      'Bain de bouche à l\'alcool (Listerine classique).',
    ],
  },
  soins_nombril: {
    title: 'NOMBRIL',
    zones: [
      { zone: 'Nombril (standard)', desc: 'Bord supérieur du nombril. Bijou : Barbell courbé.', cica: '6 à 12 mois' },
      { zone: 'Nombril bas', desc: 'Bord inférieur du nombril. Bijou : Barbell courbé.', cica: '6 à 12 mois' },
      { zone: 'Nombril surface', desc: 'Côté du nombril. Bijou : Surface bar.', cica: '6 à 18 mois' },
    ],
    faire: [
      'Nettoyer 2×/jour au sérum physiologique NaCl 0,9%.',
      'Porter des vêtements amples et respirants.',
      'Sécher soigneusement après la douche.',
      'Éviter les ceintures ou élastiques serrant la zone.',
    ],
    eviter: [
      'Piscine, mer, bain pendant la cicatrisation.',
      'Vêtements trop serrés sur la zone.',
      'Sport intense les premières semaines.',
      'Crèmes ou huiles sur la zone.',
    ],
  },
  soins_mamelons: {
    title: 'MAMELONS',
    zones: [
      { zone: 'Mamelon horizontal', desc: 'Traversée horizontale du mamelon. Bijou : Barbell droit.', cica: '6 à 12 mois' },
      { zone: 'Mamelon vertical', desc: 'Traversée verticale du mamelon. Bijou : Barbell droit.', cica: '6 à 12 mois' },
    ],
    faire: [
      'Nettoyer 2×/jour au sérum physiologique NaCl 0,9%.',
      'Porter un soutien-gorge de sport sans coutures irritantes.',
      'Sécher soigneusement après la douche.',
    ],
    eviter: [
      'Soutien-gorge avec armatures ou matières rugueuses.',
      'Sport de contact ou activités avec frottements.',
      'Piscine, mer, bain pendant la cicatrisation.',
      'Manipulation ou pression sur la zone.',
    ],
  },
  soins_arcade_sourcil: {
    title: 'ARCADE SOURCILIÈRE',
    zones: [
      { zone: 'Arcade sourcilière', desc: 'Bord de l\'arcade sourcilière. Bijou : Barbell courbé, anneau.', cica: '6 à 9 mois' },
      { zone: 'Anti-sourcil', desc: 'Sous l\'œil, surface. Bijou : Surface bar.', cica: '6 à 12 mois' },
    ],
    faire: [
      'Nettoyer 2×/jour au sérum physiologique NaCl 0,9%.',
      'Sécher avec une compresse stérile.',
      'Surveiller les signes de rejet (amincissement de la peau).',
    ],
    eviter: [
      'Maquillage près de la zone percée.',
      'Lunettes appuyant sur le piercing.',
      'Toucher ou manipuler le bijou.',
    ],
  },
  soins_surface_dermal: {
    title: 'SURFACE & DERMAL',
    zones: [
      { zone: 'Dermal / Microdermal', desc: 'Ancrage unique sous la peau. Bijou : Tête décorative sur ancre.', cica: '1 à 3 mois' },
      { zone: 'Surface bar', desc: 'Barre traversant un pli de peau. Bijou : Surface bar.', cica: '6 à 18 mois' },
    ],
    faire: [
      'Nettoyer 2×/jour au sérum physiologique NaCl 0,9%.',
      'Protéger la zone des chocs et frottements.',
      'Surveiller les signes de rejet ou migration.',
    ],
    eviter: [
      'Vêtements frottant sur la zone.',
      'Sport de contact les premières semaines.',
      'Toucher ou manipuler le bijou.',
    ],
  },
  cicatrisation_tatouage: {
    title: 'TATOUAGE',
    zones: [
      { zone: 'Tatouage', desc: 'Encrage permanent dans le derme.', cica: '2 à 4 semaines (surface) / 3 mois (complet)' },
    ],
    faire: [
      'Laver délicatement 2-3×/jour à l\'eau tiède et savon doux.',
      'Appliquer une fine couche de crème cicatrisante (Bepanthen, Tattoo Goo).',
      'Protéger du soleil avec SPF 50+ une fois cicatrisé.',
      'Hydrater quotidiennement après cicatrisation.',
    ],
    eviter: [
      'Soleil direct pendant la cicatrisation.',
      'Piscine, mer, bain pendant 3 semaines.',
      'Gratter ou arracher les croûtes.',
      'Vêtements synthétiques frottant sur la zone.',
    ],
  },
  cicatrisation_dermographie: {
    title: 'DERMOGRAPHIE / MAQUILLAGE PERMANENT',
    zones: [
      { zone: 'Dermographie', desc: 'Pigmentation permanente du derme (sourcils, eye-liner, lèvres).', cica: '7 à 14 jours' },
    ],
    faire: [
      'Appliquer la crème cicatrisante fournie 3-4×/jour.',
      'Laisser les croûtes tomber naturellement.',
      'Protéger du soleil avec SPF 50+ après cicatrisation.',
    ],
    eviter: [
      'Maquillage sur la zone pendant 10 jours.',
      'Soleil direct, UV, sauna pendant 1 mois.',
      'Gratter ou frotter la zone.',
      'Piscine, mer pendant la cicatrisation.',
    ],
  },
};

function FormSoins({ docType, data, update }: { docType: string; data: Record<string, any>; update: (k: string, v: any) => void }) {
  const soins = SOINS_DATA[docType];
  if (!soins) return <p style={{ color: 'var(--brand-text-muted)' }}>Fiche de soins non disponible pour ce type.</p>;

  return (
    <>
      <div className="p-4 rounded-xl mb-4 text-center" style={{ background: 'rgba(131,208,245,0.05)', border: '1px solid rgba(131,208,245,0.2)' }}>
        <p className="text-base font-700" style={{ color: 'var(--brand-cyan)', fontWeight: 700, fontFamily: 'Outfit' }}>FICHE DE SOINS — {soins.title}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>Document à remettre au client après chaque séance</p>
      </div>

      <FormSection title="INFORMATIONS PRESTATION" />
      <FormField label="Zone percée / traitée" value={data.zonePiercing || ''} onChange={v => update('zonePiercing', v)} required />
      <FormField label="Type de bijou posé" value={data.typeBijou || ''} onChange={v => update('typeBijou', v)} />
      <FormField label="Matériau" value={data.materiau || 'Titane implant-grade'} onChange={v => update('materiau', v)} />
      <FormField label="N° de traçabilité / Lot" value={data.tracabilite || ''} onChange={v => update('tracabilite', v)} />

      <FormSection title={`ZONES DE PIERCING — ${soins.title}`} />
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(131,208,245,0.1)' }}>
              <th className="p-2 text-left" style={{ color: 'var(--brand-cyan)', border: '1px solid var(--brand-border)' }}>Zone</th>
              <th className="p-2 text-left" style={{ color: 'var(--brand-cyan)', border: '1px solid var(--brand-border)' }}>Description & Bijou</th>
              <th className="p-2 text-left" style={{ color: 'var(--brand-cyan)', border: '1px solid var(--brand-border)' }}>Cicatrisation</th>
            </tr>
          </thead>
          <tbody>
            {soins.zones.map((z, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <td className="p-2 font-600" style={{ color: 'var(--brand-text)', border: '1px solid var(--brand-border)', fontWeight: 600 }}>{z.zone}</td>
                <td className="p-2" style={{ color: 'var(--brand-text-muted)', border: '1px solid var(--brand-border)' }}>{z.desc}</td>
                <td className="p-2" style={{ color: 'var(--brand-cyan)', border: '1px solid var(--brand-border)' }}>{z.cica}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FormSection title="PROTOCOLE DE SOINS QUOTIDIENS" />
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 rounded-xl" style={{ background: 'rgba(76,175,80,0.05)', border: '1px solid rgba(76,175,80,0.2)' }}>
          <p className="text-xs font-700 mb-2" style={{ color: '#4CAF50', fontWeight: 700 }}>✓ À FAIRE</p>
          {soins.faire.map((item, i) => (
            <p key={i} className="text-xs mb-1" style={{ color: 'var(--brand-text-muted)' }}>• {item}</p>
          ))}
        </div>
        <div className="p-3 rounded-xl" style={{ background: 'rgba(244,67,54,0.05)', border: '1px solid rgba(244,67,54,0.2)' }}>
          <p className="text-xs font-700 mb-2" style={{ color: '#F44336', fontWeight: 700 }}>✗ À ÉVITER</p>
          {soins.eviter.map((item, i) => (
            <p key={i} className="text-xs mb-1" style={{ color: 'var(--brand-text-muted)' }}>• {item}</p>
          ))}
        </div>
      </div>

      <FormSection title="INFORMATIONS COMPLÉMENTAIRES" />
      <FormField label="Notes du professionnel" value={data.notes || ''} onChange={v => update('notes', v)} multiline />

      <LegalBox color="cyan">
        <strong>VOS DROITS RGPD</strong> — Dans le cadre de votre prestation, nous collectons et traitons vos données personnelles.<br />
        Art. 15 Accès · Art. 16 Rectification · Art. 17 Effacement · Art. 21 Opposition.<br />
        Durée de conservation : données de santé 3 ans.
      </LegalBox>
    </>
  );
}

// ─── Fiche de Traçabilité Matériel Stérile ─────────────────────────────────────────────────

function FormFicheSeance({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
  return (
    <>
      <LegalBox>
        <strong>Traçabilité du matériel & Suivi de la prestation</strong><br />
        Conforme ARS — Arrêté du 13 mars 2009 & Décret 2008-149
      </LegalBox>

      <FormSection title="1 — IDENTITÉ DU CLIENT" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nom de famille" value={data.nomClient || client.nom} onChange={v => update('nomClient', v)} />
        <FormField label="Prénom(s)" value={data.prenomClient || client.prenom} onChange={v => update('prenomClient', v)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Téléphone" value={data.telephoneClient || client.telephone || ''} onChange={v => update('telephoneClient', v)} type="tel" />
        <RadioField label="Statut" options={['Majeur', 'Mineur (autorisation jointe)']} value={data.statutClient || 'Majeur'} onChange={v => update('statutClient', v)} />
      </div>
      <CheckboxField label="Questionnaire médical signé" value={data.questionnaireSigne || false} onToggle={() => update('questionnaireSigne', !data.questionnaireSigne)} />

      <FormSection title="2 — PRESTATION RÉALISÉE" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Zone percée" value={data.zonePiercing || ''} onChange={v => update('zonePiercing', v)} required />
        <FormField label="Localisation précise" value={data.localisationPrecise || ''} onChange={v => update('localisationPrecise', v)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <RadioField label="Côté" options={['Gauche', 'Droit', 'Centre']} value={data.cote || ''} onChange={v => update('cote', v)} />
        <FormField label="Durée cicatrisation estimée" value={data.dureeCicatrisation || ''} onChange={v => update('dureeCicatrisation', v)} />
      </div>
      <FormField label="Observations pré-séance (contre-indications, remarques)" value={data.observationsPreseance || ''} onChange={v => update('observationsPreseance', v)} multiline />

      <FormSection title="3 — TRAÇABILITÉ DU MATÉRIEL À USAGE UNIQUE" />
      <WarningBox>Photographiez les étiquettes de traçabilité du matériel stérile. L'emballage stérile est ouvert devant le client. Conserver les photos 5 ans minimum.</WarningBox>
      <FormField label="Référence / N° de lot du matériel à usage unique" value={data.refMaterielsUnique || ''} onChange={v => update('refMaterielsUnique', v)} />
      <FormField label="Notes supplémentaires (optionnel)" value={data.notesMaterielsUnique || ''} onChange={v => update('notesMaterielsUnique', v)} multiline />

      <FormSection title="4 — TRAÇABILITÉ DU MATÉRIEL RÉUTILISABLE STÉRILISÉ" />
      <FormField label="Référence / N° de lot du matériel réutilisable" value={data.refMaterielsReutilisables || ''} onChange={v => update('refMaterielsReutilisables', v)} />
      <FormField label="Notes supplémentaires (optionnel)" value={data.notesMaterielsReutilisables || ''} onChange={v => update('notesMaterielsReutilisables', v)} multiline />

      <FormSection title="5 — BIJOU POSÉ — TRAÇABILITÉ MATIÈRE" />
      <div className="grid grid-cols-2 gap-3">
        <RadioField label="Type de bijou" options={['Anneau', 'Labret', 'Barbell', 'Autre']} value={data.typeBijou || ''} onChange={v => update('typeBijou', v)} />
        <RadioField label="Matière" options={['Titane G23 ASTM F136', 'Acier chirurgical 316L', 'PTFE / Bioflex', 'Autre']} value={data.matiereBijou || ''} onChange={v => update('matiereBijou', v)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Calibre (gauge)" value={data.calibreBijou || ''} onChange={v => update('calibreBijou', v)} />
        <FormField label="Longueur / Diamètre" value={data.longueurBijou || ''} onChange={v => update('longueurBijou', v)} />
      </div>
      <FormField label="Marque fournisseur" value={data.marqueBijou || ''} onChange={v => update('marqueBijou', v)} />
      <FormField label="N° de lot / référence" value={data.numLotBijou || ''} onChange={v => update('numLotBijou', v)} />
      <CheckboxField label="Certificat de biocompatibilité fourni" value={data.certificatBiocompat || false} onToggle={() => update('certificatBiocompat', !data.certificatBiocompat)} />

      <FormSection title="6 — PRODUITS DÉSINFECTANTS UTILISÉS" />
      {['Désinfectant cutané', 'Désinfectant surface', 'Solution PHA mains'].map((item, i) => (
        <div key={i} className="grid grid-cols-3 gap-2 mb-2">
          <div className="flex items-center text-xs" style={{ color: 'var(--brand-text-muted)' }}>{item}</div>
          <FormField label="Marque / Réf" value={data[`produit${i}_marque`] || ''} onChange={v => update(`produit${i}_marque`, v)} />
          <FormField label="N° lot" value={data[`produit${i}_lot`] || ''} onChange={v => update(`produit${i}_lot`, v)} />
        </div>
      ))}

      <FormSection title="7 — PROTOCOLE D'HYGIÈNE — CHECKLIST OPÉRATEUR" />
      <p className="text-xs mb-2" style={{ color: 'var(--brand-text-muted)', fontWeight: 600 }}>Avant la séance</p>
      {['Lavage hygiénique des mains (PHA 30 sec)', 'Nettoyage-désinfection plan de travail', 'Pose champ stérile à usage unique', 'Vérification intégrité emballages stériles', 'Marquage du point de perçage'].map((item, i) => (
        <CheckboxField key={i} label={item} value={data[`avant${i}`] || false} onToggle={() => update(`avant${i}`, !data[`avant${i}`])} />
      ))}
      <p className="text-xs mt-3 mb-2" style={{ color: 'var(--brand-text-muted)', fontWeight: 600 }}>Après la séance</p>
      {['Elimination aiguilles en DASRI (conteneur)', 'Elimination matériel usage unique souillé', 'Prédésinfection matériel réutilisable', 'Nettoyage-désinfection plan de travail', 'Retrait gants + lavage mains'].map((item, i) => (
        <CheckboxField key={i} label={item} value={data[`apres${i}`] || false} onToggle={() => update(`apres${i}`, !data[`apres${i}`])} />
      ))}

      <FormSection title="8 — GESTION DES DÉCHETS DASRI" />
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Conteneur DASRI (n° ou réf.)" value={data.containerDasri || ''} onChange={v => update('containerDasri', v)} />
        <RadioField label="Taux de remplissage" options={['< 75%', '75% - fermeture', 'Fermé']} value={data.tauxRemplissage || ''} onChange={v => update('tauxRemplissage', v)} />
        <FormField label="Date dernier enlev. DASRI" value={data.dateDernierDasri || ''} onChange={v => update('dateDernierDasri', v)} />
      </div>

      <FormSection title="9 — DOCUMENTS REMIS AU CLIENT" />
      <CheckboxField label="Fiche de soins post-piercing (zone concernée)" value={data.fichesSoinsRemise || false} onToggle={() => update('fichesSoinsRemise', !data.fichesSoinsRemise)} />
      <CheckboxField label="Informations sur les risques et contre-indications" value={data.infosRisques || false} onToggle={() => update('infosRisques', !data.infosRisques)} />
      <CheckboxField label="Coordonnées du professionnel" value={data.coordonneesProf || false} onToggle={() => update('coordonneesProf', !data.coordonneesProf)} />
      <CheckboxField label="Numéro d'urgence en cas de réaction" value={data.numUrgence || false} onToggle={() => update('numUrgence', !data.numUrgence)} />

      <FormSection title="10 — OBSERVATIONS POST-SÉANCE & SUIVI" />
      <RadioField label="Réaction immédiate observée" options={['Aucune', 'Saignement léger', 'Rougeur locale', 'Malaise vasculaire', 'Autre']} value={data.reactionObservee || 'Aucune'} onChange={v => update('reactionObservee', v)} />
      <RadioField label="RDV de contrôle proposé" options={['Oui', 'Non']} value={data.rdvControlePropose || 'Oui'} onChange={v => update('rdvControlePropose', v)} />
      <FormField label="Commentaires / observations complémentaires" value={data.observationsPostseance || ''} onChange={v => update('observationsPostseance', v)} multiline />

      <LegalBox>
        <strong>Conservation RGPD :</strong> Cette fiche doit être conservée 5 ans minimum à compter de la date de la séance (Art. R 1311-7 CSP).<br />
        Références : Décret n°2008-149 du 13/02/2008 - Arrêté du 13/03/2009 - Art. R 1311-7 CSP - Art. R 1335-1 CSP (DASRI)
      </LegalBox>
    </>
  );
}

// ─── Page principale DocumentForm ────────────────────────────────────────────

export default function DocumentForm() {
  const params = useParams<{ clientId: string; docType: string }>();
  const [, navigate] = useLocation();
  const { state, updateClient } = useApp();
  const clientId = params.clientId;
  const docType = params.docType as DocumentType;

  const client = state.clients.find(c => c.id === clientId);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (client) {
      const existingDoc = client.documents?.find(d => d.type === docType);
      if (existingDoc?.data) {
        setFormData(existingDoc.data as Record<string, any>);
      }
    }
  }, [client, docType]);

  function updateField(key: string, value: any) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!client) return;
    setIsSaving(true);
    try {
      const existingDocIdx = (client.documents || []).findIndex(d => d.type === docType);
      const now = new Date().toISOString();
      const doc = {
        id: existingDocIdx >= 0 ? client.documents[existingDocIdx].id : `doc-${Date.now()}`,
        type: docType,
        status: 'filled' as const,
        data: formData,
        dateCreation: existingDocIdx >= 0 ? client.documents[existingDocIdx].dateCreation : now,
        dateSigned: existingDocIdx >= 0 ? client.documents[existingDocIdx].dateSigned : undefined,
      };
      const newDocs = [...(client.documents || [])];
      if (existingDocIdx >= 0) newDocs[existingDocIdx] = doc;
      else newDocs.push(doc);
      await updateClient({ ...client, documents: newDocs });
      toast.success('Document sauvegardé avec succès');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  }

  if (!client) {
    return (
      <div className="p-6 text-center" style={{ color: 'var(--brand-text-muted)' }}>
        <p>Client introuvable</p>
        <button onClick={() => navigate('/clients')} className="mt-4 text-sm" style={{ color: 'var(--brand-cyan)' }}>
          Retour aux clients
        </button>
      </div>
    );
  }

  const docTitle = DOCUMENT_LABELS[docType] || docType;
  const today = new Date().toLocaleDateString('fr-FR');

  const renderForm = () => {
    switch (docType) {
      case 'questionnaire_mineur':
        return <FormQuestionnaireMineur data={formData} update={updateField} client={client} />;
      case 'questionnaire_majeur':
        return <FormQuestionnaireMajeur data={formData} update={updateField} client={client} />;
      case 'autorisation_parentale':
        return <FormAutorisationParentale data={formData} update={updateField} client={client} salonInfo={state.salonInfo} />;
      case 'fiche_seance_piercing':
        return <FormFicheSeance data={formData} update={updateField} client={client} />;
      default:
        if (docType.startsWith('soins_') || docType.startsWith('cicatrisation_')) {
          return <FormSoins docType={docType} data={formData} update={updateField} />;
        }
        return (
          <div className="text-center py-8" style={{ color: 'var(--brand-text-muted)' }}>
            <Info size={32} className="mx-auto mb-3" style={{ color: 'var(--brand-cyan)' }} />
            <p>Formulaire en cours de développement</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-navy)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3" style={{
        background: 'var(--brand-card)',
        borderBottom: '1px solid var(--brand-border)',
      }}>
        <button
          onClick={() => navigate(`/clients/${clientId}`)}
          className="p-2 rounded-lg transition-all hover:bg-white/10"
          style={{ color: 'var(--brand-text-muted)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-700 truncate" style={{ color: 'var(--brand-text)', fontWeight: 700, fontFamily: 'Outfit' }}>
            {docTitle}
          </h1>
          <p className="text-xs truncate" style={{ color: 'var(--brand-text-muted)' }}>
            {client.prenom} {client.nom} · {today}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-600 transition-all"
          style={{
            background: 'var(--brand-cyan)',
            color: 'var(--brand-navy)',
            fontWeight: 600,
            fontFamily: 'Outfit',
            opacity: isSaving ? 0.7 : 1,
          }}
        >
          <Save size={16} />
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      {/* Form content */}
      <div className="p-4 max-w-3xl mx-auto pb-16">
        {renderForm()}

        {/* Save button at bottom */}
        <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--brand-border)' }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 rounded-xl text-sm font-700 transition-all"
            style={{
              background: 'var(--brand-cyan)',
              color: 'var(--brand-navy)',
              fontWeight: 700,
              fontFamily: 'Outfit',
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? 'Sauvegarde en cours...' : '✓ Sauvegarder le document'}
          </button>
        </div>
      </div>
    </div>
  );
}

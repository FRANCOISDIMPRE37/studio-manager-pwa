import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/lib/app-context';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import SignaturePad from '@/components/SignaturePad';
import { Client } from '@/lib/types';
import { FormSection, FormField, RadioField, DateSlashField, CheckboxField, LegalBox, RgpdMentions, WarningBox, AgeVerif, PrintHeader, PrintFooter } from './FormsCommuns';

function FormQuestionnaireMineur({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
  const { state: appState } = useApp();
  const salonInfo = appState.salonInfo;
  const { t } = useTranslation();
  const yesNo = [t('forms.no'), t('forms.yes')];
  const yesNoMaybe = [t('forms.no'), t('forms.yes'), t('forms.dont_know')];
  return (
    <>
      <LegalBox color="orange">
        {t('legal.minor_legal_frame')}
      </LegalBox>
      <LegalBox color="cyan">
        <em>{t('legal.rgpd_minor')}</em>
      </LegalBox>

      <FormSection title={t('q01.section_minor_identity')} />
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('forms.last_name')} value={data.nom || client.nom} onChange={v => update('nom', v)} required />
        <FormField label={t('forms.first_name')} value={data.prenom || client.prenom} onChange={v => update('prenom', v)} required />
      </div>
      <FormField label={t('forms.dob')} value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} required />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />
      <FormField label={t('forms.phone')} value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" required />
      <RadioField label="Numéro de la pièce d'identité du mineur" options={t('forms.id_options_minor', { returnObjects: true }) as string[]} value={data.pieceId || ''} onChange={v => update('pieceId', v)} required />
      {data.pieceId && data.pieceId !== t('forms.id_not_presented') && (
        <FormField label={t('forms.id_number')} value={data.numeroPiece || ''} onChange={v => update('numeroPiece', v)} required />
      )}
      <FormSection title={t('q01.section_piercing_requested')} />
      <FormField label={t('q01.zone_to_pierce')} value={data.zonePiercing || ''} onChange={v => update('zonePiercing', v)} required />

      <FormSection title={t('q01.section_health')} />
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
      <RadioField label={t('q01.asthma_allergy')} options={yesNo} value={data.asthmeAllergiesGraves || t('forms.no')} onChange={v => update('asthmeAllergiesGraves', v)} />
      <RadioField label={t('q01.epilepsy')} options={yesNo} value={data.epilepsie || t('forms.no')} onChange={v => update('epilepsie', v)} />

      <FormSection title={t('q01.section_medications')} />
      <RadioField label={t('q01.anticoagulants')} options={yesNo} value={data.anticoagulants || t('forms.no')} onChange={v => update('anticoagulants', v)} />
      <RadioField label={t('q01.aspirin')} options={yesNo} value={data.aspirineAntiInflammatoires || t('forms.no')} onChange={v => update('aspirineAntiInflammatoires', v)} />
      <RadioField label={t('q01.roaccutane')} options={yesNo} value={data.roaccutane || t('forms.no')} onChange={v => update('roaccutane', v)} />
      <RadioField label={t('q01.corticoids')} options={yesNo} value={data.corticoides || t('forms.no')} onChange={v => update('corticoides', v)} />
      <RadioField label={t('q01.antibiotics')} options={yesNo} value={data.antibiotiques || t('forms.no')} onChange={v => update('antibiotiques', v)} />
      <RadioField label={t('q01.other_medications')} options={yesNo} value={data.autresMedicaments || t('forms.no')} onChange={v => update('autresMedicaments', v)} />
      {(data.anticoagulants === t('forms.yes') || data.aspirineAntiInflammatoires === t('forms.yes') || data.roaccutane === t('forms.yes') || data.corticoides === t('forms.yes') || data.antibiotiques === t('forms.yes') || data.autresMedicaments === t('forms.yes')) && (
        <FormField label={t('forms.specify_medication')} value={data.traitementMedicalDetail || ''} onChange={v => update('traitementMedicalDetail', v)} multiline />
      )}

      <FormSection title={t('q01.section_allergies')} />
      <RadioField label={t('q01.allergy_metals')} options={yesNo} value={data.allergieMetaux || t('forms.no')} onChange={v => update('allergieMetaux', v)} />
      <RadioField label={t('q01.allergy_inks')} options={yesNo} value={data.allergieEncres || t('forms.no')} onChange={v => update('allergieEncres', v)} />
      <RadioField label={t('q01.allergy_latex')} options={yesNo} value={data.allergieLatex || t('forms.no')} onChange={v => update('allergieLatex', v)} />
      <RadioField label={t('q01.allergy_disinfectants')} options={yesNo} value={data.allergieDesinfectants || t('forms.no')} onChange={v => update('allergieDesinfectants', v)} />
      <RadioField label={t('q01.allergy_anesthetics')} options={yesNo} value={data.allergieAnesthesiants || t('forms.no')} onChange={v => update('allergieAnesthesiants', v)} />
      {(data.allergieMetaux === t('forms.yes') || data.allergieEncres === t('forms.yes') || data.allergieLatex === t('forms.yes') || data.allergieDesinfectants === t('forms.yes') || data.allergieAnesthesiants === t('forms.yes')) && (
        <FormField label={t('forms.specify_allergy')} value={data.allergiesDetail || ''} onChange={v => update('allergiesDetail', v)} multiline />
      )}

      <FormSection title={t('q01.section_special')} />
      <RadioField label={t('q01.pregnancy')} options={yesNoMaybe} value={data.grossesse || t('forms.no')} onChange={v => update('grossesse', v)} />
      <RadioField label={t('q01.alcohol')} options={yesNo} value={data.alcool || t('forms.no')} onChange={v => update('alcool', v)} />
      <RadioField label={t('q01.drugs')} options={yesNo} value={data.drogues || t('forms.no')} onChange={v => update('drogues', v)} />
      <RadioField label={t('q01.ate_well')} options={[t('forms.yes'), t('forms.no')]} value={data.aBienMange || t('forms.yes')} onChange={v => update('aBienMange', v)} />
      <RadioField label={t('q01.slept_well')} options={[t('forms.yes'), t('forms.no')]} value={data.aDormi || t('forms.yes')} onChange={v => update('aDormi', v)} />
      <RadioField label={t('q01.lesion_zone')} options={yesNo} value={data.lesionZone || t('forms.no')} onChange={v => update('lesionZone', v)} />
      <RadioField label={t('q01.previous_reaction')} options={yesNo} value={data.reactionAnterieure || t('forms.no')} onChange={v => update('reactionAnterieure', v)} />
      {data.reactionAnterieure === t('forms.yes') && (
        <FormField label={t('forms.describe_reaction')} value={data.reactionAnterieureDetail || ''} onChange={v => update('reactionAnterieureDetail', v)} multiline />
      )}
      <FormField label={t('forms.additional_medical_info')} value={data.autresInfosMedicales || ''} onChange={v => update('autresInfosMedicales', v)} multiline />

      <FormSection title={t('q01.section_minor_opinion')} />
      <CheckboxField label={t('q01.minor_confirms')} value={data.avisMineur || false} onToggle={() => update('avisMineur', !data.avisMineur)} required />

      <FormSection title={t('q01.section_declaration')} />
      <CheckboxField label={t('q01.answered_honestly')} value={data.reponduHonnetement || false} onToggle={() => update('reponduHonnetement', !data.reponduHonnetement)} required />

      <RgpdMentions />
      <FormSection title={t('q01.section_signatures')} />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <FormField label={t('forms.client_name_signed')} value={data.nomClientSign || client.nom || ''} onChange={v => update('nomClientSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureClient || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureClient', v)} />
          <div className="mt-3">
            <SignaturePad
              label={t('forms.client_signature')}
              value={data.signatureImageClient || ''}
              onChange={v => update('signatureImageClient', v ?? '')}
            />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du représentant légal" value={data.nomRepresentantSign || (data.nomRep ? data.nomRep + ' ' + (data.prenomRep || '') : '')} onChange={v => update('nomRepresentantSign', v)} />
          <FormField label="Date" value={data.dateSignatureRepresentant || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureRepresentant', v)} />
          <div className="mt-3">
            <SignaturePad
              label="Signature du représentant légal"
              value={data.signatureImageRepresentant || ''}
              onChange={v => update('signatureImageRepresentant', v ?? '')}
            />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <FormField label={t('forms.piercer_name')} value={data.nomPierceurSign || salonInfo?.nomPierceur || ''} onChange={v => update('nomPierceurSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignaturePierceur || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignaturePierceur', v)} />
          <div className="mt-3">
            <SignaturePad
              label={t('forms.piercer_signature')}
              value={data.signatureImagePierceur || ''}
              onChange={v => update('signatureImagePierceur', v ?? '')}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Formulaire Questionnaire Médical Majeur ─────────────────────────────────

function FormQuestionnaireMajeur({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
  const { state: appState } = useApp();
  const salonInfo = appState.salonInfo;
  const { t } = useTranslation();
  const yesNo = [t('forms.no'), t('forms.yes')];
  const yesNoMaybe = [t('forms.no'), t('forms.yes'), t('forms.dont_know')];
  return (
    <>
      <LegalBox color="green">
        <em>{t('legal.rgpd_adult')}</em>
      </LegalBox>

      <FormSection title={t('q03.section_client_identity')} />
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('forms.last_name')} value={data.nom || client.nom} onChange={v => update('nom', v)} required />
        <FormField label={t('forms.first_name')} value={data.prenom || client.prenom} onChange={v => update('prenom', v)} required />
      </div>
      <FormField label={t('forms.dob')} value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} required />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />
      <FormField label={t('forms.phone')} value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" required />
      <RadioField label="Numéro de la pièce d'identité du mineur" options={t('forms.id_options_minor', { returnObjects: true }) as string[]} value={data.pieceId || ''} onChange={v => update('pieceId', v)} required />
      {data.pieceId && data.pieceId !== t('forms.id_not_presented') && (
        <FormField label={t('forms.id_number')} value={data.numeroPiece || ''} onChange={v => update('numeroPiece', v)} required />
      )}

      <FormSection title={t('q03.section_piercing_requested')} />
      <FormField label={t('q01.zone_to_pierce')} value={data.zonePiercing || ''} onChange={v => update('zonePiercing', v)} required />

      <FormSection title={t('q03.section_health')} />
      <WarningBox>{t('q03.warning_health')}</WarningBox>

      <FormSection title={t('q01.section_medical_history')} />
      <RadioField label={t('q03.skin_disease')} options={yesNo} value={data.maladiePeau || t('forms.no')} onChange={v => update('maladiePeau', v)} />
      <RadioField label={t('q03.autoimmune')} options={yesNo} value={data.maladieAutoImmune || t('forms.no')} onChange={v => update('maladieAutoImmune', v)} />
      <RadioField label={t('q01.diabetes')} options={yesNo} value={data.diabete || t('forms.no')} onChange={v => update('diabete', v)} />
      <RadioField label={t('q03.cardiac')} options={yesNo} value={data.maladieCardiaque || t('forms.no')} onChange={v => update('maladieCardiaque', v)} />
      <RadioField label={t('q03.immunodepression')} options={yesNo} value={data.immunodepression || t('forms.no')} onChange={v => update('immunodepression', v)} />
      <RadioField label={t('q03.coagulation')} options={yesNo} value={data.troublesCoagulation || t('forms.no')} onChange={v => update('troublesCoagulation', v)} />
      <RadioField label={t('q03.keloid')} options={yesNo} value={data.cheloïdes || t('forms.no')} onChange={v => update('cheloïdes', v)} />
      {data.cheloïdes === t('forms.yes') && (
        <FormField label={t('forms.specify_zone')} value={data.cheloïdesZones || ''} onChange={v => update('cheloïdesZones', v)} />
      )}
      <RadioField label={t('q03.herpes')} options={yesNo} value={data.herpes || t('forms.no')} onChange={v => update('herpes', v)} />
      <RadioField label={t('q01.hepatitis')} options={yesNo} value={data.hepatite || t('forms.no')} onChange={v => update('hepatite', v)} />
      <RadioField label={t('q01.asthma_allergy')} options={yesNo} value={data.asthmeAllergiesGraves || t('forms.no')} onChange={v => update('asthmeAllergiesGraves', v)} />
      <RadioField label={t('q01.epilepsy')} options={yesNo} value={data.epilepsie || t('forms.no')} onChange={v => update('epilepsie', v)} />
      <RadioField label={t('q03.other_chronic')} options={yesNo} value={data.autrePathologie || t('forms.no')} onChange={v => update('autrePathologie', v)} />
      {data.autrePathologie === t('forms.yes') && (
        <FormField label={t('forms.specify')} value={data.autrePathologieDetail || ''} onChange={v => update('autrePathologieDetail', v)} />
      )}

      <FormSection title={t('q01.section_medications')} />
      <RadioField label={t('q01.anticoagulants')} options={yesNo} value={data.anticoagulants || t('forms.no')} onChange={v => update('anticoagulants', v)} />
      <RadioField label={t('q03.aspirin')} options={yesNo} value={data.aspirineAntiInflammatoires || t('forms.no')} onChange={v => update('aspirineAntiInflammatoires', v)} />
      <RadioField label={t('q03.roaccutane')} options={yesNo} value={data.roaccutane || t('forms.no')} onChange={v => update('roaccutane', v)} />
      <RadioField label={t('q03.corticoids')} options={yesNo} value={data.corticoides || t('forms.no')} onChange={v => update('corticoides', v)} />
      <RadioField label={t('q01.antibiotics')} options={yesNo} value={data.antibiotiques || t('forms.no')} onChange={v => update('antibiotiques', v)} />
      <RadioField label={t('q01.other_medications')} options={yesNo} value={data.autresMedicaments || t('forms.no')} onChange={v => update('autresMedicaments', v)} />
      {(data.anticoagulants === t('forms.yes') || data.aspirineAntiInflammatoires === t('forms.yes') || data.roaccutane === t('forms.yes') || data.corticoides === t('forms.yes') || data.antibiotiques === t('forms.yes') || data.autresMedicaments === t('forms.yes')) && (
        <FormField label={t('forms.specify_medication')} value={data.traitementMedicalDetail || ''} onChange={v => update('traitementMedicalDetail', v)} multiline />
      )}

      <FormSection title={t('q01.section_allergies')} />
      <RadioField label={t('q01.allergy_metals')} options={yesNo} value={data.allergieMetaux || t('forms.no')} onChange={v => update('allergieMetaux', v)} />
      <RadioField label={t('q01.allergy_inks')} options={yesNo} value={data.allergieEncres || t('forms.no')} onChange={v => update('allergieEncres', v)} />
      <RadioField label={t('q01.allergy_latex')} options={yesNo} value={data.allergieLatex || t('forms.no')} onChange={v => update('allergieLatex', v)} />
      <RadioField label={t('q01.allergy_disinfectants')} options={yesNo} value={data.allergieDesinfectants || t('forms.no')} onChange={v => update('allergieDesinfectants', v)} />
      <RadioField label={t('q01.allergy_anesthetics')} options={yesNo} value={data.allergieAnesthesiants || t('forms.no')} onChange={v => update('allergieAnesthesiants', v)} />
      {(data.allergieMetaux === t('forms.yes') || data.allergieEncres === t('forms.yes') || data.allergieLatex === t('forms.yes') || data.allergieDesinfectants === t('forms.yes') || data.allergieAnesthesiants === t('forms.yes')) && (
        <FormField label={t('forms.specify_allergy')} value={data.allergiesDetail || ''} onChange={v => update('allergiesDetail', v)} multiline />
      )}

      <FormSection title={t('q01.section_special')} />
      <RadioField label={t('q03.pregnancy')} options={yesNoMaybe} value={data.grossesse || t('forms.no')} onChange={v => update('grossesse', v)} />
      <RadioField label={t('q01.alcohol')} options={yesNo} value={data.alcool || t('forms.no')} onChange={v => update('alcool', v)} />
      <RadioField label={t('q01.drugs')} options={yesNo} value={data.drogues || t('forms.no')} onChange={v => update('drogues', v)} />
      <RadioField label={t('q01.ate_well')} options={[t('forms.yes'), t('forms.no')]} value={data.aBienMange || t('forms.yes')} onChange={v => update('aBienMange', v)} />
      <RadioField label={t('q01.slept_well')} options={[t('forms.yes'), t('forms.no')]} value={data.aDormi || t('forms.yes')} onChange={v => update('aDormi', v)} />
      <RadioField label={t('q01.lesion_zone')} options={yesNo} value={data.lesionZone || t('forms.no')} onChange={v => update('lesionZone', v)} />
      <RadioField label={t('q01.previous_reaction')} options={yesNo} value={data.reactionAnterieure || t('forms.no')} onChange={v => update('reactionAnterieure', v)} />
      {data.reactionAnterieure === t('forms.yes') && (
        <FormField label={t('forms.describe_reaction')} value={data.reactionAnterieureDetail || ''} onChange={v => update('reactionAnterieureDetail', v)} multiline />
      )}
      <FormField label={t('forms.additional_medical_info')} value={data.autresInfosMedicales || ''} onChange={v => update('autresInfosMedicales', v)} multiline />

      <FormSection title={t('q03.section_declaration')} />
      <CheckboxField label={t('q03.consent_adult')} value={data.consent_majeur || false} onToggle={() => update('consent_majeur', !data.consent_majeur)} required />
      <CheckboxField label={t('q03.consent_honest')} value={data.consent_honnete || false} onToggle={() => update('consent_honnete', !data.consent_honnete)} required />
      <CheckboxField label={t('q03.consent_freely')} value={data.consent_librement || false} onToggle={() => update('consent_librement', !data.consent_librement)} required />
      <CheckboxField label={t('q03.consent_protocol')} value={data.consent_protocole || false} onToggle={() => update('consent_protocole', !data.consent_protocole)} required />
      <CheckboxField label="Je consens expressement au traitement de mes donnees de sante par le salon (Art. 9 RGPD)" value={data.consentDonneesSante || false} onToggle={() => update('consentDonneesSante', !data.consentDonneesSante)} required />

      <RgpdMentions />
      <FormSection title={t('q03.section_signatures')} />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <FormField label={t('forms.client_name')} value={data.nomClientSign || data.nom || client.nom || ''} onChange={v => update('nomClientSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureClient || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureClient', v)} />
          <div className="mt-3">
            <SignaturePad
              label={t('forms.client_signature')}
              value={data.signatureImageClient || ''}
              onChange={v => update('signatureImageClient', v ?? '')}
            />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <FormField label={t('forms.piercer_name')} value={data.nomPierceurSign || salonInfo?.nomPierceur || ''} onChange={v => update('nomPierceurSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignaturePierceur || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignaturePierceur', v)} />
          <div className="mt-3">
            <SignaturePad
              label={t('forms.piercer_signature')}
              value={data.signatureImagePierceur || ''}
              onChange={v => update('signatureImagePierceur', v ?? '')}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Formulaire Autorisation Parentale ───────────────────────────────────────

function FormAutorisationParentale({ data, update, client, salonInfo }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client; salonInfo: any }) {
  const { t } = useTranslation();
  return (
    <>
      <FormSection title={t('q02.section_salon_identity')} />
      <FormField label={t('forms.salon_name')} value={data.nomSalon || salonInfo?.nom || ''} onChange={v => update('nomSalon', v)} required />
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('forms.phone')} value={data.telSalon || salonInfo?.telephone || ''} onChange={v => update('telSalon', v)} type="tel" />
        <FormField label={t('forms.siret')} value={data.siret || salonInfo?.siret || ''} onChange={v => update('siret', v)} />
      </div>
      <FormField label={t('forms.piercer_name')} value={data.nomPierceur || salonInfo?.nomPierceur || ''} onChange={v => update('nomPierceur', v)} />

      <FormSection title={t('q02.section_minor_identity')} />
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('forms.last_name')} value={data.nomMineur || client.nom} onChange={v => update('nomMineur', v)} required />
        <FormField label={t('forms.first_name')} value={data.prenomMineur || client.prenom} onChange={v => update('prenomMineur', v)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('forms.dob')} value={data.dateNaissanceMineur || client.dateNaissance || ''} onChange={v => update('dateNaissanceMineur', v)} />
        <FormField label={t('forms.age')} value={data.ageMineur || ''} onChange={v => update('ageMineur', v)} />
      </div>

      <FormSection title={t('q02.section_legal_rep')} />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nom de famille *" value={data.nomRep || ''} onChange={v => update('nomRep', v)} required />
        <FormField label="Prénom(s) *" value={data.prenomRep || ''} onChange={v => update('prenomRep', v)} required />
      </div>
      <FormField label="Lien avec le mineur" value={data.lienRep || ''} onChange={v => update('lienRep', v)} />
      <FormField label="Téléphone du représentant légal" value={data.telRep || client.telephone || ''} onChange={v => update('telRep', v)} type="tel" required />

      <FormSection title={t('q02.section_declarations')} />
      <LegalBox>{t('q02.legal_rep_intro')}</LegalBox>
      <CheckboxField label={t('q02.decl_authority')} value={data.decl_0 || false} onToggle={() => update('decl_0', !data.decl_0)} required />
      <CheckboxField label={t('q02.decl_authorize')} value={data.decl_1 || false} onToggle={() => update('decl_1', !data.decl_1)} required />
      <CheckboxField label={t('q02.decl_no_contraindication')} value={data.decl_3 || false} onToggle={() => update('decl_3', !data.decl_3)} required />
      <CheckboxField label={t('q02.decl_care_protocol')} value={data.decl_4 || false} onToggle={() => update('decl_4', !data.decl_4)} required />

      <FormSection title={t('q02.section_presence')} />
      <CheckboxField label={t('q02.presence_physical')} value={data.presencePhysique || false} onToggle={() => update('presencePhysique', !data.presencePhysique)} required />
      <CheckboxField label={t('q02.presence_written')} value={data.presenceEcrite || false} onToggle={() => update('presenceEcrite', !data.presenceEcrite)} required />

      <FormSection title={t('q02.section_rep_id')} />
      <RadioField label={t('q02.rep_id_label')} options={t('forms.id_options_minor', { returnObjects: true }) as string[]} value={data.pieceIdRepresentantType || ''} onChange={v => update('pieceIdRepresentantType', v)} required />
      <FormField label={t('forms.id_number')} value={data.pieceIdRepresentantNumero || ''} onChange={v => update('pieceIdRepresentantNumero', v)} required />

      <RgpdMentions />
      <FormSection title={t('q02.section_signatures')} />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <FormField label={t('forms.legal_rep_name')} value={data.nomRepresentantSign || (data.nomRep ? data.nomRep + ' ' + (data.prenomRep || '') : data.nomRepresentant || '')} onChange={v => update('nomRepresentantSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureParent || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureParent', v)} />
          <div className="mt-3">
            <SignaturePad
              label={t('forms.legal_rep_signature')}
              value={data.signatureImageParent || ''}
              onChange={v => update('signatureImageParent', v ?? '')}
            />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <FormField label={t('forms.piercer_name')} value={data.nomPierceurSign || salonInfo?.nomPierceur || ''} onChange={v => update('nomPierceurSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignaturePierceur || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignaturePierceur', v)} />
          <div className="mt-3">
            <SignaturePad
              label={t('forms.piercer_signature')}
              value={data.signatureImagePierceur || ''}
              onChange={v => update('signatureImagePierceur', v ?? '')}
            />
          </div>
        </div>
      </div>
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
    title: 'TÉTON',
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
    title: 'SOINS POST PIERCING SURFACE / DERMAL',
    zones: [
      { zone: 'Microdermal', desc: "N'importe quelle zone plane : cou, décolleté, nuque, hanches, joues, tempes… Bijou : Tête décorative sur ancre.", cica: '1 à 3 mois' },
      { zone: 'Skin Diver', desc: "Variante + légère du microdermal. Moins d'ancrage sous-cutané. Bijou : Tête décorative.", cica: '1 à 3 mois' },
      { zone: 'Surface — Hanche', desc: "Entre nombril et os iliaque, incliné à 90°. Zone à fort mouvement. Bijou : Surface bar.", cica: '9 à 18 mois' },
      { zone: 'Surface — Nuque', desc: "Horizontale sur la nuque. Risque de rejet parmi les plus élevés. Bijou : Surface bar.", cica: '9 à 18 mois' },
      { zone: 'Surface — Sternum', desc: "Verticale ou horizontale sur le sternum / décolleté. Bijou : Surface bar.", cica: '9 à 18 mois' },
      { zone: 'Surface — Ventre', desc: "Autour du nombril (non-nombril). Triangle ou croix de skin divers. Bijou : Surface bar.", cica: '9 à 18 mois' },
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
  soins_bouche_levres: {
    title: 'SOINS POST LABRET',
    zones: [
      { zone: 'Labret classique', desc: 'Centré sous la lèvre inf., horizontal. Bijou : Labret droit.', cica: '6 à 8 sem.' },
      { zone: 'Labret décalé', desc: 'À gauche ou à droite sous la lèvre inf. Bijou : Labret droit.', cica: '6 à 8 sem.' },
      { zone: 'Labret vertical', desc: 'Traverse verticalement le centre de la lèvre inf. Bijou : Barbell courbé.', cica: '6 à 9 mois' },
      { zone: 'Ashley', desc: 'Centré lèvre inf. — 1 bille visible, 1 en bouche. Bijou : Flatback.', cica: '6 à 9 mois' },
      { zone: 'Médusa / Philtrum', desc: 'Centré au-dessus de la lèvre sup., dans le philtrum. Bijou : Labret droit.', cica: '6 à 9 mois' },
      { zone: 'Jestrum', desc: 'Traverse la lèvre sup. verticalement — 2 billes visibles. Bijou : Barbell courbé.', cica: '6 à 9 mois' },
      { zone: 'Monroe', desc: 'Au-dessus de la lèvre sup., côté gauche. Bijou : Labret droit.', cica: '8 à 10 sem.' },
      { zone: 'Madonna', desc: 'Au-dessus de la lèvre sup., côté droit. Bijou : Labret droit.', cica: '8 à 10 sem.' },
      { zone: 'Dahlia (Joue)', desc: 'Aux commissures des lèvres, légèrement écarté. Bijou : Labret long.', cica: '6 à 9 mois' },
      { zone: 'Labret horizontal', desc: 'Perforation horizontale dans le vermillon de la lèvre inf. Bijou : Barbell droit.', cica: '6 à 9 mois' },
      { zone: 'Langue (Midline)', desc: 'Centre de la langue, vertical. Le plus courant. Bijou : Barbell long.', cica: '4 à 6 sem.' },
      { zone: 'Langue latérale', desc: 'Légèrement à gauche ou droite de la ligne centrale. Bijou : Barbell droit.', cica: '4 à 6 sem.' },
      { zone: 'Venom / Double', desc: '2 perforations côte à côte de part et d\'autre du centre. Bijou : 2 barbells.', cica: '4 à 6 sem.' },
      { zone: 'Snake Eyes', desc: '2 perforations à la pointe, horizontal — risque élevé de rejet. Bijou : Barbell courbé.', cica: '4 à 6 sem.' },
      { zone: 'Tongue Web', desc: 'Membrane sous la langue. Discret, peu douloureux. Bijou : Anneau / courbé.', cica: '4 sem.' },
      { zone: 'Smiley (Frein sup.)', desc: 'Frein de la lèvre supérieure — visible en souriant. Bijou : Anneau, fer à cheval.', cica: '4 à 8 sem.' },
      { zone: 'Frowny (Frein inf.)', desc: 'Frein de la lèvre inférieure — discret, presque invisible. Bijou : Anneau, fer à cheval.', cica: '4 sem.' },
    ],
    faire: [
      'Rincer la bouche avec un bain de bouche SANS alcool après chaque repas.',
      'Nettoyer l\'extérieur (labret, médusa, Monroe…) 2×/jour au sérum NaCl 0,9%.',
      'Manger froid ou tiède les premiers jours pour réduire le gonflement.',
      'Remplacer le bijou long par un bijou court dès disparition du gonflement (J10-J14).',
      'Utiliser un bijou en bioplastique ou titane implant-grade pour protéger dents et gencives.',
      'Brossage doux 2×/jour sans frotter le bijou.',
    ],
    eviter: [
      'Alcool, tabac, aliments épicés ou très acides les 2-3 premières semaines.',
      'Contacts buccaux (bisous, etc.) pendant la cicatrisation.',
      'Jouer avec le bijou — risque de fracture dentaire et récession gingivale.',
      'Partager verres, couverts ou brosses à dents.',
      'Conserver le bijou long initial trop longtemps (dommages dentaires).',
      'Piscine, mer, sport de contact en phase aiguë.',
      'Changer le bijou soi-même avant cicatrisation complète.',
    ],
  },
};

function FormSoins({ docType, data, update, client }: { docType: string; data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
  const { state: appState } = useApp();
  const salonInfo = appState.salonInfo;
  const { t } = useTranslation();
  const soinsKeyMap: Record<string, string> = {
    soins_oreilles: 'oreilles',
    soins_nez: 'nez',
    soins_nombril: 'nombril',
    soins_mamelons: 'mamelons',
    soins_arcade_sourcil: 'arcade_sourcil',
    soins_surface_dermal: 'surface_dermal',
    soins_bouche_levres: 'bouche_levres',
  };
  const soinsKey = soinsKeyMap[docType];
  const fallback = SOINS_DATA[docType];
  const soinsTitle = soinsKey ? t(`soins.${soinsKey}.title`, fallback?.title || '') : (fallback?.title || '');
  const soinsZones = soinsKey
    ? (t(`soins.${soinsKey}.zones`, { returnObjects: true }) as { zone: string; desc: string; cica: string }[])
    : (fallback?.zones || []);
  const soinsFaire = soinsKey
    ? (t(`soins.${soinsKey}.faire`, { returnObjects: true }) as string[])
    : (fallback?.faire || []);
  const soinsEviter = soinsKey
    ? (t(`soins.${soinsKey}.eviter`, { returnObjects: true }) as string[])
    : (fallback?.eviter || []);
  if (!fallback && !soinsKey) return <p style={{ color: '#1e293b', fontWeight: 600 }}>Fiche de soins non disponible pour ce type.</p>;

  return (
    <>
      <div className="p-4 rounded-xl mb-4 text-center" style={{ background: 'rgba(131,208,245,0.05)', border: '1px solid rgba(131,208,245,0.2)' }}>
        <p className="text-base font-700" style={{ color: '#0369a1', fontWeight: 700, fontFamily: 'Outfit' }}>{t('soins.fiche_title', 'FICHE DE SOINS')} — {soinsTitle}</p>
        <p className="text-xs mt-1" style={{ color: '#1e293b', fontWeight: 600 }}>{t('soins.doc_subtitle', 'Document à remettre au client après chaque séance')}</p>
      </div>

      <FormSection title={t('soins.identity_section', 'IDENTITÉ DU CLIENT')} />
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('forms.last_name', 'Nom de famille')} value={data.nom || client.nom} onChange={v => update('nom', v)} required />
        <FormField label={t('forms.first_name', 'Prénom(s)')} value={data.prenom || client.prenom} onChange={v => update('prenom', v)} required />
      </div>
      <FormField label={t('forms.dob', 'Date de naissance (JJ/MM/AAAA)')} value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />
      <FormField label={t('forms.phone', 'Téléphone')} value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" />
      <FormSection title={t('soins.prestation_section', 'INFORMATIONS PRESTATION')} />
      <FormField label={t('soins.zone_piercing_label', 'Zone percée / traitée')} value={data.zonePiercing || ''} onChange={v => update('zonePiercing', v)} required />

      <FormSection title={`${t('soins.zones_section', 'ZONES DE PIERCING')} — ${soinsTitle}`} />
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(131,208,245,0.1)' }}>
              <th className="p-2 text-left" style={{ color: '#0369a1', border: '1px solid var(--brand-border)' }}>{t('soins.zone_col', 'Zone')}</th>
              <th className="p-2 text-left" style={{ color: '#0369a1', border: '1px solid var(--brand-border)' }}>{t('soins.desc_col', 'Description & Bijou')}</th>
              <th className="p-2 text-left" style={{ color: '#0369a1', border: '1px solid var(--brand-border)' }}>{t('soins.cica_col', 'Cicatrisation')}</th>
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(soinsZones) ? soinsZones : []).map((z: any, i: number) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <td className="p-2 font-600" style={{ color: '#1b5e20', border: '1px solid var(--brand-border)', fontWeight: 600 }}>{z.zone}</td>
                <td className="p-2" style={{ color: '#1e293b', border: '1px solid var(--brand-border)' }}>{z.desc}</td>
                <td className="p-2" style={{ color: '#0369a1', border: '1px solid var(--brand-border)' }}>{z.cica}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FormSection title={t('soins.protocol_section', 'PROTOCOLE DE SOINS QUOTIDIENS')} />
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 rounded-xl" style={{ background: 'rgba(76,175,80,0.05)', border: '1px solid rgba(76,175,80,0.2)' }}>
          <p className="text-xs font-700 mb-2" style={{ color: '#4CAF50', fontWeight: 700 }}>{t('soins.todo_label', '✓ À FAIRE')}</p>
          {(Array.isArray(soinsFaire) ? soinsFaire : []).map((item: string, i: number) => (
            <p key={i} className="text-xs mb-1" style={{ color: '#1e293b' }}>• {item}</p>
          ))}
        </div>
        <div className="p-3 rounded-xl" style={{ background: 'rgba(244,67,54,0.05)', border: '1px solid rgba(244,67,54,0.2)' }}>
          <p className="text-xs font-700 mb-2" style={{ color: '#F44336', fontWeight: 700 }}>{t('soins.avoid_label', '✗ À ÉVITER')}</p>
          {(Array.isArray(soinsEviter) ? soinsEviter : []).map((item: string, i: number) => (
            <p key={i} className="text-xs mb-1" style={{ color: '#1e293b' }}>• {item}</p>
          ))}
        </div>
      </div>

      <FormSection title="INFORMATIONS COMPLÉMENTAIRES" />
      <FormField label="Notes du professionnel" value={data.notes || ''} onChange={v => update('notes', v)} multiline />

      {docType === 'soins_oreilles' && (
        <div className="mb-4">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/pasted_file_vRQdfj_image_04a9dd8b.png"
            alt="Soins post-piercing Oreilles — Chlorhexidine matin et soir 15 jours, Sérum Physiologique matin et soir derniers 15 jours, compresses non-tissées"
            style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--brand-border)' }}
          />
          <p className="text-xs mt-1 text-center italic" style={{ color: 'var(--brand-text)', opacity: 0.7, fontSize: '10px' }}>{t('soins.trademark', 'Marque déposée — usage descriptif uniquement, sans affiliation commerciale')}</p>
        </div>
      )}

      {docType === 'soins_bouche_levres' && (
        <div className="mb-4">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/soins_labret_new_3c0b91d9.jpg"
            alt="Soins Post Labret — Chlorhexidine matin et soir 15j, Eludril après chaque repas 15 premiers jours, Sérum Physiologique + compresses matin et soir derniers 15j"
            style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--brand-border)' }}
          />
          <p className="text-xs mt-1 text-center italic" style={{ color: 'var(--brand-text)', opacity: 0.7, fontSize: '10px' }}>{t('soins.trademark', 'Marque déposée — usage descriptif uniquement, sans affiliation commerciale')}</p>
        </div>
      )}

      {docType === 'soins_nombril' && (
        <div className="mb-4">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/soins_nombril_new_d5f89320.webp"
            alt="Soins Post Nombril — Chlorhexidine matin et soir 2 semaines, Sérum Physiologique matin et soir 6 semaines, compresses non-tissées"
            style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--brand-border)' }}
          />
          <p className="text-xs mt-1 text-center italic" style={{ color: 'var(--brand-text)', opacity: 0.7, fontSize: '10px' }}>{t('soins.trademark', 'Marque déposée — usage descriptif uniquement, sans affiliation commerciale')}</p>
        </div>
      )}

      {docType === 'soins_nez' && (
        <div className="mb-4">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/soins_nez_new_1ea6172d.webp"
            alt="Soins post-piercing Nez — Chlorhexidine matin et soir 15 jours, Sérum Physiologique matin et soir derniers 15 jours, compresses non-tissées"
            style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--brand-border)' }}
          />
          <p className="text-xs mt-1 text-center italic" style={{ color: 'var(--brand-text)', opacity: 0.7, fontSize: '10px' }}>{t('soins.trademark', 'Marque déposée — usage descriptif uniquement, sans affiliation commerciale')}</p>
        </div>
      )}

      {docType === 'soins_mamelons' && (
        <div className="mb-4">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/soins_oreilles_mamelons_arcade_d6fa385b.webp"
            alt="Soins post-piercing Téton — Chlorhexidine matin et soir 15 jours, Sérum Physiologique matin et soir derniers 15 jours, compresses non-tissées"
            style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--brand-border)' }}
          />
          <p className="text-xs mt-1 text-center italic" style={{ color: 'var(--brand-text)', opacity: 0.7, fontSize: '10px' }}>{t('soins.trademark', 'Marque déposée — usage descriptif uniquement, sans affiliation commerciale')}</p>
        </div>
      )}

      {docType === 'soins_arcade_sourcil' && (
        <div className="mb-4">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/soins_oreilles_mamelons_arcade_d6fa385b.webp"
            alt="Soins post-piercing Arcade/Sourcil — Chlorhexidine matin et soir 15 jours, Sérum Physiologique matin et soir derniers 15 jours, compresses non-tissées"
            style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--brand-border)' }}
          />
          <p className="text-xs mt-1 text-center italic" style={{ color: 'var(--brand-text)', opacity: 0.7, fontSize: '10px' }}>Marque déposée — usage descriptif uniquement, sans affiliation commerciale</p>
        </div>
      )}

      {docType === 'soins_surface_dermal' && (
        <div className="mb-4">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/soins_surface_dermal_new_6c6a051e.webp"
            alt="Soins post-piercing Surface/Dermal — Sérum Physiologique matin et soir 1 mois, compresses non-tissées"
            style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--brand-border)' }}
          />
          <p className="text-xs mt-1 text-center italic" style={{ color: 'var(--brand-text)', opacity: 0.7, fontSize: '10px' }}>{t('soins.trademark', 'Marque déposée — usage descriptif uniquement, sans affiliation commerciale')}</p>
        </div>
      )}

      <LegalBox color="cyan">
        <em>Conservation : 3 ans minimum à compter de la majorité du mineur (Art. L1110-4 CSP). Copie conservée par le salon — Pièces jointes : copie de la/des pièce(s) d'identité du/des représentant(s) légal/aux. VOS DROITS RGPD Dans le cadre de votre prestation, nous collectons et traitons vos données personnelles. Conformément au RGPD, vous disposez des droits suivants : Art. 15 — Droit d'accès · Art. 16 — Droit de rectification · Art. 17 — Droit à l'effacement · Art. 21 — Droit d'opposition Conservation : données de santé 3 ans — Pour exercer vos droits : {salonInfo?.email || "contact@votresalon.fr"}<br />
        Support : L'écrit électronique a la même force probante que l'écrit papier (Art. 1366 du Code civil).</em>
      </LegalBox>


      <RgpdMentions />
      <FormSection title="SIGNATURES" />
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
          <FormField label="Nom du pierceur" value={data.nomPierceurSign || salonInfo?.nomPierceur || ''} onChange={v => update('nomPierceurSign', v)} />
          <FormField label="Date" value={data.dateSignaturePierceur || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignaturePierceur', v)} />
          <div className="mt-3">
            <SignaturePad
              label="Signature du pierceur"
              value={data.signatureImagePierceur || ''}
              onChange={v => update('signatureImagePierceur', v ?? '')}
            />
          </div>
        </div>
      </div>

      {/* Déclarations post-signature */}
      <div className="mt-4 p-4 rounded-xl space-y-3" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-0.5 accent-cyan-400" />
          <span className="text-sm" style={{ color: '#1b5e20' }}>
            {t('soins.declaration_1', 'Je déclare avoir pris connaissance des risques liés à la pratique du piercing')}
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-0.5 accent-cyan-400" />
          <span className="text-sm" style={{ color: '#1b5e20' }}>
            {t('soins.declaration_2', "J'ai pu poser toutes les questions que je voulais")}
          </span>
        </label>
      </div>
    </>
  );
}

// ─── Fiche de Traçabilité Matériel Stérile ─────────────────────────────────────────────────


export { FormQuestionnaireMineur, FormQuestionnaireMajeur, FormAutorisationParentale, FormSoins, FormFicheSeance };

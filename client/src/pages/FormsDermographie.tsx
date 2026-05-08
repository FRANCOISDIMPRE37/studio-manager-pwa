import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/lib/app-context';
import { Eye, Info } from 'lucide-react';
import SignaturePad from '@/components/SignaturePad';
import { Client } from '@/lib/types';
import { FormSection, FormField, RadioField, DateSlashField, CheckboxField, LegalBox, RgpdMentions, WarningBox, AgeVerif, PrintHeader, PrintFooter } from './FormsCommuns';

function FormFicheSeanceDermographe({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
  const { state: _s } = useApp();
  const salonInfo = _s.salonInfo;
  const { t } = useTranslation();
  const yesNo = [t('forms.yes'), t('forms.no')];
  return (
    <>
      <LegalBox color="orange">
        {t('q08.legal_framework')}
      </LegalBox>

      <FormSection title={t('q08.section_client_identity')} />
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('forms.last_name')} value={data.nom || client.nom || ''} onChange={v => update('nom', v)} required />
        <FormField label={t('forms.first_name')} value={data.prenom || client.prenom || ''} onChange={v => update('prenom', v)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('forms.dob')} value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} type="date" required />
        <FormField label={t('forms.phone')} value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" required />
      </div>

      <FormSection title={t('q08.section_session_info')} />
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('q08.session_date')} value={data.dateSeance || ''} onChange={v => update('dateSeance', v)} type="date" required />
        <FormField label={t('q08.session_duration')} value={data.dureeSeance || ''} onChange={v => update('dureeSeance', v)} placeholder={t('q08.session_duration_placeholder')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('q08.start_time')} value={data.heureDebut || ''} onChange={v => update('heureDebut', v)} type="time" />
        <FormField label={t('q08.end_time')} value={data.heureFin || ''} onChange={v => update('heureFin', v)} type="time" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('q08.session_number')} value={data.numeroSeance || ''} onChange={v => update('numeroSeance', v)} placeholder={t('q08.session_number_placeholder')} />
        <FormField label={t('q08.artist_name')} value={data.dermographe || salonInfo?.nomDermographe || ''} onChange={v => update('dermographe', v)} placeholder={t('q08.artist_name_placeholder')} required />
      </div>

      <FormSection title={t('q08.section_zones')} />
      <LegalBox color="green">
        {t('q08.authorized_zones')}
      </LegalBox>
      {['sourcils', 'levres', 'eye_liner_superieur', 'eye_liner_inferieur', 'autre_zone'].map((zone) => {
        const zoneLabels: Record<string, string> = {
          sourcils: t('q08.zone_eyebrows'),
          levres: t('q08.zone_lips'),
          eye_liner_superieur: t('q08.zone_eyeliner_upper'),
          eye_liner_inferieur: t('q08.zone_eyeliner_lower'),
          autre_zone: t('q08.zone_other'),
        };
        return (
          <div key={zone} className="p-3 rounded-lg mb-2" style={{ background: 'rgba(255,152,0,0.04)', border: '1px solid rgba(255,152,0,0.15)' }}>
            <CheckboxField label={zoneLabels[zone]} value={data[`zone_${zone}`] || false} onToggle={() => update(`zone_${zone}`, !data[`zone_${zone}`])} required />
            {data[`zone_${zone}`] && (
              <>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <RadioField label={t('q08.technique')} options={zone === 'sourcils' ? ['Microblading', 'Powder Brows', 'Ombre Brows', 'Combo Brows', 'Nano Brows'] : zone === 'levres' ? [t('q08.lip_contour'), t('q08.lip_watercolor'), 'Full lips', t('q08.lip_neutralization')] : [t('q08.liner_thin'), t('q08.liner_thick'), 'Smoky', 'Cat eye']} value={data[`zone_${zone}_technique`] || ''} onChange={v => update(`zone_${zone}_technique`, v)} />
                  <FormField label={t('q08.description_form')} value={data[`zone_${zone}_description`] || ''} onChange={v => update(`zone_${zone}_description`, v)} multiline placeholder={t('q08.description_form_placeholder')} />
                </div>
                <FormField label={t('q08.color_shade')} value={data[`zone_${zone}_couleur`] || ''} onChange={v => update(`zone_${zone}_couleur`, v)} placeholder={t('q08.color_shade_placeholder')} />
                <FormField label={t('q08.prev_session_obs')} value={data[`zone_${zone}_obs`] || ''} onChange={v => update(`zone_${zone}_obs`, v)} multiline placeholder={t('q08.prev_session_obs_placeholder')} />
              </>
            )}
          </div>
        );
      })}

      <FormSection title={t('q08.section_pigment_traceability')} />
      <LegalBox color="orange">
        {t('q08.pigment_legal_obligation')}
      </LegalBox>
      {[1, 2, 3].map(i => (
        <div key={i} className="p-3 rounded-lg mb-2" style={{ background: 'rgba(255,152,0,0.04)', border: '1px solid rgba(255,152,0,0.15)' }}>
          <p className="text-xs font-600 mb-2" style={{ color: '#FF9800', fontWeight: 600 }}>{t('q08.pigment_n', { n: i })}</p>
          <div className="grid grid-cols-2 gap-2">
            <FormField label={t('q08.pigment_color')} value={data[`pigment${i}_couleur`] || ''} onChange={v => update(`pigment${i}_couleur`, v)} required placeholder={t('q08.pigment_color_placeholder')} />
            <FormField label={t('q08.pigment_manufacturer')} value={data[`pigment${i}_fabricant`] || ''} onChange={v => update(`pigment${i}_fabricant`, v)} required placeholder={t('q08.pigment_manufacturer_placeholder')} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormField label={t('q08.pigment_ref')} value={data[`pigment${i}_ref`] || ''} onChange={v => update(`pigment${i}_ref`, v)} required placeholder={t('q08.pigment_ref_placeholder')} />
            <FormField label={t('q08.pigment_lot')} value={data[`pigment${i}_lot`] || ''} onChange={v => update(`pigment${i}_lot`, v)} required placeholder={t('q08.pigment_lot_placeholder')} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormField label={t('forms.expiry_date')} value={data[`pigment${i}_peremption`] || ''} onChange={v => update(`pigment${i}_peremption`, v)} type="date" />
            <FormField label={t('q08.pigment_quantity')} value={data[`pigment${i}_quantite`] || ''} onChange={v => update(`pigment${i}_quantite`, v)} placeholder="ml" />
          </div>
          <RadioField label={t('q08.pigment_compliant')} options={yesNo} value={data[`pigment${i}_conforme`] || t('forms.yes')} onChange={v => update(`pigment${i}_conforme`, v)} />
        </div>
      ))}

      <FormSection title={t('q08.section_machine')} />
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('q08.machine_used')} value={data.machine || ''} onChange={v => update('machine', v)} placeholder={t('q08.machine_used_placeholder')} />
        <FormField label={t('q08.machine_speed')} value={data.vitesseMachine || ''} onChange={v => update('vitesseMachine', v)} placeholder={t('q08.machine_speed_placeholder')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('q08.needle_type')} value={data.typeAiguille || ''} onChange={v => update('typeAiguille', v)} placeholder={t('q08.needle_type_placeholder')} />
        <FormField label={t('q08.needle_lot')} value={data.lotAiguille || ''} onChange={v => update('lotAiguille', v)} placeholder={t('q08.needle_lot_placeholder')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('q08.needle_expiry')} value={data.peremptionAiguille || ''} onChange={v => update('peremptionAiguille', v)} type="date" required />
        <FormField label={t('q08.needle_manufacturer')} value={data.fabricantAiguille || ''} onChange={v => update('fabricantAiguille', v)} required placeholder={t('q08.needle_manufacturer_placeholder')} />
      </div>
      <FormField label={t('q08.anesthetic')} value={data.anesthesiant || ''} onChange={v => update('anesthesiant', v)} placeholder={t('q08.anesthetic_placeholder')} />
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('q08.anesthetic_lot')} value={data.lotAnesthesiant || ''} onChange={v => update('lotAnesthesiant', v)} />
        <FormField label={t('q08.anesthetic_expiry')} value={data.peremptionAnesthesiant || ''} onChange={v => update('peremptionAnesthesiant', v)} type="date" />
      </div>

      <FormSection title={t('q08.section_session_progress')} />
      <RadioField label={t('q08.zone_preparation')} options={t('q08.zone_preparation_options', { returnObjects: true }) as string[]} value={data.preparationZone || t('q08.zone_preparation_default')} onChange={v => update('preparationZone', v)} />
      <RadioField label={t('q08.color_test')} options={yesNo} value={data.testCouleur || t('forms.no')} onChange={v => update('testCouleur', v)} />
      <RadioField label={t('q08.template_used')} options={yesNo} value={data.gabarit || t('forms.yes')} onChange={v => update('gabarit', v)} />
      <RadioField label={t('q08.client_approved_design')} options={yesNo} value={data.accordDessin || t('forms.yes')} onChange={v => update('accordDessin', v)} />
      <RadioField label={t('q08.incident')} options={t('q08.incident_options', { returnObjects: true }) as string[]} value={data.incident || t('q08.incident_none')} onChange={v => update('incident', v)} />
      {data.incident && data.incident !== t('q08.incident_none') && (
        <FormField label={t('q08.incident_details')} value={data.incidentDetail || ''} onChange={v => update('incidentDetail', v)} multiline />
      )}
      <FormField label={t('q08.general_observations')} value={data.observations || ''} onChange={v => update('observations', v)} multiline placeholder={t('q08.general_observations_placeholder')} />

      <FormSection title={t('q08.section_followup')} />
      <RadioField label={t('q08.touchup_planned')} options={yesNo} value={data.retouchePrevue || t('forms.yes')} onChange={v => update('retouchePrevue', v)} />
      {data.retouchePrevue === t('forms.yes') && (
        <FormField label={t('q08.touchup_date')} value={data.dateRetouche || ''} onChange={v => update('dateRetouche', v)} type="date" />
      )}
      <FormField label={t('q08.post_session_advice')} value={data.conseilsPostSeance || ''} onChange={v => update('conseilsPostSeance', v)} multiline placeholder={t('q08.post_session_advice_placeholder')} />
      <CheckboxField label={t('q08.care_sheet_given')} value={data.ficheSoinsRemise || false} onToggle={() => update('ficheSoinsRemise', !data.ficheSoinsRemise)} required />


      {/* Photos matériel stérile */}
      <FormSection title="📷 PHOTOS MATÉRIEL STÉRILE (ARS obligatoire)" />
      <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(0,180,216,0.05)', border: '1px solid rgba(0,180,216,0.3)' }}>
        <p className="text-xs mb-3" style={{ color: '#0369a1', fontWeight: 600 }}>
          Photographiez les emballages des produits utilisés (lot, péremption, fabricant) — Arrêté ARS 3 déc. 2008 + Règlement UE 2020/2081
        </p>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#00B4D8', color: 'white', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          📷 Photographier le matériel
          <input type="file" accept="image/*" capture="environment" multiple onChange={e => {
            const files = e.target.files;
            if (!files) return;
            const photos = [...(data.photosTracabilite || [])];
            Array.from(files).forEach(file => {
              const reader = new FileReader();
              reader.onload = (ev) => {
                photos.push({ id: Date.now() + Math.random(), url: ev.target?.result, nom: file.name, date: new Date().toLocaleDateString('fr-FR') });
                update('photosTracabilite', [...photos]);
              };
              reader.readAsDataURL(file);
            });
          }} style={{ display: 'none' }} />
        </label>
        <span style={{ marginLeft: 12, fontSize: 12, color: '#6b7280' }}>{(data.photosTracabilite || []).length} photo(s)</span>
        {(data.photosTracabilite || []).length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginTop: 12 }}>
            {(data.photosTracabilite || []).map((p: any, i: number) => (
              <div key={p.id || i} style={{ position: 'relative', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                <img src={p.url} alt={p.nom} style={{ width: '100%', height: 100, objectFit: 'cover' }} />
                <button onClick={() => { const ph = (data.photosTracabilite || []).filter((_: any, idx: number) => idx !== i); update('photosTracabilite', ph); }}
                  style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', border: 'none', borderRadius: '50%', width: 20, height: 20, color: 'white', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                <p style={{ fontSize: 10, color: '#6b7280', padding: '2px 4px', textAlign: 'center' }}>{p.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <RgpdMentions />
      <FormSection title={t('q08.section_signatures')} />
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
          <FormField label="Nom du représentant légal" value={data.nomRepresentantSign || data.nomRep || ''} onChange={v => update('nomRepresentantSign', v)} />
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
          <FormField label={t('q08.dermographer_name')} value={data.nomDermographeSign || salonInfo?.nomDermographe || ''} onChange={v => update('nomDermographeSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureDermographe || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureDermographe', v)} />
          <div className="mt-3">
            <SignaturePad
              label={t('q08.dermographer_signature')}
              value={data.signatureImageDermographe || ''}
              onChange={v => update('signatureImageDermographe', v ?? '')}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Formulaire Questionnaire Médical Dermographe ───────────────────────────────────────────

function FormQuestionnaireDermographe({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
  const { state: _s } = useApp();
  const salonInfo = _s.salonInfo;
  const { t } = useTranslation();
  const yesNo = [t('forms.no'), t('forms.yes')];
  return (
    <>
      <LegalBox color="orange">
        {t('q09.legal_framework')}
      </LegalBox>
      <LegalBox color="cyan">
        <em>{t('legal.rgpd_dermography')}</em>
      </LegalBox>

      <FormField label={t('forms.salon_name')} value={data.nomSalon || ''} onChange={v => update('nomSalon', v)} />
      <FormField label={t('q09.service_date')} value={data.datePrestation || ''} onChange={v => update('datePrestation', v)} />

      <FormSection title={t('q09.section_client_identity')} />
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('forms.last_name')} value={data.nom || client.nom} onChange={v => update('nom', v)} required />
        <FormField label={t('forms.first_name')} value={data.prenom || client.prenom} onChange={v => update('prenom', v)} required />
      </div>
      <FormField label={t('forms.dob')} value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} required />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />
      <FormField label={t('forms.phone')} value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" required />
      <RadioField label="Pièce d'identité" options={['CNI','Passeport','Titre de séjour','Non présentée']} value={data.pieceIdentiteType || ''} onChange={v => update('pieceIdentiteType', v)} required />
      {data.pieceIdentiteType && data.pieceIdentiteType !== 'Non présentée' && (
        <FormField label="Numéro de pièce d'identité" value={data.pieceIdentiteNumero || ''} onChange={v => update('pieceIdentiteNumero', v)} required />
      )}

      <FormSection title={t('q09.section_service')} />
      <RadioField
        label={t('q09.zones_treated')}
        options={t('q09.zones_options', { returnObjects: true }) as string[]}
        value={data.zoneDermographie || ''}
        onChange={v => update('zoneDermographie', v)}
      />
      {data.zoneDermographie === t('forms.other') && (
        <FormField label={t('forms.specify_zone')} value={data.zoneAutre || ''} onChange={v => update('zoneAutre', v)} />
      )}
      <RadioField
        label={t('q09.technique_type')}
        options={t('q09.technique_options', { returnObjects: true }) as string[]}
        value={data.techniqueDermographie || ''}
        onChange={v => update('techniqueDermographie', v)}
      />
      {data.techniqueDermographie === t('forms.other') && (
        <FormField label={t('forms.specify_technique')} value={data.techniqueAutre || ''} onChange={v => update('techniqueAutre', v)} />
      )}
      <RadioField label={t('q09.session_type')} options={t('q09.session_type_options', { returnObjects: true }) as string[]} value={data.typeSeance || t('q09.session_type_first')} onChange={v => update('typeSeance', v)} />
      <FormField label={t('q09.project_description')} value={data.descriptionProjet || ''} onChange={v => update('descriptionProjet', v)} multiline />

      <FormSection title={t('q09.section_history')} />
      <RadioField label={t('q09.previous_pmu')} options={yesNo} value={data.maquillagePrecedent || t('forms.no')} onChange={v => update('maquillagePrecedent', v)} />
      {data.maquillagePrecedent === t('forms.yes') && (
        <>
          <FormField label={t('q09.previous_salon')} value={data.salonPrecedent || ''} onChange={v => update('salonPrecedent', v)} />
          <FormField label={t('q09.previous_session_date')} value={data.dateDerniereMaquillagePrecedente || ''} onChange={v => update('dateDerniereMaquillagePrecedente', v)} />
          <RadioField label={t('q09.laser_removal')} options={[t('forms.no'), t('forms.yes'), t('q09.partially')]} value={data.retraitLaser || t('forms.no')} onChange={v => update('retraitLaser', v)} />
        </>
      )}
      <RadioField label={t('q09.laser_other')} options={yesNo} value={data.laserAutre || t('forms.no')} onChange={v => update('laserAutre', v)} />

      <FormSection title={t('q09.section_health')} />
      <WarningBox>{t('q09.warning_health')}</WarningBox>
      <RadioField label={t('q01.pregnancy')} options={yesNo} value={data.grossesse || t('forms.no')} onChange={v => update('grossesse', v)} />
      <RadioField label={t('q01.diabetes')} options={yesNo} value={data.diabete || t('forms.no')} onChange={v => update('diabete', v)} />
      <RadioField label={t('q01.coagulation')} options={yesNo} value={data.troublesCoagulation || t('forms.no')} onChange={v => update('troublesCoagulation', v)} />
      <RadioField label={t('q09.autoimmune_dermo')} options={yesNo} value={data.maladiesAutoImmunes || t('forms.no')} onChange={v => update('maladiesAutoImmunes', v)} />
      <RadioField label={t('q09.skin_diseases_zone')} options={yesNo} value={data.maladiesPeau || t('forms.no')} onChange={v => update('maladiesPeau', v)} />
      {data.maladiesPeau === t('forms.yes') && (
        <FormField label={t('forms.specify_pathology')} value={data.maladiesPeauDetail || ''} onChange={v => update('maladiesPeauDetail', v)} />
      )}
      <RadioField label={t('q01.keloid')} options={yesNo} value={data.cheloide || t('forms.no')} onChange={v => update('cheloide', v)} />
      <RadioField label={t('q09.herpes_labial')} options={[t('forms.no'), t('forms.yes'), t('q09.not_applicable')]} value={data.herpesLabial || t('q09.not_applicable')} onChange={v => update('herpesLabial', v)} />
      {data.herpesLabial === t('forms.yes') && (
        <WarningBox>{t('q09.herpes_warning')}</WarningBox>
      )}
      <RadioField label={t('q09.allergy_pigments')} options={yesNo} value={data.allergiesPigments || t('forms.no')} onChange={v => update('allergiesPigments', v)} />
      {data.allergiesPigments === t('forms.yes') && (
        <FormField label={t('forms.specify_allergy')} value={data.allergiesPigmentsDetail || ''} onChange={v => update('allergiesPigmentsDetail', v)} />
      )}
      <RadioField label={t('q01.allergy_latex')} options={yesNo} value={data.allergieLatex || t('forms.no')} onChange={v => update('allergieLatex', v)} />
      <RadioField label={t('q01.immunodepression')} options={yesNo} value={data.immunodepression || t('forms.no')} onChange={v => update('immunodepression', v)} />
      <RadioField label={t('q09.anticoagulant')} options={yesNo} value={data.anticoagulant || t('forms.no')} onChange={v => update('anticoagulant', v)} />
      {data.anticoagulant === t('forms.yes') && (
        <FormField label={t('forms.medication_name')} value={data.anticoagulantDetail || ''} onChange={v => update('anticoagulantDetail', v)} />
      )}
      <RadioField label={t('q09.isotretinoin')} options={yesNo} value={data.isotretinoine || t('forms.no')} onChange={v => update('isotretinoine', v)} />
      <RadioField label={t('q09.other_medication')} options={yesNo} value={data.autreMedicament || t('forms.no')} onChange={v => update('autreMedicament', v)} />
      {data.autreMedicament === t('forms.yes') && (
        <FormField label={t('forms.specify_medication')} value={data.autreMedicamentDetail || ''} onChange={v => update('autreMedicamentDetail', v)} multiline />
      )}
      <FormField label={t('forms.additional_medical_info')} value={data.autresInfosMedicales || ''} onChange={v => update('autresInfosMedicales', v)} multiline />

      <FormSection title={t('q09.section_pigment_traceability')} />
      <WarningBox>{t('q09.pigment_warning')}</WarningBox>
      <FormField label={t('q09.pigment_brand')} value={data.marquePigment || ''} onChange={v => update('marquePigment', v)} />
      <FormField label={t('q09.pigment_ref_color')} value={data.referencePigment || ''} onChange={v => update('referencePigment', v)} />
      <FormField label={t('q08.pigment_lot')} value={data.lotPigment || ''} onChange={v => update('lotPigment', v)} />
      <FormField label={t('q09.pigment_expiry')} value={data.perempPigment || ''} onChange={v => update('perempPigment', v)} />
      <RadioField label={t('q05.ink_cert')} options={[t('forms.yes'), t('forms.no')]} value={data.certifPigment || t('forms.yes')} onChange={v => update('certifPigment', v)} />
      <FormField label={t('q09.anesthetic_used')} value={data.anesthesiant || ''} onChange={v => update('anesthesiant', v)} />

      <FormSection title={t('q09.section_consent')} />
      <CheckboxField label={t('q09.consent_risks')} value={data.informeRisques || false} onToggle={() => update('informeRisques', !data.informeRisques)} required />
      <CheckboxField label={t('q09.consent_healing')} value={data.informeCicatrisation || false} onToggle={() => update('informeCicatrisation', !data.informeCicatrisation)} required />
      <CheckboxField label={t('q09.consent_fading')} value={data.informeEclaircissement || false} onToggle={() => update('informeEclaircissement', !data.informeEclaircissement)} required />
      <CheckboxField label={t('q09.consent_contraindications')} value={data.certifieContraIndications || false} onToggle={() => update('certifieContraIndications', !data.certifieContraIndications)} required />
      <CheckboxField label={t('q09.consent_aftercare')} value={data.engageSoinsPost || false} onToggle={() => update('engageSoinsPost', !data.engageSoinsPost)} required />
      <CheckboxField label={t('q09.consent_free')} value={data.consentementLibre || false} onToggle={() => update('consentementLibre', !data.consentementLibre)} required />
      <CheckboxField label="Je consens expressement au traitement de mes donnees de sante par le salon (Art. 9 RGPD)" value={data.consentDonneesSante || false} onToggle={() => update('consentDonneesSante', !data.consentDonneesSante)} required />
      <CheckboxField label={t('q09.consent_accurate')} value={data.certifieInfosExactes || false} onToggle={() => update('certifieInfosExactes', !data.certifieInfosExactes)} required />

      <RgpdMentions />
      <FormSection title={t('q09.section_signatures')} />
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
          <FormField label={t('q08.dermographer_name')} value={data.nomDermographeSign || salonInfo?.nomDermographe || ''} onChange={v => update('nomDermographeSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureDermographe || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureDermographe', v)} />
          <div className="mt-3">
            <SignaturePad
              label={t('q08.dermographer_signature')}
              value={data.signatureImageDermographe || ''}
              onChange={v => update('signatureImageDermographe', v ?? '')}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Formulaire Soins Post-Dermographie (Maquillage Permanent) ──────────────────────

const CICATRISATION_DERMOGRAPHE = [
  {
    phase: 'Phase 1 — Inflammation & Croutes',
    jours: 'J1 — J7',
    couleur: '#E91E63',
    etapes: [
      { jour: 'J1', titre: 'Immédiatement après la séance', instructions: "La zone est rouge, légèrement gonflée et peut suinter un liquide lymphatique clair. C'est une réaction normale. Ne pas toucher, ne pas frotter. Appliquer délicatement la crème cicatrisante fournie par le praticien (Bepanthen, Cicalfate ou équivalent) en couche ultra-fine. Pour les lèvres : appliquer toutes les 2 heures. Pour les sourcils et eye-liner : 2 à 3 fois dans la journée." },
      { jour: 'J2 — J3', titre: 'Assombrissement de la couleur', instructions: "La couleur apparaît plus foncée et plus intense qu'en fin de séance : c'est normal et temporaire. De fines croûtes commencent à se former. Continuer les applications de crème cicatrisante 2 à 3 fois par jour. Ne pas mouiller la zone (pas de douche directe sur la zone, pas de piscine, pas de mer). Pour les lèvres : éviter de manger des aliments acides, épicés ou très chauds." },
      { jour: 'J4 — J5', titre: 'Formation des croûtes', instructions: "Les croûtes sont bien formées. Elles peuvent tirer et démanger : tapoter doucement, ne jamais gratter. Ne jamais arracher les croûtes — risque de dépigmentation irréversible et de cicatrice. Continuer la crème cicatrisante. Pour les sourcils : ne pas se mouiller le visage sous la douche. Pour les lèvres : ne pas embrasser, ne pas utiliser de rouge à lèvres." },
      { jour: 'J6 — J7', titre: 'Chute des croûtes', instructions: "Les croûtes tombent naturellement. La couleur semble avoir presque disparu ou être très pâle : c'est normal, la pigmentation est encore sous la peau. Continuer à hydrater avec la crème cicatrisante. Protéger la zone du soleil avec SPF 50+." },
    ],
  },
  {
    phase: 'Phase 2 — Régénération',
    jours: 'J8 — J21',
    couleur: '#FF9800',
    etapes: [
      { jour: 'J8 — J14', titre: 'Réapparition de la couleur', instructions: "La couleur commence à réapparaître progressivement sous la nouvelle couche de peau. Elle peut sembler inégale ou par taches : c'est normal. La peau peut encore être légèrement sensible. Hydrater 1 à 2 fois par jour avec une crème neutre non parfumée. Appliquer SPF 50+ à chaque exposition solaire. Pour les lèvres : éviter les baisers et le rouge à lèvres encore 7 jours." },
      { jour: 'J15 — J21', titre: 'Stabilisation de la pigmentation', instructions: "La couleur se stabilise et devient plus uniforme. Les légères irrégularités visibles à ce stade seront corrigées lors de la retouche. Continuer l'hydratation quotidienne. Protection solaire SPF 50+ obligatoire. Vous pouvez reprendre le maquillage classique sur la zone après J14 si la peau est complètement cicatrisée." },
    ],
  },
  {
    phase: 'Phase 3 — Cicatrisation profonde & Retouche',
    jours: 'J22 — J42',
    couleur: '#4CAF50',
    etapes: [
      { jour: 'J22 — J30', titre: 'Cicatrisation complète en surface', instructions: "La peau est cicatrisée en surface. La couleur définitive est presque visible. Hydrater quotidiennement. Protection solaire SPF 50+ à chaque exposition pendant encore 3 mois. Vous pouvez reprendre normalement vos activités (piscine, sport, maquillage)." },
      { jour: 'J35 — J42', titre: 'Retouche recommandée', instructions: "La retouche est recommandée entre 4 et 6 semaines après la première séance. Elle permet de corriger les irrégularités, d'intensifier la couleur et d'assurer un résultat optimal. Sans retouche, le résultat peut être inégal. Contactez le salon pour planifier votre rendez-vous de retouche." },
    ],
  },
];

function FormSoinsDermographe({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
  const { state: _s } = useApp();
  const salonInfo = _s.salonInfo;
  return (
    <>
      {/* Cadre légal */}
      <LegalBox color="orange">
        <strong>■ Cadre légal — Arrêté du 3 décembre 2008 (ARS) + Règlement UE 2020/2081</strong><br />
        ■ La dermographie (maquillage permanent) est soumise à la réglementation sanitaire française.<br />
        ■ Les pigments utilisés sont conformes au Règlement UE 2020/2081 (en vigueur depuis le 4 janvier 2022).<br />
        ■ Conservation du dossier : <strong>5 ans</strong> minimum à compter de la dernière prestation.
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
      {/* Prestation réalisée */}
      <FormSection title="2 — PRESTATION RÉALISÉE" />
      <RadioField
        label="Zone traitée"
        options={['Sourcils', 'Lèvres', 'Eye-liner supérieur', 'Eye-liner inférieur', 'Eye-liner complet', 'Grain de beauté', 'Autre']}
        value={data.zoneDermographe || ''}
        onChange={v => update('zoneDermographe', v)}
      />
      {data.zoneDermographe === 'Autre' && (
        <FormField label="Préciser la zone" value={data.zoneAutre || ''} onChange={v => update('zoneAutre', v)} />
      )}
      <RadioField
        label="Technique utilisée"
        options={['Microblading', 'Powder Brows / Ombré', 'Combo Brows', 'Nano Brows', 'Aquarelle lèvres', 'Contour lèvres', 'Liner classique', 'Liner smoky', 'Autre']}
        value={data.techniqueDermographe || ''}
        onChange={v => update('techniqueDermographe', v)}
      />
      <RadioField label="Type de séance" options={['Première séance', 'Retouche (< 6 semaines)', 'Retouche annuelle', 'Correction']} value={data.typeSeance || 'Première séance'} onChange={v => update('typeSeance', v)} />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Marque du pigment" value={data.marquePigment || ''} onChange={v => update('marquePigment', v)} />
        <FormField label="Référence / couleur" value={data.refPigment || ''} onChange={v => update('refPigment', v)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="N° de lot pigment" value={data.lotPigment || ''} onChange={v => update('lotPigment', v)} />
        <FormField label="Date de péremption" value={data.perempPigment || ''} onChange={v => update('perempPigment', v)} />
      </div>
      <FormField label="Anesthésiant topique utilisé" value={data.anesthesiant || ''} onChange={v => update('anesthesiant', v)} />

      {/* Protocole de soins J1-J42 */}
      <FormSection title="3 — PROTOCOLE DE SOINS POST-DERMOGRAPHIE — J1 À J42" />
      <LegalBox color="cyan">
        <strong>Ce protocole est remis au client à l'issue de chaque séance.</strong> Il constitue la fiche de soins officielle conforme à l'Arrêté du 3 décembre 2008. Le respect strict de ces consignes conditionne la qualité du résultat et la tenue de la pigmentation dans le temps.
      </LegalBox>

      {CICATRISATION_DERMOGRAPHE.map((phase, pi) => (
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

      {/* Consignes spécifiques par zone */}
      <FormSection title="4 — CONSIGNES SPÉCIFIQUES PAR ZONE" />

      <div className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(233,30,99,0.05)', border: '1px solid rgba(233,30,99,0.2)' }}>
        <p className="text-xs font-700 mb-2" style={{ color: '#E91E63', fontWeight: 700 }}>SOURCILS (Microblading / Powder / Combo / Nano)</p>
        {[
          'Ne pas mouiller les sourcils pendant 7 jours (douche : protéger avec un film plastique)',
          'Ne pas appliquer de fond de teint, BB crème ou maquillage sur la zone pendant 14 jours',
          'Ne pas faire de sport intensif (transpiration) pendant 7 jours',
          'Ne pas aller au sauna, hammam, jacuzzi pendant 4 semaines',
          "Ne pas s'exposer au soleil sans SPF 50+ pendant 3 mois",
          "Ne pas faire d'IPL, laser ou peeling sur la zone pendant 3 mois",
          'Ne pas se teindre les sourcils pendant 4 semaines',
          'Appliquer la crème cicatrisante 2 à 3 fois par jour en couche ultra-fine (pas épaisse)',
        ].map((item, i) => (
          <p key={i} className="text-xs mb-1" style={{ color: '#1e293b' }}>• {item}</p>
        ))}
      </div>

      <div className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(156,39,176,0.05)', border: '1px solid rgba(156,39,176,0.2)' }}>
        <p className="text-xs font-700 mb-2" style={{ color: '#9C27B0', fontWeight: 700 }}>LÈVRES (Aquarelle / Contour)</p>
        {[
          'Appliquer la crème cicatrisante toutes les 2 heures les 3 premiers jours',
          'Ne pas embrasser pendant 7 jours minimum',
          'Ne pas utiliser de rouge à lèvres, gloss ou lip balm parfumé pendant 14 jours',
          'Manger des aliments mous, tides ou froids (pas chauds, pas acides, pas épicés) pendant 5 jours',
          'Ne pas boire à la paille pendant 5 jours',
          "En cas d'herpes labial : prendre le traitement antiviral prescrit par votre médecin DES LE SOIR de la séance",
          'Ne pas faire de soins dentaires invasifs pendant 2 semaines',
          'Protéger les lèvres du soleil avec un stick lèvres SPF 50+ pendant 3 mois',
        ].map((item, i) => (
          <p key={i} className="text-xs mb-1" style={{ color: '#1e293b' }}>• {item}</p>
        ))}
      </div>

      <div className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(33,150,243,0.05)', border: '1px solid rgba(33,150,243,0.2)' }}>
        <p className="text-xs font-700 mb-2" style={{ color: '#2196F3', fontWeight: 700 }}>EYE-LINER</p>
        {[
          'Ne pas porter de lentilles de contact pendant 5 jours',
          'Ne pas appliquer de mascara, eye-liner ou fard à paupières pendant 14 jours',
          'Ne pas se frotter les yeux',
          'Ne pas utiliser de démaquillant huileux sur la zone pendant 14 jours',
          'En cas de rougeur oculaire persistante : consulter un ophtalmologue',
          'Appliquer la crème cicatrisante 2 à 3 fois par jour en couche ultra-fine',
          'Ne pas faire de traitement laser ou IPL autour des yeux pendant 3 mois',
        ].map((item, i) => (
          <p key={i} className="text-xs mb-1" style={{ color: '#1e293b' }}>• {item}</p>
        ))}
      </div>

      {/* Règles absolues communes */}
      <FormSection title="5 — RÈGLES ABSOLUES — TOUTES ZONES" />
      <div className="grid grid-cols-1 gap-3 mb-4">
        <div className="p-3 rounded-xl" style={{ background: 'rgba(244,67,54,0.05)', border: '1px solid rgba(244,67,54,0.2)' }}>
          <p className="text-xs font-700 mb-2" style={{ color: '#F44336', fontWeight: 700 }}>INTERDICTIONS ABSOLUES</p>
          {[
            "Ne jamais gratter, frotter ou arracher les croûtes — risque de dépigmentation irréversible",
            "Ne jamais appliquer de crème parfumée, alcool, eau oxygénée ou bétadine sur la zone",
            "Ne pas s'exposer au soleil sans SPF 50+ pendant toute la cicatrisation",
            "Ne pas aller au sauna, hammam ou jacuzzi pendant 4 semaines",
            "Ne pas faire de peeling chimique ou mécanique sur la zone pendant 3 mois",
            "Ne pas faire de traitement laser ou IPL sur la zone pendant 3 mois",
            "Ne pas nager en piscine chlorée ou en mer pendant 14 jours",
          ].map((item, i) => (
            <p key={i} className="text-xs mb-1" style={{ color: '#1e293b' }}>✗ {item}</p>
          ))}
        </div>
        <div className="p-3 rounded-xl" style={{ background: 'rgba(76,175,80,0.05)', border: '1px solid rgba(76,175,80,0.2)' }}>
          <p className="text-xs font-700 mb-2" style={{ color: '#4CAF50', fontWeight: 700 }}>BONNES PRATIQUES</p>
          {[
            "Appliquer la crème cicatrisante en couche ultra-fine (pas épaisse) selon la zone",
            "Laver les mains avant tout contact avec la zone traitée",
            "Hydrater quotidiennement après cicatrisation avec une crème neutre non parfumée",
            "Appliquer SPF 50+ à chaque exposition solaire pendant 3 mois minimum",
            "Planifier la retouche entre 4 et 6 semaines après la première séance",
            "Contacter le salon en cas de doute sur la cicatrisation",
          ].map((item, i) => (
            <p key={i} className="text-xs mb-1" style={{ color: '#1e293b', fontWeight: 600 }}>✓ {item}</p>
          ))}
        </div>
      </div>

      {/* Signes d'alerte */}
      <FormSection title="6 — SIGNES D'ALERTE — CONSULTER UN MÉDECIN" />
      <WarningBox>
        Consultez immédiatement un médecin si vous observez : fièvre &gt; 38°C · rougeur qui s'étend au-delà de la zone traitée · pus ou écoulement malodorant · douleur intense et croissante après J3 · gonflement important après J3 · éruption cutanée généralisée · difficultés respiratoires (choc allergique) · pour les lèvres : apparition de vésicules (herpas) dès J1.
      </WarningBox>
      <WarningBox>
        <strong>Herpas labial :</strong> si vous avez des antécédents d'herpas labial, prenez immédiatement votre traitement antiviral (Aciclovir, Valaciclovir) prescrit par votre médecin dès le soir de la séance, sans attendre l'apparition des symptômes.
      </WarningBox>
      <FormField label="Contact d'urgence du praticien" value={data.contactUrgence || ''} onChange={v => update('contactUrgence', v)} type="tel" />

      {/* Retouche */}
      <FormSection title="7 — RETOUCHE & SUIVI" />
      <LegalBox color="green">
        La retouche est <strong>incluse dans la prestation</strong> et doit être réalisée entre <strong>4 et 6 semaines</strong> après la première séance. Passé ce délai, la retouche peut être facturée. La retouche annuelle est recommandée pour maintenir la qualité du résultat.
      </LegalBox>
      <RadioField label="RDV de retouche planifié" options={['Oui — dans 4 à 6 semaines', 'Non']} value={data.rdvRetouche || 'Oui — dans 4 à 6 semaines'} onChange={v => update('rdvRetouche', v)} />
      <FormField label="Date du RDV de retouche (si planifié)" value={data.dateRdvRetouche || ''} onChange={v => update('dateRdvRetouche', v)} />
      <FormField label="Observations post-séance" value={data.observationsPostseance || ''} onChange={v => update('observationsPostseance', v)} multiline />

      {/* Documents remis */}
      <FormSection title="8 — DOCUMENTS REMIS AU CLIENT" />
      <CheckboxField label="Fiche de soins post-dermographie signée (ce document)" value={data.docSoins || false} onToggle={() => update('docSoins', !data.docSoins)} required />
      <CheckboxField label="Protocole de cicatrisation J1-J42 remis" value={data.docProtocole || false} onToggle={() => update('docProtocole', !data.docProtocole)} required />
      <CheckboxField label="Informations sur les pigments (conformité UE 2020/2081)" value={data.docPigments || false} onToggle={() => update('docPigments', !data.docPigments)} required />
      <CheckboxField label="Coordonnées du praticien remises" value={data.docCoordonnees || false} onToggle={() => update('docCoordonnees', !data.docCoordonnees)} required />

      <LegalBox color="cyan">
        <em>Conservation : 5 ans minimum à compter de la dernière prestation (Art. R 1311-7 CSP + Arrêté 13/03/2009). Copie conservée par le salon. VOS DROITS RGPD — Pour exercer vos droits : {salonInfo?.email || "contact@votresalon.fr"}<br />
        Support : L'écrit électronique a la même force probante que l'écrit papier (Art. 1366 du Code civil).</em>
      </LegalBox>

      <RgpdMentions />
      {/* Photos matériel stérile */}
      <FormSection title="📷 PHOTOS MATÉRIEL STÉRILE (ARS obligatoire)" />
      <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(0,180,216,0.05)', border: '1px solid rgba(0,180,216,0.3)' }}>
        <p className="text-xs mb-3" style={{ color: '#0369a1', fontWeight: 600 }}>
          Photographiez les emballages des produits utilisés (lot, péremption, fabricant) — Arrêté ARS 3 déc. 2008 + Règlement UE 2020/2081
        </p>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#00B4D8', color: 'white', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          📷 Photographier le matériel
          <input type="file" accept="image/*" capture="environment" multiple onChange={e => {
            const files = e.target.files;
            if (!files) return;
            const photos = [...(data.photosTracabilite || [])];
            Array.from(files).forEach(file => {
              const reader = new FileReader();
              reader.onload = (ev) => {
                photos.push({ id: Date.now() + Math.random(), url: ev.target?.result, nom: file.name, date: new Date().toLocaleDateString('fr-FR') });
                update('photosTracabilite', [...photos]);
              };
              reader.readAsDataURL(file);
            });
          }} style={{ display: 'none' }} />
        </label>
        <span style={{ marginLeft: 12, fontSize: 12, color: '#6b7280' }}>{(data.photosTracabilite || []).length} photo(s)</span>
        {(data.photosTracabilite || []).length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginTop: 12 }}>
            {(data.photosTracabilite || []).map((p: any, i: number) => (
              <div key={p.id || i} style={{ position: 'relative', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                <img src={p.url} alt={p.nom} style={{ width: '100%', height: 100, objectFit: 'cover' }} />
                <button onClick={() => { const ph = (data.photosTracabilite || []).filter((_: any, idx: number) => idx !== i); update('photosTracabilite', ph); }}
                  style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', border: 'none', borderRadius: '50%', width: 20, height: 20, color: 'white', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                <p style={{ fontSize: 10, color: '#6b7280', padding: '2px 4px', textAlign: 'center' }}>{p.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <FormSection title="9 — SIGNATURES" />
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
          <FormField label="Nom du représentant légal" value={data.nomRepresentantSign || data.nomRep || ''} onChange={v => update('nomRepresentantSign', v)} />
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
          <FormField label="Nom du dermographe" value={data.nomDermographeSign || salonInfo?.nomDermographe || ''} onChange={v => update('nomDermographeSign', v)} />
          <FormField label="Date" value={data.dateSignatureDermographe || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureDermographe', v)} />
          <div className="mt-3">
            <SignaturePad
              label="Signature du dermographe"
              value={data.signatureImageDermographe || ''}
              onChange={v => update('signatureImageDermographe', v ?? '')}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Formulaire Engagement de Confidentialité (RGPD Art. 29) ──────────────────────


export { FormFicheSeanceDermographe, FormQuestionnaireDermographe, FormSoinsDermographe };

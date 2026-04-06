/*
 * DESIGN: Studio Nocturne — Formulaires de documents RGPD complets
 * Palette: bleu marine #0A1628, cyan #83D0F5, rose #C0396A
 * Typographie: Outfit
 */
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'wouter';
import { useApp } from '@/lib/app-context';
import { DocumentType, DOCUMENT_LABELS, Client } from '@/lib/types';
import { ArrowLeft, Save, CheckCircle, AlertTriangle, Info, Phone, Printer, Mail, Send, X, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import SignaturePad from '@/components/SignaturePad';
import { trpc } from '@/lib/trpc';

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
  label, value, onChange, placeholder, multiline, type, required, inputRef, onNext
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; type?: string; required?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  onNext?: () => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === 'Tab') && onNext) {
      e.preventDefault();
      onNext();
    }
  };
  return (
    <div className="mb-3">
      <label className="block text-xs mb-1" style={{ color: '#374151', fontWeight: 500 }}>
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
            color: '#111827',
            fontFamily: 'Outfit',
          }}
        />
      ) : (
        <input
          ref={inputRef}
          type={type || 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onNext ? handleKeyDown : undefined}
          placeholder={placeholder}
          enterKeyHint={onNext ? 'next' : 'done'}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--brand-border)',
            color: '#111827',
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
      <label className="block text-xs mb-2" style={{ color: '#374151', fontWeight: 500 }}>{label}</label>
      <div className="flex flex-wrap gap-2">
        {(Array.isArray(options) ? options : []).map(opt => (
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

// ─── Bloc mentions RGPD (affiché dans tous les documents) ───────────────────
function RgpdMentions() {
  return (
    <div className="mt-4 mb-2 rounded-xl text-xs" style={{
      background: 'rgba(131,208,245,0.04)',
      border: '1px solid rgba(131,208,245,0.15)',
      padding: '10px 12px',
      fontFamily: 'Outfit, sans-serif',
      lineHeight: 1.6,
      color: '#374151',
    }}>
      <div style={{ fontWeight: 700, color: 'var(--brand-cyan)', marginBottom: 4, fontSize: 11 }}>VOS DROITS RGPD</div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ fontWeight: 600, color: '#111827' }}>Conservation (mineurs) :</span>{' '}
        3 ans minimum à compter de la majorité du mineur (Art. L1110-4 CSP). Copie conservée par le salon — Pièces jointes : copie de la/des pièce(s) d'identité du/des représentant(s) légal/aux.
      </div>
      <div style={{ marginBottom: 4 }}>
        Dans le cadre de votre prestation, nous collectons et traitons vos données personnelles. Conformément au RGPD, vous disposez des droits suivants :{' '}
        <span style={{ fontWeight: 600, color: '#111827' }}>Art. 15 — Droit d'accès · Art. 16 — Droit de rectification · Art. 17 — Droit à l'effacement · Art. 21 — Droit d'opposition</span>{' '}
        — Conservation : données de santé 3 ans — Pour exercer vos droits :{' '}
        <span style={{ fontWeight: 600, color: 'var(--brand-cyan)' }}>francois-dimpre@intemporelle.eu</span>
      </div>
      <div>
        <span style={{ fontWeight: 600, color: '#111827' }}>Support :</span>{' '}
        L'écrit électronique a la même force probante que l'écrit papier (Art. 1366 du Code civil). Le salon s'engage à ne pas utiliser les données personnelles à des fins publicitaires.
      </div>
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

// ─── En-tête d'impression avec logo ────────────────────────────────────────────

function PrintHeader({ salonInfo, docTitle, clientName, date, numeroClient }: {
  salonInfo: any;
  docTitle: string;
  clientName: string;
  date: string;
  numeroClient?: string;
}) {
  return (
    <div className="print-header" style={{ display: 'none', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, borderBottom: '2px solid #0A1628', paddingBottom: 12, marginBottom: 16, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}>
        {salonInfo?.logo && (
          <img
            src={salonInfo.logo}
            alt="Logo du salon"
            style={{ height: 60, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
          />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0A1628', fontFamily: 'Outfit, sans-serif' }}>
            {salonInfo?.nom || 'Studio'}
          </div>

          {salonInfo?.telephone && (
            <div style={{ fontSize: 11, color: '#555' }}>Tél : {salonInfo.telephone}</div>
          )}
          {salonInfo?.email && (
            <div style={{ fontSize: 11, color: '#555' }}>Email : {salonInfo.email}</div>
          )}
          {salonInfo?.siret && (
            <div style={{ fontSize: 11, color: '#555' }}>SIRET : {salonInfo.siret}</div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', fontFamily: 'Outfit, sans-serif' }}>{docTitle}</div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>Client : {clientName}</div>
          {numeroClient && <div style={{ fontSize: 11, color: '#555' }}>N° client : {numeroClient}</div>}
          <div style={{ fontSize: 11, color: '#555' }}>Date : {date}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Pied de page d'impression ────────────────────────────────────────────────────

function PrintFooter({ salonInfo, docTitle }: {
  salonInfo: any;
  docTitle: string;
}) {
  const year = new Date().getFullYear();
  return (
    <div className="print-footer" style={{ display: 'none', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}>
      {/* Bloc RGPD principal */}
      <div style={{
        borderTop: '2px solid #0A1628',
        paddingTop: 8,
        marginTop: 20,
        fontSize: 8,
        color: '#444',
        fontFamily: 'Outfit, sans-serif',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      } as React.CSSProperties}>
        {/* Ligne 1 : Conservation mineurs + pièces jointes */}
        <div style={{ marginBottom: 4, lineHeight: 1.4 }}>
          <span style={{ fontWeight: 700, color: '#0A1628' }}>Conservation (mineurs) :</span>{' '}
          3 ans minimum à compter de la majorité du mineur (Art. L1110-4 CSP). Copie conservée par le salon — Pièces jointes : copie de la/des pièce(s) d’identité du/des représentant(s) légal/aux.
        </div>
        {/* Ligne 2 : Vos droits RGPD */}
        <div style={{ marginBottom: 4, lineHeight: 1.4 }}>
          <span style={{ fontWeight: 700, color: '#0A1628' }}>VOS DROITS RGPD</span>{' '}
          Dans le cadre de votre prestation, nous collectons et traitons vos données personnelles. Conformément au RGPD, vous disposez des droits suivants :
          {' '}Art. 15 — Droit d’accès · Art. 16 — Droit de rectification · Art. 17 — Droit à l’effacement · Art. 21 — Droit d’opposition
          {' '}Conservation : données de santé 3 ans — Pour exercer vos droits : <span style={{ fontWeight: 600 }}>francois-dimpre@intemporelle.eu</span>
        </div>
        {/* Ligne 3 : Support + engagement */}
        <div style={{ marginBottom: 6, lineHeight: 1.4 }}>
          <span style={{ fontWeight: 700, color: '#0A1628' }}>Support :</span>{' '}
          L’écrit électronique a la même force probante que l’écrit papier (Art. 1366 du Code civil). Le salon s’engage à ne pas utiliser les données personnelles à des fins publicitaires.
        </div>
        {/* Barre inférieure : infos salon + crédits */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderTop: '1px solid #ccc',
          paddingTop: 5,
          fontSize: 7.5,
          color: '#666',
        }}>
          <div>
            <span style={{ fontWeight: 700, color: '#333' }}>{salonInfo?.nom || 'Studio'}</span>
            {salonInfo?.telephone && <span> · Tél : {salonInfo.telephone}</span>}
            {salonInfo?.siret && <span> · SIRET : {salonInfo.siret}</span>}
            {salonInfo?.mentionsLegales && <div style={{ marginTop: 2, fontStyle: 'italic' }}>{salonInfo.mentionsLegales}</div>}
          </div>
          <div style={{ textAlign: 'center', color: '#999' }}>
            © {year} {salonInfo?.nom || 'Studio'} — {docTitle}
          </div>
          <div style={{ textAlign: 'right' }}>
            {salonInfo?.siteWeb && <div style={{ fontWeight: 600, color: '#333' }}>{salonInfo.siteWeb}</div>}
            <div>Développé par Société Intemporelle · www.intemporelle.eu</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Formulaire Questionnaire Médical Mineur ─────────────────────────────────

function FormQuestionnaireMineur({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
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
      <FormField label={t('forms.dob')} value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />
      <FormField label={t('forms.phone')} value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" />
      <RadioField label={t('forms.id_piece')} options={t('forms.id_options_minor', { returnObjects: true }) as string[]} value={data.pieceId || ''} onChange={v => update('pieceId', v)} />
      {data.pieceId && data.pieceId !== t('forms.id_not_presented') && (
        <FormField label={t('forms.id_number')} value={data.numeroPiece || ''} onChange={v => update('numeroPiece', v)} />
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
      <CheckboxField label={t('q01.minor_confirms')} value={data.avisMineur || false} onToggle={() => update('avisMineur', !data.avisMineur)} />

      <FormSection title={t('q01.section_declaration')} />
      <CheckboxField label={t('q01.answered_honestly')} value={data.reponduHonnetement || false} onToggle={() => update('reponduHonnetement', !data.reponduHonnetement)} />

      <RgpdMentions />
      <FormSection title={t('q01.section_signatures')} />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
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
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du représentant légal" value={data.nomRepresentantSign || ''} onChange={v => update('nomRepresentantSign', v)} />
          <FormField label="Date" value={data.dateSignatureRepresentant || ''} onChange={v => update('dateSignatureRepresentant', v)} />
          <div className="mt-3">
            <SignaturePad
              label="Signature du représentant légal"
              value={data.signatureImageRepresentant || ''}
              onChange={v => update('signatureImageRepresentant', v ?? '')}
            />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label={t('forms.piercer_name')} value={data.nomPierceurSign || ''} onChange={v => update('nomPierceurSign', v)} />
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
      <FormField label={t('forms.dob')} value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />
      <FormField label={t('forms.phone')} value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" />
      <RadioField label={t('forms.id_piece')} options={t('forms.id_options_minor', { returnObjects: true }) as string[]} value={data.pieceId || ''} onChange={v => update('pieceId', v)} />
      {data.pieceId && data.pieceId !== t('forms.id_not_presented') && (
        <FormField label={t('forms.id_number')} value={data.numeroPiece || ''} onChange={v => update('numeroPiece', v)} />
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
      <CheckboxField label={t('q03.consent_adult')} value={data.consent_majeur || false} onToggle={() => update('consent_majeur', !data.consent_majeur)} />
      <CheckboxField label={t('q03.consent_honest')} value={data.consent_honnete || false} onToggle={() => update('consent_honnete', !data.consent_honnete)} />
      <CheckboxField label={t('q03.consent_freely')} value={data.consent_librement || false} onToggle={() => update('consent_librement', !data.consent_librement)} />
      <CheckboxField label={t('q03.consent_protocol')} value={data.consent_protocole || false} onToggle={() => update('consent_protocole', !data.consent_protocole)} />

      <RgpdMentions />
      <FormSection title={t('q03.section_signatures')} />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label={t('forms.client_name')} value={data.nomClientSign || data.nom || ''} onChange={v => update('nomClientSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureClient || ''} onChange={v => update('dateSignatureClient', v)} />
          <div className="mt-3">
            <SignaturePad
              label={t('forms.client_signature')}
              value={data.signatureImageClient || ''}
              onChange={v => update('signatureImageClient', v ?? '')}
            />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du représentant légal" value={data.nomRepresentantSign || ''} onChange={v => update('nomRepresentantSign', v)} />
          <FormField label="Date" value={data.dateSignatureRepresentant || ''} onChange={v => update('dateSignatureRepresentant', v)} />
          <div className="mt-3">
            <SignaturePad
              label="Signature du représentant légal"
              value={data.signatureImageRepresentant || ''}
              onChange={v => update('signatureImageRepresentant', v ?? '')}
            />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label={t('forms.piercer_name')} value={data.nomPierceurSign || ''} onChange={v => update('nomPierceurSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignaturePierceur || ''} onChange={v => update('dateSignaturePierceur', v)} />
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
      <div className="p-3 rounded-xl mb-3" style={{ background: 'rgba(131,208,245,0.05)', border: '1px solid rgba(131,208,245,0.2)' }}>
        <p className="text-xs mb-1" style={{ color: 'var(--brand-cyan)' }}>{t('q02.sync_from_01')}</p>
        <p className="text-sm font-600" style={{ color: '#111827', fontWeight: 600 }}>
          {data.nomRep || client.nom} {data.prenomRep || client.prenom}
        </p>
        {data.telRep || client.telephone ? <p className="text-xs mt-1" style={{ color: '#374151' }}>{data.telRep || client.telephone}</p> : null}
        {data.lienRep ? <p className="text-xs mt-1" style={{ color: '#374151' }}>Lien : {data.lienRep}</p> : null}
      </div>

      <FormSection title={t('q02.section_declarations')} />
      <LegalBox>{t('q02.legal_rep_intro')}</LegalBox>
      <CheckboxField label={t('q02.decl_authority')} value={data.decl_0 || false} onToggle={() => update('decl_0', !data.decl_0)} />
      <CheckboxField label={t('q02.decl_authorize')} value={data.decl_1 || false} onToggle={() => update('decl_1', !data.decl_1)} />
      <CheckboxField label={t('q02.decl_no_contraindication')} value={data.decl_3 || false} onToggle={() => update('decl_3', !data.decl_3)} />
      <CheckboxField label={t('q02.decl_care_protocol')} value={data.decl_4 || false} onToggle={() => update('decl_4', !data.decl_4)} />

      <FormSection title={t('q02.section_presence')} />
      <CheckboxField label={t('q02.presence_physical')} value={data.presencePhysique || false} onToggle={() => update('presencePhysique', !data.presencePhysique)} />
      <CheckboxField label={t('q02.presence_written')} value={data.presenceEcrite || false} onToggle={() => update('presenceEcrite', !data.presenceEcrite)} />

      <FormSection title={t('q02.section_rep_id')} />
      <RadioField label={t('q02.rep_id_label')} options={t('forms.id_options_minor', { returnObjects: true }) as string[]} value={data.pieceIdRepresentantType || ''} onChange={v => update('pieceIdRepresentantType', v)} />
      <FormField label={t('forms.id_number')} value={data.pieceIdRepresentantNumero || ''} onChange={v => update('pieceIdRepresentantNumero', v)} />

      <RgpdMentions />
      <FormSection title={t('q02.section_signatures')} />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label={t('forms.legal_rep_name')} value={data.nomRepresentantSign || data.nomRepresentant || ''} onChange={v => update('nomRepresentantSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureParent || ''} onChange={v => update('dateSignatureParent', v)} />
          <div className="mt-3">
            <SignaturePad
              label={t('forms.legal_rep_signature')}
              value={data.signatureImageParent || ''}
              onChange={v => update('signatureImageParent', v ?? '')}
            />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label={t('forms.piercer_name')} value={data.nomPierceurSign || ''} onChange={v => update('nomPierceurSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignaturePierceur || ''} onChange={v => update('dateSignaturePierceur', v)} />
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
  if (!fallback && !soinsKey) return <p style={{ color: '#374151' }}>Fiche de soins non disponible pour ce type.</p>;

  return (
    <>
      <div className="p-4 rounded-xl mb-4 text-center" style={{ background: 'rgba(131,208,245,0.05)', border: '1px solid rgba(131,208,245,0.2)' }}>
        <p className="text-base font-700" style={{ color: 'var(--brand-cyan)', fontWeight: 700, fontFamily: 'Outfit' }}>{t('soins.fiche_title', 'FICHE DE SOINS')} — {soinsTitle}</p>
        <p className="text-xs mt-1" style={{ color: '#374151' }}>{t('soins.doc_subtitle', 'Document à remettre au client après chaque séance')}</p>
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
              <th className="p-2 text-left" style={{ color: 'var(--brand-cyan)', border: '1px solid var(--brand-border)' }}>{t('soins.zone_col', 'Zone')}</th>
              <th className="p-2 text-left" style={{ color: 'var(--brand-cyan)', border: '1px solid var(--brand-border)' }}>{t('soins.desc_col', 'Description & Bijou')}</th>
              <th className="p-2 text-left" style={{ color: 'var(--brand-cyan)', border: '1px solid var(--brand-border)' }}>{t('soins.cica_col', 'Cicatrisation')}</th>
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(soinsZones) ? soinsZones : []).map((z: any, i: number) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <td className="p-2 font-600" style={{ color: '#111827', border: '1px solid var(--brand-border)', fontWeight: 600 }}>{z.zone}</td>
                <td className="p-2" style={{ color: '#374151', border: '1px solid var(--brand-border)' }}>{z.desc}</td>
                <td className="p-2" style={{ color: 'var(--brand-cyan)', border: '1px solid var(--brand-border)' }}>{z.cica}</td>
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
            <p key={i} className="text-xs mb-1" style={{ color: '#374151' }}>• {item}</p>
          ))}
        </div>
        <div className="p-3 rounded-xl" style={{ background: 'rgba(244,67,54,0.05)', border: '1px solid rgba(244,67,54,0.2)' }}>
          <p className="text-xs font-700 mb-2" style={{ color: '#F44336', fontWeight: 700 }}>{t('soins.avoid_label', '✗ À ÉVITER')}</p>
          {(Array.isArray(soinsEviter) ? soinsEviter : []).map((item: string, i: number) => (
            <p key={i} className="text-xs mb-1" style={{ color: '#374151' }}>• {item}</p>
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
          <p className="text-xs mt-1 text-center italic" style={{ color: '#374151', opacity: 0.7, fontSize: '10px' }}>{t('soins.trademark', 'Marque déposée — usage descriptif uniquement, sans affiliation commerciale')}</p>
        </div>
      )}

      {docType === 'soins_bouche_levres' && (
        <div className="mb-4">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/soins_labret_new_3c0b91d9.jpg"
            alt="Soins Post Labret — Chlorhexidine matin et soir 15j, Eludril après chaque repas 15 premiers jours, Sérum Physiologique + compresses matin et soir derniers 15j"
            style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--brand-border)' }}
          />
          <p className="text-xs mt-1 text-center italic" style={{ color: '#374151', opacity: 0.7, fontSize: '10px' }}>{t('soins.trademark', 'Marque déposée — usage descriptif uniquement, sans affiliation commerciale')}</p>
        </div>
      )}

      {docType === 'soins_nombril' && (
        <div className="mb-4">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/soins_nombril_new_d5f89320.webp"
            alt="Soins Post Nombril — Chlorhexidine matin et soir 2 semaines, Sérum Physiologique matin et soir 6 semaines, compresses non-tissées"
            style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--brand-border)' }}
          />
          <p className="text-xs mt-1 text-center italic" style={{ color: '#374151', opacity: 0.7, fontSize: '10px' }}>{t('soins.trademark', 'Marque déposée — usage descriptif uniquement, sans affiliation commerciale')}</p>
        </div>
      )}

      {docType === 'soins_nez' && (
        <div className="mb-4">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/soins_nez_new_1ea6172d.webp"
            alt="Soins post-piercing Nez — Chlorhexidine matin et soir 15 jours, Sérum Physiologique matin et soir derniers 15 jours, compresses non-tissées"
            style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--brand-border)' }}
          />
          <p className="text-xs mt-1 text-center italic" style={{ color: '#374151', opacity: 0.7, fontSize: '10px' }}>{t('soins.trademark', 'Marque déposée — usage descriptif uniquement, sans affiliation commerciale')}</p>
        </div>
      )}

      {docType === 'soins_mamelons' && (
        <div className="mb-4">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/soins_oreilles_mamelons_arcade_d6fa385b.webp"
            alt="Soins post-piercing Téton — Chlorhexidine matin et soir 15 jours, Sérum Physiologique matin et soir derniers 15 jours, compresses non-tissées"
            style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--brand-border)' }}
          />
          <p className="text-xs mt-1 text-center italic" style={{ color: '#374151', opacity: 0.7, fontSize: '10px' }}>{t('soins.trademark', 'Marque déposée — usage descriptif uniquement, sans affiliation commerciale')}</p>
        </div>
      )}

      {docType === 'soins_arcade_sourcil' && (
        <div className="mb-4">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/soins_oreilles_mamelons_arcade_d6fa385b.webp"
            alt="Soins post-piercing Arcade/Sourcil — Chlorhexidine matin et soir 15 jours, Sérum Physiologique matin et soir derniers 15 jours, compresses non-tissées"
            style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--brand-border)' }}
          />
          <p className="text-xs mt-1 text-center italic" style={{ color: '#374151', opacity: 0.7, fontSize: '10px' }}>Marque déposée — usage descriptif uniquement, sans affiliation commerciale</p>
        </div>
      )}

      {docType === 'soins_surface_dermal' && (
        <div className="mb-4">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/soins_surface_dermal_new_6c6a051e.webp"
            alt="Soins post-piercing Surface/Dermal — Sérum Physiologique matin et soir 1 mois, compresses non-tissées"
            style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--brand-border)' }}
          />
          <p className="text-xs mt-1 text-center italic" style={{ color: '#374151', opacity: 0.7, fontSize: '10px' }}>{t('soins.trademark', 'Marque déposée — usage descriptif uniquement, sans affiliation commerciale')}</p>
        </div>
      )}

      <LegalBox color="cyan">
        <em>Conservation : 3 ans minimum à compter de la majorité du mineur (Art. L1110-4 CSP). Copie conservée par le salon — Pièces jointes : copie de la/des pièce(s) d'identité du/des représentant(s) légal/aux. VOS DROITS RGPD Dans le cadre de votre prestation, nous collectons et traitons vos données personnelles. Conformément au RGPD, vous disposez des droits suivants : Art. 15 — Droit d'accès · Art. 16 — Droit de rectification · Art. 17 — Droit à l'effacement · Art. 21 — Droit d'opposition Conservation : données de santé 3 ans — Pour exercer vos droits : francois-dimpre@intemporelle.eu<br />
        Support : L'écrit électronique a la même force probante que l'écrit papier (Art. 1366 du Code civil).</em>
      </LegalBox>

      <RgpdMentions />
      <FormSection title="SIGNATURES" />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du client — Lu et approuvé" value={data.nomClientSign || ''} onChange={v => update('nomClientSign', v)} />
          <FormField label="Date" value={data.dateSignatureClient || ''} onChange={v => update('dateSignatureClient', v)} />
          <div className="mt-3">
            <SignaturePad
              label="Signature du client"
              value={data.signatureImageClient || ''}
              onChange={v => update('signatureImageClient', v ?? '')}
            />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du représentant légal" value={data.nomRepresentantSign || ''} onChange={v => update('nomRepresentantSign', v)} />
          <FormField label="Date" value={data.dateSignatureRepresentant || ''} onChange={v => update('dateSignatureRepresentant', v)} />
          <div className="mt-3">
            <SignaturePad
              label="Signature du représentant légal"
              value={data.signatureImageRepresentant || ''}
              onChange={v => update('signatureImageRepresentant', v ?? '')}
            />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du pierceur" value={data.nomPierceurSign || ''} onChange={v => update('nomPierceurSign', v)} />
          <FormField label="Date" value={data.dateSignaturePierceur || ''} onChange={v => update('dateSignaturePierceur', v)} />
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
      <div className="mt-4 p-4 rounded-xl space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-0.5 accent-cyan-400" />
          <span className="text-sm" style={{ color: '#111827' }}>
            {t('soins.declaration_1', 'Je déclare avoir pris connaissance des risques liés à la pratique du piercing')}
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-0.5 accent-cyan-400" />
          <span className="text-sm" style={{ color: '#111827' }}>
            {t('soins.declaration_2', "J'ai pu poser toutes les questions que je voulais")}
          </span>
        </label>
      </div>
    </>
  );
}

// ─── Fiche de Traçabilité Matériel Stérile ─────────────────────────────────────────────────

function FormFicheSeance({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  const photos: string[] = data.photosTracabilite || [];

  // Calcul automatique de l'âge
  const calculateAge = (dateNaissance: string): string => {
    if (!dateNaissance) return '';
    const today = new Date();
    const birth = new Date(dateNaissance);
    if (isNaN(birth.getTime())) return '';
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
        <FormField label="Nom de famille" value={data.nomClient || client.nom} onChange={v => update('nomClient', v)} />
        <FormField label="Prénom(s)" value={data.prenomClient || client.prenom} onChange={v => update('prenomClient', v)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Date de naissance"
          value={data.dateNaissanceClient || client.dateNaissance || ''}
          onChange={v => {
            update('dateNaissanceClient', v);
            update('ageClient', calculateAge(v));
          }}
          type="date"
        />
        <div className="mb-3">
          <label className="block text-xs mb-1" style={{ color: '#374151', fontWeight: 500 }}>Âge (calculé automatiquement)</label>
          <div className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--brand-border)', color: '#111827', opacity: 0.8 }}>
            {data.ageClient || calculateAge(data.dateNaissanceClient || client.dateNaissance || '') || '—'} {(data.ageClient || calculateAge(data.dateNaissanceClient || client.dateNaissance || '')) ? 'ans' : ''}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Téléphone" value={data.telephoneClient || client.telephone || ''} onChange={v => update('telephoneClient', v)} type="tel" />
        <FormField label="Courriel" value={data.emailClient || client.email || ''} onChange={v => update('emailClient', v)} type="email" />
      </div>

      <FormSection title="2 — TRAÇABILITÉ DU MATÉRIEL RÉUTILISABLE STÉRILISÉ" />
      <WarningBox>Photographiez les étiquettes de traçabilité du matériel stérile. L'emballage stérile est ouvert devant le client. Conserver les photos 5 ans minimum.</WarningBox>


      {/* ─── Section Photos de traçabilité ─── */}
      <div className="studio-card p-4 rounded-xl mb-4" style={{ border: '1px solid var(--brand-border)', background: 'rgba(255,255,255,0.03)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 16 }}>📷</span>
            <span className="text-sm font-600" style={{ color: '#111827', fontWeight: 600 }}>Photos de traçabilité</span>
          </div>
          <div className="flex gap-2">
            {/* Bouton caméra */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--brand-cyan-dim)', color: 'var(--brand-cyan)', border: '1px solid var(--brand-cyan)' }}
            >
              📷 Prendre une photo
            </button>
            {/* Bouton import */}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#111827', border: '1px solid var(--brand-border)' }}
            >
              ↗ Importer
            </button>
          </div>
        </div>

        {/* Inputs cachés */}
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" multiple onChange={e => addPhotos(e.target.files)} />
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" multiple onChange={e => addPhotos(e.target.files)} />

        {/* Galerie ou état vide */}
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8" style={{ color: '#374151' }}>
            <span style={{ fontSize: 32, opacity: 0.3 }}>📷</span>
            <p className="text-sm mt-2">Aucune photo de traçabilité</p>
            <p className="text-xs mt-1" style={{ opacity: 0.6 }}>Prenez des photos de vos documents, bijoux, encres ou matériels</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {(Array.isArray(photos) ? photos : []).map((src, idx) => (
              <div key={idx} className="relative group rounded-lg overflow-hidden" style={{ aspectRatio: '1', background: 'rgba(0,0,0,0.2)' }}>
                <img
                  src={src}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setLightboxPhoto(src)}
                />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(192,57,106,0.9)', color: 'white' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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




      <LegalBox>
        <em>Conservation : 5 ans minimum à compter de la dernière prestation (Art. R 1311-7 CSP + Arrêté 13/03/2009). Copie conservée par le salon. VOS DROITS RGPD — Pour exercer vos droits : francois-dimpre@intemporelle.eu<br />
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
        Pour exercer vos droits : francois-dimpre@intemporelle.eu — L'écrit électronique a la même force probante que l'écrit papier (Art. 1366 Code civil).</em>
      </LegalBox>

      {/* Identité client */}
      <FormSection title="1 — IDENTITÉ DU CLIENT" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nom de famille" value={data.nom || client.nom} onChange={v => update('nom', v)} required />
        <FormField label="Prénom(s)" value={data.prenom || client.prenom} onChange={v => update('prenom', v)} required />
      </div>
      <FormField label="Date de naissance (JJ/MM/AAAA)" value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />
      <FormField label="Téléphone" value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" />

      {/* Consentement éclairé */}
      <FormSection title="2 — CONSENTEMENT ÉCLAIRÉ" />
      <LegalBox color="green">
        En signant ce document, le client déclare avoir été informé(e) des éléments suivants et y consent librement :
      </LegalBox>
      <CheckboxField label="Je suis majeur(e) et en pleine capacité juridique" value={data.consent_majeur || false} onToggle={() => update('consent_majeur', !data.consent_majeur)} />
      <CheckboxField label="J'ai répondu honnêtement au questionnaire médical" value={data.consent_honnete || false} onToggle={() => update('consent_honnete', !data.consent_honnete)} />
      <CheckboxField label="J'ai été informé(e) des risques : infection, allergie, chéloïde, décoloration, retouche possible" value={data.consent_risques || false} onToggle={() => update('consent_risques', !data.consent_risques)} />
      <CheckboxField label="J'ai été informé(e) que le résultat définitif est visible après cicatrisation complète (3 à 4 semaines)" value={data.consent_resultat || false} onToggle={() => update('consent_resultat', !data.consent_resultat)} />
      <CheckboxField label="J'accepte que le tatouage est permanent et que les retouches peuvent nécessiter une séance supplémentaire" value={data.consent_permanent || false} onToggle={() => update('consent_permanent', !data.consent_permanent)} />
      <CheckboxField label="J'ai reçu et lu la fiche de soins post-tatouage" value={data.consent_ficheRecue || false} onToggle={() => update('consent_ficheRecue', !data.consent_ficheRecue)} />
      <CheckboxField label="Je m'engage à respecter le protocole de cicatrisation" value={data.consent_protocole || false} onToggle={() => update('consent_protocole', !data.consent_protocole)} />
      <CheckboxField label="Je consens librement à la réalisation de cette prestation" value={data.consent_libre || false} onToggle={() => update('consent_libre', !data.consent_libre)} />

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
                <span className="text-xs font-600" style={{ color: '#111827', fontWeight: 600 }}>{etape.titre}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#374151', lineHeight: 1.7 }}>{etape.instructions}</p>
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
            <p key={i} className="text-xs mb-1" style={{ color: '#374151' }}>✗ {item}</p>
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
            <p key={i} className="text-xs mb-1" style={{ color: '#374151' }}>✓ {item}</p>
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
      <CheckboxField label="Fiche de consentement et de soins signée (ce document)" value={data.docConsentement || false} onToggle={() => update('docConsentement', !data.docConsentement)} />
      <CheckboxField label="Protocole de cicatrisation J1-J30 remis" value={data.docCicatrisation || false} onToggle={() => update('docCicatrisation', !data.docCicatrisation)} />
      <CheckboxField label="Informations sur les encres (conformité UE 2020/2081)" value={data.docEncres || false} onToggle={() => update('docEncres', !data.docEncres)} />
      <CheckboxField label="Coordonnées du professionnel remises" value={data.docCoordonnees || false} onToggle={() => update('docCoordonnees', !data.docCoordonnees)} />

      <LegalBox color="cyan">
        <em>Conservation : 5 ans minimum à compter de la dernière prestation (Art. R 1311-7 CSP + Arrêté 13/03/2009). Copie conservée par le salon. VOS DROITS RGPD — Pour exercer vos droits : francois-dimpre@intemporelle.eu<br />
        Support : L'écrit électronique a la même force probante que l'écrit papier (Art. 1366 du Code civil).</em>
      </LegalBox>

      <RgpdMentions />
      <FormSection title="11 — SIGNATURES" />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du client — Lu et approuvé" value={data.nomClientSign || ''} onChange={v => update('nomClientSign', v)} />
          <FormField label="Date" value={data.dateSignatureClient || ''} onChange={v => update('dateSignatureClient', v)} />
          <div className="mt-3">
            <SignaturePad
              label="Signature du client"
              value={data.signatureImageClient || ''}
              onChange={v => update('signatureImageClient', v ?? '')}
            />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du représentant légal" value={data.nomRepresentantSign || ''} onChange={v => update('nomRepresentantSign', v)} />
          <FormField label="Date" value={data.dateSignatureRepresentant || ''} onChange={v => update('dateSignatureRepresentant', v)} />
          <div className="mt-3">
            <SignaturePad
              label="Signature du représentant légal"
              value={data.signatureImageRepresentant || ''}
              onChange={v => update('signatureImageRepresentant', v ?? '')}
            />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du tatoueur" value={data.nomTatoueurSign || ''} onChange={v => update('nomTatoueurSign', v)} />
          <FormField label="Date" value={data.dateSignatureTatoueur || ''} onChange={v => update('dateSignatureTatoueur', v)} />
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
        <FormField label="Téléphone" value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" />
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
            <FormField label="Fabricant" value={data[`encre${i}_fabricant`] || ''} onChange={v => update(`encre${i}_fabricant`, v)} placeholder="Marque" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Référence / Code" value={data[`encre${i}_ref`] || ''} onChange={v => update(`encre${i}_ref`, v)} placeholder="Réf. produit" />
            <FormField label="N° de lot" value={data[`encre${i}_lot`] || ''} onChange={v => update(`encre${i}_lot`, v)} placeholder="N° lot" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Date de péremption" value={data[`encre${i}_peremption`] || ''} onChange={v => update(`encre${i}_peremption`, v)} type="date" />
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
      <CheckboxField label="Fiche de soins post-tatouage remise" value={!!data.fichesSoinsRemise} onToggle={() => update('fichesSoinsRemise', !data.fichesSoinsRemise)} />
      <CheckboxField label="Informations sur les encres communiquées" value={!!data.infosEncresRemises} onToggle={() => update('infosEncresRemises', !data.infosEncresRemises)} />
      <CheckboxField label="Conseils de cicatrisation expliqués oralement" value={!!data.conseilsOraux} onToggle={() => update('conseilsOraux', !data.conseilsOraux)} />
      <FormField label="Autres documents remis" value={data.autresDocuments || ''} onChange={v => update('autresDocuments', v)} placeholder="Préciser si nécessaire" />

      <FormSection title="8 — SIGNATURE" />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du tatoueur" value={data.signatureTatoueur || ''} onChange={v => update('signatureTatoueur', v)} />
          <div className="mt-3">
            <SignaturePad
              label="Signature du tatoueur"
              value={data.signatureImageTatoueur || ''}
              onChange={v => update('signatureImageTatoueur', v ?? '')}
            />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Lu et approuvé — Nom du client" value={data.signatureClient || ''} onChange={v => update('signatureClient', v)} />
          <div className="mt-3">
            <SignaturePad
              label="Signature du client"
              value={data.signatureImageClient || ''}
              onChange={v => update('signatureImageClient', v ?? '')}
            />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du représentant légal" value={data.nomRepresentantSign || ''} onChange={v => update('nomRepresentantSign', v)} />
          <FormField label="Date" value={data.dateSignatureRepresentant || ''} onChange={v => update('dateSignatureRepresentant', v)} />
          <div className="mt-3">
            <SignaturePad
              label="Signature du représentant légal"
              value={data.signatureImageRepresentant || ''}
              onChange={v => update('signatureImageRepresentant', v ?? '')}
            />
          </div>
        </div>
      </div>
    </>
  );
}
// ─── Formulaire Questionnaire Médical Tatouage Mineur ────────────────────────

function FormQuestionnaireTatouageMineur({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
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
      <FormField label={t('forms.dob')} value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />
      <FormField label={t('forms.phone')} value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" />
      <FormSection title="Représentant légal" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nom du représentant légal" value={data.nomRepresentant || client.nomRepresentantLegal || ''} onChange={v => update('nomRepresentant', v)} required />
        <FormField label="Prénom du représentant légal" value={data.prenomRepresentant || client.prenomRepresentantLegal || ''} onChange={v => update('prenomRepresentant', v)} required />
      </div>
      <FormField label="Lien avec le mineur" value={data.lienRepresentant || client.lienRepresentantLegal || ''} onChange={v => update('lienRepresentant', v)} />
      <FormField label="Téléphone du représentant légal" value={data.telephoneRepresentant || client.telephoneRepresentantLegal || ''} onChange={v => update('telephoneRepresentant', v)} type="tel" />
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
      <FormSection title="Consentement du représentant légal" />
      <CheckboxField label="Le représentant légal a répondu honnêtement au questionnaire médical" value={data.reponduHonnetement || false} onToggle={() => update('reponduHonnetement', !data.reponduHonnetement)} />
      <CheckboxField label="Le représentant légal donne son consentement pour le tatouage du mineur" value={data.consentementLibre || false} onToggle={() => update('consentementLibre', !data.consentementLibre)} />
      <CheckboxField label="Le représentant légal assume la responsabilité du suivi des soins" value={data.assumeResponsabilite || false} onToggle={() => update('assumeResponsabilite', !data.assumeResponsabilite)} />
      <CheckboxField label="Confirme la présence physique du représentant légal lors de la séance" value={data.presenceRepresentant || false} onToggle={() => update('presenceRepresentant', !data.presenceRepresentant)} />
      <RgpdMentions />
      <FormSection title={t('q05.section_signatures')} />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <p className="text-xs mb-3" style={{ color: '#374151' }}>Signature du mineur</p>
          <FormField label="Nom du mineur" value={data.nomMineurSign || `${client.prenom} ${client.nom}`} onChange={v => update('nomMineurSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureMineur || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureMineur', v)} />
          <div className="mt-3">
            <SignaturePad label="Signature du mineur" value={data.signatureImageMineur || ''} onChange={v => update('signatureImageMineur', v ?? '')} />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <p className="text-xs mb-3" style={{ color: '#374151' }}>Signature du représentant légal</p>
          <FormField label="Nom du représentant légal" value={data.nomRepresentantSign || ''} onChange={v => update('nomRepresentantSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureRepresentant || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureRepresentant', v)} />
          <div className="mt-3">
            <SignaturePad label="Signature du représentant légal" value={data.signatureImageRepresentant || ''} onChange={v => update('signatureImageRepresentant', v ?? '')} />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label={t('forms.tattoo_artist_name')} value={data.nomTatoueurSign || ''} onChange={v => update('nomTatoueurSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureTatoueur || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureTatoueur', v)} />
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
      <FormField label={t('forms.dob')} value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />
      <FormField label={t('forms.phone')} value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" />

      <FormSection title="Représentant légal" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nom du représentant légal" value={data.nomRepresentant || client.nomRepresentantLegal || ''} onChange={v => update('nomRepresentant', v)} required />
        <FormField label="Prénom du représentant légal" value={data.prenomRepresentant || client.prenomRepresentantLegal || ''} onChange={v => update('prenomRepresentant', v)} required />
      </div>
      <FormField label="Lien avec le mineur" value={data.lienRepresentant || client.lienRepresentantLegal || ''} onChange={v => update('lienRepresentant', v)} />
      <FormField label="Téléphone du représentant légal" value={data.telephoneRepresentant || client.telephoneRepresentantLegal || ''} onChange={v => update('telephoneRepresentant', v)} type="tel" />

      <FormSection title="Zone de dermographie" />
      <RadioField
        label="Zone à traiter"
        options={['Sourcils', 'Lèvres', 'Eye-liner supérieur', 'Eye-liner inférieur', 'Autre']}
        value={data.zoneDermographie || ''}
        onChange={v => update('zoneDermographie', v)}
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

      <FormSection title="Consentement du représentant légal" />
      <CheckboxField label="Le représentant légal a répondu honnêtement au questionnaire médical" value={data.reponduHonnetement || false} onToggle={() => update('reponduHonnetement', !data.reponduHonnetement)} />
      <CheckboxField label="Le représentant légal autorise la prestation de dermographie sur le mineur" value={data.consentementLibre || false} onToggle={() => update('consentementLibre', !data.consentementLibre)} />
      <CheckboxField label="Le représentant légal assume la responsabilité du suivi des soins" value={data.assumeResponsabilite || false} onToggle={() => update('assumeResponsabilite', !data.assumeResponsabilite)} />
      <CheckboxField label="Confirme la présence physique du représentant légal lors de la séance" value={data.presenceRepresentant || false} onToggle={() => update('presenceRepresentant', !data.presenceRepresentant)} />

      <RgpdMentions />
      <FormSection title="Signatures" />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <p className="text-xs mb-3" style={{ color: '#374151' }}>Signature du mineur</p>
          <FormField label="Nom du mineur" value={data.nomMineurSign || `${client.prenom} ${client.nom}`} onChange={v => update('nomMineurSign', v)} />
          <FormField label="Date" value={data.dateSignatureMineur || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureMineur', v)} />
          <div className="mt-3">
            <SignaturePad label="Signature du mineur" value={data.signatureImageMineur || ''} onChange={v => update('signatureImageMineur', v ?? '')} />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <p className="text-xs mb-3" style={{ color: '#374151' }}>Signature du représentant légal</p>
          <FormField label="Nom du représentant légal" value={data.nomRepresentantSign || ''} onChange={v => update('nomRepresentantSign', v)} />
          <FormField label="Date" value={data.dateSignatureRepresentant || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureRepresentant', v)} />
          <div className="mt-3">
            <SignaturePad label="Signature du représentant légal" value={data.signatureImageRepresentant || ''} onChange={v => update('signatureImageRepresentant', v ?? '')} />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du dermographe" value={data.nomDermographeSign || ''} onChange={v => update('nomDermographeSign', v)} />
          <FormField label="Date" value={data.dateSignatureDermographe || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureDermographe', v)} />
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
      <FormField label={t('forms.dob')} value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />

      <FormSection title="Représentant légal" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nom du représentant légal" value={data.nomRepresentant || client.nomRepresentantLegal || ''} onChange={v => update('nomRepresentant', v)} required />
        <FormField label="Prénom du représentant légal" value={data.prenomRepresentant || client.prenomRepresentantLegal || ''} onChange={v => update('prenomRepresentant', v)} required />
      </div>
      <FormField label="Lien avec le mineur" value={data.lienRepresentant || client.lienRepresentantLegal || ''} onChange={v => update('lienRepresentant', v)} />
      <FormField label="Téléphone" value={data.telephoneRepresentant || client.telephoneRepresentantLegal || ''} onChange={v => update('telephoneRepresentant', v)} type="tel" />

      <FormSection title="Détails de la prestation" />
      <RadioField
        label="Zone à traiter"
        options={['Sourcils', 'Lèvres', 'Eye-liner supérieur', 'Eye-liner inférieur', 'Autre']}
        value={data.zoneDermographie || ''}
        onChange={v => update('zoneDermographie', v)}
      />
      <FormField label="Date de la séance" value={data.dateSeance || ''} onChange={v => update('dateSeance', v)} />
      <FormField label="Nom du dermographe" value={data.nomDermographe || ''} onChange={v => update('nomDermographe', v)} />

      <FormSection title="Engagement du représentant légal" />
      <CheckboxField label="Je certifie avoir pris connaissance des risques liés à la dermographie sur un mineur" value={data.connaitRisques || false} onToggle={() => update('connaitRisques', !data.connaitRisques)} />
      <CheckboxField label="Je m'engage à superviser les soins post-dermographie du mineur" value={data.engageSoins || false} onToggle={() => update('engageSoins', !data.engageSoins)} />
      <CheckboxField label="Je confirme donner mon autorisation parentale pour cette prestation" value={data.autorisationDonnee || false} onToggle={() => update('autorisationDonnee', !data.autorisationDonnee)} />
      <CheckboxField label="Je confirme ma présence physique lors de la séance" value={data.presenceConfirmee || false} onToggle={() => update('presenceConfirmee', !data.presenceConfirmee)} />

      <RgpdMentions />
      <FormSection title="Signatures" />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <p className="text-xs mb-3" style={{ color: '#374151' }}>Signature du représentant légal</p>
          <FormField label="Nom du représentant légal" value={data.nomRepresentantSign || ''} onChange={v => update('nomRepresentantSign', v)} />
          <FormField label="Date" value={data.dateSignatureRepresentant || ''} onChange={v => update('dateSignatureRepresentant', v)} />
          <div className="mt-3">
            <SignaturePad label="Signature du représentant légal" value={data.signatureImageRepresentant || ''} onChange={v => update('signatureImageRepresentant', v ?? '')} />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du dermographe" value={data.nomDermographeSign || ''} onChange={v => update('nomDermographeSign', v)} />
          <FormField label="Date" value={data.dateSignatureDermographe || ''} onChange={v => update('dateSignatureDermographe', v)} />
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
      <FormField label={t('forms.dob')} value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />
      <FormField label={t('forms.phone')} value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" />
      <RadioField label={t('forms.id_piece')} options={t('forms.id_options_adult', { returnObjects: true }) as string[]} value={data.pieceIdType || ''} onChange={v => update('pieceIdType', v)} />
      {data.pieceIdType && (
        <FormField label={t('forms.id_number')} value={data.pieceIdNumero || ''} onChange={v => update('pieceIdNumero', v)} />
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
      <CheckboxField label="Le représentant légal a répondu honnêtement au questionnaire médical" value={data.reponduHonnetement || false} onToggle={() => update('reponduHonnetement', !data.reponduHonnetement)} />
      <CheckboxField label="Le représentant légal donne son consentement éclairé pour la réalisation du tatouage sur le mineur" value={data.consentementLibre || false} onToggle={() => update('consentementLibre', !data.consentementLibre)} />
      <CheckboxField label="Le représentant légal assume la responsabilité du suivi des soins post-tatouage" value={data.assumeResponsabilite || false} onToggle={() => update('assumeResponsabilite', !data.assumeResponsabilite)} />
      <CheckboxField label="Confirme la présence physique du représentant légal lors de la séance" value={data.presenceRepresentant || false} onToggle={() => update('presenceRepresentant', !data.presenceRepresentant)} />

      <RgpdMentions />
      <FormSection title={t('q05.section_signatures')} />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <p className="text-xs mb-3" style={{ color: '#374151' }}>Signature du mineur</p>
          <FormField label="Nom du mineur" value={data.nomMineurSign || ''} onChange={v => update('nomMineurSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureMineur || ''} onChange={v => update('dateSignatureMineur', v)} />
          <div className="mt-3">
            <SignaturePad label="Signature du mineur" value={data.signatureImageMineur || ''} onChange={v => update('signatureImageMineur', v ?? '')} />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <p className="text-xs mb-3" style={{ color: '#374151' }}>Signature du représentant légal</p>
          <FormField label="Nom du représentant légal" value={data.nomRepresentantSign || ''} onChange={v => update('nomRepresentantSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureRepresentant || ''} onChange={v => update('dateSignatureRepresentant', v)} />
          <div className="mt-3">
            <SignaturePad label="Signature du représentant légal" value={data.signatureImageRepresentant || ''} onChange={v => update('signatureImageRepresentant', v ?? '')} />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label={t('forms.tattoo_artist_name')} value={data.nomTatoueurSign || ''} onChange={v => update('nomTatoueurSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureTatoueur || ''} onChange={v => update('dateSignatureTatoueur', v)} />
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
      <FormField label={t('forms.dob')} value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />

      <FormSection title="Représentant légal" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nom du représentant légal" value={data.nomRepresentant || client.nomRepresentantLegal || ''} onChange={v => update('nomRepresentant', v)} required />
        <FormField label="Prénom du représentant légal" value={data.prenomRepresentant || client.prenomRepresentantLegal || ''} onChange={v => update('prenomRepresentant', v)} required />
      </div>
      <FormField label="Lien avec le mineur" value={data.lienRepresentant || client.lienRepresentantLegal || ''} onChange={v => update('lienRepresentant', v)} />
      <FormField label="Téléphone" value={data.telephoneRepresentant || client.telephoneRepresentantLegal || ''} onChange={v => update('telephoneRepresentant', v)} type="tel" />

      <FormSection title="Détails du tatouage" />
      <FormField label="Zone tatouée" value={data.zoneTatouage || ''} onChange={v => update('zoneTatouage', v)} required />
      <FormField label="Date de la séance" value={data.dateSeance || ''} onChange={v => update('dateSeance', v)} />
      <FormField label="Nom du tatoueur" value={data.nomTatoueur || ''} onChange={v => update('nomTatoueur', v)} />

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
      <CheckboxField label="Je certifie avoir pris connaissance des instructions de soins post-tatouage" value={data.connaitSoins || false} onToggle={() => update('connaitSoins', !data.connaitSoins)} />
      <CheckboxField label="Je m'engage à superviser et assurer les soins post-tatouage du mineur" value={data.engageSoins || false} onToggle={() => update('engageSoins', !data.engageSoins)} />
      <CheckboxField label="Je reconnais avoir reçu les informations nécessaires sur les risques éventuels" value={data.informeRisques || false} onToggle={() => update('informeRisques', !data.informeRisques)} />
      <CheckboxField label="Je confirme donner mon autorisation parentale pour ce tatouage" value={data.autorisationDonnee || false} onToggle={() => update('autorisationDonnee', !data.autorisationDonnee)} />

      <RgpdMentions />
      <FormSection title={t('q05.section_signatures')} />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <p className="text-xs mb-3" style={{ color: '#374151' }}>Signature du représentant légal</p>
          <FormField label="Nom du représentant légal" value={data.nomRepresentantSign || ''} onChange={v => update('nomRepresentantSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureRepresentant || ''} onChange={v => update('dateSignatureRepresentant', v)} />
          <div className="mt-3">
            <SignaturePad label="Signature du représentant légal" value={data.signatureImageRepresentant || ''} onChange={v => update('signatureImageRepresentant', v ?? '')} />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label={t('forms.tattoo_artist_name')} value={data.nomTatoueurSign || ''} onChange={v => update('nomTatoueurSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureTatoueur || ''} onChange={v => update('dateSignatureTatoueur', v)} />
          <div className="mt-3">
            <SignaturePad label={t('forms.tattoo_artist_signature')} value={data.signatureImageTatoueur || ''} onChange={v => update('signatureImageTatoueur', v ?? '')} />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Formulaire Fiche de Séance Dermographe ───────────────────────────────────────────

function FormFicheSeanceDermographe({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
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
        <FormField label={t('forms.dob')} value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} type="date" />
        <FormField label={t('forms.phone')} value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" />
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
        <FormField label={t('q08.artist_name')} value={data.dermographe || ''} onChange={v => update('dermographe', v)} placeholder={t('q08.artist_name_placeholder')} required />
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
            <CheckboxField label={zoneLabels[zone]} value={data[`zone_${zone}`] || false} onToggle={() => update(`zone_${zone}`, !data[`zone_${zone}`])} />
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
            <FormField label={t('q08.pigment_color')} value={data[`pigment${i}_couleur`] || ''} onChange={v => update(`pigment${i}_couleur`, v)} placeholder={t('q08.pigment_color_placeholder')} />
            <FormField label={t('q08.pigment_manufacturer')} value={data[`pigment${i}_fabricant`] || ''} onChange={v => update(`pigment${i}_fabricant`, v)} placeholder={t('q08.pigment_manufacturer_placeholder')} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormField label={t('q08.pigment_ref')} value={data[`pigment${i}_ref`] || ''} onChange={v => update(`pigment${i}_ref`, v)} placeholder={t('q08.pigment_ref_placeholder')} />
            <FormField label={t('q08.pigment_lot')} value={data[`pigment${i}_lot`] || ''} onChange={v => update(`pigment${i}_lot`, v)} placeholder={t('q08.pigment_lot_placeholder')} />
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
        <FormField label={t('q08.needle_expiry')} value={data.peremptionAiguille || ''} onChange={v => update('peremptionAiguille', v)} type="date" />
        <FormField label={t('q08.needle_manufacturer')} value={data.fabricantAiguille || ''} onChange={v => update('fabricantAiguille', v)} placeholder={t('q08.needle_manufacturer_placeholder')} />
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
      <CheckboxField label={t('q08.care_sheet_given')} value={data.ficheSoinsRemise || false} onToggle={() => update('ficheSoinsRemise', !data.ficheSoinsRemise)} />

      <RgpdMentions />
      <FormSection title={t('q08.section_signatures')} />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label={t('forms.client_name_signed')} value={data.nomClientSign || ''} onChange={v => update('nomClientSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureClient || ''} onChange={v => update('dateSignatureClient', v)} />
          <div className="mt-3">
            <SignaturePad
              label={t('forms.client_signature')}
              value={data.signatureImageClient || ''}
              onChange={v => update('signatureImageClient', v ?? '')}
            />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du représentant légal" value={data.nomRepresentantSign || ''} onChange={v => update('nomRepresentantSign', v)} />
          <FormField label="Date" value={data.dateSignatureRepresentant || ''} onChange={v => update('dateSignatureRepresentant', v)} />
          <div className="mt-3">
            <SignaturePad
              label="Signature du représentant légal"
              value={data.signatureImageRepresentant || ''}
              onChange={v => update('signatureImageRepresentant', v ?? '')}
            />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label={t('q08.dermographer_name')} value={data.nomDermographeSign || ''} onChange={v => update('nomDermographeSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureDermographe || ''} onChange={v => update('dateSignatureDermographe', v)} />
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
      <FormField label={t('forms.dob')} value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />
      <FormField label={t('forms.phone')} value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" />

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
      <CheckboxField label={t('q09.consent_risks')} value={data.informeRisques || false} onToggle={() => update('informeRisques', !data.informeRisques)} />
      <CheckboxField label={t('q09.consent_healing')} value={data.informeCicatrisation || false} onToggle={() => update('informeCicatrisation', !data.informeCicatrisation)} />
      <CheckboxField label={t('q09.consent_fading')} value={data.informeEclaircissement || false} onToggle={() => update('informeEclaircissement', !data.informeEclaircissement)} />
      <CheckboxField label={t('q09.consent_contraindications')} value={data.certifieContraIndications || false} onToggle={() => update('certifieContraIndications', !data.certifieContraIndications)} />
      <CheckboxField label={t('q09.consent_aftercare')} value={data.engageSoinsPost || false} onToggle={() => update('engageSoinsPost', !data.engageSoinsPost)} />
      <CheckboxField label={t('q09.consent_free')} value={data.consentementLibre || false} onToggle={() => update('consentementLibre', !data.consentementLibre)} />
      <CheckboxField label={t('q09.consent_accurate')} value={data.certifieInfosExactes || false} onToggle={() => update('certifieInfosExactes', !data.certifieInfosExactes)} />

      <RgpdMentions />
      <FormSection title={t('q09.section_signatures')} />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label={t('forms.client_name_signed')} value={data.nomClientSign || ''} onChange={v => update('nomClientSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureClient || ''} onChange={v => update('dateSignatureClient', v)} />
          <div className="mt-3">
            <SignaturePad
              label={t('forms.client_signature')}
              value={data.signatureImageClient || ''}
              onChange={v => update('signatureImageClient', v ?? '')}
            />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du représentant légal" value={data.nomRepresentantSign || ''} onChange={v => update('nomRepresentantSign', v)} />
          <FormField label="Date" value={data.dateSignatureRepresentant || ''} onChange={v => update('dateSignatureRepresentant', v)} />
          <div className="mt-3">
            <SignaturePad
              label="Signature du représentant légal"
              value={data.signatureImageRepresentant || ''}
              onChange={v => update('signatureImageRepresentant', v ?? '')}
            />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label={t('q08.dermographer_name')} value={data.nomDermographeSign || ''} onChange={v => update('nomDermographeSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureDermographe || ''} onChange={v => update('dateSignatureDermographe', v)} />
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
        Pour exercer vos droits : francois-dimpre@intemporelle.eu — L'écrit électronique a la même force probante que l'écrit papier (Art. 1366 Code civil).</em>
      </LegalBox>

      {/* Identité client */}
      <FormSection title="1 — IDENTITÉ DU CLIENT" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nom de famille" value={data.nom || client.nom} onChange={v => update('nom', v)} required />
        <FormField label="Prénom(s)" value={data.prenom || client.prenom} onChange={v => update('prenom', v)} required />
      </div>
      <FormField label="Date de naissance (JJ/MM/AAAA)" value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />
       <FormField label="Téléphone" value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" />
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
                <span className="text-xs font-600" style={{ color: '#111827', fontWeight: 600 }}>{etape.titre}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#374151', lineHeight: 1.7 }}>{etape.instructions}</p>
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
          <p key={i} className="text-xs mb-1" style={{ color: '#374151' }}>• {item}</p>
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
          <p key={i} className="text-xs mb-1" style={{ color: '#374151' }}>• {item}</p>
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
          <p key={i} className="text-xs mb-1" style={{ color: '#374151' }}>• {item}</p>
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
            <p key={i} className="text-xs mb-1" style={{ color: '#374151' }}>✗ {item}</p>
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
            <p key={i} className="text-xs mb-1" style={{ color: '#374151' }}>✓ {item}</p>
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
      <CheckboxField label="Fiche de soins post-dermographie signée (ce document)" value={data.docSoins || false} onToggle={() => update('docSoins', !data.docSoins)} />
      <CheckboxField label="Protocole de cicatrisation J1-J42 remis" value={data.docProtocole || false} onToggle={() => update('docProtocole', !data.docProtocole)} />
      <CheckboxField label="Informations sur les pigments (conformité UE 2020/2081)" value={data.docPigments || false} onToggle={() => update('docPigments', !data.docPigments)} />
      <CheckboxField label="Coordonnées du praticien remises" value={data.docCoordonnees || false} onToggle={() => update('docCoordonnees', !data.docCoordonnees)} />

      <LegalBox color="cyan">
        <em>Conservation : 5 ans minimum à compter de la dernière prestation (Art. R 1311-7 CSP + Arrêté 13/03/2009). Copie conservée par le salon. VOS DROITS RGPD — Pour exercer vos droits : francois-dimpre@intemporelle.eu<br />
        Support : L'écrit électronique a la même force probante que l'écrit papier (Art. 1366 du Code civil).</em>
      </LegalBox>

      <RgpdMentions />
      <FormSection title="9 — SIGNATURES" />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du client — Lu et approuvé" value={data.nomClientSign || ''} onChange={v => update('nomClientSign', v)} />
          <FormField label="Date" value={data.dateSignatureClient || ''} onChange={v => update('dateSignatureClient', v)} />
          <div className="mt-3">
            <SignaturePad
              label="Signature du client"
              value={data.signatureImageClient || ''}
              onChange={v => update('signatureImageClient', v ?? '')}
            />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du représentant légal" value={data.nomRepresentantSign || ''} onChange={v => update('nomRepresentantSign', v)} />
          <FormField label="Date" value={data.dateSignatureRepresentant || ''} onChange={v => update('dateSignatureRepresentant', v)} />
          <div className="mt-3">
            <SignaturePad
              label="Signature du représentant légal"
              value={data.signatureImageRepresentant || ''}
              onChange={v => update('signatureImageRepresentant', v ?? '')}
            />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du dermographe" value={data.nomDermographeSign || ''} onChange={v => update('nomDermographeSign', v)} />
          <FormField label="Date" value={data.dateSignatureDermographe || ''} onChange={v => update('dateSignatureDermographe', v)} />
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

function FormEngagementConfidentialite({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
  return (
    <>
      {/* En-tête */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-900 mb-1" style={{ color: '#111827', fontFamily: 'Outfit', fontWeight: 900, letterSpacing: '-0.02em' }}>ENGAGEMENT DE CONFIDENTIALITÉ</h2>
        <p className="text-sm italic mb-1" style={{ color: '#C8860A' }}>Données personnelles clients — RGPD Art. 29</p>
        <p className="text-xs" style={{ color: '#374151' }}>À signer par tout employé, stagiaire ou prestataire ayant accès aux données clients</p>
      </div>

      {/* Identité du signataire */}
      <div className="mb-4">
        <div className="px-3 py-2 mb-3" style={{ background: '#1a1a1a', borderRadius: 6 }}>
          <p className="text-xs font-700 uppercase tracking-wider" style={{ color: '#fff', fontWeight: 700 }}>IDENTITÉ DU SIGNATAIRE</p>
        </div>
        <div className="space-y-3">
          <FormField label="Nom et Prénom" value={data.nomSignataire || ''} onChange={v => update('nomSignataire', v)} required />
          <FormField label="Poste / Fonction" value={data.posteSignataire || ''} onChange={v => update('posteSignataire', v)} required />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Type de contrat" value={data.typeContrat || ''} onChange={v => update('typeContrat', v)} />
            <FormField label="Date de début de mission" value={data.dateDebutMission || ''} onChange={v => update('dateDebutMission', v)} />
          </div>
          <FormField label="Nom du salon / Établissement" value={data.nomSalon || ''} onChange={v => update('nomSalon', v)} />
        </div>
      </div>

      {/* Préambule */}
      <div className="mb-4">
        <div className="px-3 py-2 mb-3" style={{ background: '#1a1a1a', borderRadius: 6 }}>
          <p className="text-xs font-700 uppercase tracking-wider" style={{ color: '#fff', fontWeight: 700 }}>PRÉAMBULE</p>
        </div>
        <div className="p-4 rounded-xl text-xs leading-relaxed space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)', color: '#374151', lineHeight: 1.7 }}>
          <p>Dans le cadre de ses fonctions au sein du salon de piercing, le signataire est amené à accéder à des données personnelles de clients, incluant notamment des <strong style={{ color: '#111827' }}>données de santé</strong> au sens de l'article 9 du RGPD (Règlement UE 2016/679). Ces données sont strictement confidentielles et font l'objet d'une protection renforcée en droit français et européen.</p>
          <p>Conformément à l'article 29 du RGPD, les personnes agissant sous l'autorité du responsable de traitement ne peuvent traiter ces données que sur instruction de ce dernier, sauf obligation légale contraire.</p>
        </div>
      </div>

      {/* Obligations */}
      <div className="mb-4">
        <div className="px-3 py-2 mb-3" style={{ background: '#1a1a1a', borderRadius: 6 }}>
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
            <div key={item.num} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
              <p className="text-xs font-700 mb-1" style={{ color: '#111827', fontWeight: 700 }}>
                {item.num} — {item.titre}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#374151', lineHeight: 1.7 }}>{item.texte}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Avertissement pénal */}
      <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.3)' }}>
        <p className="text-xs leading-relaxed" style={{ color: '#374151', lineHeight: 1.7 }}>
          ■ Tout manquement expose le signataire à des sanctions disciplinaires pouvant aller jusqu'au licenciement pour faute grave, sans préjudice des poursuites pénales au titre de l'article 226-13 du Code pénal (violation du secret professionnel : <strong style={{ color: '#E53935' }}>1 an d'emprisonnement et 15 000 € d'amende</strong>).
        </p>
      </div>

      {/* Durée de l'engagement */}
      <div className="mb-4">
        <div className="px-3 py-2 mb-3" style={{ background: '#1a1a1a', borderRadius: 6 }}>
          <p className="text-xs font-700 uppercase tracking-wider" style={{ color: '#fff', fontWeight: 700 }}>DURÉE DE L'ENGAGEMENT</p>
        </div>
        <div className="p-4 rounded-xl text-xs leading-relaxed" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)', color: '#374151', lineHeight: 1.7 }}>
          <p>Le présent engagement prend effet à la date de signature et s'applique pendant toute la durée de la relation contractuelle. Les obligations de confidentialité <strong style={{ color: '#111827' }}>survivent à la cessation du contrat, sans limitation de durée</strong>, pour toutes les informations auxquelles le signataire a eu accès.</p>
        </div>
      </div>

      {/* Signatures */}
      <div className="mb-4">
        <div className="px-3 py-2 mb-3" style={{ background: '#1a1a1a', borderRadius: 6 }}>
          <p className="text-xs font-700 uppercase tracking-wider" style={{ color: '#fff', fontWeight: 700 }}>SIGNATURES</p>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
            <p className="text-xs font-700" style={{ color: '#111827', fontWeight: 700 }}>LE SIGNATAIRE — Lu et approuvé</p>
            <FormField label="Nom, Prénom" value={data.signataireNomSignature || ''} onChange={v => update('signataireNomSignature', v)} />
            <FormField label="Date" value={data.signataireDate || ''} onChange={v => update('signataireDate', v)} />
            <SignaturePad
              label="Signature du signataire"
              value={data.signatureImageSignataire || ''}
              onChange={v => update('signatureImageSignataire', v ?? '')}
            />
          </div>
          <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
            <p className="text-xs font-700" style={{ color: '#111827', fontWeight: 700 }}>LE RESPONSABLE DU SALON</p>
            <FormField label="Nom, Prénom" value={data.responsableNomSignature || ''} onChange={v => update('responsableNomSignature', v)} />
            <FormField label="Date" value={data.responsableDate || ''} onChange={v => update('responsableDate', v)} />
            <SignaturePad
              label="Signature du responsable"
              value={data.signatureImageResponsable || ''}
              onChange={v => update('signatureImageResponsable', v ?? '')}
            />
          </div>
        </div>
      </div>

      <div className="text-center mt-4">
        <p className="text-xs italic" style={{ color: '#374151' }}>Document à établir en deux exemplaires originaux — Un exemplaire conservé par le salon, un exemplaire remis au signataire.</p>
      </div>
    </>
  );
}

// ─── Formulaire Affichage Salon — Information Client RGPD ───────────────────────────────────

function FormAffichageSalon({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
  const blocs = [
    {
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
        <h2 className="text-xl font-900 mb-1" style={{ color: '#111827', fontFamily: 'Outfit', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
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
              background: 'rgba(255,255,255,0.03)',
              border: `2px solid ${bloc.borderColor}`,
            }}
          >
            <p className="text-sm font-700 mb-2" style={{ color: bloc.titleColor, fontWeight: 700 }}>
              {bloc.titre}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: '#374151', lineHeight: 1.7 }}>
              {bloc.texte}
            </p>
          </div>
        ))}
      </div>

      {/* Personnalisation salon */}
      <div className="mb-4">
        <div className="px-3 py-2 mb-3" style={{ background: '#1a1a1a', borderRadius: 6 }}>
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
        <p className="text-xs" style={{ color: '#374151', lineHeight: 1.7 }}>
          <strong style={{ color: '#E53935' }}>Base légale :</strong> Règlement (UE) 2016/679 du Parlement européen et du Conseil du 27 avril 2016 (RGPD). Ce document est destiné à être affiché dans le salon ou remis au client lors de chaque prestation.
        </p>
      </div>
    </>
  );
}

export default function DocumentForm() {
  const params = useParams<{ clientId: string; docType: string }>();
  const [, navigate] = useLocation();
  const { state, updateClient } = useApp();
  const clientId = params.clientId;
  const docType = params.docType as DocumentType;

  // Mode sans client : pas de clientId dans l'URL (route /document/:docType)
  const isStandaloneMode = !clientId;

  // Client fictif pour le mode sans client
  const STANDALONE_CLIENT: Client = {
    id: '__standalone__',
    nom: '',
    prenom: '',
    dateNaissance: '',
    adresse: '',
    codePostal: '',
    ville: '',
    telephone: '',
    email: '',
    estMineur: false,
    prestations: [],
    documentsAssocies: [],
    documents: [],
    photos: [],
    dateCreation: new Date().toISOString(),
    dateSuppressionPrevue: '',
    rgpdStatus: 'ok',
    rgpdDroitsExerces: [],
    estArchive: false,
  };

  // Détection du paramètre ?print=1 dans l'URL pour impression automatique
  const autoPrint = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('print') === '1';

  const client = isStandaloneMode ? STANDALONE_CLIENT : state.clients.find(c => c.id === clientId);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (client) {
      const existingDoc = client.documents?.find(d => d.type === docType);
      const today = new Date().toLocaleDateString('fr-FR');

      // Données d'identité du client à synchroniser automatiquement dans tous les formulaires
      const clientIdentity: Record<string, any> = {
        // Champs standards
        nom: client.nom || '',
        prenom: client.prenom || '',
        dateNaissance: client.dateNaissance || '',
        telephone: client.telephone || '',
        email: client.email || '',
        adresse: client.adresse || '',
        codePostal: client.codePostal || '',
        ville: client.ville || '',
        // Variantes de noms utilisées dans certains formulaires
        nomClient: client.nom || '',
        prenomClient: client.prenom || '',
        telephoneClient: client.telephone || '',
        emailClient: client.email || '',
        // Champs mineur (identité du mineur = identité du client)
        nomMineur: client.nom || '',
        prenomMineur: client.prenom || '',
        dateNaissanceMineur: client.dateNaissance || '',
        // Pièce d'identité — synchronisée depuis la fiche client vers tous les formulaires
        // Champ texte libre (Questionnaire majeur piercing)
        pieceId: client.pieceIdentiteType || '',
        numeroPiece: client.pieceIdentiteNumero || '',
        // Champs radio + numéro (Questionnaire tatouage majeur, dermographe, fiche séance tatouage)
        pieceIdType: client.pieceIdentiteType || '',
        pieceIdNumero: client.pieceIdentiteNumero || '',
        // Champs mineur (Questionnaire médical mineur piercing)
        pieceIdMineurType: client.pieceIdentiteType || '',
        pieceIdMineurNumero: client.pieceIdentiteNumero || '',
        // Pré-remplissage de la zone à percer depuis les prestations souhaitées
        zonePiercing: (() => {
          const prestationsPiercing = ['Oreilles', 'Nez', 'Nombril', 'Téton', 'Arcade / Sourcil', 'Surface / Dermal'];
          const zones = (client.prestationsSouhaitees || []).filter(p => prestationsPiercing.includes(p));
          return zones.length > 0 ? zones.join(', ') : '';
        })(),
        // Champs de signature client pré-remplis
        nomClientSign: client.nom ? `${client.prenom || ''} ${client.nom}`.trim() : '',
        dateSignatureClient: today,
        dateSignaturePierceur: today,
        dateSignatureTatoueur: today,
        dateSignatureDermographe: today,
        dateSignatureParent: today,
      };

      if (existingDoc?.data) {
        // Document existant : on fusionne en prioritisant les données sauvegardées,
        // mais on met à jour les champs d'identité si le client a été modifié
        const saved = existingDoc.data as Record<string, any>;
        const merged: Record<string, any> = { ...clientIdentity };
        // Pour chaque clé sauvegardée, on garde la valeur sauf si elle est vide
        for (const key of Object.keys(saved)) {
          if (saved[key] !== undefined && saved[key] !== null && saved[key] !== '') {
            merged[key] = saved[key];
          }
        }
        // Forcer la resynchronisation des champs d'identité depuis le client
        const identityKeys = ['nom', 'prenom', 'dateNaissance', 'telephone', 'email', 'adresse', 'codePostal', 'ville',
          'nomClient', 'prenomClient', 'telephoneClient', 'emailClient',
          'nomMineur', 'prenomMineur', 'dateNaissanceMineur', 'nomClientSign',
          'pieceId', 'numeroPiece', 'pieceIdType', 'pieceIdNumero',
          'pieceIdMineurType', 'pieceIdMineurNumero'];
        for (const key of identityKeys) {
          if (clientIdentity[key]) merged[key] = clientIdentity[key];
        }
        setFormData(merged);
      } else {
        // Nouveau document : on pré-remplit avec toutes les données du client
        setFormData(clientIdentity);
      }
    }
   }, [client?.id, docType]);

  // Impression automatique si ?print=1 dans l'URL (déclenché après chargement des données)
  useEffect(() => {
    if (autoPrint && Object.keys(formData).length > 0) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, formData]);

  function updateField(key: string, value: any) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  // Fiches de consentement critiques qui requièrent une signature obligatoire
  const FICHES_SIGNATURE_OBLIGATOIRE: DocumentType[] = [
    'questionnaire_mineur',
    'questionnaire_majeur',
    'questionnaire_tatouage_majeur',
    'questionnaire_dermographe',
    'consentement_soins_tatouage',
  ];

  const signatureRequise = FICHES_SIGNATURE_OBLIGATOIRE.includes(docType);
  const signatureManquante = signatureRequise && !formData.signatureImageClient;

  async function handleSave() {
    if (isStandaloneMode) {
      // En mode standalone, on imprime directement
      handlePrint();
      return;
    }
    if (!client) return;
    if (signatureManquante) {
      toast.error('La signature du client est obligatoire pour valider ce document.');
      return;
    }
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

  if (!client && !isStandaloneMode) {
    return (
      <div className="p-6 text-center" style={{ color: '#374151' }}>
        <p>Client introuvable</p>
        <button onClick={() => navigate('/clients')} className="mt-4 text-sm" style={{ color: 'var(--brand-cyan)' }}>
          Retour aux clients
        </button>
      </div>
    );
  }

  // À ce stade, client est toujours défini (soit un vrai client, soit STANDALONE_CLIENT)
  const effectiveClient = client!;

  const docTitle = DOCUMENT_LABELS[docType] || docType;
  const today = new Date().toLocaleDateString('fr-FR');

  function handlePrint() {
    const style = document.createElement('style');
    style.id = '__print_style__';
    style.innerHTML = `
      @media print {
        /* Mise en page A4 avec marges généreuses pour éviter les coupures */
        @page {
          size: A4 portrait;
          margin: 20mm 15mm 20mm 15mm;
        }

        /* Masquer la sidebar, le header sticky, les boutons et la navigation */
        body > div > aside,
        aside,
        nav,
        .sticky,
        [data-sidebar],
        .no-print { display: none !important; }

        /* Réinitialiser le fond et supprimer les conteneurs scrollables */
        html {
          background: white !important;
          overflow: visible !important;
          height: auto !important;
        }
        body {
          background: white !important;
          color: #111 !important;
          margin: 0 !important;
          padding: 0 !important;
          font-size: 10pt !important;
          width: 100% !important;
          overflow: visible !important;
          height: auto !important;
        }

        /* CRITIQUE Safari iPad : supprimer overflow sur TOUS les conteneurs */
        html, body, main, [role='main'],
        div, section, article, aside, header, footer {
          overflow: visible !important;
          height: auto !important;
          max-height: none !important;
          min-height: 0 !important;
        }
        /* Remettre flex pour les grilles */
        [class*='grid'] {
          height: auto !important;
        }

        /* FORCER LES COULEURS À L'IMPRESSION */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        /* Texte lisible */
        p, span, label, td, th, li, h1, h2, h3, h4, h5, h6 {
          color: #111 !important;
        }

        /* Champs de formulaire */
        input, textarea, select {
          border: 1px solid #999 !important;
          color: #111 !important;
          background: #fff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Cartes */
        .studio-card, [class*='rounded'] {
          border: 1px solid #ccc !important;
          box-shadow: none !important;
          background: white !important;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* Masquer les boutons */
        button { display: none !important; }

        /* En-tête et pied de page d'impression */
        .print-header { display: block !important; margin-bottom: 16px; }
        .print-footer { display: block !important; margin-top: 16px; }

        /* Numérotation des pages */
        .page-num::after { content: counter(page); }

        /* Sections : éviter les coupures en milieu de section */
        section,
        .print-section,
        fieldset {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* Titres de section : ne jamais couper après un titre */
        h2, h3, h4 {
          break-after: avoid;
          page-break-after: avoid;
        }

        /* Tableaux : éviter les coupures */
        table {
          break-inside: avoid;
          page-break-inside: avoid;
          width: 100% !important;
        }
        tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* Canvas de signature */
        canvas {
          display: block !important;
          border: 1px solid #999 !important;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* Assurer que le contenu principal prend toute la largeur */
        .p-4, .p-6, .max-w-3xl {
          padding: 0 !important;
          margin: 0 auto !important;
          width: 100% !important;
          max-width: 100% !important;
        }

        /* Supprimer le padding-bottom */
        .pb-16, .pb-24 {
          padding-bottom: 0 !important;
        }

        /* Images */
        img {
          max-width: 100% !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => { const s = document.getElementById('__print_style__'); if (s) s.remove(); }, 2000);
  }

  // ─── Email SMTP ───
  const sendDocumentEmail = trpc.smtp.sendDocument.useMutation({
    onSuccess: () => { toast.success('Email envoyé avec succès !'); setEmailModal(false); },
    onError: (e) => toast.error(e.message),
  });
  const [emailModal, setEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  function handleEmail() {
    setEmailTo(effectiveClient.email || '');
    setEmailModal(true);
  }

  function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    const clientName = effectiveClient.prenom || effectiveClient.nom
      ? `${effectiveClient.prenom} ${effectiveClient.nom}`.trim()
      : 'Client non renseigné';
    sendDocumentEmail.mutate({
      to: emailTo,
      subject: `${docTitle} — ${clientName}`,
      body: `<p>Veuillez trouver ci-dessous le résumé du document : <strong>${docTitle}</strong></p>
             <p>Client : <strong>${clientName}</strong><br>Date : ${today}</p>
             <p>Ce document a été généré depuis Studio Manager by Intemporelle.</p>`,
      documentTitle: docTitle,
      clientNom: clientName,
    });
  }

  const renderForm = () => {
    switch (docType) {
      case 'questionnaire_mineur':
        return <FormQuestionnaireMineur data={formData} update={updateField} client={effectiveClient} />;
      case 'autorisation_parentale':
        return <FormAutorisationParentale data={formData} update={updateField} client={effectiveClient} salonInfo={state.salonInfo} />;
      case 'questionnaire_majeur':
        return <FormQuestionnaireMajeur data={formData} update={updateField} client={effectiveClient} />;
      case 'fiche_seance_piercing':
        return <FormFicheSeance data={formData} update={updateField} client={effectiveClient} />;
      case 'questionnaire_tatouage_mineur':
        return <FormQuestionnaireTatouageMineur data={formData} update={updateField} client={effectiveClient} />;
      case 'autorisation_parentale_tatouage':
        return <FormAutorisationParentaleTatouage data={formData} update={updateField} client={effectiveClient} />;
      case 'questionnaire_tatouage_majeur':
        return <FormQuestionnaireTatouageMajeur data={formData} update={updateField} client={effectiveClient} />;
      case 'questionnaire_dermographe_mineur':
        return <FormQuestionnaireDermographeMineur data={formData} update={updateField} client={effectiveClient} />;
      case 'autorisation_parentale_dermographie':
        return <FormAutorisationParentaleDermographie data={formData} update={updateField} client={effectiveClient} />;
      case 'questionnaire_dermographe':
        return <FormQuestionnaireDermographe data={formData} update={updateField} client={effectiveClient} />;
      case 'consentement_soins_tatouage':
        return <FormConsentementSoinsTatouage data={formData} update={updateField} client={effectiveClient} />;
      case 'soins_dermographe':
        return <FormSoinsDermographe data={formData} update={updateField} client={effectiveClient} />;
      case 'fiche_seance_tatouage':
        return <FormFicheSeanceTatouage data={formData} update={updateField} client={effectiveClient} />;
      case 'fiche_seance_dermographe':
        return <FormFicheSeanceDermographe data={formData} update={updateField} client={effectiveClient} />;
      case 'engagement_confidentialite':
        return <FormEngagementConfidentialite data={formData} update={updateField} client={effectiveClient} />;
      case 'affichage_salon':
        return <FormAffichageSalon data={formData} update={updateField} client={effectiveClient} />;
      default:
        if (docType.startsWith('soins_') || docType.startsWith('cicatrisation_')) {
          return <FormSoins docType={docType} data={formData} update={updateField} client={effectiveClient} />;
        }
        return (
          <div className="text-center py-8" style={{ color: '#374151' }}>
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
          onClick={() => isStandaloneMode ? navigate('/documents') : navigate(`/clients/${clientId}`)}
          className="p-2 rounded-lg transition-all hover:bg-white/10"
          style={{ color: '#374151' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-700 truncate" style={{ color: '#111827', fontWeight: 700, fontFamily: 'Outfit' }}>
            {docTitle}
          </h1>
          <p className="text-xs truncate" style={{ color: '#374151' }}>
            {isStandaloneMode ? 'Sans client associé' : `${effectiveClient.prenom} ${effectiveClient.nom}`} · {today}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Bouton Aperçu */}
          <button
            onClick={() => setShowPreview(true)}
            title="Aperçu avant impression"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-600 transition-all hover:bg-white/10"
            style={{ color: '#374151', border: '1px solid var(--brand-border)', fontWeight: 600 }}
          >
            <Eye size={15} />
            <span className="hidden sm:inline">Aperçu</span>
          </button>
          {/* Bouton Imprimer */}
          <button
            onClick={handlePrint}
            title="Imprimer le document"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-600 transition-all hover:bg-white/10"
            style={{ color: '#374151', border: '1px solid var(--brand-border)', fontWeight: 600 }}
          >
            <Printer size={15} />
            <span className="hidden sm:inline">Imprimer</span>
          </button>

          {/* Bouton Sauvegarder */}
          <button
            onClick={handleSave}
            disabled={isSaving || signatureManquante}
            title={signatureManquante ? 'Signature du client obligatoire' : 'Sauvegarder le document'}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-600 transition-all"
            style={{
              background: signatureManquante ? 'rgba(192,57,106,0.3)' : 'var(--brand-cyan)',
              color: signatureManquante ? '#C0396A' : 'var(--brand-navy)',
              fontWeight: 600,
              fontFamily: 'Outfit',
              opacity: isSaving ? 0.7 : 1,
              border: signatureManquante ? '1px solid rgba(192,57,106,0.5)' : 'none',
              cursor: signatureManquante ? 'not-allowed' : 'pointer',
            }}
          >
            <Save size={16} />
            {isStandaloneMode ? 'Imprimer' : isSaving ? 'Sauvegarde...' : signatureManquante ? 'Signature requise' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Form content */}
      <div className="p-4 max-w-3xl mx-auto pb-16">
        {/* En-tête visible uniquement à l'impression */}
        <PrintHeader
          salonInfo={state.salonInfo}
          docTitle={docTitle}
          clientName={`${effectiveClient.prenom} ${effectiveClient.nom}`}
          date={today}
          numeroClient={effectiveClient.numeroClient}
        />
        {renderForm()}

        {/* Pied de page visible uniquement à l'impression */}
        <PrintFooter
          salonInfo={state.salonInfo}
          docTitle={docTitle}
        />

        {/* Save button at bottom */}
        <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--brand-border)' }}>
          {signatureManquante && (
            <div className="flex items-center gap-2 mb-3 px-4 py-2 rounded-lg text-xs" style={{ background: 'rgba(192,57,106,0.1)', border: '1px solid rgba(192,57,106,0.3)', color: '#C0396A' }}>
              <AlertTriangle size={14} />
              <span>La <strong>signature du client</strong> est obligatoire pour valider ce document. Veuillez signer dans la section Signatures ci-dessus.</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || signatureManquante}
            className="w-full py-3 rounded-xl text-sm font-700 transition-all"
            style={{
              background: signatureManquante ? 'rgba(192,57,106,0.15)' : 'var(--brand-cyan)',
              color: signatureManquante ? '#C0396A' : 'var(--brand-navy)',
              fontWeight: 700,
              fontFamily: 'Outfit',
              opacity: isSaving ? 0.7 : 1,
              border: signatureManquante ? '1px solid rgba(192,57,106,0.4)' : 'none',
              cursor: signatureManquante ? 'not-allowed' : 'pointer',
            }}
          >
            {isStandaloneMode ? '🖨️ Imprimer le document' : isSaving ? 'Sauvegarde en cours...' : signatureManquante ? '✍️ Signature requise pour sauvegarder' : '✓ Sauvegarder le document'}
          </button>
        </div>
      </div>

      {/* Modal Aperçu avant impression */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: 'rgba(0,0,0,0.92)' }}
        >
          {/* Barre d'outils aperçu */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: '#1a2540', borderBottom: '1px solid rgba(131,208,245,0.2)' }}>
            <div className="flex items-center gap-3">
              <Eye size={18} style={{ color: 'var(--brand-cyan)' }} />
              <div>
                <h3 className="text-sm font-700" style={{ color: '#111827', fontWeight: 700 }}>Aperçu avant impression</h3>
                <p className="text-xs" style={{ color: '#374151' }}>{docTitle} — {effectiveClient.prenom} {effectiveClient.nom}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowPreview(false); setTimeout(handlePrint, 100); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-700 transition-all"
                style={{ background: 'var(--brand-cyan)', color: 'var(--brand-navy)', fontWeight: 700 }}
              >
                <Printer size={15} />
                Imprimer
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 rounded-lg transition-all hover:bg-white/10"
                style={{ color: '#374151' }}
                title="Fermer l'aperçu"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Zone de prévisualisation A4 */}
          <div className="flex-1 overflow-auto p-6 flex justify-center" style={{ background: '#2a2a2a' }}>
            <div
              style={{
                width: '210mm',
                minHeight: '297mm',
                background: 'white',
                color: '#111',
                padding: '15mm',
                boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '10pt',
                lineHeight: 1.5,
              }}
            >
              {/* En-tête imprimable */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, borderBottom: '2px solid #0A1628', paddingBottom: 12, marginBottom: 16 }}>
                {state.salonInfo?.logo && (
                  <img src={state.salonInfo.logo} alt="Logo" style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8 }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '13pt', color: '#0A1628' }}>{state.salonInfo?.nom || 'Studio'}</div>
                  {state.salonInfo?.adresse && <div style={{ fontSize: '9pt', color: '#555' }}>{state.salonInfo.adresse}</div>}
                  {state.salonInfo?.telephone && <div style={{ fontSize: '9pt', color: '#555' }}>Tél : {state.salonInfo.telephone}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '11pt', color: '#0A1628' }}>{docTitle}</div>
                  <div style={{ fontSize: '9pt', color: '#555' }}>Client : {effectiveClient.prenom} {effectiveClient.nom}</div>
                  <div style={{ fontSize: '9pt', color: '#555' }}>Date : {today}</div>
                </div>
              </div>

              {/* Contenu du formulaire en mode preview */}
              <div
                className="preview-content"
                style={{
                  filter: 'none',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                } as React.CSSProperties}
              >
                <style>{`
                  .preview-content * { color: #111 !important; }
                  .preview-content input, .preview-content textarea, .preview-content select {
                    border: 1px solid #ccc !important;
                    background: white !important;
                    color: #111 !important;
                    padding: 2px 6px !important;
                    border-radius: 4px !important;
                    font-size: 9pt !important;
                  }
                  .preview-content label { color: #333 !important; font-size: 9pt !important; }
                  .preview-content h2, .preview-content h3 { color: #0A1628 !important; }
                  .preview-content .section-divider { border-color: #0A1628 !important; }
                  .preview-content canvas { border: 1px solid #ccc !important; background: #f9f9f9 !important; }
                  .preview-content button { display: none !important; }
                  .preview-content [class*="sticky"] { position: relative !important; }
                `}</style>
                {renderForm()}
              </div>

              {/* Pied de page */}
              <div style={{ marginTop: 24, paddingTop: 8, borderTop: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', fontSize: '8pt', color: '#666' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{state.salonInfo?.nom}</div>

                  {state.salonInfo?.siret && <div>SIRET : {state.salonInfo.siret}</div>}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div>Document confidentiel — RGPD Art. 15-17-21</div>
                  {state.salonInfo?.mentionsLegales && <div style={{ fontStyle: 'italic' }}>{state.salonInfo.mentionsLegales}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {state.salonInfo?.siteWeb && <div>{state.salonInfo.siteWeb}</div>}
                  <div>Société Intemporelle</div>
                </div>
              </div>
            </div>
          </div>

          {/* Barre de bas de page */}
          <div className="flex items-center justify-center gap-4 px-4 py-3 flex-shrink-0" style={{ background: '#1a2540', borderTop: '1px solid rgba(131,208,245,0.2)' }}>
            <p className="text-xs" style={{ color: '#374151' }}>Vérifiez le contenu avant d'imprimer. Les couleurs et la mise en page peuvent légèrement différer selon votre navigateur.</p>
            <button
              onClick={() => { setShowPreview(false); setTimeout(handlePrint, 100); }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-700 flex-shrink-0"
              style={{ background: 'var(--brand-cyan)', color: 'var(--brand-navy)', fontWeight: 700 }}
            >
              <Printer size={15} />
              Lancer l'impression
            </button>
          </div>
        </div>
      )}

      {/* Modal envoi email */}
      {emailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setEmailModal(false); }}
        >
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--brand-card)', border: '1px solid var(--brand-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mail size={18} style={{ color: 'var(--brand-cyan)' }} />
                <h3 className="text-sm font-700" style={{ color: '#111827', fontWeight: 700 }}>Envoyer par email</h3>
              </div>
              <button type="button" onClick={() => setEmailModal(false)} style={{ color: '#374151' }}><X size={18} /></button>
            </div>

            <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(131,208,245,0.06)', border: '1px solid rgba(131,208,245,0.15)' }}>
              <p className="text-xs" style={{ color: '#374151' }}>Document : <strong style={{ color: '#111827' }}>{docTitle}</strong></p>
              <p className="text-xs mt-1" style={{ color: '#374151' }}>Client : <strong style={{ color: '#111827' }}>{effectiveClient.prenom} {effectiveClient.nom}</strong></p>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: '#374151', fontWeight: 500 }}>Adresse email du destinataire</label>
                <input
                  type="email"
                  required
                  value={emailTo}
                  onChange={e => setEmailTo(e.target.value)}
                  placeholder="client@exemple.fr"
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--brand-navy)', border: '1px solid var(--brand-border)', color: '#111827', outline: 'none' }}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEmailModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: '#374151' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={sendDocumentEmail.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-700"
                  style={{
                    background: sendDocumentEmail.isPending ? 'rgba(131,208,245,0.5)' : 'var(--brand-cyan)',
                    color: 'var(--brand-navy)',
                    fontWeight: 700,
                    cursor: sendDocumentEmail.isPending ? 'not-allowed' : 'pointer',
                  }}
                >
                  {sendDocumentEmail.isPending
                    ? <><Loader2 size={14} className="animate-spin" />Envoi en cours...</>
                    : <><Send size={14} />Envoyer</>}
                </button>
              </div>
            </form>

            <p className="text-xs mt-3" style={{ color: '#374151', opacity: 0.7 }}>
              L'email est envoyé via votre serveur SMTP configuré dans Paramètres.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Exports pour PrintAll ────────────────────────────────────────────────────
export {
  PrintHeader,
  PrintFooter,
  FormQuestionnaireMineur,
  FormQuestionnaireMajeur,
  FormAutorisationParentale,
  FormSoins,
  FormFicheSeance,
  FormConsentementSoinsTatouage,
  FormFicheSeanceTatouage,
  FormQuestionnaireDermographeMineur,
  FormAutorisationParentaleDermographie,
  FormQuestionnaireTatouageMineur,
  FormAutorisationParentaleTatouage,
  FormQuestionnaireTatouageMajeur,
  FormFicheSeanceDermographe,
  FormQuestionnaireDermographe,
  FormSoinsDermographe,
  FormEngagementConfidentialite,
  FormAffichageSalon,
};

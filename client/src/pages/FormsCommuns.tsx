import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/lib/app-context';
import { AlertTriangle, CheckCircle, Phone } from 'lucide-react';
import { Client } from '@/lib/types';
import SignaturePad from '@/components/SignaturePad';

function FormSection({ title }: { title: string }) {
  return (
    <div className="my-4">
      <div className="px-3 py-2 rounded-lg" style={{
        background: 'linear-gradient(135deg, #0a4a7a 0%, #0077aa 100%)',
        color: '#ffffff',
        fontWeight: 700,
        fontFamily: 'Outfit',
        fontSize: '12px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
      }}>{title}</div>
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
      <label className="block text-xs mb-1" style={{ color: '#111111', fontWeight: 700 }}>
        {label}{required && <span style={{ color: 'var(--brand-rose)' }}> *</span>}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 rounded-lg text-sm resize-none outline-none"
          data-required={required ? 'true' : undefined}
          data-label={required ? label : undefined}
          style={{
            background: '#f8f9fa',
            border: '1px solid #aaaaaa',
            color: '#111111',
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
          data-required={required ? 'true' : undefined}
          data-label={required ? label : undefined}
          style={{
            background: '#f8f9fa',
            border: '1px solid #aaaaaa',
            color: '#111111',
            fontFamily: 'Outfit',
          }}
        />
      )}
    </div>
  );
}

function RadioField({ label, options, value, onChange, required }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div className="mb-3">
      {required && <input type="hidden" data-required="true" data-label={label} value={value} readOnly />}
      <label className="block mb-2" style={{ color: required && !value ? '#b71c1c' : '#111111', fontWeight: 700, fontSize: '16px' }}>{label}{required && !value && <span style={{ color: '#b71c1c', marginLeft: 4 }}>*</span>}</label>
      <div className="flex flex-wrap gap-2">
        {(Array.isArray(options) ? options : []).map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{
              background: value === opt ? '#0a4a7a' : '#ffffff',
              border: `2px solid ${value === opt ? '#0a4a7a' : '#555555'}`,
              color: value === opt ? '#ffffff' : '#111111',
              fontFamily: 'Outfit',
              fontWeight: 700,
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}


function DateSlashField({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  const parts = (value || '').split('/');
  const dd = (parts[0] || '').trim();
  const mm = (parts[1] || '').trim();
  const yyyy = (parts[2] || '').trim();
  const refMM = useRef<HTMLInputElement>(null);
  const refYYYY = useRef<HTMLInputElement>(null);
  const update = (newDd: string, newMm: string, newYyyy: string) => {
    const joined = [newDd, newMm, newYyyy].filter(Boolean).join(' / ');
    onChange(joined);
  };
  return (
    <div>
      {required && <input type="hidden" data-required="true" data-label={label} value={value || ''} readOnly />}
      <label className="block text-xs mb-1" style={{ color: '#9ca3af' }}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
      <div className="flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--brand-border)', borderRadius: 8, padding: '6px 10px' }}>
        <input
          type="text" maxLength={2} placeholder="JJ" value={dd}
          onChange={e => { const v = e.target.value.replace(/\D/g,''); update(v, mm, yyyy); if(v.length===2) refMM.current?.focus(); }}
          style={{ width: 28, background: 'transparent', border: 'none', outline: 'none', color: '#000000', fontSize: 14, textAlign: 'center' }}
        />
        <span style={{ color: '#9ca3af' }}>/</span>
        <input
          ref={refMM} type="text" maxLength={2} placeholder="MM" value={mm}
          onChange={e => { const v = e.target.value.replace(/\D/g,''); update(dd, v, yyyy); if(v.length===2) refYYYY.current?.focus(); }}
          onKeyDown={e => { if(e.key==='Backspace' && mm==='' && dd!=='') update('', '', yyyy); }}
          style={{ width: 28, background: 'transparent', border: 'none', outline: 'none', color: '#000000', fontSize: 14, textAlign: 'center' }}
        />
        <span style={{ color: '#9ca3af' }}>/</span>
        <input
          ref={refYYYY} type="text" maxLength={4} placeholder="AAAA" value={yyyy}
          onChange={e => { const v = e.target.value.replace(/\D/g,''); update(dd, mm, v); }}
          onKeyDown={e => { if(e.key==='Backspace' && yyyy==='' && mm!=='') refMM.current?.focus(); }}
          style={{ width: 44, background: 'transparent', border: 'none', outline: 'none', color: '#000000', fontSize: 14, textAlign: 'center' }}
        />
      </div>
    </div>
  );
}
function CheckboxField({ label, value, onToggle, warning, required }: {
  label: string; value: boolean; onToggle: () => void; warning?: boolean; required?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-start gap-3 w-full text-left mb-2 p-2 rounded-lg transition-all"
      data-required-checkbox={required ? 'true' : undefined}
      data-checkbox-label={required ? label : undefined}
      data-checkbox-value={value ? 'true' : 'false'}
      style={{ background: value ? 'rgba(10,74,122,0.05)' : (required && !value ? 'rgba(183,28,28,0.05)' : 'transparent'), border: required && !value ? '1px solid rgba(183,28,28,0.2)' : '1px solid transparent', borderRadius: 6 }}
    >
      <div
        className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center mt-0.5"
        style={{
          background: value ? (warning ? 'rgba(255,152,0,0.2)' : 'rgba(10,74,122,0.2)') : (required ? '#ffebee' : '#ffffff'),
          border: `2px solid ${value ? (warning ? '#FF9800' : '#0a4a7a') : (required ? '#c62828' : '#555555')}`,
        }}
      >
        {value && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke={warning ? '#FF9800' : '#000000'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className="text-sm" style={{ color: warning && value ? '#FF9800' : (required && !value ? '#b71c1c' : '#111111'), fontFamily: 'Outfit', fontWeight: 600 }}>
        {label}{required && !value && <span style={{ color: '#b71c1c', marginLeft: 4 }}>*</span>}
      </span>
    </button>
  );
}

function LegalBox({ children, color = 'cyan' }: { children: React.ReactNode; color?: 'cyan' | 'orange' | 'green' | 'red' }) {
  const colors = {
    cyan: { bg: '#c8e6c9', border: '#388e3c', text: '#1b5e20' },
    orange: { bg: '#ffcdd2', border: '#c62828', text: '#b71c1c' },
    green: { bg: '#e8f5e9', border: '#a5d6a7', text: '#1b5e20' },
    red: { bg: '#ffebee', border: '#ef9a9a', text: '#b71c1c' },
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
  const { state } = useApp();
  const email = state.salonInfo?.email || 'contact@votresalon.fr';
  return (
    <div className="mt-4 mb-2 rounded-xl text-xs" style={{
      background: '#e8f5e9',
      border: '1px solid rgba(131,208,245,0.15)',
      padding: '10px 12px',
      fontFamily: 'Outfit, sans-serif',
      lineHeight: 1.6,
      color: '#1b5e20',
      fontWeight: 600,
    }}>
      <div style={{ fontWeight: 700, color: '#1b5e20', marginBottom: 4, fontSize: 11 }}>VOS DROITS RGPD</div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ fontWeight: 600, color: '#1b5e20' }}>Conservation (mineurs) :</span>{' '}
        3 ans minimum à compter de la majorité du mineur (Art. L1110-4 CSP). Copie conservée par le salon — Pièces jointes : copie de la/des pièce(s) d'identité du/des représentant(s) légal/aux.
      </div>
      <div style={{ marginBottom: 4 }}>
        Dans le cadre de votre prestation, nous collectons et traitons vos données personnelles. Conformément au RGPD, vous disposez des droits suivants :{' '}
        <span style={{ fontWeight: 600, color: '#1b5e20' }}>Art. 15 — Droit d'accès · Art. 16 — Droit de rectification · Art. 17 — Droit à l'effacement · Art. 21 — Droit d'opposition</span>{' '}
        — Conservation : données de santé 3 ans — Pour exercer vos droits :{' '}
        <span style={{ fontWeight: 600, color: '#1a1a2e' }}>{email}</span>
      </div>
      <div>
        <span style={{ fontWeight: 600, color: '#1b5e20' }}>Support :</span>{' '}
        L'écrit électronique a la même force probante que l'écrit papier (Art. 1366 du Code civil). Le salon s'engage à ne pas utiliser les données personnelles à des fins publicitaires.
      </div>
    </div>
  );
}

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl mb-3" style={{ background: '#ffcdd2', border: '2px solid #c62828' }}>
      <AlertTriangle size={14} style={{ color: '#b71c1c', flexShrink: 0, marginTop: 2 }} />
      <span className="text-xs" style={{ color: '#b71c1c', fontFamily: 'Outfit', lineHeight: 1.6, fontWeight: 700 }}>{children}</span>
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
          {/* SIRET supprimé à la demande de l'utilisateur */}
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
          {' '}Conservation : données de santé 3 ans — Pour exercer vos droits : <span style={{ fontWeight: 600 }}>{salonInfo?.email || "contact@votresalon.fr"}</span>
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
            <div>Développé par Société Intemporelle · www.studiomanagereurope.eu</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Formulaire Questionnaire Médical Mineur ─────────────────────────────────


export { FormSection, FormField, RadioField, DateSlashField, CheckboxField, LegalBox, RgpdMentions, WarningBox, AgeVerif, PrintHeader, PrintFooter };

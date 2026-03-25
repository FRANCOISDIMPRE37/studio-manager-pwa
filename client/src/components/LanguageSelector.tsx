import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';

// Toutes les langues européennes officielles + principales langues de l'UE
export const EUROPEAN_LANGUAGES = [
  // Langues avec traduction complète
  { code: 'fr', flag: '🇫🇷', name: 'Français', native: 'Français', complete: true },
  { code: 'en', flag: '🇬🇧', name: 'English', native: 'English', complete: true },
  { code: 'de', flag: '🇩🇪', name: 'Allemand', native: 'Deutsch', complete: true },
  { code: 'nl', flag: '🇳🇱', name: 'Néerlandais', native: 'Nederlands', complete: true },
  // Langues avec traduction partielle (fallback FR)
  { code: 'es', flag: '🇪🇸', name: 'Espagnol', native: 'Español', complete: false },
  { code: 'it', flag: '🇮🇹', name: 'Italien', native: 'Italiano', complete: false },
  { code: 'pt', flag: '🇵🇹', name: 'Portugais', native: 'Português', complete: false },
  { code: 'pl', flag: '🇵🇱', name: 'Polonais', native: 'Polski', complete: false },
  { code: 'ro', flag: '🇷🇴', name: 'Roumain', native: 'Română', complete: false },
  { code: 'cs', flag: '🇨🇿', name: 'Tchèque', native: 'Čeština', complete: false },
  { code: 'hu', flag: '🇭🇺', name: 'Hongrois', native: 'Magyar', complete: false },
  { code: 'sv', flag: '🇸🇪', name: 'Suédois', native: 'Svenska', complete: false },
  { code: 'da', flag: '🇩🇰', name: 'Danois', native: 'Dansk', complete: false },
  { code: 'fi', flag: '🇫🇮', name: 'Finnois', native: 'Suomi', complete: false },
  { code: 'sk', flag: '🇸🇰', name: 'Slovaque', native: 'Slovenčina', complete: false },
  { code: 'bg', flag: '🇧🇬', name: 'Bulgare', native: 'Български', complete: false },
  { code: 'hr', flag: '🇭🇷', name: 'Croate', native: 'Hrvatski', complete: false },
  { code: 'el', flag: '🇬🇷', name: 'Grec', native: 'Ελληνικά', complete: false },
  { code: 'lt', flag: '🇱🇹', name: 'Lituanien', native: 'Lietuvių', complete: false },
  { code: 'lv', flag: '🇱🇻', name: 'Letton', native: 'Latviešu', complete: false },
  { code: 'et', flag: '🇪🇪', name: 'Estonien', native: 'Eesti', complete: false },
  { code: 'sl', flag: '🇸🇮', name: 'Slovène', native: 'Slovenščina', complete: false },
  { code: 'ga', flag: '🇮🇪', name: 'Irlandais', native: 'Gaeilge', complete: false },
  { code: 'mt', flag: '🇲🇹', name: 'Maltais', native: 'Malti', complete: false },
  { code: 'lb', flag: '🇱🇺', name: 'Luxembourgeois', native: 'Lëtzebuergesch', complete: false },
  { code: 'no', flag: '🇳🇴', name: 'Norvégien', native: 'Norsk', complete: false },
  { code: 'is', flag: '🇮🇸', name: 'Islandais', native: 'Íslenska', complete: false },
  { code: 'tr', flag: '🇹🇷', name: 'Turc', native: 'Türkçe', complete: false },
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = EUROPEAN_LANGUAGES.find(l => l.code === i18n.language)
    || EUROPEAN_LANGUAGES.find(l => l.code === i18n.language.split('-')[0])
    || EUROPEAN_LANGUAGES[0];

  // Fermer si clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (code: string, name: string, complete: boolean) => {
    i18n.changeLanguage(code);
    setOpen(false);
    if (!complete) {
      toast.info(`${name} — traduction en cours, affichage en français`);
    } else {
      toast.success(`Langue : ${name}`);
    }
  };

  return (
    <div ref={ref} className="relative px-2 py-1">
      {/* Bouton déclencheur */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md transition-all duration-200 hover:bg-white/5"
        style={{
          color: 'var(--brand-text-muted)',
          border: '1px solid var(--brand-border)',
          background: open ? 'rgba(255,255,255,0.05)' : 'transparent',
        }}
      >
        <Globe size={13} style={{ color: 'var(--brand-cyan)', flexShrink: 0 }} />
        <span className="text-xs" style={{ color: 'var(--brand-cyan)' }}>{current.flag}</span>
        <span className="text-xs font-600 truncate" style={{ color: 'var(--brand-text)', fontWeight: 600, fontSize: '11px' }}>
          {current.native}
        </span>
        <ChevronDown
          size={12}
          className="ml-auto flex-shrink-0 transition-transform duration-200"
          style={{
            color: 'var(--brand-text-muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Menu déroulant */}
      {open && (
        <div
          className="absolute bottom-full left-0 right-0 mb-1 rounded-md overflow-hidden z-50"
          style={{
            background: '#0D1E38',
            border: '1px solid var(--brand-border)',
            boxShadow: '0 -8px 24px rgba(0,0,0,0.5)',
            maxHeight: '280px',
            overflowY: 'auto',
          }}
        >
          {/* Section : traductions complètes */}
          <div
            className="px-3 py-1 text-xs uppercase tracking-wider"
            style={{ color: 'var(--brand-cyan)', fontSize: '9px', opacity: 0.8, background: 'rgba(0,200,220,0.05)' }}
          >
            Traduction complète
          </div>
          {EUROPEAN_LANGUAGES.filter(l => l.complete).map(lang => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code, lang.native, lang.complete)}
              className="flex items-center gap-2 w-full px-3 py-2 text-left transition-all duration-150 hover:bg-white/5"
              style={{
                background: current.code === lang.code ? 'rgba(0,200,220,0.1)' : 'transparent',
              }}
            >
              <span className="text-sm flex-shrink-0">{lang.flag}</span>
              <span
                className="text-xs flex-1 truncate"
                style={{
                  color: current.code === lang.code ? 'var(--brand-cyan)' : 'var(--brand-text)',
                  fontWeight: current.code === lang.code ? 600 : 400,
                }}
              >
                {lang.native}
              </span>
              {current.code === lang.code && (
                <Check size={12} style={{ color: 'var(--brand-cyan)', flexShrink: 0 }} />
              )}
            </button>
          ))}

          {/* Section : traductions en cours */}
          <div
            className="px-3 py-1 text-xs uppercase tracking-wider"
            style={{ color: 'var(--brand-text-muted)', fontSize: '9px', opacity: 0.7, background: 'rgba(255,255,255,0.02)' }}
          >
            En cours de traduction
          </div>
          {EUROPEAN_LANGUAGES.filter(l => !l.complete).map(lang => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code, lang.native, lang.complete)}
              className="flex items-center gap-2 w-full px-3 py-2 text-left transition-all duration-150 hover:bg-white/5"
              style={{
                background: current.code === lang.code ? 'rgba(0,200,220,0.08)' : 'transparent',
              }}
            >
              <span className="text-sm flex-shrink-0">{lang.flag}</span>
              <span
                className="text-xs flex-1 truncate"
                style={{
                  color: current.code === lang.code ? 'var(--brand-cyan)' : 'var(--brand-text-muted)',
                  fontWeight: current.code === lang.code ? 600 : 400,
                }}
              >
                {lang.native}
              </span>
              {current.code === lang.code && (
                <Check size={12} style={{ color: 'var(--brand-cyan)', flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

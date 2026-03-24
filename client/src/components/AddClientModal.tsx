/*
 * DESIGN: Studio Nocturne — Modal d'ajout de client
 * Validation: erreurs uniquement après blur (touched) ou soumission
 * Version 3 — approche touched par champ, impossible d'afficher des erreurs à l'ouverture
 */
import { useState, useRef } from 'react';
import { useApp } from '@/lib/app-context';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DocumentType } from '@/lib/types';
import { toast } from 'sonner';

const DOCS_MINEURS: DocumentType[] = ['questionnaire_mineur', 'autorisation_parentale'];

// Correspondance prestation souhaitée → documents associés
const PRESTATION_DOCS_MAJEUR: Record<string, DocumentType[]> = {
  'Oreilles':          ['questionnaire_majeur', 'soins_oreilles', 'fiche_seance_piercing'],
  'Nez':               ['questionnaire_majeur', 'soins_nez', 'fiche_seance_piercing'],
  'Bouche & Lèvres':   ['questionnaire_majeur', 'soins_bouche_levres', 'fiche_seance_piercing'],
  'Nombril':           ['questionnaire_majeur', 'soins_nombril', 'fiche_seance_piercing'],
  'Mamelons':          ['questionnaire_majeur', 'soins_mamelons', 'fiche_seance_piercing'],
  'Arcade / Sourcil':  ['questionnaire_majeur', 'soins_arcade_sourcil', 'fiche_seance_piercing'],
  'Surface / Dermal':  ['questionnaire_majeur', 'soins_surface_dermal', 'fiche_seance_piercing'],
  'Tatouage':          ['questionnaire_tatouage_majeur', 'consentement_soins_tatouage', 'fiche_seance_tatouage'],
  'Dermographie':      ['questionnaire_dermographe', 'soins_dermographe', 'fiche_seance_dermographe'],
};

const PRESTATION_DOCS_MINEUR: Record<string, DocumentType[]> = {
  'Oreilles':          ['questionnaire_mineur', 'soins_oreilles', 'fiche_seance_piercing'],
  'Nez':               ['questionnaire_mineur', 'soins_nez', 'fiche_seance_piercing'],
  'Bouche & Lèvres':   ['questionnaire_mineur', 'soins_bouche_levres', 'fiche_seance_piercing'],
  'Nombril':           ['questionnaire_mineur', 'soins_nombril', 'fiche_seance_piercing'],
  'Mamelons':          ['questionnaire_mineur', 'soins_mamelons', 'fiche_seance_piercing'],
  'Arcade / Sourcil':  ['questionnaire_mineur', 'soins_arcade_sourcil', 'fiche_seance_piercing'],
  'Surface / Dermal':  ['questionnaire_mineur', 'soins_surface_dermal', 'fiche_seance_piercing'],
  'Tatouage':          ['questionnaire_tatouage_majeur', 'consentement_soins_tatouage', 'fiche_seance_tatouage'],
  'Dermographie':      ['questionnaire_dermographe', 'soins_dermographe', 'fiche_seance_dermographe'],
};

function buildDocumentsAssocies(prestations: string[], isMineur: boolean): DocumentType[] {
  const set = new Set<DocumentType>();
  // Toujours ajouter l'autorisation parentale pour les mineurs
  if (isMineur) set.add('autorisation_parentale');
  const map = isMineur ? PRESTATION_DOCS_MINEUR : PRESTATION_DOCS_MAJEUR;
  for (const p of prestations) {
    const docs = map[p] || [];
    docs.forEach(d => set.add(d));
  }
  return Array.from(set);
}

interface Props {
  onClose: () => void;
}

function calcAge(j: string, m: string, a: string): number {
  if (!j || !m || !a || a.length < 4) return -1;
  const birth = new Date(parseInt(a), parseInt(m) - 1, parseInt(j));
  if (isNaN(birth.getTime())) return -1;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const diff = now.getMonth() - birth.getMonth();
  if (diff < 0 || (diff === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export default function AddClientModal({ onClose }: Props) {
  const { addClient, state } = useApp();

  // Champs du formulaire
  const refMois = useRef<HTMLInputElement>(null);
  const refAnnee = useRef<HTMLInputElement>(null);
  const refTelephone = useRef<HTMLInputElement>(null);

  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [dateJour, setDateJour] = useState('');
  const [dateMois, setDateMois] = useState('');
  const [dateAnnee, setDateAnnee] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [prestationsSouhaitees, setPrestationsSouhaitees] = useState<string[]>([]);

  const PRESTATIONS_OPTIONS = [
    'Oreilles',
    'Nez',
    'Bouche & Lèvres',
    'Nombril',
    'Mamelons',
    'Arcade / Sourcil',
    'Surface / Dermal',
    'Tatouage',
    'Dermographie',
  ];

  const togglePrestation = (p: string) => {
    setPrestationsSouhaitees(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };


  // Suivi des champs touchés (blur) — jamais true à l'initialisation
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  // Indique si le bouton soumettre a été cliqué au moins une fois
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const touch = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  // Calcul de l'âge
  const age = calcAge(dateJour, dateMois, dateAnnee);
  const isMineur = age >= 0 && age < 18;
  const isDateValid = age >= 0 && age <= 120;

  // Validation des champs requis
  const getError = (field: string): string => {
    // N'afficher l'erreur que si le champ a été touché OU si soumission tentée
    const shouldShow = submitAttempted || touched[field];
    if (!shouldShow) return '';

    switch (field) {
      case 'prenom': return !prenom.trim() ? 'Le prénom est requis' : '';
      case 'nom': return !nom.trim() ? 'Le nom est requis' : '';
      case 'telephone': return !telephone.trim() ? 'Le téléphone est requis' : '';
      case 'date':
        if (!dateJour || !dateMois || !dateAnnee) return 'La date de naissance est requise';
        if (!isDateValid) return 'Date invalide';
        return '';
      default: return '';
    }
  };

  const isFormValid = (): boolean => {
    return (
      prenom.trim() !== '' &&
      nom.trim() !== '' &&
      telephone.trim() !== '' &&
      dateJour !== '' && dateMois !== '' && dateAnnee !== '' &&
      isDateValid
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!isFormValid()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const dateNaissanceISO = `${dateAnnee}-${dateMois.padStart(2, '0')}-${dateJour.padStart(2, '0')}`;

    const docsAssocies: DocumentType[] = buildDocumentsAssocies(prestationsSouhaitees, isMineur);

    const d = new Date();
    d.setFullYear(d.getFullYear() + 5);
    const dateSuppressionPrevue = d.toISOString().split('T')[0];

    addClient({
      prenom: prenom.trim(),
      nom: nom.trim().toUpperCase(),
      dateNaissance: dateNaissanceISO,
      telephone: telephone.trim(),
      email: email.trim() || undefined,
      adresse: '',
      codePostal: '',
      ville: '',
      pieceIdentiteType: undefined,
      pieceIdentiteNumero: undefined,
      prestationsSouhaitees: prestationsSouhaitees.length > 0 ? prestationsSouhaitees : undefined,
      estMineur: isMineur,
      prestations: [],
      documentsAssocies: docsAssocies,
      documents: [],
      photos: [],
      dateConsentement: new Date().toISOString().split('T')[0],
      dateSuppressionPrevue,
      rgpdDroitsExerces: [],
      estArchive: false,
    });

    toast.success(`✓ ${prenom.trim()} ${nom.trim().toUpperCase()} ajouté(e)`);
    onClose();
  };

  // Styles
  const inputBase: React.CSSProperties = {
    background: 'var(--brand-navy)',
    border: '1px solid var(--brand-border)',
    color: 'var(--brand-text)',
    borderRadius: '0.5rem',
    padding: '0.6rem 0.75rem',
    width: '100%',
    fontSize: '15px',
    outline: 'none',
    WebkitAppearance: 'none',
    appearance: 'none',
  };

  const inputErrorStyle: React.CSSProperties = {
    ...inputBase,
    border: '1px solid #F44336',
  };

  const getStyle = (field: string) => getError(field) ? inputErrorStyle : inputBase;

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    color: 'var(--brand-text-muted)',
    marginBottom: '4px',
    fontWeight: 500,
  };

  const errPrenom = getError('prenom');
  const errNom = getError('nom');
  const errTel = getError('telephone');
  const errDate = getError('date');
  const dateInputStyle = errDate ? inputErrorStyle : inputBase;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-0" style={{ overflowY: 'auto' }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full md:max-w-lg my-0 md:my-8 rounded-b-2xl md:rounded-xl"
        style={{ background: 'var(--brand-navy-light)', border: '1px solid var(--brand-border)', minHeight: 'auto' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b sticky top-0 z-10"
          style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-navy-light)' }}
        >
          <h2 className="text-base" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>
            Nouveau client
          </h2>
          {state.isDemo && (
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{ background: 'rgba(255,152,0,0.15)', color: '#FF9800', border: '1px solid #FF9800' }}
            >
              Mode démo
            </span>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-all">
            <X size={18} style={{ color: 'var(--brand-text-muted)' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-5" noValidate>

          {/* IDENTITÉ */}
          <div>
            <p className="text-xs mb-3 uppercase tracking-wide" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>
              Identité
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Prénom */}
              <div>
                <label style={labelStyle}>Prénom *</label>
                <input
                  style={getStyle('prenom')}
                  value={prenom}
                  onChange={e => setPrenom(e.target.value)}
                  onBlur={() => touch('prenom')}
                  placeholder="Ex: Marie"
                  autoComplete="given-name"
                  autoCapitalize="words"
                  inputMode="text"
                />
                {errPrenom && (
                  <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}>
                    <AlertCircle size={11} /> {errPrenom}
                  </p>
                )}
              </div>

              {/* Nom */}
              <div>
                <label style={labelStyle}>Nom *</label>
                <input
                  style={getStyle('nom')}
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  onBlur={() => touch('nom')}
                  placeholder="Ex: DUPUIS"
                  autoComplete="family-name"
                  autoCapitalize="characters"
                  inputMode="text"
                />
                {errNom && (
                  <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}>
                    <AlertCircle size={11} /> {errNom}
                  </p>
                )}
              </div>
            </div>

            {/* Date de naissance */}
            <div className="mt-3">
              <label style={labelStyle}>Date de naissance *</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  style={dateInputStyle}
                  value={dateJour}
                  onChange={e => {
                    const v = e.target.value.slice(0, 2);
                    setDateJour(v);
                    if (v.length === 2) refMois.current?.focus();
                  }}
                  onBlur={() => touch('date')}
                  placeholder="JJ"
                  min="1" max="31"
                />
                <input
                  ref={refMois}
                  type="number"
                  style={dateInputStyle}
                  value={dateMois}
                  onChange={e => {
                    const v = e.target.value.slice(0, 2);
                    setDateMois(v);
                    if (v.length === 2) refAnnee.current?.focus();
                  }}
                  onBlur={() => touch('date')}
                  placeholder="MM"
                  min="1" max="12"
                />
                <input
                  ref={refAnnee}
                  type="number"
                  style={dateInputStyle}
                  value={dateAnnee}
                  onChange={e => {
                    const v = e.target.value.slice(0, 4);
                    setDateAnnee(v);
                    if (v.length === 4) refTelephone.current?.focus();
                  }}
                  onBlur={() => touch('date')}
                  placeholder="AAAA"
                  min="1900" max={new Date().getFullYear()}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)', opacity: 0.6 }}>
                Jour / Mois / Année
              </p>
              {errDate && (
                <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}>
                  <AlertCircle size={11} /> {errDate}
                </p>
              )}
              {isDateValid && (
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-700"
                    style={{
                      background: isMineur ? 'rgba(156,39,176,0.15)' : 'rgba(76,175,80,0.15)',
                      color: isMineur ? '#CE93D8' : '#81C784',
                      border: `1px solid ${isMineur ? 'rgba(156,39,176,0.5)' : 'rgba(76,175,80,0.5)'}`,
                      fontWeight: 700,
                    }}
                  >
                    {isMineur
                      ? <><AlertCircle size={12} /> MINEUR — {age} ans</>
                      : <><CheckCircle2 size={12} /> MAJEUR — {age} ans</>
                    }
                  </span>
                  {isMineur && (
                    <span className="text-xs" style={{ color: '#CE93D8', opacity: 0.8 }}>
                      Documents parentaux requis
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* CONTACT */}
          <div>
            <p className="text-xs mb-3 uppercase tracking-wide" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>
              Contact
            </p>
            <div className="space-y-3">
              <div>
                <label style={labelStyle}>Téléphone *</label>
                <input
                  ref={refTelephone}
                  type="tel"
                  style={getStyle('telephone')}
                  value={telephone}
                  onChange={e => setTelephone(e.target.value)}
                  onBlur={() => touch('telephone')}
                  placeholder="06 XX XX XX XX"
                  autoComplete="off"
                />
                {errTel && (
                  <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}>
                    <AlertCircle size={11} /> {errTel}
                  </p>
                )}
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  style={inputBase}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="exemple@email.fr"
                  autoComplete="off"
                />
              </div>

            </div>
          </div>

          {/* PRESTATIONS SOUHAITÉES */}
          <div>
            <p className="text-xs mb-3 uppercase tracking-wide" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>
              Prestations souhaitées
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESTATIONS_OPTIONS.map(p => {
                const selected = prestationsSouhaitees.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePrestation(p)}
                    className="px-3 py-1.5 rounded-full text-xs transition-all"
                    style={{
                      background: selected ? 'var(--brand-cyan)' : 'rgba(255,255,255,0.05)',
                      color: selected ? 'var(--brand-navy)' : 'var(--brand-text-muted)',
                      border: selected ? '1px solid var(--brand-cyan)' : '1px solid var(--brand-border)',
                      fontWeight: selected ? 700 : 500,
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* BOUTONS */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg text-sm transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--brand-border)',
                color: 'var(--brand-text-muted)',
                fontWeight: 600,
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-lg text-sm transition-all active:scale-95"
              style={{
                background: 'var(--brand-cyan)',
                color: 'var(--brand-navy)',
                fontWeight: 700,
              }}
            >
              Créer le client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

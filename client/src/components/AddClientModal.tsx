/*
 * DESIGN: Studio Nocturne — Modal d'ajout de client
 * Validation: erreurs uniquement après blur (touched) ou soumission
 * Version 3 — approche touched par champ, impossible d'afficher des erreurs à l'ouverture
 */
import { useState, useRef } from 'react';
import { useApp } from '@/lib/app-context';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DocumentType, PrestationType } from '@/lib/types';
import { toast } from 'sonner';

const DOCS_PAR_PRESTATION: Record<PrestationType, DocumentType[]> = {
  piercing: ['questionnaire_majeur', 'soins_oreilles'],
  tatouage: ['questionnaire_tatouage_majeur'],
  dermographie: ['questionnaire_tatouage_majeur'],
};

const DOCS_MINEURS: DocumentType[] = ['questionnaire_mineur', 'autorisation_parentale'];

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
  const [adresse, setAdresse] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [ville, setVille] = useState('');
  const [pieceType, setPieceType] = useState('');
  const [pieceNumero, setPieceNumero] = useState('');
  const [prestation, setPrestation] = useState('');

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

    const docsAssocies: DocumentType[] = isMineur ? [...DOCS_MINEURS] : [];
    if (prestation) {
      docsAssocies.push(...(DOCS_PAR_PRESTATION[prestation as PrestationType] || []));
    }

    const d = new Date();
    d.setFullYear(d.getFullYear() + 5);
    const dateSuppressionPrevue = d.toISOString().split('T')[0];

    addClient({
      prenom: prenom.trim(),
      nom: nom.trim().toUpperCase(),
      dateNaissance: dateNaissanceISO,
      telephone: telephone.trim(),
      email: email.trim() || undefined,
      adresse: adresse.trim(),
      codePostal: codePostal.trim(),
      ville: ville.trim(),
      pieceIdentiteType: (pieceType as 'CNI' | 'Passeport' | 'Permis' | 'Autre') || undefined,
      pieceIdentiteNumero: pieceNumero.trim() || undefined,
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
                <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: isMineur ? '#9C27B0' : 'var(--brand-text-muted)' }}>
                  {isMineur
                    ? <><AlertCircle size={11} /> Client mineur ({age} ans) — documents parentaux requis</>
                    : <><CheckCircle2 size={11} style={{ color: 'var(--brand-cyan)' }} /> {age} ans</>
                  }
                </p>
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
              <div>
                <label style={labelStyle}>Adresse</label>
                <input
                  style={inputBase}
                  value={adresse}
                  onChange={e => setAdresse(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Code postal</label>
                  <input
                    style={inputBase}
                    value={codePostal}
                    onChange={e => setCodePostal(e.target.value)}
                    placeholder="75000"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Ville</label>
                  <input
                    style={inputBase}
                    value={ville}
                    onChange={e => setVille(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PIÈCE D'IDENTITÉ */}
          <div>
            <p className="text-xs mb-3 uppercase tracking-wide" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>
              Pièce d'identité
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Type</label>
                <select
                  style={{ ...inputBase, cursor: 'pointer' }}
                  value={pieceType}
                  onChange={e => setPieceType(e.target.value)}
                >
                  <option value="">— Sélectionner —</option>
                  <option value="CNI">CNI</option>
                  <option value="Passeport">Passeport</option>
                  <option value="Permis">Permis de conduire</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Numéro</label>
                <input
                  style={inputBase}
                  value={pieceNumero}
                  onChange={e => setPieceNumero(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          {/* PRESTATION */}
          <div>
            <p className="text-xs mb-3 uppercase tracking-wide" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>
              Prestation prévue
            </p>
            <select
              style={{ ...inputBase, cursor: 'pointer' }}
              value={prestation}
              onChange={e => setPrestation(e.target.value)}
            >
              <option value="">— Sélectionner —</option>
              <option value="piercing">Piercing</option>
              <option value="tatouage">Tatouage</option>
              <option value="dermographie">Dermographie</option>
            </select>
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

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

const DOCS_MINEURS: DocumentType[] = ['questionnaire_mineur'];

// Correspondance prestation souhaitée → documents associés
const PRESTATION_DOCS_MAJEUR: Record<string, DocumentType[]> = {
  'Oreilles':          ['questionnaire_majeur', 'fiche_seance_piercing', 'soins_oreilles'],
  'Nez':               ['questionnaire_majeur', 'fiche_seance_piercing', 'soins_nez'],
  'Nombril':           ['questionnaire_majeur', 'fiche_seance_piercing', 'soins_nombril'],
  'Téton':             ['questionnaire_majeur', 'fiche_seance_piercing', 'soins_mamelons'],
  'Arcade / Sourcil':  ['questionnaire_majeur', 'fiche_seance_piercing', 'soins_arcade_sourcil'],
  'Surface / Dermal':  ['questionnaire_majeur', 'fiche_seance_piercing', 'soins_surface_dermal'],
  'Labret':   ['questionnaire_majeur', 'fiche_seance_piercing', 'soins_bouche_levres'],
  'Tatouage':          ['questionnaire_tatouage_majeur', 'fiche_seance_tatouage', 'consentement_soins_tatouage'],
  'Dermographie':      ['questionnaire_dermographe', 'fiche_seance_dermographe', 'soins_dermographe'],
};

const PRESTATION_DOCS_MINEUR: Record<string, DocumentType[]> = {
  'Oreilles':          ['questionnaire_mineur', 'fiche_seance_piercing', 'soins_oreilles'],
  'Nez':               ['questionnaire_mineur', 'fiche_seance_piercing', 'soins_nez'],
  'Nombril':           ['questionnaire_mineur', 'fiche_seance_piercing', 'soins_nombril'],
  'Téton':             ['questionnaire_mineur', 'fiche_seance_piercing', 'soins_mamelons'],
  'Arcade / Sourcil':  ['questionnaire_mineur', 'fiche_seance_piercing', 'soins_arcade_sourcil'],
  'Surface / Dermal':  ['questionnaire_mineur', 'fiche_seance_piercing', 'soins_surface_dermal'],
  'Labret':   ['questionnaire_mineur', 'fiche_seance_piercing', 'soins_bouche_levres'],
  'Tatouage':   ['questionnaire_tatouage_mineur', 'fiche_seance_tatouage'],
  'Dermographie': ['questionnaire_dermographe_mineur', 'fiche_seance_dermographe', 'soins_dermographe'],
};

function buildDocumentsAssocies(prestations: string[], isMineur: boolean): DocumentType[] {
  const set = new Set<DocumentType>();

  const map = isMineur ? PRESTATION_DOCS_MINEUR : PRESTATION_DOCS_MAJEUR;
  for (const p of prestations) {
    const docs = map[p] || [];
    docs.forEach(d => set.add(d));
  }
  const result = Array.from(set);
  return result;
}

interface Props {
  onClose: () => void;
  client?: any;
}

function splitDateParts(value?: string): { jour: string; mois: string; annee: string } {
  if (!value) return { jour: '', mois: '', annee: '' };
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return { jour: match[3], mois: match[2], annee: match[1] };
  const date = new Date(value);
  if (isNaN(date.getTime())) return { jour: '', mois: '', annee: '' };
  return {
    jour: String(date.getDate()).padStart(2, '0'),
    mois: String(date.getMonth() + 1).padStart(2, '0'),
    annee: String(date.getFullYear()),
  };
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

export default function AddClientModal({ onClose, client }: Props) {
  const { addClient, updateClient, state } = useApp();
  const isEditMode = Boolean(client?.id);
  const initialDateParts = splitDateParts(client?.dateNaissance);

  // Champs du formulaire
  const refPrenom = useRef<HTMLInputElement>(null);
  const refNom = useRef<HTMLInputElement>(null);
  const refJour = useRef<HTMLInputElement>(null);
  const refMois = useRef<HTMLInputElement>(null);
  const refAnnee = useRef<HTMLInputElement>(null);
  const refTelephone = useRef<HTMLInputElement>(null);
  const refEmail = useRef<HTMLInputElement>(null);

  const [prenom, setPrenom] = useState(client?.prenom || '');
  const [nom, setNom] = useState(client?.nom || '');
  const [dateJour, setDateJour] = useState(initialDateParts.jour);
  const [dateMois, setDateMois] = useState(initialDateParts.mois);
  const [dateAnnee, setDateAnnee] = useState(initialDateParts.annee);
  const [telephone, setTelephone] = useState(client?.telephone || '');
  const [email, setEmail] = useState(client?.email || '');
  const [adresse, setAdresse] = useState(client?.adresse || '');
  const [codePostal, setCodePostal] = useState(client?.codePostal || '');
  const [ville, setVille] = useState(client?.ville || '');
  const [pieceIdentiteType, setPieceIdentiteType] = useState(client?.pieceIdentiteType || '');
  const [pieceIdentiteNumero, setPieceIdentiteNumero] = useState(client?.pieceIdentiteNumero || '');
  const [prestationsSouhaitees, setPrestationsSouhaitees] = useState<string[]>(client?.prestationsSouhaitees || []);

  const PRESTATIONS_OPTIONS = [
    'Oreilles',
    'Nez',
    'Nombril',
    'Téton',
    'Arcade / Sourcil',
    'Surface / Dermal',
    'Labret',
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
  const [nomRepresentant, setNomRepresentant] = useState(client?.nomRepresentantLegal || '');
  const [prenomRepresentant, setPrenomRepresentant] = useState(client?.prenomRepresentantLegal || '');
  const [lienRepresentant, setLienRepresentant] = useState(client?.lienRepresentantLegal || '');
  const [telephoneRepresentant, setTelephoneRepresentant] = useState(client?.telephoneRepresentantLegal || '');
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
      case 'email': return !email.trim() ? "L'adresse mail est obligatoire" : '';
      case 'adresse': return isMineur && !adresse?.trim() ? "L'adresse est requise pour une fiche mineur" : '';
      case 'codePostal': return isMineur && !codePostal.trim() ? 'Le code postal est requis pour une fiche mineur' : '';
      case 'ville': return isMineur && !ville.trim() ? 'La ville est requise pour une fiche mineur' : '';
      case 'pieceIdentiteType': return isMineur && !pieceIdentiteType.trim() ? "Le type de pièce d'identité est requis pour une fiche mineur" : '';
      case 'pieceIdentiteNumero': return isMineur && !pieceIdentiteNumero.trim() ? "Le numéro de pièce d'identité est requis pour une fiche mineur" : '';
      case 'nomRepresentant': return isMineur && !nomRepresentant.trim() ? "Le nom du représentant légal est requis" : '';
      case 'prenomRepresentant': return isMineur && !prenomRepresentant.trim() ? "Le prénom du représentant légal est requis" : '';
      case 'lienRepresentant': return isMineur && !lienRepresentant.trim() ? "Le lien avec le mineur est requis" : '';
      case 'telephoneRepresentant': return isMineur && !telephoneRepresentant.trim() ? "Le téléphone du représentant légal est requis" : '';
      case 'prestationsSouhaitees': return isMineur && prestationsSouhaitees.length === 0 ? 'Au moins une prestation est requise pour une fiche mineur' : '';
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
      // email.trim() !== '' &&  // Email optionnel
      dateJour !== '' && dateMois !== '' && dateAnnee !== '' &&
      isDateValid &&
      (!isMineur || (
        adresse.trim() !== '' &&
        codePostal.trim() !== '' &&
        ville.trim() !== '' &&
        pieceIdentiteType.trim() !== '' &&
        pieceIdentiteNumero.trim() !== '' &&
        nomRepresentant.trim() !== '' &&
        prenomRepresentant.trim() !== '' &&
        lienRepresentant.trim() !== '' &&
        telephoneRepresentant.trim() !== '' &&
        prestationsSouhaitees.length > 0
      ))
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

    const commonClientFields = {
      prenom: prenom.trim(),
      nom: nom.trim().toUpperCase(),
      dateNaissance: dateNaissanceISO,
      telephone: telephone.trim(),
      email: email.trim() || undefined,
      adresse: adresse.trim(),
      codePostal: codePostal.trim(),
      ville: ville.trim(),
      pieceIdentiteType: pieceIdentiteType as any || undefined,
      pieceIdentiteNumero: pieceIdentiteNumero.trim() || undefined,
      prestationsSouhaitees: prestationsSouhaitees.length > 0 ? prestationsSouhaitees : undefined,
      estMineur: isMineur,
      nomRepresentantLegal: isMineur ? nomRepresentant : undefined,
      prenomRepresentantLegal: isMineur ? prenomRepresentant : undefined,
      lienRepresentantLegal: isMineur ? lienRepresentant : undefined,
      telephoneRepresentantLegal: isMineur ? telephoneRepresentant : undefined,
    };

    if (isEditMode && client?.id) {
      updateClient({
        ...client,
        ...commonClientFields,
        dateModification: new Date().toISOString().split('T')[0],
      });
      toast.success(`✓ ${prenom.trim()} ${nom.trim().toUpperCase()} modifié(e)`);
      onClose();
      return;
    }

    addClient({
      ...commonClientFields,
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
  const errEmail = getError('email');
  const errAdresse = getError('adresse');
  const errCodePostal = getError('codePostal');
  const errVille = getError('ville');
  const errPieceIdentiteType = getError('pieceIdentiteType');
  const errPieceIdentiteNumero = getError('pieceIdentiteNumero');
  const errNomRepresentant = getError('nomRepresentant');
  const errPrenomRepresentant = getError('prenomRepresentant');
  const errLienRepresentant = getError('lienRepresentant');
  const errTelephoneRepresentant = getError('telephoneRepresentant');
  const errPrestations = getError('prestationsSouhaitees');
  const errDate = getError('date');
  const dateInputStyle = errDate ? inputErrorStyle : inputBase;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2" style={{ overflowY: 'auto' }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full md:max-w-lg rounded-xl"
        style={{ background: 'var(--brand-navy-light)', border: '1px solid var(--brand-border)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b sticky top-0 z-10"
          style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-navy-light)' }}
        >
          <h2 className="text-base" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>
            {isEditMode ? 'Modifier le client' : 'Nouveau client'}
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

        <form onSubmit={handleSubmit} className="p-4 space-y-4" noValidate style={{ overflowY: "auto", flex: 1 }}>

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
                  ref={refPrenom}
                  style={getStyle('prenom')}
                  required
                  value={prenom}
                  onChange={e => {
                    setPrenom(e.target.value);
                  }}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); refNom.current?.focus(); } }}
                  onBlur={() => touch('prenom')}
                  placeholder="Ex: Marie"
                  autoComplete="given-name"
                  autoCapitalize="words"
                  inputMode="text"
                  autoFocus
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
                  ref={refNom}
                  style={getStyle('nom')}
                  required
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); refJour.current?.focus(); } }}
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
                  ref={refJour}
                  type="number"
                  style={dateInputStyle}
                  required
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
                  required
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
                  required
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Téléphone *</label>
                <input
                  ref={refTelephone}
                  type="tel"
                  style={getStyle('telephone')}
                  required
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
                <label style={labelStyle}>Adresse mail *</label>
                <input
                  ref={refEmail}
                  type="email"
                  style={getStyle('email')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={() => touch('email')}
                  placeholder="exemple@email.com"
                  autoComplete="off"
                  required
                  aria-required="true"
                />
                {!errEmail && (
                  <p className="mt-1 text-xs" style={{ color: 'var(--brand-text-muted)', opacity: 0.75 }}>
                    L'adresse mail est obligatoire pour tous les clients.
                  </p>
                )}
                {errEmail && (
                  <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}>
                    <AlertCircle size={11} /> {errEmail}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* COORDONNÉES ET IDENTITÉ — obligatoires pour les mineurs */}
          {isMineur && (
            <div>
              <p className="text-xs mb-3 uppercase tracking-wide" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>
                Coordonnées et pièce d’identité *
              </p>
              <div className="space-y-3">
                <div>
                  <label style={labelStyle}>Adresse complète *</label>
                  <input
                    type="text"
                    style={getStyle('adresse')}
                    value={adresse}
                    onChange={e => setAdresse(e.target.value)}
                    onBlur={() => touch('adresse')}
                    placeholder="Numéro, rue, bâtiment..."
                    autoComplete="street-address"
                    required
                  />
                  {errAdresse && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}><AlertCircle size={11} /> {errAdresse}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label style={labelStyle}>Code postal *</label>
                    <input
                      type="text"
                      style={getStyle('codePostal')}
                      value={codePostal}
                      onChange={e => setCodePostal(e.target.value)}
                      onBlur={() => touch('codePostal')}
                      placeholder="75000"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      required
                    />
                    {errCodePostal && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}><AlertCircle size={11} /> {errCodePostal}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Ville *</label>
                    <input
                      type="text"
                      style={getStyle('ville')}
                      value={ville}
                      onChange={e => setVille(e.target.value)}
                      onBlur={() => touch('ville')}
                      placeholder="Ville"
                      autoComplete="address-level2"
                      required
                    />
                    {errVille && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}><AlertCircle size={11} /> {errVille}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label style={labelStyle}>Type de pièce d’identité *</label>
                    <select
                      style={getStyle('pieceIdentiteType')}
                      value={pieceIdentiteType || ''}
                      onChange={e => {
                        const value = e.target.value;
                        setPieceIdentiteType(value);
                        touch('pieceIdentiteType');
                      }}
                      onBlur={() => touch('pieceIdentiteType')}
                      onInput={e => {
                        setPieceIdentiteType((e.target as HTMLSelectElement).value);
                      }}
                      required
                    >
                      <option value="">Sélectionner</option>
                      <option value="carte_identite">Carte d'identité</option>
                      <option value="passeport">Passeport</option>
                      <option value="titre_sejour">Titre de séjour</option>
                      <option value="autre">Autre</option>
                    </select>
                    {errPieceIdentiteType && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}><AlertCircle size={11} /> {errPieceIdentiteType}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Numéro de pièce d’identité *</label>
                    <input
                      type="text"
                      style={getStyle('pieceIdentiteNumero')}
                      value={pieceIdentiteNumero}
                      onChange={e => setPieceIdentiteNumero(e.target.value)}
                      onBlur={() => touch('pieceIdentiteNumero')}
                      placeholder="Numéro du document"
                      autoComplete="off"
                      required
                    />
                    {errPieceIdentiteNumero && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}><AlertCircle size={11} /> {errPieceIdentiteNumero}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REPRÉSENTANT LÉGAL */}
          {isMineur && (
            <div>
              <p className="text-xs mb-3 uppercase tracking-wide" style={{ color: '#CE93D8', fontWeight: 600 }}>
                👨‍👩‍👧 Représentant légal
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Nom du représentant légal *</label>
                  <input type="text" style={getStyle('nomRepresentant')} value={nomRepresentant} onChange={e => setNomRepresentant(e.target.value)} onBlur={() => touch('nomRepresentant')} placeholder="Nom" autoComplete="off" required />
                  {errNomRepresentant && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}><AlertCircle size={11} /> {errNomRepresentant}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Prénom du représentant légal *</label>
                  <input type="text" style={getStyle('prenomRepresentant')} value={prenomRepresentant} onChange={e => setPrenomRepresentant(e.target.value)} onBlur={() => touch('prenomRepresentant')} placeholder="Prénom" autoComplete="off" required />
                  {errPrenomRepresentant && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}><AlertCircle size={11} /> {errPrenomRepresentant}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Lien avec le mineur *</label>
                  <input type="text" style={getStyle('lienRepresentant')} value={lienRepresentant} onChange={e => setLienRepresentant(e.target.value)} onBlur={() => touch('lienRepresentant')} placeholder="Père, Mère, Tuteur..." autoComplete="off" required />
                  {errLienRepresentant && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}><AlertCircle size={11} /> {errLienRepresentant}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Téléphone du représentant *</label>
                  <input type="tel" style={getStyle('telephoneRepresentant')} value={telephoneRepresentant} onChange={e => setTelephoneRepresentant(e.target.value)} onBlur={() => touch('telephoneRepresentant')} placeholder="06 XX XX XX XX" autoComplete="off" required />
                  {errTelephoneRepresentant && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}><AlertCircle size={11} /> {errTelephoneRepresentant}</p>}
                </div>
              </div>
            </div>
          )}
          {/* PRESTATIONS SOUHAITÉES */}
          <div>
            <p className="text-xs mb-3 uppercase tracking-wide" style={{ color: errPrestations ? '#F44336' : 'var(--brand-cyan)', fontWeight: 600 }}>
              Prestations souhaitées{isMineur ? ' *' : ''}
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
            {errPrestations && (
              <p className="flex items-center gap-1 mt-2 text-xs" style={{ color: '#F44336' }}>
                <AlertCircle size={11} /> {errPrestations}
              </p>
            )}
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
              {isEditMode ? 'Enregistrer les modifications' : 'Créer le client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

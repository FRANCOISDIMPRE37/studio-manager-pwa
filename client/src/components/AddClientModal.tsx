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
  isOpen: boolean;
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

export default function AddClientModal({ isOpen, onClose, client: initialClient }: Props) {
  const { addClient, updateClient, state } = useApp();
  const isEditMode = Boolean(initialClient?.id);
  const initialDateParts = splitDateParts(initialClient?.dateNaissance);

  // Champs du formulaire
  const refPrenom = useRef<HTMLInputElement>(null);
  const refNom = useRef<HTMLInputElement>(null);
  const refJour = useRef<HTMLInputElement>(null);
  const refMois = useRef<HTMLInputElement>(null);
  const refAnnee = useRef<HTMLInputElement>(null);
  const refTelephone = useRef<HTMLInputElement>(null);
  const refEmail = useRef<HTMLInputElement>(null);

  const [prenom, setPrenom] = useState(initialClient?.prenom || '');
  const [nom, setNom] = useState(initialClient?.nom || '');
  const [dateJour, setDateJour] = useState(initialDateParts.jour);
  const [dateMois, setDateMois] = useState(initialDateParts.mois);
  const [dateAnnee, setDateAnnee] = useState(initialDateParts.annee);
  const [telephone, setTelephone] = useState(initialClient?.telephone || '');
  const [email, setEmail] = useState(initialClient?.email || '');
  const [adresse, setAdresse] = useState(initialClient?.adresse || '');
  const [codePostal, setCodePostal] = useState(initialClient?.codePostal || '');
  const [ville, setVille] = useState(initialClient?.ville || '');
  const [pieceIdentiteType, setPieceIdentiteType] = useState(initialClient?.pieceIdentiteType || '');
  const [pieceIdentiteNumero, setPieceIdentiteNumero] = useState(initialClient?.pieceIdentiteNumero || '');
  const [prestationsSouhaitees, setPrestationsSouhaitees] = useState<string[]>(initialClient?.prestationsSouhaitees || []);

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

  // Suivi des champs touchés (blur)
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const touch = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  // Calcul de l'âge
  const age = calcAge(dateJour, dateMois, dateAnnee);
  const isMineur = age >= 0 && age < 18;
  const [nomRepresentant, setNomRepresentant] = useState(initialClient?.nomRepresentantLegal || '');
  const [prenomRepresentant, setPrenomRepresentant] = useState(initialClient?.prenomRepresentantLegal || '');
  const [lienRepresentant, setLienRepresentant] = useState(initialClient?.lienRepresentantLegal || '');
  const [telephoneRepresentant, setTelephoneRepresentant] = useState(initialClient?.telephoneRepresentantLegal || '');
  const isDateValid = age >= 0 && age <= 120;

  // Validation des champs requis
  const getError = (field: string): string => {
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
      dateJour !== '' && dateMois !== '' && dateAnnee !== '' &&
      isDateValid &&
      (!isMineur || (
        adresse.trim() !== '' &&
        codePostal.trim() !== '' &&
        ville.trim() !== '' &&
        nomRepresentant.trim() !== '' &&
        prenomRepresentant.trim() !== '' &&
        lienRepresentant.trim() !== '' &&
        telephoneRepresentant.trim() !== '' &&
        prestationsSouhaitees.length > 0
      ))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!isFormValid()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const clientData = {
        prenom,
        nom,
        dateNaissance: `${dateAnnee}-${dateMois}-${dateJour}`,
        telephone,
        email,
        adresse,
        codePostal,
        ville,
        pieceIdentiteType,
        pieceIdentiteNumero,
        prestationsSouhaitees,
        nomRepresentantLegal: isMineur ? nomRepresentant : undefined,
        prenomRepresentantLegal: isMineur ? prenomRepresentant : undefined,
        lienRepresentantLegal: isMineur ? lienRepresentant : undefined,
        telephoneRepresentantLegal: isMineur ? telephoneRepresentant : undefined,
        documentsAssocies: buildDocumentsAssocies(prestationsSouhaitees, isMineur),
      };

      if (isEditMode) {
        await updateClient({ id: initialClient.id, ...clientData });
        toast.success('Client mis à jour avec succès');
      } else {
        await addClient(clientData);
        toast.success('Client créé avec succès');
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue lors de l'enregistrement");
    }
  };

  if (!isOpen) return null;

  const labelStyle = { color: 'var(--brand-text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem', display: 'block' };
  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--brand-border)',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    color: 'var(--brand-text)',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'all 0.2s'
  };

  const getStyle = (field: string) => ({
    ...inputStyle,
    borderColor: getError(field) ? '#F44336' : 'var(--brand-border)',
    boxShadow: getError(field) ? '0 0 0 1px #F44336' : 'none'
  });

  const errTel = getError('telephone');
  const errEmail = getError('email');
  const errPrenom = getError('prenom');
  const errNom = getError('nom');
  const errDate = getError('date');
  const errAdresse = getError('adresse');
  const errCodePostal = getError('codePostal');
  const errVille = getError('ville');
  const errNomRepresentant = getError('nomRepresentant');
  const errPrenomRepresentant = getError('prenomRepresentant');
  const errLienRepresentant = getError('lienRepresentant');
  const errTelephoneRepresentant = getError('telephoneRepresentant');
  const errPrestations = getError('prestationsSouhaitees');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0A0F1E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {isEditMode ? 'Modifier le client' : 'Nouveau client'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* IDENTITÉ */}
          <div>
            <p className="text-xs mb-3 uppercase tracking-wide" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>
              Identité du client *
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Prénom *</label>
                <input ref={refPrenom} type="text" style={getStyle('prenom')} value={prenom} onChange={e => setPrenom(e.target.value)} onBlur={() => touch('prenom')} placeholder="Prénom" autoComplete="off" required />
                {errPrenom && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}><AlertCircle size={11} /> {errPrenom}</p>}
              </div>
              <div>
                <label style={labelStyle}>Nom *</label>
                <input ref={refNom} type="text" style={getStyle('nom')} value={nom} onChange={e => setNom(e.target.value)} onBlur={() => touch('nom')} placeholder="Nom" autoComplete="off" required />
                {errNom && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}><AlertCircle size={11} /> {errNom}</p>}
              </div>
            </div>
          </div>

          {/* DATE DE NAISSANCE */}
          <div>
            <label style={labelStyle}>Date de naissance *</label>
            <div className="grid grid-cols-3 gap-2">
              <input ref={refJour} type="text" style={getStyle('date')} value={dateJour} onChange={e => setDateJour(e.target.value)} onBlur={() => touch('date')} placeholder="JJ" maxLength={2} inputMode="numeric" required />
              <input ref={refMois} type="text" style={getStyle('date')} value={dateMois} onChange={e => setDateMois(e.target.value)} onBlur={() => touch('date')} placeholder="MM" maxLength={2} inputMode="numeric" required />
              <input ref={refAnnee} type="text" style={getStyle('date')} value={dateAnnee} onChange={e => setDateAnnee(e.target.value)} onBlur={() => touch('date')} placeholder="AAAA" maxLength={4} inputMode="numeric" required />
            </div>
            {errDate && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}><AlertCircle size={11} /> {errDate}</p>}
            {age >= 0 && (
              <p className="mt-1.5 text-xs font-medium flex items-center gap-1.5" style={{ color: isMineur ? '#CE93D8' : 'var(--brand-cyan)' }}>
                {isMineur ? '👶 Mineur' : '👤 Majeur'} — {age} ans
              </p>
            )}
          </div>

          {/* CONTACT */}
          <div>
            <p className="text-xs mb-3 uppercase tracking-wide" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>
              Contact *
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
                />
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
                  <input type="text" style={getStyle('adresse')} value={adresse} onChange={e => setAdresse(e.target.value)} onBlur={() => touch('adresse')} placeholder="Numéro, rue, bâtiment..." autoComplete="street-address" required />
                  {errAdresse && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}><AlertCircle size={11} /> {errAdresse}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label style={labelStyle}>Code postal *</label>
                    <input type="text" style={getStyle('codePostal')} value={codePostal} onChange={e => setCodePostal(e.target.value)} onBlur={() => touch('codePostal')} placeholder="75000" inputMode="numeric" autoComplete="postal-code" required />
                    {errCodePostal && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}><AlertCircle size={11} /> {errCodePostal}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Ville *</label>
                    <input type="text" style={getStyle('ville')} value={ville} onChange={e => setVille(e.target.value)} onBlur={() => touch('ville')} placeholder="Ville" autoComplete="address-level2" required />
                    {errVille && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}><AlertCircle size={11} /> {errVille}</p>}
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
            <p className="text-xs mb-1 uppercase tracking-wide" style={{ color: errPrestations ? '#F44336' : 'var(--brand-cyan)', fontWeight: 600 }}>
              Prestations souhaitées{isMineur ? ' *' : ''}
            </p>
            <div className="flex flex-wrap gap-1">
              {PRESTATIONS_OPTIONS.map(p => {
                const selected = prestationsSouhaitees.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePrestation(p)}
                    className="px-2 py-0.5 rounded-full text-xs transition-all"
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
              <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}>
                <AlertCircle size={11} /> {errPrestations}
              </p>
            )}
          </div>

          {/* BOUTONS */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-1.5 rounded-lg text-xs transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-muted)', fontWeight: 600 }}>
              Annuler
            </button>
            <button type="submit" className="flex-1 py-1.5 rounded-lg text-xs transition-all active:scale-95" style={{ background: 'var(--brand-cyan)', color: 'var(--brand-navy)', fontWeight: 700 }}>
              {isEditMode ? 'Enregistrer les modifications' : 'Créer le client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

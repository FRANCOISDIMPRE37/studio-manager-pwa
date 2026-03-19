/*
 * DESIGN: Studio Nocturne — Modal d'ajout de client avec formulaire complet
 * Correction : validation robuste, champ date compatible Android, messages d'erreur
 */
import { useState, useRef } from 'react';
import { useApp } from '@/lib/app-context';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DocumentType, PrestationType } from '@/lib/types';
import { toast } from 'sonner';

const DOCS_PAR_PRESTATION: Record<PrestationType, DocumentType[]> = {
  piercing: ['questionnaire_majeur', 'soins_oreilles'],
  tatouage: ['cicatrisation_tatouage'],
  dermographie: ['cicatrisation_dermographie'],
};

const DOCS_MINEURS: DocumentType[] = ['questionnaire_mineur', 'autorisation_parentale'];

interface Props {
  onClose: () => void;
}

function calcAge(dateStr: string): number {
  if (!dateStr) return -1;
  const birth = new Date(dateStr);
  if (isNaN(birth.getTime())) return -1;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export default function AddClientModal({ onClose }: Props) {
  const { addClient, state } = useApp();
  const formRef = useRef<HTMLFormElement>(null);

  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    dateNaissance: '',
    telephone: '',
    email: '',
    adresse: '',
    codePostal: '',
    ville: '',
    pieceIdentiteType: '' as '' | 'CNI' | 'Passeport' | 'Permis' | 'Autre',
    pieceIdentiteNumero: '',
    prestationType: '' as '' | PrestationType,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Champs date séparés pour compatibilité Android
  const [dateJour, setDateJour] = useState('');
  const [dateMois, setDateMois] = useState('');
  const [dateAnnee, setDateAnnee] = useState('');

  // Construire la date ISO à partir des 3 champs
  const buildDateISO = (j: string, m: string, a: string): string => {
    if (!j || !m || !a || a.length < 4) return '';
    const jj = j.padStart(2, '0');
    const mm = m.padStart(2, '0');
    return `${a}-${mm}-${jj}`;
  };

  const dateNaissanceValue = buildDateISO(dateJour, dateMois, dateAnnee);

  const age = calcAge(dateNaissanceValue);
  const isMineur = age >= 0 && age < 18;
  const isDateValid = age >= 0 && age <= 120;

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    if (submitted) setErrors(prev => ({ ...prev, [k]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.prenom.trim()) newErrors.prenom = 'Le prénom est requis';
    if (!form.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!form.telephone.trim()) newErrors.telephone = 'Le téléphone est requis';
    if (!dateJour || !dateMois || !dateAnnee) {
      newErrors.dateNaissance = 'La date de naissance est requise';
    } else if (!isDateValid) {
      newErrors.dateNaissance = 'Date invalide (vérifiez le format)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!validate()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    const docsAssocies: DocumentType[] = isMineur ? [...DOCS_MINEURS] : [];
    if (form.prestationType) {
      docsAssocies.push(...(DOCS_PAR_PRESTATION[form.prestationType] || []));
    }

    const d = new Date();
    d.setFullYear(d.getFullYear() + 5);
    const dateSuppressionPrevue = d.toISOString().split('T')[0];

    addClient({
      prenom: form.prenom.trim(),
      nom: form.nom.trim().toUpperCase(),
      dateNaissance: dateNaissanceValue,
      telephone: form.telephone.trim(),
      email: form.email.trim() || undefined,
      adresse: form.adresse.trim(),
      codePostal: form.codePostal.trim(),
      ville: form.ville.trim(),
      pieceIdentiteType: (form.pieceIdentiteType as 'CNI' | 'Passeport' | 'Permis' | 'Autre') || undefined,
      pieceIdentiteNumero: form.pieceIdentiteNumero.trim() || undefined,
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

    toast.success(`✓ ${form.prenom} ${form.nom.trim().toUpperCase()} ajouté(e)`);
    onClose();
  };

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

  const inputError: React.CSSProperties = {
    ...inputBase,
    border: '1px solid #F44336',
  };

  const getInputStyle = (name: string) => errors[name] ? inputError : inputBase;

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    color: 'var(--brand-text-muted)',
    marginBottom: '4px',
    fontWeight: 500,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full md:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-xl"
        style={{ background: 'var(--brand-navy-light)', border: '1px solid var(--brand-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 z-10" style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-navy-light)' }}>
          <h2 className="text-base" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>Nouveau client</h2>
          {state.isDemo && (
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(255,152,0,0.15)', color: '#FF9800', border: '1px solid #FF9800' }}>Mode démo</span>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-all">
            <X size={18} style={{ color: 'var(--brand-text-muted)' }} />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="p-4 space-y-5" noValidate>
          {/* Identité */}
          <div>
            <p className="text-xs font-600 mb-3 uppercase tracking-wide" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>Identité</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Prénom *</label>
                <input style={getInputStyle('prenom')} value={form.prenom} onChange={e => set('prenom', e.target.value)} autoComplete="off" />
                {errors.prenom && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}><AlertCircle size={11} /> {errors.prenom}</p>}
              </div>
              <div>
                <label style={labelStyle}>Nom *</label>
                <input style={getInputStyle('nom')} value={form.nom} onChange={e => set('nom', e.target.value)} autoComplete="off" />
                {errors.nom && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}><AlertCircle size={11} /> {errors.nom}</p>}
              </div>
            </div>
            <div className="mt-3">
              <label style={labelStyle}>Date de naissance *</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input
                    type="number"
                    style={errors.dateNaissance ? inputError : inputBase}
                    value={dateJour}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                      setDateJour(v);
                      if (submitted) setErrors(prev => ({ ...prev, dateNaissance: '' }));
                    }}
                    placeholder="JJ"
                    min="1" max="31"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    style={errors.dateNaissance ? inputError : inputBase}
                    value={dateMois}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                      setDateMois(v);
                      if (submitted) setErrors(prev => ({ ...prev, dateNaissance: '' }));
                    }}
                    placeholder="MM"
                    min="1" max="12"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    style={errors.dateNaissance ? inputError : inputBase}
                    value={dateAnnee}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setDateAnnee(v);
                      if (submitted) setErrors(prev => ({ ...prev, dateNaissance: '' }));
                    }}
                    placeholder="AAAA"
                    min="1900" max={new Date().getFullYear()}
                  />
                </div>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)', opacity: 0.6 }}>Jour / Mois / Année</p>
              {errors.dateNaissance && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}><AlertCircle size={11} /> {errors.dateNaissance}</p>}
              {dateNaissanceValue && isDateValid && (
                <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: isMineur ? '#9C27B0' : 'var(--brand-text-muted)' }}>
                  {isMineur
                    ? <><AlertCircle size={11} /> Client mineur ({age} ans) — documents parentaux requis</>
                    : <><CheckCircle2 size={11} style={{ color: 'var(--brand-cyan)' }} /> {age} ans</>
                  }
                </p>
              )}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-600 mb-3 uppercase tracking-wide" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>Contact</p>
            <div className="space-y-3">
              <div>
                <label style={labelStyle}>Téléphone *</label>
                <input type="tel" style={getInputStyle('telephone')} value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="06 XX XX XX XX" autoComplete="off" />
                {errors.telephone && <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#F44336' }}><AlertCircle size={11} /> {errors.telephone}</p>}
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" style={inputBase} value={form.email} onChange={e => set('email', e.target.value)} placeholder="exemple@email.fr" autoComplete="off" />
              </div>
              <div>
                <label style={labelStyle}>Adresse</label>
                <input style={inputBase} value={form.adresse} onChange={e => set('adresse', e.target.value)} autoComplete="off" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Code postal</label>
                  <input style={inputBase} value={form.codePostal} onChange={e => set('codePostal', e.target.value)} placeholder="75000" autoComplete="off" />
                </div>
                <div>
                  <label style={labelStyle}>Ville</label>
                  <input style={inputBase} value={form.ville} onChange={e => set('ville', e.target.value)} autoComplete="off" />
                </div>
              </div>
            </div>
          </div>

          {/* Pièce d'identité */}
          <div>
            <p className="text-xs font-600 mb-3 uppercase tracking-wide" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>Pièce d'identité</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Type</label>
                <select style={{ ...inputBase, cursor: 'pointer' }} value={form.pieceIdentiteType} onChange={e => set('pieceIdentiteType', e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  <option value="CNI">CNI</option>
                  <option value="Passeport">Passeport</option>
                  <option value="Permis">Permis de conduire</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Numéro</label>
                <input style={inputBase} value={form.pieceIdentiteNumero} onChange={e => set('pieceIdentiteNumero', e.target.value)} autoComplete="off" />
              </div>
            </div>
          </div>

          {/* Prestation */}
          <div>
            <p className="text-xs font-600 mb-3 uppercase tracking-wide" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>Prestation prévue</p>
            <select style={{ ...inputBase, cursor: 'pointer' }} value={form.prestationType} onChange={e => set('prestationType', e.target.value)}>
              <option value="">— Sélectionner —</option>
              <option value="piercing">Piercing</option>
              <option value="tatouage">Tatouage</option>
              <option value="dermographie">Dermographie</option>
            </select>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg text-sm font-600 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-muted)', fontWeight: 600 }}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-lg text-sm font-700 transition-all active:scale-95"
              style={{ background: 'var(--brand-cyan)', color: 'var(--brand-navy)', fontWeight: 700 }}
            >
              Créer le client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

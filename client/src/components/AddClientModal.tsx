/*
 * DESIGN: Studio Nocturne — Modal d'ajout de client avec formulaire complet
 */
import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { X } from 'lucide-react';
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

export default function AddClientModal({ onClose }: Props) {
  const { addClient } = useApp();
  const [form, setForm] = useState({
    prenom: '', nom: '', dateNaissance: '', telephone: '', email: '',
    adresse: '', codePostal: '', ville: '',
    pieceIdentiteType: '' as '' | 'CNI' | 'Passeport' | 'Permis' | 'Autre',
    pieceIdentiteNumero: '',
    prestationType: '' as '' | PrestationType,
  });

  const isMineur = (() => {
    if (!form.dateNaissance) return false;
    const age = Math.floor((Date.now() - new Date(form.dateNaissance).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return age < 18;
  })();

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.prenom || !form.nom || !form.telephone || !form.dateNaissance) {
      toast.error('Veuillez remplir les champs obligatoires');
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
      prenom: form.prenom,
      nom: form.nom.toUpperCase(),
      dateNaissance: form.dateNaissance,
      telephone: form.telephone,
      email: form.email || undefined,
      adresse: form.adresse,
      codePostal: form.codePostal,
      ville: form.ville,
      pieceIdentiteType: (form.pieceIdentiteType as 'CNI' | 'Passeport' | 'Permis' | 'Autre') || undefined,
      pieceIdentiteNumero: form.pieceIdentiteNumero || undefined,
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

    toast.success(`Client ${form.prenom} ${form.nom.toUpperCase()} créé`);
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--brand-navy)',
    border: '1px solid var(--brand-border)',
    color: 'var(--brand-text)',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    width: '100%',
    fontSize: '14px',
    outline: 'none',
  };

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
        <div className="flex items-center justify-between p-4 border-b sticky top-0" style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-navy-light)' }}>
          <h2 className="text-base font-700" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>Nouveau client</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-all">
            <X size={18} style={{ color: 'var(--brand-text-muted)' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Identité */}
          <div>
            <p className="text-xs font-600 mb-3 uppercase tracking-wide" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>Identité</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Prénom *</label>
                <input style={inputStyle} value={form.prenom} onChange={e => set('prenom', e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Nom *</label>
                <input style={inputStyle} value={form.nom} onChange={e => set('nom', e.target.value)} required />
              </div>
            </div>
            <div className="mt-3">
              <label style={labelStyle}>Date de naissance *</label>
              <input type="date" style={inputStyle} value={form.dateNaissance} onChange={e => set('dateNaissance', e.target.value)} required />
              {isMineur && (
                <p className="text-xs mt-1" style={{ color: '#9C27B0' }}>⚠ Client mineur — documents parentaux requis</p>
              )}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-600 mb-3 uppercase tracking-wide" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>Contact</p>
            <div className="space-y-3">
              <div>
                <label style={labelStyle}>Téléphone *</label>
                <input type="tel" style={inputStyle} value={form.telephone} onChange={e => set('telephone', e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Adresse</label>
                <input style={inputStyle} value={form.adresse} onChange={e => set('adresse', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Code postal</label>
                  <input style={inputStyle} value={form.codePostal} onChange={e => set('codePostal', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Ville</label>
                  <input style={inputStyle} value={form.ville} onChange={e => set('ville', e.target.value)} />
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
                <select style={{ ...inputStyle }} value={form.pieceIdentiteType} onChange={e => set('pieceIdentiteType', e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  <option value="CNI">CNI</option>
                  <option value="Passeport">Passeport</option>
                  <option value="Permis">Permis de conduire</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Numéro</label>
                <input style={inputStyle} value={form.pieceIdentiteNumero} onChange={e => set('pieceIdentiteNumero', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Prestation */}
          <div>
            <p className="text-xs font-600 mb-3 uppercase tracking-wide" style={{ color: 'var(--brand-cyan)', fontWeight: 600 }}>Prestation prévue</p>
            <select style={{ ...inputStyle }} value={form.prestationType} onChange={e => set('prestationType', e.target.value)}>
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

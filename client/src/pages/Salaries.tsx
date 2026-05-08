import { useState, type CSSProperties } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { FileText, Pencil, Trash2, UserPlus, X } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { ClientDocument } from '@/lib/types';

const SPECIALITES = [
  '— Choisir —', 'Tatouage', 'Piercing', 'Dermographie', 'Microblading',
  'Maquillage permanent', 'Esthétique', 'Coiffure', 'Autre'
];

const TYPES_CONTRAT = [
  '— Choisir —', 'CDI', 'CDD', 'Stage', 'Alternance', 'Freelance', 'Intérim'
];

type SalarieRole = 'employe' | 'admin' | 'stagiaire';

type SalarieForm = {
  prenom: string;
  nom: string;
  pin: string;
  role: SalarieRole;
  specialite: string;
  typeContrat: string;
  dateEntree: string;
  dateSortie: string;
  adresse: string;
};

const EMPTY_FORM: SalarieForm = {
  prenom: '',
  nom: '',
  pin: '',
  role: 'employe',
  specialite: '',
  typeContrat: '',
  dateEntree: '',
  dateSortie: '',
  adresse: '',
};

const REQUIRED_FIELDS: Array<{ key: keyof SalarieForm; label: string }> = [
  { key: 'prenom', label: 'Prénom' },
  { key: 'nom', label: 'Nom' },
  { key: 'pin', label: 'PIN' },
  { key: 'role', label: 'Rôle' },
  { key: 'specialite', label: 'Spécialité' },
  { key: 'typeContrat', label: 'Type de contrat' },
  { key: 'dateEntree', label: "Date d'entrée" },
  { key: 'dateSortie', label: 'Date de sortie' },
  { key: 'adresse', label: 'Adresse' },
];

export default function Salaries() {
  const [, navigate] = useLocation();
  const { state } = useApp();
  const [showForm, setShowForm] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingHasPinSet, setEditingHasPinSet] = useState(false);
  const [form, setForm] = useState<SalarieForm>(EMPTY_FORM);
  const utils = trpc.useUtils();

  const list = trpc.studioUsers.list.useQuery();

  const resetForm = () => {
    setEditingId(null);
    setEditingHasPinSet(false);
    setForm(EMPTY_FORM);
  };

  const del = trpc.studioUsers.delete.useMutation({
    onSuccess: () => {
      utils.studioUsers.list.invalidate();
      toast.success('Salarié supprimé');
    }
  });

  const create = trpc.studioUsers.create.useMutation({
    onSuccess: () => {
      utils.studioUsers.list.invalidate();
      setShowForm(false);
      resetForm();
      toast.success('Salarié créé !');
    },
    onError: (e) => toast.error(e.message)
  });

  const update = trpc.studioUsers.update.useMutation({
    onSuccess: () => {
      utils.studioUsers.list.invalidate();
      setShowForm(false);
      resetForm();
      toast.success('Fiche salarié mise à jour !');
    },
    onError: (e) => toast.error(e.message)
  });

  const validateRequiredFields = () => {
    const missing = REQUIRED_FIELDS.filter(({ key }) => {
      if (key === 'pin' && editingId && editingHasPinSet) return false;
      return !String(form[key] ?? '').trim();
    });

    if (missing.length > 0) {
      toast.error(`Tous les champs de la fiche salarié sont obligatoires : ${missing.map(f => f.label).join(', ')}`);
      return false;
    }

    if (!/^\d{4}$/.test(form.pin) && !(editingId && editingHasPinSet && !form.pin.trim())) {
      toast.error('Le PIN salarié est obligatoire et doit contenir exactement 4 chiffres.');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateRequiredFields()) return;

    const cleanForm = {
      ...form,
      prenom: form.prenom.trim(),
      nom: form.nom.trim(),
      pin: form.pin.trim(),
      specialite: form.specialite.trim(),
      typeContrat: form.typeContrat.trim(),
      dateEntree: form.dateEntree.trim(),
      dateSortie: form.dateSortie.trim(),
      adresse: form.adresse.trim(),
    };

    if (editingId) {
      const { pin, ...fields } = cleanForm;
      update.mutate({
        id: editingId,
        ...fields,
        ...(pin ? { pin } : {}),
      });
      return;
    }

    const login = (cleanForm.prenom + cleanForm.nom).toLowerCase().replace(/[^a-z0-9]/g, '') + Date.now();
    const password = Math.random().toString(36).slice(2, 10);
    create.mutate({ ...cleanForm, login, password });
  };

  const startEdit = (salarie: any) => {
    setForm({
      prenom: salarie.prenom || '',
      nom: salarie.nom || '',
      pin: '',
      role: (salarie.role || 'employe') as SalarieRole,
      specialite: salarie.specialite || '',
      typeContrat: salarie.typeContrat || '',
      dateEntree: salarie.dateEntree || '',
      dateSortie: salarie.dateSortie || '',
      adresse: salarie.adresse || '',
    });
    setEditingId(Number(salarie.id));
    setEditingHasPinSet(Boolean(salarie.hasPinSet));
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasSignedEngagement = (salarieId: string): boolean => {
    const salarieAsClient = state.clients.find(c => c.id === salarieId);
    return salarieAsClient?.documents?.some(
      (doc: ClientDocument) => doc.type === 'engagement_confidentialite' && doc.status === 'signed'
    ) ?? false;
  };

  const inp = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'white',
    borderRadius: 10,
    padding: '12px 14px',
    width: '100%',
    fontSize: 14,
    boxSizing: 'border-box' as const,
  } as CSSProperties;

  const requiredLabel = (label: string) => `${label} *`;
  const isSaving = create.isPending || update.isPending;

  return (
    <div style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'white' }}>Salariés</h1>
        <button
          onClick={() => {
            if (showForm && editingId) resetForm();
            setShowForm(!showForm);
          }}
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: 'white', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <UserPlus size={16} />
          {showForm ? 'Masquer' : '+ Ajouter'}
        </button>
      </div>

      {/* Formulaire salarié obligatoire et prérempli en modification */}
      {showForm && (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, color: 'white', fontSize: 17, fontWeight: 700 }}>{editingId ? 'Modifier la fiche salarié' : 'Nouveau salarié'}</h3>
              <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                Tous les champs marqués * sont obligatoires sur PC comme sur iPad.
              </p>
            </div>
            {editingId && (
              <button
                onClick={resetForm}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <X size={14} /> Annuler
              </button>
            )}
          </div>

          {/* Prénom / Nom */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>{requiredLabel('Prénom')}</label>
              <input required style={inp} value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} />
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>{requiredLabel('Nom')}</label>
              <input required style={inp} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
            </div>
          </div>

          {/* PIN / Rôle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>{editingId && editingHasPinSet ? 'PIN * (déjà enregistré, saisir pour modifier)' : requiredLabel('PIN')}</label>
              <input required={!editingId || !editingHasPinSet} inputMode="numeric" maxLength={4} pattern="[0-9]{4}" style={inp} value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))} placeholder={editingId && editingHasPinSet ? 'PIN déjà enregistré' : '4 chiffres obligatoires'} />
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>{requiredLabel('Rôle')}</label>
              <select required style={inp} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as SalarieRole }))}>
                <option value="employe">Employé</option>
                <option value="admin">Admin</option>
                <option value="stagiaire">Stagiaire</option>
              </select>
            </div>
          </div>

          {/* Spécialité / Type de contrat */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>{requiredLabel('Spécialité')}</label>
              <select required style={inp} value={form.specialite} onChange={e => setForm(f => ({ ...f, specialite: e.target.value }))}>
                {SPECIALITES.map(s => <option key={s} value={s === '— Choisir —' ? '' : s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>{requiredLabel('Type de contrat')}</label>
              <select required style={inp} value={form.typeContrat} onChange={e => setForm(f => ({ ...f, typeContrat: e.target.value }))}>
                {TYPES_CONTRAT.map(t => <option key={t} value={t === '— Choisir —' ? '' : t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>{requiredLabel("Date d'entrée")}</label>
              <input required type="date" style={inp} value={form.dateEntree} onChange={e => setForm(f => ({ ...f, dateEntree: e.target.value }))} />
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>{requiredLabel('Date de sortie')}</label>
              <input required type="date" style={inp} value={form.dateSortie} onChange={e => setForm(f => ({ ...f, dateSortie: e.target.value }))} />
            </div>
          </div>

          {/* Adresse */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>{requiredLabel('Adresse')}</label>
            <input
              required
              style={inp}
              placeholder="Ex: 3 rue de Tours, 37000 Tours"
              value={form.adresse}
              onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
            />
          </div>

          {/* Bouton créer / modifier */}
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', color: 'white', borderRadius: 10, padding: '14px', fontWeight: 700, cursor: 'pointer', width: '100%', fontSize: 15 }}
          >
            {isSaving ? 'Enregistrement...' : editingId ? 'Enregistrer la fiche salarié' : 'Créer le salarié'}
          </button>
        </div>
      )}

      {/* Liste vide */}
      {(list.data ?? []).length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>
          <p style={{ fontSize: 40 }}>👥</p>
          <p>Aucun salarié</p>
        </div>
      )}

      {/* Liste des salariés */}
      {(list.data ?? []).map((s: any) => (
        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, marginBottom: 10 }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: 'white', fontSize: 16 }}>{s.prenom} {s.nom}</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              {s.role}{s.specialite ? ` · ${s.specialite}` : ''} · PIN {s.hasPinSet ? '✅' : '❌'}
              {hasSignedEngagement(String(s.id)) && <span style={{ color: '#4ade80', marginLeft: 8 }}>· RGPD ✅</span>}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
              {s.typeContrat || 'Contrat non renseigné'} · Entrée : {s.dateEntree || 'non renseignée'} · Sortie : {s.dateSortie || 'non renseignée'}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{s.adresse || 'Adresse non renseignée'}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => startEdit(s)}
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: 'white', borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Pencil size={14} />
              Modifier
            </button>
            {!hasSignedEngagement(String(s.id)) && (
              <button
                onClick={() => navigate(`/rgpd-salarie?salarieId=${s.id}`)}
                style={{ background: 'rgba(131,208,245,0.15)', border: '1px solid rgba(131,208,245,0.3)', color: '#83d0f5', borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <FileText size={14} />
                Signer RGPD
              </button>
            )}
            <button
              onClick={() => { if (confirm('Supprimer ce salarié ?')) del.mutate({ id: Number(s.id) }) }}
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

import { useState, type CSSProperties } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { FileText, Pencil, Printer, Trash2, UserPlus, X } from 'lucide-react';
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
  { key: 'role', label: 'Rôle' },
  { key: 'specialite', label: 'Spécialité' },
  { key: 'typeContrat', label: 'Type de contrat' },
  { key: 'dateEntree', label: "Date d'entrée" },
  { key: 'adresse', label: 'Adresse' },
];

export default function Salaries() {
  const [, navigate] = useLocation();
  const { state } = useApp();
  const [showForm, setShowForm] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SalarieForm>(EMPTY_FORM);
  const utils = trpc.useUtils();

  const list = trpc.studioUsers.list.useQuery();

  const resetForm = () => {
    setEditingId(null);
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
      return !String(form[key] ?? '').trim();
    });

    if (missing.length > 0) {
      toast.error(`Champs obligatoires : ${missing.map(f => f.label).join(', ')}`);
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
      specialite: form.specialite.trim(),
      typeContrat: form.typeContrat.trim(),
      dateEntree: form.dateEntree.trim(),
      dateSortie: form.dateSortie.trim(),
      adresse: form.adresse.trim(),
    };

    if (editingId) {
      update.mutate({
        id: editingId,
        ...cleanForm,
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
      role: (salarie.role || 'employe') as SalarieRole,
      specialite: salarie.specialite || '',
      typeContrat: salarie.typeContrat || '',
      dateEntree: salarie.dateEntree || '',
      dateSortie: salarie.dateSortie || '',
      adresse: salarie.adresse || '',
    });
    setEditingId(Number(salarie.id));
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

      <div style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: 16, padding: 18, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <FileText size={20} style={{ color: '#818cf8', flexShrink: 0, marginTop: 2 }} />
          <div>
            <h2 style={{ margin: 0, color: 'white', fontSize: 16, fontWeight: 700 }}>Fiche 15 — Engagement de Confidentialité (RGPD Art. 29)</h2>
            <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.62)', fontSize: 12, lineHeight: 1.5 }}>
              Cette fiche est réservée aux salariés. Elle n’apparaît plus dans les documents clients et doit être signée depuis la fiche du salarié concerné.
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire salarié obligatoire et prérempli en modification */}
      {showForm && (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, color: 'white', fontSize: 17, fontWeight: 700 }}>{editingId ? 'Modifier la fiche salarié' : 'Nouveau salarié'}</h3>
              <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                Tous les champs marqués * sont obligatoires.
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Prénom */}
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>{requiredLabel('Prénom')}</label>
              <input required style={inp} value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} />
            </div>

            {/* Nom */}
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>{requiredLabel('Nom')}</label>
              <input required style={inp} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
            </div>

            {/* Rôle */}
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>{requiredLabel('Rôle')}</label>
              <select required style={inp} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as SalarieRole }))}>
                <option value="employe">Employé</option>
                <option value="admin">Admin</option>
                <option value="stagiaire">Stagiaire</option>
              </select>
            </div>

            {/* Spécialité */}
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>{requiredLabel('Spécialité')}</label>
              <select required style={inp} value={form.specialite} onChange={e => setForm(f => ({ ...f, specialite: e.target.value }))}>
                {SPECIALITES.map(s => <option key={s} value={s === '— Choisir —' ? '' : s}>{s}</option>)}
              </select>
            </div>

            {/* Type de contrat */}
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>{requiredLabel('Type de contrat')}</label>
              <select required style={inp} value={form.typeContrat} onChange={e => setForm(f => ({ ...f, typeContrat: e.target.value }))}>
                {TYPES_CONTRAT.map(t => <option key={t} value={t === '— Choisir —' ? '' : t}>{t}</option>)}
              </select>
            </div>

            {/* Date d'entrée */}
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>{requiredLabel("Date d'entrée")}</label>
              <input required type="date" style={inp} value={form.dateEntree} onChange={e => setForm(f => ({ ...f, dateEntree: e.target.value }))} />
            </div>

            {/* Date de sortie */}
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>Date de sortie (optionnel)</label>
              <input type="date" style={inp} value={form.dateSortie} onChange={e => setForm(f => ({ ...f, dateSortie: e.target.value }))} />
            </div>

            {/* Adresse */}
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>{requiredLabel('Adresse')}</label>
              <input required style={inp} value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} placeholder="Ex: 3 rue de Tours, 37000 Tours" />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSaving}
              style={{ width: '100%', background: '#22c55e', border: 'none', color: 'white', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: isSaving ? 0.7 : 1, marginTop: 8 }}
            >
              {isSaving ? 'Enregistrement...' : (editingId ? 'Enregistrer les modifications' : 'Créer le salarié')}
            </button>
          </div>
        </div>
      )}

      {/* Liste des salariés */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {list.data?.filter((s: any) => !(s.role === "admin" && s.login === "admin")).map((salarie: any) => (
          <div key={salarie.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h4 style={{ margin: 0, color: 'white', fontSize: 16, fontWeight: 700 }}>{salarie.prenom} {salarie.nom}</h4>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                  {salarie.specialite} • {salarie.role}
                </p>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                  {salarie.typeContrat} • Entrée : {salarie.dateEntree || 'non renseignée'}
                  {salarie.dateSortie ? ` • Sortie : ${salarie.dateSortie}` : ''}
                </p>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                  Adresse : {salarie.adresse || 'non renseignée'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => startEdit(salarie)}
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                >
                  <Pencil size={14} /> Modifier
                </button>
                <button
                  onClick={() => {
                    navigate(`/rgpd-salarie?salarieId=${salarie.id}`);
                  }}
                  style={{ background: hasSignedEngagement(salarie.id) ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)', border: `1px solid ${hasSignedEngagement(salarie.id) ? '#22c55e' : '#6366f1'}`, color: hasSignedEngagement(salarie.id) ? '#22c55e' : '#6366f1', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                >
                  <FileText size={14} /> {hasSignedEngagement(salarie.id) ? 'Fiche 15 signée' : 'Signer fiche 15'}
                </button>
                <button
                  onClick={() => navigate(`/rgpd-salarie?salarieId=${salarie.id}&print=1`)}
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                >
                  <Printer size={14} /> Imprimer
                </button>
                <button
                  onClick={() => {
                    if (confirm('Supprimer ce salarié ?')) del.mutate({ id: salarie.id });
                  }}
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 8, padding: '8px', cursor: 'pointer' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

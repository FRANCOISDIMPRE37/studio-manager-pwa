import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { FileText, Trash2, UserPlus } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { ClientDocument } from '@/lib/types';

const SPECIALITES = [
  '— Choisir —', 'Tatouage', 'Piercing', 'Dermographie', 'Microblading',
  'Maquillage permanent', 'Esthétique', 'Coiffure', 'Autre'
];

const TYPES_CONTRAT = [
  '— Choisir —', 'CDI', 'CDD', 'Stage', 'Alternance', 'Freelance', 'Intérim'
];

export default function Salaries() {
  const [, navigate] = useLocation();
  const { state } = useApp();
  const [showForm, setShowForm] = useState(true);
  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    pin: '',
    role: 'employe' as 'employe' | 'admin' | 'stagiaire',
    specialite: '',
    typeContrat: '',
    dateEntree: '',
    dateSortie: '',
    adresse: '',
  });
  const utils = trpc.useUtils();

  const list = trpc.studioUsers.list.useQuery();

  const del = trpc.studioUsers.delete.useMutation({
    onSuccess: () => {
      utils.studioUsers.list.invalidate();
      toast.success('Salarié supprimé');
    }
  });

  const create = trpc.studioUsers.create.useMutation({
    onSuccess: (data) => {
      utils.studioUsers.list.invalidate();
      setShowForm(false);
      setForm({ prenom: '', nom: '', pin: '', role: 'employe', specialite: '', typeContrat: '', dateEntree: '', dateSortie: '', adresse: '' });
      toast.success('Salarié créé !');

    },
    onError: (e) => toast.error(e.message)
  });

  const handleCreate = () => {
    if (!form.prenom || !form.nom) return toast.error('Prénom et Nom obligatoires');
    const pin = form.pin || Math.floor(1000 + Math.random() * 9000).toString();
    const login = (form.prenom + form.nom).toLowerCase().replace(/[^a-z0-9]/g, '') + Date.now();
    const password = Math.random().toString(36).slice(2, 10);
    create.mutate({ ...form, pin, login, password });
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
  } as React.CSSProperties;

  return (
    <div style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'white' }}>Salariés</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: 'white', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <UserPlus size={16} />
          + Ajouter
        </button>
      </div>

      {/* Formulaire nouveau salarié */}
      {showForm && (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 20px', color: 'white', fontSize: 17, fontWeight: 700 }}>Nouveau salarié</h3>

          {/* Prénom / Nom */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>Prénom *</label>
              <input style={inp} value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} />
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>Nom *</label>
              <input style={inp} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
            </div>
          </div>

          {/* Rôle / Spécialité */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>Rôle</label>
              <select style={inp} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}>
                <option value="employe">Employé</option>
                <option value="admin">Admin</option>
                <option value="stagiaire">Stagiaire</option>
              </select>
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>Spécialité</label>
              <select style={inp} value={form.specialite} onChange={e => setForm(f => ({ ...f, specialite: e.target.value }))}>
                {SPECIALITES.map(s => <option key={s} value={s === '— Choisir —' ? '' : s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Type de contrat / Date d'entrée */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>Type de contrat</label>
              <select style={inp} value={form.typeContrat} onChange={e => setForm(f => ({ ...f, typeContrat: e.target.value }))}>
                {TYPES_CONTRAT.map(t => <option key={t} value={t === '— Choisir —' ? '' : t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>Date d'entrée</label>
              <input type="date" style={inp} value={form.dateEntree} onChange={e => setForm(f => ({ ...f, dateEntree: e.target.value }))} />
            </div>
          </div>

          {/* Date de sortie */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>Date de sortie</label>
            <input type="date" style={{ ...inp, width: 'calc(50% - 7px)' }} value={form.dateSortie} onChange={e => setForm(f => ({ ...f, dateSortie: e.target.value }))} />
          </div>

          {/* Adresse */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 6 }}>Adresse</label>
            <input
              style={inp}
              placeholder="Ex: 3 rue de Tours, 37000 Tours"
              value={form.adresse}
              onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
            />
          </div>

          {/* Bouton créer */}
          <button
            onClick={handleCreate}
            disabled={create.isPending}
            style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', color: 'white', borderRadius: 10, padding: '14px', fontWeight: 700, cursor: 'pointer', width: '100%', fontSize: 15 }}
          >
            {create.isPending ? 'Création...' : 'Créer le salarié'}
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
              {hasSignedEngagement(s.id) && <span style={{ color: '#4ade80', marginLeft: 8 }}>· RGPD ✅</span>}
            </p>
            {s.typeContrat && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{s.typeContrat}{s.dateEntree ? ` · Entrée : ${s.dateEntree}` : ''}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!hasSignedEngagement(s.id) && (
              <button
                onClick={() => navigate(`/rgpd-salarie?salarieId=${s.id}`)}
                style={{ background: 'rgba(131,208,245,0.15)', border: '1px solid rgba(131,208,245,0.3)', color: '#83d0f5', borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <FileText size={14} />
                Signer RGPD
              </button>
            )}
            <button
              onClick={() => { if (confirm('Supprimer ce salarié ?')) del.mutate({ id: s.id }) }}
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

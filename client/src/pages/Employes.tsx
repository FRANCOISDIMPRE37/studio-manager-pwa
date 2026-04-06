/**
 * Employes.tsx — Gestion complète des employés du salon
 * - Liste des employés avec rôle, spécialité et statut
 * - Création / modification / désactivation
 * - Attribution d'un employé aux documents
 */
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import {
  UserPlus, Pencil, Trash2, Eye, EyeOff, ShieldCheck,
  User, GraduationCap, CheckCircle, XCircle, Loader2, X, Save,
  Scissors, Palette, Sparkles, ChevronLeft,
} from 'lucide-react';
import { Link } from 'wouter';

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = 'admin' | 'employe' | 'stagiaire';

const SPECIALITES = [
  { value: 'piercing', label: 'Piercing', icon: '💎' },
  { value: 'tatouage', label: 'Tatouage', icon: '🎨' },
  { value: 'dermographie', label: 'Dermographie', icon: '✨' },
  { value: 'piercing,tatouage', label: 'Piercing & Tatouage', icon: '💎🎨' },
  { value: 'piercing,dermographie', label: 'Piercing & Dermographie', icon: '💎✨' },
  { value: 'tatouage,dermographie', label: 'Tatouage & Dermographie', icon: '🎨✨' },
  { value: 'piercing,tatouage,dermographie', label: 'Toutes spécialités', icon: '⭐' },
];

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrateur',
  employe: 'Employé',
  stagiaire: 'Stagiaire',
};

const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-cyan-900/40 text-cyan-300 border-cyan-700',
  employe: 'bg-blue-900/40 text-blue-300 border-blue-700',
  stagiaire: 'bg-purple-900/40 text-purple-300 border-purple-700',
};

const ROLE_ICONS: Record<Role, React.ReactNode> = {
  admin: <ShieldCheck size={13} />,
  employe: <User size={13} />,
  stagiaire: <GraduationCap size={13} />,
};

interface FormState {
  prenom: string;
  nom: string;
  login: string;
  password: string;
  confirmPassword: string;
  pin: string;
  role: Role;
  specialite: string;
  actif: boolean;
}

const EMPTY_FORM: FormState = {
  prenom: '', nom: '', login: '', password: '', confirmPassword: '',
  pin: '', role: 'employe', specialite: '', actif: true,
};

// ─── Composant principal ──────────────────────────────────────────────────────
export default function Employes() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // ─── Requêtes tRPC ──────────────────────────────────────────────────────────
  const { data: employes = [], isLoading, refetch } = trpc.studioUsers.list.useQuery();

  const createMutation = trpc.studioUsers.create.useMutation({
    onSuccess: () => {
      toast.success('Employé créé avec succès !');
      refetch();
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.studioUsers.update.useMutation({
    onSuccess: () => {
      toast.success('Employé mis à jour !');
      refetch();
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.studioUsers.delete.useMutation({
    onSuccess: () => {
      toast.success('Employé désactivé.');
      refetch();
      setConfirmDelete(null);
    },
    onError: (e) => toast.error(e.message),
  });

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditingId(null);
    setShowPassword(false);
  };

  const startEdit = (emp: any) => {
    setForm({
      prenom: emp.prenom || '',
      nom: emp.nom || '',
      login: emp.login || '',
      password: '',
      confirmPassword: '',
      pin: '',
      role: emp.role || 'employe',
      specialite: emp.specialite || '',
      actif: emp.actif ?? true,
    });
    setEditingId(emp.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    if (editingId !== null) {
      const payload: any = {
        id: editingId,
        prenom: form.prenom,
        nom: form.nom,
        login: form.login,
        role: form.role,
        specialite: form.specialite || undefined,
        actif: form.actif,
      };
      if (form.password) payload.password = form.password;
      if (form.pin && form.pin.length === 4) payload.pin = form.pin;
      updateMutation.mutate(payload);
    } else {
      if (!form.password) { toast.error('Le mot de passe est requis.'); return; }
      if (form.pin && form.pin.length > 0 && form.pin.length !== 4) {
        toast.error('Le code PIN doit être exactement 4 chiffres.');
        return;
      }
      createMutation.mutate({
        prenom: form.prenom,
        nom: form.nom,
        login: form.login,
        password: form.password,
        pin: form.pin && form.pin.length === 4 ? form.pin : undefined,
        role: form.role,
        specialite: form.specialite || undefined,
        actif: true,
      });
    }
  };

  const getSpecialiteLabel = (val: string) =>
    SPECIALITES.find(s => s.value === val)?.label || val || '—';

  const getSpecialiteIcon = (val: string) =>
    SPECIALITES.find(s => s.value === val)?.icon || '';

  const isBusy = createMutation.isPending || updateMutation.isPending;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: 'var(--brand-navy)' }}>

      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-white/10"
              style={{ color: 'var(--brand-text-muted)', border: '1px solid var(--brand-border)' }}>
              <ChevronLeft size={16} /> Tableau de bord
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--brand-cyan)', fontFamily: 'Outfit' }}>
              Employés
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--brand-text-muted)' }}>
              {employes.length} membre{employes.length > 1 ? 's' : ''} dans votre équipe
            </p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
            style={{ background: 'var(--brand-cyan)', color: '#000' }}
          >
            <UserPlus size={16} /> Nouvel employé
          </button>
        )}
      </div>

      {/* ─── Formulaire création / modification ─── */}
      {showForm && (
        <div className="studio-card rounded-2xl p-5 mb-6" style={{ border: '1px solid var(--brand-cyan)', background: 'rgba(0,200,255,0.03)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg" style={{ color: 'var(--brand-cyan)', fontFamily: 'Outfit' }}>
              {editingId ? '✏️ Modifier l\'employé' : '➕ Nouvel employé'}
            </h2>
            <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: 'var(--brand-text-muted)' }}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nom & Prénom */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1 font-500" style={{ color: 'var(--brand-text-muted)' }}>Prénom *</label>
                <input
                  type="text" required value={form.prenom}
                  onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                  placeholder="Marie"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1 font-500" style={{ color: 'var(--brand-text-muted)' }}>Nom *</label>
                <input
                  type="text" required value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Dupont"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }}
                />
              </div>
            </div>

            {/* Login */}

            {/* Code PIN */}
            <div>
              <label className="block text-xs mb-1 font-500" style={{ color: 'var(--brand-text-muted)' }}>
                🔐 Code PIN (4 chiffres) {editingId ? '— laisser vide = inchangé' : '— optionnel'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={form.pin}
                onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) }))}
                placeholder="Ex : 1234"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none tracking-widest font-mono"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${form.pin.length > 0 && form.pin.length < 4 ? '#f59e0b' : 'var(--brand-border)'}`,
                  color: 'var(--brand-text)',
                  letterSpacing: '0.3em',
                }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>
                Permet à l’employé de se connecter rapidement sur tablette partagée
              </p>
            </div>

            {/* Rôle & Spécialité */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1 font-500" style={{ color: 'var(--brand-text-muted)' }}>Rôle *</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }}
                >
                  <option value="employe" style={{ background: '#0D1E38' }}>Employé</option>
                  <option value="admin" style={{ background: '#0D1E38' }}>Administrateur</option>
                  <option value="stagiaire" style={{ background: '#0D1E38' }}>Stagiaire</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1 font-500" style={{ color: 'var(--brand-text-muted)' }}>Spécialité</label>
                <select
                  value={form.specialite}
                  onChange={e => setForm(f => ({ ...f, specialite: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }}
                >
                  <option value="" style={{ background: '#0D1E38' }}>— Choisir —</option>
                  {SPECIALITES.map(s => (
                    <option key={s.value} value={s.value} style={{ background: '#0D1E38' }}>{s.icon} {s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Statut (modification uniquement) */}
            {editingId && (
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
                <label className="text-sm font-500 flex-1" style={{ color: 'var(--brand-text)' }}>Compte actif</label>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, actif: !f.actif }))}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-500 transition-all"
                  style={{
                    background: form.actif ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    border: `1px solid ${form.actif ? '#22c55e' : '#ef4444'}`,
                    color: form.actif ? '#22c55e' : '#ef4444',
                  }}
                >
                  {form.actif ? <><CheckCircle size={14} /> Actif</> : <><XCircle size={14} /> Inactif</>}
                </button>
              </div>
            )}

            {/* Boutons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit" disabled={isBusy}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all"
                style={{ background: 'var(--brand-cyan)', color: '#000', opacity: isBusy ? 0.7 : 1 }}
              >
                {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editingId ? 'Enregistrer les modifications' : 'Créer l\'employé'}
              </button>
              <button
                type="button" onClick={resetForm}
                className="px-4 py-2.5 rounded-xl text-sm transition-all hover:bg-white/10"
                style={{ color: 'var(--brand-text-muted)', border: '1px solid var(--brand-border)' }}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Liste des employés ─── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--brand-cyan)' }} />
        </div>
      ) : employes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(0,200,255,0.08)', border: '1px solid var(--brand-border)' }}>
            <User size={28} style={{ color: 'var(--brand-cyan)', opacity: 0.6 }} />
          </div>
          <p className="text-lg font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>Aucun employé</p>
          <p className="text-sm mb-4" style={{ color: 'var(--brand-text-muted)' }}>
            Ajoutez votre premier employé pour commencer
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm"
            style={{ background: 'var(--brand-cyan)', color: '#000' }}
          >
            <UserPlus size={16} /> Ajouter un employé
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {employes.map((emp: any) => (
            <div
              key={emp.id}
              className="studio-card rounded-2xl p-4 flex flex-col gap-3 transition-all"
              style={{
                border: `1px solid ${emp.actif ? 'var(--brand-border)' : 'rgba(239,68,68,0.3)'}`,
                background: emp.actif ? 'rgba(255,255,255,0.02)' : 'rgba(239,68,68,0.04)',
                opacity: emp.actif ? 1 : 0.7,
              }}
            >
              {/* Avatar + Nom */}
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold"
                  style={{ background: 'rgba(0,200,255,0.12)', color: 'var(--brand-cyan)' }}>
                  {emp.prenom?.[0]?.toUpperCase()}{emp.nom?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: 'var(--brand-text)', fontFamily: 'Outfit' }}>
                    {emp.prenom} {emp.nom}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--brand-text-muted)' }}>
                    @{emp.login}
                  </p>
                </div>
                {/* Statut actif/inactif */}
                <span className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                  style={{
                    background: emp.actif ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                    color: emp.actif ? '#22c55e' : '#ef4444',
                    border: `1px solid ${emp.actif ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  }}>
                  {emp.actif ? <CheckCircle size={11} /> : <XCircle size={11} />}
                  {emp.actif ? 'Actif' : 'Inactif'}
                </span>
              </div>

              {/* Badges Rôle + Spécialité */}
              <div className="flex flex-wrap gap-2">
                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border font-500 ${ROLE_COLORS[emp.role as Role] || ROLE_COLORS.employe}`}>
                  {ROLE_ICONS[emp.role as Role] || <User size={13} />}
                  {ROLE_LABELS[emp.role as Role] || emp.role}
                </span>
                {emp.specialite && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border font-500"
                    style={{ background: 'rgba(168,85,247,0.12)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)' }}>
                    {getSpecialiteIcon(emp.specialite)} {getSpecialiteLabel(emp.specialite)}
                  </span>
                )}
                {emp.hasPinSet && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border font-500"
                    style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                    🔐 PIN configuré
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1 border-t" style={{ borderColor: 'var(--brand-border)' }}>
                <button
                  onClick={() => startEdit(emp)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-500 transition-all hover:bg-white/10"
                  style={{ color: 'var(--brand-cyan)', border: '1px solid rgba(0,200,255,0.2)' }}
                >
                  <Pencil size={13} /> Modifier
                </button>
                {confirmDelete === emp.id ? (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => deleteMutation.mutate({ id: emp.id })}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-600 transition-all"
                      style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)' }}
                    >
                      {deleteMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : '✓'} Confirmer
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-2 py-1.5 rounded-lg text-xs hover:bg-white/10"
                      style={{ color: 'var(--brand-text-muted)' }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(emp.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-500 transition-all hover:bg-red-900/20"
                    style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                    title="Désactiver cet employé"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Info attribution documents ─── */}
      <div className="mt-8 p-4 rounded-2xl" style={{ background: 'rgba(0,200,255,0.04)', border: '1px solid rgba(0,200,255,0.15)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--brand-cyan)' }}>💡 Attribution des documents</p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--brand-text-muted)' }}>
          Lors de la création d'un document client, vous pouvez sélectionner l'employé qui réalise la prestation.
          Son nom apparaîtra automatiquement sur le document et dans les archives.
          Rendez-vous dans <strong style={{ color: 'var(--brand-text)' }}>Clients → Fiche client → Nouveau document</strong>.
        </p>
      </div>
    </div>
  );
}

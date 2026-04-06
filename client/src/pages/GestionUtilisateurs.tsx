/**
 * GestionUtilisateurs — Section Paramètres > Utilisateurs
 * Permet à l'administrateur de créer, modifier, désactiver et supprimer
 * des comptes utilisateurs locaux avec mot de passe.
 */
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import {
  UserPlus, Pencil, Trash2, KeyRound, Eye, EyeOff, Lock,
  ShieldCheck, User, GraduationCap, CheckCircle, XCircle, Loader2,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type Role = 'admin' | 'employe' | 'stagiaire';

interface FormState {
  prenom: string;
  nom: string;
  email: string;
  login: string;
  password: string;
  confirmPassword: string;
  role: Role;
  actif: boolean;
}

const EMPTY_FORM: FormState = {
  prenom: '', nom: '', email: '', login: '', password: '', confirmPassword: '',
  role: 'employe', actif: true,
};

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrateur',
  employe: 'Employé',
  stagiaire: 'Stagiaire',
};

const ROLE_ICONS: Record<Role, React.ReactNode> = {
  admin: <ShieldCheck size={14} className="text-cyan-400" />,
  employe: <User size={14} className="text-blue-400" />,
  stagiaire: <GraduationCap size={14} className="text-purple-400" />,
};

const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-cyan-900/40 text-cyan-300 border-cyan-700',
  employe: 'bg-blue-900/40 text-blue-300 border-blue-700',
  stagiaire: 'bg-purple-900/40 text-purple-300 border-purple-700',
};

// ─── Composant principal ──────────────────────────────────────────────────────
export default function GestionUtilisateurs() {
  const utils = trpc.useUtils();

  // Données
  const { data: users = [], isLoading } = trpc.studioUsers.list.useQuery();

  // Mutations
  const createUser = trpc.studioUsers.create.useMutation({
    onSuccess: () => {
      toast.success('Utilisateur créé avec succès');
      utils.studioUsers.list.invalidate();
      setShowForm(false);
      setForm(EMPTY_FORM);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateUser = trpc.studioUsers.update.useMutation({
    onSuccess: () => {
      toast.success('Utilisateur modifié');
      utils.studioUsers.list.invalidate();
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteUser = trpc.studioUsers.delete.useMutation({
    onSuccess: () => {
      toast.success('Utilisateur supprimé');
      utils.studioUsers.list.invalidate();
      setConfirmDeleteId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const resetPassword = trpc.studioUsers.resetPassword.useMutation({
    onSuccess: () => {
      toast.success('Mot de passe réinitialisé');
      setResetPasswordId(null);
      setNewPassword('');
    },
    onError: (e) => toast.error(e.message),
  });

  // État local
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [pinModalId, setPinModalId] = useState<number | null>(null);
  const [newPin, setNewPin] = useState('');
  const setPin = trpc.studioUsers.setPin.useMutation({ onSuccess: () => { toast.success('PIN défini !'); setPinModalId(null); setNewPin(''); }, onError: (e) => toast.error(e.message) });
  const [resetPasswordId, setResetPasswordId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowPassword(false);
    setShowForm(true);
  };

  const openEdit = (user: typeof users[0]) => {
    setEditingId(user.id);
    setForm({
      prenom: user.prenom,
      nom: user.nom,
      email: (user as any).email || '',
      login: user.login,
      password: '',
      confirmPassword: '',
      role: user.role as Role,
      actif: user.actif,
    });
    setShowPassword(false);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId && form.password !== form.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (editingId && form.password && form.password !== form.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (editingId) {
      updateUser.mutate({
        id: editingId,
        prenom: form.prenom,
        nom: form.nom,
        email: form.email||undefined,
        login: form.login,
        password: form.password || undefined,
        role: form.role,
        actif: form.actif,
      });
    } else {
      createUser.mutate({
        prenom: form.prenom,
        nom: form.nom,
        email: form.email||undefined,
        login: form.login,
        password: form.password,
        role: form.role,
        actif: form.actif,
      });
    }
  };

  const handleResetPassword = () => {
    if (!resetPasswordId || newPassword.length < 6) {
      toast.error('Le mot de passe doit faire au moins 6 caractères');
      return;
    }
    resetPassword.mutate({ id: resetPasswordId, newPassword });
  };

  // ─── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#E6F1FF]">Gestion des utilisateurs</h2>
          <p className="text-sm text-[#8892B0] mt-1">
            Créez des comptes pour vos employés et stagiaires. Chaque utilisateur se connecte avec son propre login et mot de passe.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#64FFDA] text-[#0A192F] rounded-lg font-semibold text-sm hover:bg-[#4de8c4] transition-colors"
        >
          <UserPlus size={16} />
          Nouvel utilisateur
        </button>
      </div>

      {/* Formulaire de création / modification */}
      {showForm && (
        <div className="bg-[#112240] border border-[#64FFDA]/20 rounded-xl p-6">
          <h3 className="text-base font-bold text-[#64FFDA] mb-5">
            {editingId ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8892B0] mb-1.5 uppercase tracking-wide">Prénom *</label>
                <input
                  type="text"
                  required
                  value={form.prenom}
                  onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                  className="w-full bg-[#0A192F] border border-[#64FFDA]/20 rounded-lg px-3 py-2 text-[#E6F1FF] text-sm focus:outline-none focus:border-[#64FFDA]/60"
                  placeholder="ex: Marie"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#8892B0] mb-1.5 uppercase tracking-wide">Nom *</label>
                <input
                  type="text"
                  required
                  value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  className="w-full bg-[#0A192F] border border-[#64FFDA]/20 rounded-lg px-3 py-2 text-[#E6F1FF] text-sm focus:outline-none focus:border-[#64FFDA]/60"
                  placeholder="ex: Dupont"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8892B0] mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-[#0A192F] border border-[#64FFDA]/20 rounded-lg px-3 py-2 text-[#E6F1FF] text-sm focus:outline-none focus:border-[#64FFDA]/60"
                placeholder="ex: marie@salon.fr"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8892B0] mb-1.5 uppercase tracking-wide">Login (identifiant de connexion) *</label>
              <input
                type="text"
                required
                value={form.login}
                onChange={e => setForm(f => ({ ...f, login: e.target.value.toLowerCase().replace(/\s/g, '') }))}
                className="w-full bg-[#0A192F] border border-[#64FFDA]/20 rounded-lg px-3 py-2 text-[#E6F1FF] text-sm focus:outline-none focus:border-[#64FFDA]/60"
                placeholder="ex: marie.dupont"
                pattern="[a-zA-Z0-9._-]+"
                minLength={3}
              />
              <p className="text-xs text-[#8892B0] mt-1">Lettres, chiffres, points, tirets et underscores uniquement</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8892B0] mb-1.5 uppercase tracking-wide">
                  {editingId ? 'Nouveau mot de passe (laisser vide = inchangé)' : 'Mot de passe *'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingId}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full bg-[#0A192F] border border-[#64FFDA]/20 rounded-lg px-3 py-2 pr-10 text-[#E6F1FF] text-sm focus:outline-none focus:border-[#64FFDA]/60"
                    placeholder="Min. 6 caractères"
                    minLength={editingId ? 0 : 6}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8892B0] hover:text-[#64FFDA]">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#8892B0] mb-1.5 uppercase tracking-wide">Confirmer le mot de passe</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required={!editingId || form.password.length > 0}
                  value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  className="w-full bg-[#0A192F] border border-[#64FFDA]/20 rounded-lg px-3 py-2 text-[#E6F1FF] text-sm focus:outline-none focus:border-[#64FFDA]/60"
                  placeholder="Répéter le mot de passe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8892B0] mb-1.5 uppercase tracking-wide">Rôle *</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}
                  className="w-full bg-[#0A192F] border border-[#64FFDA]/20 rounded-lg px-3 py-2 text-[#E6F1FF] text-sm focus:outline-none focus:border-[#64FFDA]/60"
                >
                  <option value="employe">Employé</option>
                  <option value="admin">Administrateur</option>
                  <option value="stagiaire">Stagiaire</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setForm(f => ({ ...f, actif: !f.actif }))}
                    className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${form.actif ? 'bg-[#64FFDA]' : 'bg-[#8892B0]/30'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform ${form.actif ? 'translate-x-5.5 ml-5' : 'ml-0.5'}`} />
                  </div>
                  <span className="text-sm text-[#E6F1FF]">Compte actif</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={createUser.isPending || updateUser.isPending}
                className="flex items-center gap-2 px-5 py-2 bg-[#64FFDA] text-[#0A192F] rounded-lg font-semibold text-sm hover:bg-[#4de8c4] disabled:opacity-50 transition-colors"
              >
                {(createUser.isPending || updateUser.isPending) && <Loader2 size={14} className="animate-spin" />}
                {editingId ? 'Enregistrer les modifications' : 'Créer l\'utilisateur'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
                className="px-5 py-2 border border-[#64FFDA]/30 text-[#8892B0] rounded-lg text-sm hover:text-[#E6F1FF] transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des utilisateurs */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-[#64FFDA]" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-[#112240] border border-[#64FFDA]/10 rounded-xl p-10 text-center">
          <User size={40} className="text-[#8892B0] mx-auto mb-3" />
          <p className="text-[#E6F1FF] font-semibold">Aucun utilisateur créé</p>
          <p className="text-[#8892B0] text-sm mt-1">Cliquez sur "Nouvel utilisateur" pour créer le premier compte.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(user => (
            <div key={user.id} className="bg-[#112240] border border-[#64FFDA]/15 rounded-xl px-5 py-4 flex items-center gap-4">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-[#0A192F] border border-[#64FFDA]/30 flex items-center justify-center flex-shrink-0">
                <span className="text-[#64FFDA] font-bold text-sm">
                  {user.prenom[0]}{user.nom[0]}
                </span>
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[#E6F1FF]">{user.prenom} {user.nom}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${ROLE_COLORS[user.role as Role]}`}>
                    {ROLE_ICONS[user.role as Role]}
                    {ROLE_LABELS[user.role as Role]}
                  </span>
                  {user.actif ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-900/30 border border-green-700 text-green-300 text-xs">
                      <CheckCircle size={11} /> Actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-900/30 border border-red-700 text-red-300 text-xs">
                      <XCircle size={11} /> Inactif
                    </span>
                  )}
                </div>
                <p className="text-[#8892B0] text-xs mt-0.5">Login : <span className="text-[#64FFDA] font-mono">{user.login}</span></p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => { setResetPasswordId(user.id); setNewPassword(''); }}
                  title="Réinitialiser le mot de passe"
                  className="p-2 text-[#8892B0] hover:text-[#64FFDA] hover:bg-[#64FFDA]/10 rounded-lg transition-colors"
                >
                  <KeyRound size={16} />
                </button>
                <button
                  onClick={() => openEdit(user)}
                  title="Modifier"
                  className="p-2 text-[#8892B0] hover:text-[#64FFDA] hover:bg-[#64FFDA]/10 rounded-lg transition-colors"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => { setPinModalId(user.id); setNewPin(''); }}
                  title="Définir PIN"
                  className="p-2 text-[#8892B0] hover:text-yellow-400 hover:bg-yellow-900/20 rounded-lg transition-colors"
                >
                  <Lock size={16} />
                </button>
                <button
                  onClick={() => setConfirmDeleteId(user.id)}
                  title="Supprimer"
                  className="p-2 text-[#8892B0] hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal confirmation suppression */}
      {pinModalId !== null && (<div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:"rgba(0,0,0,0.7)"}}><div className="rounded-xl p-6 w-80" style={{background:"#0F2040",border:"1px solid var(--brand-border)"}}><h3 className="text-base font-bold text-white mb-4">Definir le code PIN</h3><input type="text" maxLength={4} value={newPin} onChange={e=>setNewPin(e.target.value.replace(/[^0-9]/g,"").slice(0,4))} placeholder="4 chiffres" className="w-full bg-[#0A192F] border border-[#64FFDA]/20 rounded-lg px-3 py-2 text-white text-center text-2xl tracking-widest mb-4" /><div className="flex gap-2"><button onClick={()=>setPin.mutate({employeId:pinModalId,pin:newPin})} disabled={newPin.length!==4} className="flex-1 py-2 rounded-lg text-sm" style={{background:"var(--brand-cyan)",color:"#0A1628"}}>Enregistrer</button><button onClick={()=>setPinModalId(null)} className="flex-1 py-2 rounded-lg text-sm" style={{background:"rgba(255,255,255,0.05)",color:"var(--brand-text-muted)"}}>Annuler</button></div></div></div>)}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#112240] border border-red-700/50 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-red-400 mb-2">Supprimer l'utilisateur ?</h3>
            <p className="text-sm text-[#8892B0] mb-5">Cette action est irréversible. L'utilisateur ne pourra plus se connecter.</p>
            <div className="flex gap-3">
              <button
                onClick={() => deleteUser.mutate({ id: confirmDeleteId })}
                disabled={deleteUser.isPending}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleteUser.isPending ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Supprimer'}
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 border border-[#64FFDA]/30 text-[#8892B0] rounded-lg text-sm hover:text-[#E6F1FF] transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal réinitialisation mot de passe */}
      {resetPasswordId !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#112240] border border-[#64FFDA]/30 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-[#64FFDA] mb-2">Réinitialiser le mot de passe</h3>
            <p className="text-sm text-[#8892B0] mb-4">Saisissez le nouveau mot de passe pour cet utilisateur.</p>
            <div className="relative mb-5">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-[#0A192F] border border-[#64FFDA]/20 rounded-lg px-3 py-2 pr-10 text-[#E6F1FF] text-sm focus:outline-none focus:border-[#64FFDA]/60"
                placeholder="Nouveau mot de passe (min. 6 caractères)"
                minLength={6}
              />
              <button type="button" onClick={() => setShowNewPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8892B0] hover:text-[#64FFDA]">
                {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleResetPassword}
                disabled={resetPassword.isPending || newPassword.length < 6}
                className="flex-1 py-2 bg-[#64FFDA] text-[#0A192F] rounded-lg text-sm font-semibold hover:bg-[#4de8c4] disabled:opacity-50 transition-colors"
              >
                {resetPassword.isPending ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Enregistrer'}
              </button>
              <button
                onClick={() => { setResetPasswordId(null); setNewPassword(''); }}
                className="flex-1 py-2 border border-[#64FFDA]/30 text-[#8892B0] rounded-lg text-sm hover:text-[#E6F1FF] transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

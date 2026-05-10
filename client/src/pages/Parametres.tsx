/*
 * DESIGN: Studio Nocturne — Page paramètres avec infos salon, PIN, RGPD
 */
import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { useTranslation } from 'react-i18next';
import { Building2, Phone, Mail, MapPin, Hash, User, Shield, Lock, LogOut, Info, ExternalLink, Download, Upload, Users, Archive, Stethoscope, FileText, AlertTriangle, ImageIcon, ChevronRight, Send, CheckCircle, XCircle, Server } from 'lucide-react';
import { Link } from 'wouter';
import { SalonInfo } from '@/lib/types';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';


function SmtpSection() {
  const utils = trpc.useUtils();
  const { data: cfg, isLoading } = trpc.smtp.get.useQuery();
  const save = trpc.smtp.save.useMutation({
    onSuccess: () => { utils.smtp.get.invalidate(); toast.success('Configuration email sauvegardée !'); },
    onError: (e: any) => toast.error(e.message),
  });
  const test = trpc.smtp.test.useMutation({
    onSuccess: (r: any) => toast.success(r.message || 'Connexion SMTP réussie !'),
    onError: (e: any) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    host: '', port: 587, secure: false, user: '', password: '', fromName: '', replyTo: '',
  });
  const [loaded, setLoaded] = useState(false);

  if (!loaded && cfg) {
    setForm({
      host: (cfg as any).host ?? '',
      port: (cfg as any).port ?? 587,
      secure: (cfg as any).secure ?? false,
      user: (cfg as any).user ?? '',
      password: '',
      fromName: (cfg as any).fromName ?? '',
      replyTo: (cfg as any).replyTo ?? '',
    });
    setLoaded(true);
  }

  const inp = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', borderRadius: 8, padding: '8px 12px', width: '100%', fontSize: 13, outline: 'none' } as React.CSSProperties;
  const lbl = { color: 'rgba(255,255,255,0.6)', fontSize: 11, display: 'block', marginBottom: 4 } as React.CSSProperties;

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Mail size={18} style={{ color: 'var(--brand-cyan)' }} />
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'white' }}>Configuration Email (SMTP)</h3>
        {cfg && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#22c55e', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20, padding: '2px 10px' }}>✓ Configuré</span>}
      </div>

      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 16, lineHeight: 1.5 }}>
        Configurez votre serveur email pour envoyer des rappels automatiques 24h avant chaque RDV et des documents à vos clients.
      </p>

      {isLoading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Chargement...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
            <div>
              <label style={lbl}>Serveur SMTP (host)</label>
              <input style={inp} placeholder="ex: smtp.gmail.com" value={form.host} onChange={e => setForm(f => ({ ...f, host: e.target.value }))} />
            </div>
            <div style={{ minWidth: 90 }}>
              <label style={lbl}>Port</label>
              <input style={inp} type="number" placeholder="587" value={form.port} onChange={e => setForm(f => ({ ...f, port: Number(e.target.value) }))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Email expéditeur (login SMTP)</label>
              <input style={inp} type="email" placeholder="votre@email.com" value={form.user} onChange={e => setForm(f => ({ ...f, user: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>{(cfg as any)?.passwordSet ? 'Nouveau mot de passe (vide = inchangé)' : 'Mot de passe SMTP'}</label>
              <input style={inp} type="password" placeholder={(cfg as any)?.passwordSet ? '••••••••' : 'Mot de passe'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Nom affiché (optionnel)</label>
              <input style={inp} placeholder="ex: Studio Intemporelle" value={form.fromName} onChange={e => setForm(f => ({ ...f, fromName: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Email de réponse (optionnel)</label>
              <input style={inp} type="email" placeholder="reponse@email.com" value={form.replyTo} onChange={e => setForm(f => ({ ...f, replyTo: e.target.value }))} />
            </div>
          </div>

          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, cursor: 'pointer' }}
            onClick={() => setForm(f => ({ ...f, secure: !f.secure }))}
          >
            <div style={{ width: 36, height: 20, background: form.secure ? '#6366f1' : 'rgba(255,255,255,0.15)', borderRadius: 10, position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 2, left: form.secure ? 18 : 2, width: 16, height: 16, background: 'white', borderRadius: '50%', transition: 'left 0.2s' }} />
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>Connexion sécurisée SSL/TLS (port 465)</span>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              onClick={() => save.mutate({ host: form.host, port: form.port, secure: form.secure, user: form.user, password: form.password || undefined, fromName: form.fromName || undefined, replyTo: form.replyTo || undefined })}
              disabled={save.isPending || !form.host || !form.user}
              style={{ flex: 1, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: 'white', borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: (!form.host || !form.user) ? 0.5 : 1 }}
            >
              {save.isPending ? 'Sauvegarde...' : '💾 Sauvegarder'}
            </button>
            <button
              onClick={() => test.mutate()}
              disabled={test.isPending || !cfg}
              style={{ flex: 1, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: !cfg ? 0.4 : 1 }}
            >
              {test.isPending ? 'Test en cours...' : '📡 Tester la connexion'}
            </button>
          </div>

          <div style={{ background: 'rgba(131,208,245,0.06)', border: '1px solid rgba(131,208,245,0.15)', borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              <strong style={{ color: 'rgba(255,255,255,0.65)' }}>Gmail :</strong> smtp.gmail.com · port 587 · activer "Mot de passe d'application" dans votre compte Google<br />
              <strong style={{ color: 'rgba(255,255,255,0.65)' }}>OVH :</strong> ssl0.ovh.net · port 587<br />
              <strong style={{ color: 'rgba(255,255,255,0.65)' }}>Orange :</strong> smtp.orange.fr · port 587
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SalarieSection() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ prenom: '', nom: '', login: '', password: '', pin: '', role: 'employe' as const });
  const utils = trpc.useUtils();
  const list = trpc.studioUsers.list.useQuery();
  const create = trpc.studioUsers.create.useMutation({ onSuccess: () => { utils.studioUsers.list.invalidate(); setShowForm(false); setForm({ prenom: '', nom: '', login: '', password: '', pin: '', role: 'employe' }); toast.success('Salarié créé !'); }, onError: e => toast.error(e.message) });
  const handleCreate = () => {
    const login = (form.prenom + form.nom).toLowerCase().replace(/[^a-z0-9]/g, '') || 'user' + Date.now();
    const password = Math.random().toString(36).slice(2, 10);
    create.mutate({ ...form, login, password });
  };
  const del = trpc.studioUsers.delete.useMutation({ onSuccess: () => { utils.studioUsers.list.invalidate(); toast.success('Salarié supprimé'); }, onError: e => toast.error(e.message) });
  const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', borderRadius: 8, padding: '8px 12px', width: '100%', fontSize: 13 };
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'white' }}>👥 Salariés</h3>
        <button onClick={() => setShowForm(!showForm)} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: 'white', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Ajouter</button>
      </div>
      {showForm && (
        <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div><label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Prénom</label><input style={inputStyle} value={form.prenom} onChange={e => setForm(f => ({...f, prenom: e.target.value}))} /></div>
            <div><label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Nom</label><input style={inputStyle} value={form.nom} onChange={e => setForm(f => ({...f, nom: e.target.value}))} /></div>

            <div><label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>PIN (4 chiffres)</label><input style={inputStyle} maxLength={4} value={form.pin} onChange={e => setForm(f => ({...f, pin: e.target.value}))} /></div>
            <div><label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Rôle</label><select style={inputStyle} value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value as any}))}><option value="employe">Employé</option><option value="admin">Admin</option><option value="stagiaire">Stagiaire</option></select></div>
          </div>
          <button onClick={handleCreate} disabled={create.isPending} style={{ background: '#22c55e', border: 'none', color: 'white', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', width: '100%' }}>{create.isPending ? 'Création...' : 'Créer le salarié'}</button>
        </div>
      )}
      {(list.data ?? []).map((s: any) => (
        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, marginBottom: 8 }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: 'white', fontSize: 14 }}>{s.prenom} {s.nom}</p>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>@{s.login} · {s.role}</p>
          </div>
          <button onClick={() => del.mutate({ id: s.id })} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}>Suppr.</button>
        </div>
      ))}
      {(list.data ?? []).length === 0 && !showForm && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center' }}>Aucun salarié</p>}
    </div>
  );
}

const EMPTY_SALON_INFO: SalonInfo = {
  nom: '', raisonSociale: '', adresse: '', codePostal: '', ville: '',
  telephone: '', email: '', siret: '', nomPierceur: '', nomTatoueur: '', nomDermographe: '', logo: '',
  siteWeb: '', mentionsLegales: '',
  specialites: { piercing: true, tatouage: true, dermographie: true },
};

export default function Parametres() {
  const { state, updateSalonInfo, setAuthenticated, setPin, exitDemoMode } = useApp();
  const { t } = useTranslation();

  const [editingSalon, setEditingSalon] = useState(false);
  const [salonForm, setSalonForm] = useState<SalonInfo>({ ...EMPTY_SALON_INFO, ...(state.salonInfo || {}) });
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state.salonInfo) return;
    setSalonForm({ ...EMPTY_SALON_INFO, ...state.salonInfo });
  }, [state.salonInfo]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Le logo ne doit pas dépasser 2 Mo');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSalonForm(f => ({ ...f, logo: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');

  const handleSalonSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSalonInfo(salonForm);
    setEditingSalon(false);
    toast.success(t('settings.saved'));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compteurs pour l'export
  const totalClients = state.clients.filter(c => !c.estArchive).length;
  const totalArchives = state.clients.filter(c => c.estArchive).length;
  const totalSoins = state.clients.reduce((acc, c) => acc + (c.prestations?.length || 0), 0);
  const totalDocuments = state.clients.reduce((acc, c) => acc + (c.documents?.length || 0), 0);

  const handleExport = () => {
    const backup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      salonInfo: state.salonInfo,
      clients: state.clients,
      rendezVous: state.rendezVous,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `studio-backup-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Sauvegarde téléchargée avec succès');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const backup = JSON.parse(ev.target?.result as string);
        if (!backup.clients || !Array.isArray(backup.clients)) {
          toast.error('Fichier de sauvegarde invalide');
          return;
        }
        // Confirmation avant import
        if (!window.confirm(`Importer ${backup.clients.length} client(s) depuis la sauvegarde du ${backup.exportDate ? new Date(backup.exportDate).toLocaleDateString('fr-FR') : 'date inconnue'} ?\n\nATTENTION : Cela remplacera toutes les données actuelles.`)) return;
        // La restauration se fait uniquement via le serveur OVH
        // Aucune donnée n'est stockée localement
        toast.error('La restauration locale est désactivée. Contactez votre administrateur pour restaurer depuis le serveur OVH.');
        return;
      } catch {
        toast.error('Erreur lors de la lecture du fichier');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handlePinChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast.error('Le code PIN doit contenir 4 chiffres');
      return;
    }
    if (newPin !== confirmNewPin) {
      toast.error('Les codes PIN ne correspondent pas');
      return;
    }
    setPin(newPin);
    setNewPin('');
    setConfirmNewPin('');
    toast.success('Code PIN modifié');
  };

  const inputStyle: React.CSSProperties = { background: 'var(--brand-navy)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', width: '100%', fontSize: '14px', outline: 'none' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', color: 'var(--brand-text-muted)', marginBottom: '4px', fontWeight: 500 };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-xl font-700" style={{ color: 'var(--brand-text)', fontFamily: 'Outfit', fontWeight: 700 }}>{t('settings.title')}</h1>

      {/* Demo mode banner */}
      {state.isDemo && (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(192, 57, 106, 0.1)', border: '1px solid var(--brand-rose)' }}>
          <p className="text-sm font-600" style={{ color: 'var(--brand-rose)', fontWeight: 600 }}>{t('auth.mode_demo')}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>{t('settings.demo_no_save', 'Les données ne sont pas sauvegardées en mode démo.')}</p>
          <button onClick={exitDemoMode} className="mt-2 text-xs px-3 py-1.5 rounded" style={{ background: 'var(--brand-rose)', color: 'white' }}>
            {t('settings.exit_demo', 'Quitter le mode démo')}
          </button>
        </div>
      )}

      {/* Salon info */}
      <div className="studio-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 size={16} style={{ color: 'var(--brand-cyan)' }} />
            <h2 className="text-sm font-600" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>{t('settings.salon_info')}</h2>
          </div>
          {!editingSalon && (
            <button onClick={() => setEditingSalon(true)} className="text-xs px-3 py-1.5 rounded" style={{ background: 'var(--brand-cyan-dim)', color: 'var(--brand-cyan)', border: '1px solid var(--brand-cyan)' }}>
              {t('common.edit')}
            </button>
          )}
        </div>

        {editingSalon ? (
          <form onSubmit={handleSalonSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label style={labelStyle}>{t('settings.salon_name')} *</label><input style={inputStyle} value={salonForm.nom} onChange={e => setSalonForm(f => ({ ...f, nom: e.target.value }))} required /></div>
              <div><label style={labelStyle}>{t('settings.salon_legal_name', 'Raison sociale')}</label><input style={inputStyle} value={salonForm.raisonSociale || ''} onChange={e => setSalonForm(f => ({ ...f, raisonSociale: e.target.value }))} /></div>
            </div>
            <div><label style={labelStyle}>{t('settings.salon_address')}</label><input style={inputStyle} value={salonForm.adresse} onChange={e => setSalonForm(f => ({ ...f, adresse: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label style={labelStyle}>{t('settings.salon_postal', 'Code postal')}</label><input style={inputStyle} value={salonForm.codePostal} onChange={e => setSalonForm(f => ({ ...f, codePostal: e.target.value }))} /></div>
              <div><label style={labelStyle}>{t('settings.salon_city')}</label><input style={inputStyle} value={salonForm.ville} onChange={e => setSalonForm(f => ({ ...f, ville: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label style={labelStyle}>{t('settings.salon_phone')}</label><input type="tel" style={inputStyle} value={salonForm.telephone} onChange={e => setSalonForm(f => ({ ...f, telephone: e.target.value }))} /></div>
              <div><label style={labelStyle}>{t('settings.salon_email')}</label><input type="email" style={inputStyle} value={salonForm.email} onChange={e => setSalonForm(f => ({ ...f, email: e.target.value }))} /></div>
            </div>
            <div><label style={labelStyle}>SIRET</label><input style={inputStyle} value={salonForm.siret} onChange={e => setSalonForm(f => ({ ...f, siret: e.target.value }))} /></div>
            <div><label style={labelStyle}>Site web</label><input style={inputStyle} value={salonForm.siteWeb || ''} onChange={e => setSalonForm(f => ({ ...f, siteWeb: e.target.value }))} placeholder="https://www.monsalon.fr" /></div>
            <div>
              <label style={labelStyle}>Mentions légales personnalisées <span style={{ color: 'var(--brand-text-muted)', fontWeight: 400 }}>(pied de page imprimable)</span></label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }}
                value={salonForm.mentionsLegales || ''}
                onChange={e => setSalonForm(f => ({ ...f, mentionsLegales: e.target.value }))}
                placeholder="Ex : Agrément préfectoral n° XXX — Membre de la Fédération Française du Tatouage"
                rows={2}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>Cette ligne apparaît dans le pied de page de toutes les fiches imprimées.</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div><label style={labelStyle}>Nom du pierceur</label><input style={inputStyle} value={salonForm.nomPierceur} onChange={e => setSalonForm(f => ({ ...f, nomPierceur: e.target.value }))} /></div>
              <div><label style={labelStyle}>Nom du tatoueur</label><input style={inputStyle} value={salonForm.nomTatoueur || ''} onChange={e => setSalonForm(f => ({ ...f, nomTatoueur: e.target.value }))} /></div>
              <div><label style={labelStyle}>Nom du dermographe</label><input style={inputStyle} value={salonForm.nomDermographe || ''} onChange={e => setSalonForm(f => ({ ...f, nomDermographe: e.target.value }))} /></div>
            </div>
            {/* Logo du salon */}
            <div>
              <label style={labelStyle}>Logo du salon</label>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <div className="flex items-center gap-3">
                {salonForm.logo ? (
                  <div className="relative">
                    <img src={salonForm.logo} alt="Logo" className="w-16 h-16 rounded-lg object-contain" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--brand-border)' }} />
                    <button
                      type="button"
                      onClick={() => setSalonForm(f => ({ ...f, logo: '' }))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                      style={{ background: '#F44336', color: 'white' }}
                    >✕</button>
                  </div>
                ) : (
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '2px dashed var(--brand-border)' }}
                  >
                    <ImageIcon size={20} style={{ color: 'var(--brand-text-muted)' }} />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:opacity-90"
                  style={{ background: 'var(--brand-cyan-dim)', color: 'var(--brand-cyan)', border: '1px solid var(--brand-cyan)' }}
                >
                  <Upload size={12} /> {salonForm.logo ? 'Changer le logo' : 'Télécharger le logo'}
                </button>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>Format : PNG, JPG, SVG — max 2 Mo</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditingSalon(false)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-muted)' }}>{t('common.cancel')}</button>
              <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-700" style={{ background: 'var(--brand-cyan)', color: 'var(--brand-navy)', fontWeight: 700 }}>{t('settings.save')}</button>
            </div>
          </form>
        ) : state.salonInfo ? (
          <div className="space-y-2">
            {[
              { icon: Building2, label: state.salonInfo.nom + (state.salonInfo.raisonSociale ? ` (${state.salonInfo.raisonSociale})` : '') },
              { icon: MapPin, label: `${state.salonInfo.adresse}, ${state.salonInfo.codePostal} ${state.salonInfo.ville}` },
              { icon: Phone, label: state.salonInfo.telephone },
              { icon: Mail, label: state.salonInfo.email },
              { icon: Hash, label: `SIRET : ${state.salonInfo.siret}` },
              { icon: User, label: `Pierceur : ${state.salonInfo.nomPierceur}` },
            ].filter(i => i.label).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <item.icon size={13} style={{ color: 'var(--brand-text-muted)', flexShrink: 0 }} />
                <span className="text-sm" style={{ color: 'var(--brand-text)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>Aucune information configurée</p>
        )}
      </div>


      {/* À propos */}
      <Link href="/a-propos">
        <div className="studio-card p-4 cursor-pointer transition-all hover:border-cyan-400/40" style={{ borderColor: 'var(--brand-border)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/logo_white_d12a3c81.svg" alt="Intemporelle" className="w-9 h-9" />
              <div>
                <p className="text-sm font-700" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>À propos — Intemporelle</p>
                <p className="text-xs" style={{ color: 'var(--brand-cyan)' }}>Propriété, support & informations légales</p>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--brand-text-muted)' }} />
          </div>
        </div>
      </Link>

      {/* Export / Import */}
      <div className="studio-card p-4">
        {/* Exporter */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Download size={16} style={{ color: 'var(--brand-cyan)' }} />
            <h2 className="text-sm font-600" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>{t('settings.export_data')}</h2>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--brand-text-muted)' }}>Exportez l'intégralité de vos données (clients, soins, questionnaires, autorisations) dans un fichier sécurisé. Sauvegardez-le sur votre cloud personnel (iCloud, Google Drive…), une clé USB ou tout autre support de votre choix.</p>

          {/* 4 compteurs */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { icon: Users, label: 'Clients', count: totalClients, color: 'var(--brand-cyan)' },
              { icon: Archive, label: 'Archives', count: totalArchives, color: '#a78bfa' },
              { icon: Stethoscope, label: 'Soins', count: totalSoins, color: '#34d399' },
              { icon: FileText, label: 'Documents', count: totalDocuments, color: '#fb923c' },
            ].map(({ icon: Icon, label, count, color }) => (
              <div key={label} className="rounded-lg p-3 flex flex-col items-center gap-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--brand-border)' }}>
                <Icon size={18} style={{ color }} />
                <span className="text-lg font-700" style={{ color: 'var(--brand-text)', fontWeight: 700, lineHeight: 1 }}>{count}</span>
                <span className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>{label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-600 transition-all hover:opacity-90"
            style={{ background: 'var(--brand-cyan)', color: 'var(--brand-navy)', fontWeight: 600 }}
          >
            <Download size={15} />
            {t('settings.export_data')}
          </button>
          <p className="text-xs mt-2" style={{ color: 'var(--brand-text-muted)' }}>
            💾 Le fichier généré s'appelle <em>studio-backup-[date].json</em>. Conservez-le sur votre cloud (iCloud, Google Drive, Dropbox…) ou une clé USB. Il vous permettra de restaurer toutes vos données en cas de changement de tablette ou de réinitialisation.
          </p>
        </div>

        {/* Séparateur */}
        <div className="border-t my-4" style={{ borderColor: 'var(--brand-border)' }} />

        {/* Importer */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Upload size={16} style={{ color: 'var(--brand-cyan)' }} />
            <h2 className="text-sm font-600" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>{t('settings.import_data')}</h2>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--brand-text-muted)' }}>Restaurez votre base de données depuis un fichier de sauvegarde précédemment exporté. Idéal lors d'un changement de tablette, d'une réinitialisation ou d'une migration vers une nouvelle installation.</p>

          <div className="flex items-start gap-2 p-3 rounded-lg mb-3" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.3)' }}>
            <AlertTriangle size={14} style={{ color: '#fb923c', flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs" style={{ color: '#fb923c' }}>
              <strong>L'import remplace toutes les données actuelles.</strong> Effectuez d'abord un export de sauvegarde avant d'importer, afin de ne perdre aucune donnée existante.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-600 transition-all hover:opacity-90"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)', fontWeight: 600 }}
          >
            <Upload size={15} />
            {t('settings.import_data')}
          </button>
        </div>
      </div>

      {/* Configuration Email */}
      <SmtpSection />

      {/* Salariés */}
      <SalarieSection />

      {/* Logout */}
      <button
        onClick={() => setAuthenticated(false)}
        className="w-full py-3 rounded-xl text-sm font-600 flex items-center justify-center gap-2 transition-all"
        style={{ background: 'rgba(244, 67, 54, 0.1)', border: '1px solid rgba(244, 67, 54, 0.3)', color: '#F44336', fontWeight: 600 }}
      >
        <LogOut size={16} />
        {t('nav.logout')}
      </button>
    </div>
  );
}

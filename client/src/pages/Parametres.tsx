/*
 * DESIGN: Studio Nocturne — Page paramètres avec infos salon, PIN, RGPD
 */
import { useState, useRef } from 'react';
import { useApp } from '@/lib/app-context';
import { Building2, Phone, Mail, MapPin, Hash, User, Shield, Lock, LogOut, Info, ExternalLink, Download, Upload, Users, Archive, Stethoscope, FileText, AlertTriangle, ImageIcon, Server, CheckCircle, XCircle, Eye, EyeOff, MessageSquare } from 'lucide-react';
import GestionUtilisateurs from './GestionUtilisateurs';
import { SalonInfo } from '@/lib/types';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

export default function Parametres() {
  const { state, updateSalonInfo, setAuthenticated, setPin, exitDemoMode } = useApp();

  // ─── SMS Brevo ───
  const smsConfigQuery = trpc.sms.getConfig.useQuery();
  const smsSave = trpc.sms.saveConfig.useMutation({
    onSuccess: () => { toast.success('Configuration SMS sauvegardée !'); smsConfigQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const [smsForm, setSmsForm] = useState({ apiKey: '', senderName: 'Studio' });
  const [showSmsKey, setShowSmsKey] = useState(false);

  // ─── SMTP ───
  const smtpQuery = trpc.smtp.get.useQuery();
  const smtpSave = trpc.smtp.save.useMutation({
    onSuccess: () => { toast.success('Configuration email sauvegardée'); smtpQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const smtpTest = trpc.smtp.test.useMutation({
    onSuccess: (r) => toast.success(r.message || 'Connexion SMTP réussie !'),
    onError: (e) => toast.error(e.message),
  });
  const [smtpForm, setSmtpForm] = useState({
    host: 'smtp.ionos.fr',
    port: 587,
    secure: false,
    user: '',
    password: '',
    fromName: '',
    replyTo: '',
  });
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [smtpLoaded, setSmtpLoaded] = useState(false);

  // Pré-remplir le formulaire SMTP depuis la base
  if (smtpQuery.data && !smtpLoaded) {
    setSmtpForm(f => ({
      ...f,
      host: smtpQuery.data!.host || 'smtp.ionos.fr',
      port: smtpQuery.data!.port || 587,
      secure: smtpQuery.data!.secure || false,
      user: smtpQuery.data!.user || '',
      fromName: smtpQuery.data!.fromName || '',
      replyTo: smtpQuery.data!.replyTo || '',
    }));
    setSmtpLoaded(true);
  }
  const [editingSalon, setEditingSalon] = useState(false);
  const [salonForm, setSalonForm] = useState<SalonInfo>(state.salonInfo || {
    nom: '', raisonSociale: '', adresse: '', codePostal: '', ville: '',
    telephone: '', email: '', siret: '', nomPierceur: '', nomTatoueur: '', nomDermographe: '', logo: '',
    siteWeb: '', mentionsLegales: '',
  });
  const logoInputRef = useRef<HTMLInputElement>(null);

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
    toast.success('Informations du salon sauvegardées');
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
        if (backup.salonInfo) {
          localStorage.setItem('sm_salon_info', JSON.stringify(backup.salonInfo));
        }
        localStorage.setItem('sm_clients', JSON.stringify(backup.clients));
        if (backup.rendezVous) {
          localStorage.setItem('sm_rdv', JSON.stringify(backup.rendezVous));
        }
        toast.success('Sauvegarde importée ! Rechargement en cours...');
        setTimeout(() => window.location.reload(), 1500);
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
      <h1 className="text-xl font-700" style={{ color: 'var(--brand-text)', fontFamily: 'Outfit', fontWeight: 700 }}>Paramètres</h1>

      {/* Demo mode banner */}
      {state.isDemo && (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(192, 57, 106, 0.1)', border: '1px solid var(--brand-rose)' }}>
          <p className="text-sm font-600" style={{ color: 'var(--brand-rose)', fontWeight: 600 }}>Mode démo actif</p>
          <p className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>Les données ne sont pas sauvegardées en mode démo.</p>
          <button onClick={exitDemoMode} className="mt-2 text-xs px-3 py-1.5 rounded" style={{ background: 'var(--brand-rose)', color: 'white' }}>
            Quitter le mode démo
          </button>
        </div>
      )}

      {/* Salon info */}
      <div className="studio-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 size={16} style={{ color: 'var(--brand-cyan)' }} />
            <h2 className="text-sm font-600" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>Informations du salon</h2>
          </div>
          {!editingSalon && (
            <button onClick={() => setEditingSalon(true)} className="text-xs px-3 py-1.5 rounded" style={{ background: 'var(--brand-cyan-dim)', color: 'var(--brand-cyan)', border: '1px solid var(--brand-cyan)' }}>
              Modifier
            </button>
          )}
        </div>

        {editingSalon ? (
          <form onSubmit={handleSalonSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label style={labelStyle}>Nom du salon *</label><input style={inputStyle} value={salonForm.nom} onChange={e => setSalonForm(f => ({ ...f, nom: e.target.value }))} required /></div>
              <div><label style={labelStyle}>Raison sociale</label><input style={inputStyle} value={salonForm.raisonSociale || ''} onChange={e => setSalonForm(f => ({ ...f, raisonSociale: e.target.value }))} /></div>
            </div>
            <div><label style={labelStyle}>Adresse</label><input style={inputStyle} value={salonForm.adresse} onChange={e => setSalonForm(f => ({ ...f, adresse: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label style={labelStyle}>Code postal</label><input style={inputStyle} value={salonForm.codePostal} onChange={e => setSalonForm(f => ({ ...f, codePostal: e.target.value }))} /></div>
              <div><label style={labelStyle}>Ville</label><input style={inputStyle} value={salonForm.ville} onChange={e => setSalonForm(f => ({ ...f, ville: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label style={labelStyle}>Téléphone</label><input type="tel" style={inputStyle} value={salonForm.telephone} onChange={e => setSalonForm(f => ({ ...f, telephone: e.target.value }))} /></div>
              <div><label style={labelStyle}>Email</label><input type="email" style={inputStyle} value={salonForm.email} onChange={e => setSalonForm(f => ({ ...f, email: e.target.value }))} /></div>
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
              <button type="button" onClick={() => setEditingSalon(false)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-muted)' }}>Annuler</button>
              <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-700" style={{ background: 'var(--brand-cyan)', color: 'var(--brand-navy)', fontWeight: 700 }}>Sauvegarder</button>
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

      {/* Configuration Email SMTP */}
      <div className="studio-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Server size={16} style={{ color: 'var(--brand-cyan)' }} />
          <h2 className="text-sm font-600" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>Configuration Email (SMTP)</h2>
        </div>

        {/* Statut actuel */}
        {smtpQuery.data && (
          <div className="flex items-center gap-2 mb-4 p-2 rounded-lg" style={{ background: 'rgba(131,208,245,0.08)', border: '1px solid rgba(131,208,245,0.2)' }}>
            <CheckCircle size={13} style={{ color: '#34d399' }} />
            <span className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
              Serveur configuré : <strong style={{ color: 'var(--brand-text)' }}>{smtpQuery.data.user}</strong> via {smtpQuery.data.host}:{smtpQuery.data.port}
            </span>
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); smtpSave.mutate({ ...smtpForm, password: smtpForm.password || undefined }); }} className="space-y-3">
          {/* Informations sur l'utilisateur */}
          <p className="text-xs font-600 mb-1" style={{ color: 'var(--brand-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Informations sur l'utilisateur</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label style={labelStyle}>Votre nom (expéditeur)</label><input style={inputStyle} value={smtpForm.fromName} onChange={e => setSmtpForm(f => ({ ...f, fromName: e.target.value }))} placeholder="Studio Intemporelle" /></div>
            <div><label style={labelStyle}>Adresse de courrier</label><input type="email" style={inputStyle} value={smtpForm.user} onChange={e => setSmtpForm(f => ({ ...f, user: e.target.value }))} placeholder="societe@intemporel.tech" required /></div>
          </div>

          {/* Informations sur le serveur */}
          <p className="text-xs font-600 mt-3 mb-1" style={{ color: 'var(--brand-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Informations sur le serveur</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><label style={labelStyle}>Serveur de courrier sortant (SMTP)</label><input style={inputStyle} value={smtpForm.host} onChange={e => setSmtpForm(f => ({ ...f, host: e.target.value }))} placeholder="smtp.ionos.fr" required /></div>
            <div><label style={labelStyle}>Port</label><input type="number" style={inputStyle} value={smtpForm.port} onChange={e => setSmtpForm(f => ({ ...f, port: parseInt(e.target.value) || 587 }))} /></div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={smtpForm.secure} onChange={e => setSmtpForm(f => ({ ...f, secure: e.target.checked, port: e.target.checked ? 465 : 587 }))} className="w-4 h-4 rounded" style={{ accentColor: 'var(--brand-cyan)' }} />
              <span className="text-xs" style={{ color: 'var(--brand-text)' }}>SSL/TLS (port 465) — décoché = STARTTLS (port 587)</span>
            </label>
          </div>

          {/* Informations de connexion */}
          <p className="text-xs font-600 mt-3 mb-1" style={{ color: 'var(--brand-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Informations de connexion</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label style={labelStyle}>Nom d'utilisateur</label><input style={inputStyle} value={smtpForm.user} onChange={e => setSmtpForm(f => ({ ...f, user: e.target.value }))} placeholder="societe@intemporel.tech" /></div>
            <div>
              <label style={labelStyle}>Mot de passe {smtpQuery.data?.passwordSet && <span style={{ color: '#34d399' }}>(déjà configuré)</span>}</label>
              <div className="relative">
                <input
                  type={showSmtpPassword ? 'text' : 'password'}
                  style={{ ...inputStyle, paddingRight: '2.5rem' }}
                  value={smtpForm.password}
                  onChange={e => setSmtpForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={smtpQuery.data?.passwordSet ? '(laisser vide pour conserver)' : 'Mot de passe SMTP'}
                />
                <button type="button" onClick={() => setShowSmtpPassword(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--brand-text-muted)' }}>
                  {showSmtpPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          <div><label style={labelStyle}>Répondre à (Reply-To, optionnel)</label><input type="email" style={inputStyle} value={smtpForm.replyTo} onChange={e => setSmtpForm(f => ({ ...f, replyTo: e.target.value }))} placeholder="contact@intemporel.tech" /></div>

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => smtpTest.mutate()}
              disabled={smtpTest.isPending || !smtpQuery.data?.passwordSet}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-600 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--brand-border)', color: smtpQuery.data?.passwordSet ? 'var(--brand-text)' : 'var(--brand-text-muted)', fontWeight: 600 }}
            >
              {smtpTest.isPending ? '⏳ Test...' : '🔌 Tester les paramètres'}
            </button>
            <button
              type="submit"
              disabled={smtpSave.isPending}
              className="flex-1 py-2.5 rounded-lg text-sm font-700"
              style={{ background: 'var(--brand-cyan)', color: 'var(--brand-navy)', fontWeight: 700 }}
            >
              {smtpSave.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>

      {/* Configuration SMS Brevo */}
      <div className="studio-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={16} style={{ color: '#64FFDA' }} />
          <h2 className="text-sm font-600" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>Configuration SMS (Brevo)</h2>
        </div>

        {smsConfigQuery.data ? (
          <div className="flex items-center gap-2 mb-4 p-2 rounded-lg" style={{ background: 'rgba(100,255,218,0.06)', border: '1px solid rgba(100,255,218,0.2)' }}>
            <CheckCircle size={13} style={{ color: '#34d399' }} />
            <span className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
              SMS actif — Expéditeur : <strong style={{ color: 'var(--brand-text)' }}>{smsConfigQuery.data.senderName}</strong> · Clé : {smsConfigQuery.data.apiKeyPreview}
            </span>
          </div>
        ) : (
          <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(255,152,0,0.08)', border: '1px solid rgba(255,152,0,0.25)' }}>
            <p className="text-xs" style={{ color: '#FF9800' }}>SMS non configuré. Créez un compte gratuit sur <a href="https://www.brevo.com" target="_blank" rel="noopener noreferrer" style={{ color: '#64FFDA', textDecoration: 'underline' }}>brevo.com</a> pour obtenir votre clé API.</p>
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); smsSave.mutate(smsForm); }} className="space-y-3">
          <div>
            <label style={labelStyle}>Clé API Brevo</label>
            <div className="relative">
              <input
                type={showSmsKey ? 'text' : 'password'}
                style={{ ...inputStyle, paddingRight: '2.5rem' }}
                value={smsForm.apiKey}
                onChange={e => setSmsForm(f => ({ ...f, apiKey: e.target.value }))}
                placeholder={smsConfigQuery.data?.apiKeySet ? '(laisser vide pour conserver)' : 'xkeysib-...'}
              />
              <button type="button" onClick={() => setShowSmsKey(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--brand-text-muted)' }}>
                {showSmsKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Nom expéditeur (max 11 caractères, sans espace)</label>
            <input
              style={inputStyle}
              value={smsForm.senderName}
              onChange={e => setSmsForm(f => ({ ...f, senderName: e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 11) }))}
              placeholder="Studio"
              maxLength={11}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>Apparaîtra comme expéditeur sur le téléphone du client. Ex : Intemporel</p>
          </div>
          <button
            type="submit"
            disabled={smsSave.isPending}
            className="w-full py-2.5 rounded-lg text-sm font-700"
            style={{ background: 'rgba(100,255,218,0.15)', border: '1px solid rgba(100,255,218,0.4)', color: '#64FFDA', fontWeight: 700 }}
          >
            {smsSave.isPending ? 'Sauvegarde...' : 'Sauvegarder la configuration SMS'}
          </button>
        </form>
      </div>

      {/* PIN */}
      <div className="studio-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={16} style={{ color: 'var(--brand-cyan)' }} />
          <h2 className="text-sm font-600" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>Code PIN</h2>
        </div>
        <form onSubmit={handlePinChange} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Nouveau PIN (4 chiffres)</label>
              <input type="password" maxLength={4} pattern="\d{4}" style={inputStyle} value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="••••" />
            </div>
            <div>
              <label style={labelStyle}>Confirmer le PIN</label>
              <input type="password" maxLength={4} pattern="\d{4}" style={inputStyle} value={confirmNewPin} onChange={e => setConfirmNewPin(e.target.value)} placeholder="••••" />
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-600" style={{ background: 'var(--brand-cyan-dim)', color: 'var(--brand-cyan)', border: '1px solid var(--brand-cyan)', fontWeight: 600 }}>
            Modifier le code PIN
          </button>
        </form>
      </div>

      {/* À propos */}
      <div className="studio-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} style={{ color: 'var(--brand-cyan)' }} />
          <h2 className="text-sm font-600" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>À propos</h2>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT/logo_white_d12a3c81.svg" alt="Intemporelle" className="w-10 h-10" />
          <div>
            <p className="text-sm font-700" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>Studio Manager</p>
            <p className="text-xs" style={{ color: 'var(--brand-cyan)' }}>by Intemporelle v1.0</p>
          </div>
        </div>
        <div className="space-y-2 text-xs" style={{ color: 'var(--brand-text-muted)' }}>
          <p>Application de gestion de studio de piercing, tatouage et dermographie.</p>
          <p>Conforme RGPD — Données stockées localement sur votre appareil.</p>
          <div className="pt-2 space-y-1">
            <p><span style={{ color: 'var(--brand-text)' }}>Éditeur :</span> Intemporelle — RGPD & Cybersécurité</p>
            <p><span style={{ color: 'var(--brand-text)' }}>Adresse :</span> Tours (37)</p>
            <p><span style={{ color: 'var(--brand-text)' }}>Email :</span> contact@intemporelle.eu</p>
            <a href="https://www.intemporelle.eu" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:opacity-80" style={{ color: 'var(--brand-cyan)' }}>
              www.intemporelle.eu <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>

      {/* Export / Import */}
      <div className="studio-card p-4">
        {/* Exporter */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Download size={16} style={{ color: 'var(--brand-cyan)' }} />
            <h2 className="text-sm font-600" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>Exporter mes données</h2>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--brand-text-muted)' }}>Télécharge un fichier de sauvegarde complet (clients, soins, questionnaires, autorisations)</p>

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
            Télécharger la sauvegarde
          </button>
          <p className="text-xs mt-2" style={{ color: 'var(--brand-text-muted)' }}>
            ⚠️ Le fichier s'appelle <em>studio-backup-[date].json</em> — gardez-le précieusement !
          </p>
        </div>

        {/* Séparateur */}
        <div className="border-t my-4" style={{ borderColor: 'var(--brand-border)' }} />

        {/* Importer */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Upload size={16} style={{ color: 'var(--brand-cyan)' }} />
            <h2 className="text-sm font-600" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>Importer une sauvegarde</h2>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--brand-text-muted)' }}>Restaurez vos données depuis un fichier de sauvegarde précédent</p>

          <div className="flex items-start gap-2 p-3 rounded-lg mb-3" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.3)' }}>
            <AlertTriangle size={14} style={{ color: '#fb923c', flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs" style={{ color: '#fb923c' }}>
              <strong>L'import remplace toutes les données actuelles.</strong> Faites d'abord un export si nécessaire.
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
            Choisir un fichier de sauvegarde
          </button>
        </div>
      </div>

      {/* Gestion des utilisateurs */}
      <div className="studio-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} style={{ color: 'var(--brand-cyan)' }} />
          <h2 className="text-sm font-600" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>Gestion des utilisateurs</h2>
        </div>
        <GestionUtilisateurs />
      </div>

      {/* Logout */}
      <button
        onClick={() => setAuthenticated(false)}
        className="w-full py-3 rounded-xl text-sm font-600 flex items-center justify-center gap-2 transition-all"
        style={{ background: 'rgba(244, 67, 54, 0.1)', border: '1px solid rgba(244, 67, 54, 0.3)', color: '#F44336', fontWeight: 600 }}
      >
        <LogOut size={16} />
        Se déconnecter
      </button>
    </div>
  );
}

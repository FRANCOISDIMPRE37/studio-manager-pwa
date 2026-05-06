import { useState, useEffect } from "react";

interface Studio {
  id: number;
  nom: string;
  slug: string;
  email: string;
  ownerEmail: string;
  planType: string;
  actif: boolean;
  isTemporary: boolean;
  firstLogin: boolean;
  tempPin: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  specialites?: string;
}

export default function SuperAdmin() {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loginError, setLoginError] = useState("");
  const [studios, setStudios] = useState<Studio[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newStudio, setNewStudio] = useState({ nomSalon: "", ownerEmail: "", password: "", pin: "", planType: "studio", specialites: ["piercing", "tatouage", "dermographie"] });
  const [created, setCreated] = useState<{ tempPin: string; nomSalon: string; ownerEmail: string; password: string; pin: string } | null>(null);
  const [actionMsg, setActionMsg] = useState("");
  const [editingSpecialites, setEditingSpecialites] = useState<number | null>(null);
  const [showNotif, setShowNotif] = useState(false);
  const [notifForm, setNotifForm] = useState({ titre: "", message: "", type: "info", destinataire: "tous", studioId: "" });
  const [sendingNotif, setSendingNotif] = useState(false);

  useEffect(() => {
    fetch("/api/super-admin/me", { credentials: "include" })
      .then(r => r.ok ? setAuthed(true) : null)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (authed) loadStudios();
  }, [authed]);

  async function sendNotification(e: React.FormEvent) {
    e.preventDefault();
    setSendingNotif(true);
    const r = await fetch("/api/super-admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(notifForm),
    });
    setSendingNotif(false);
    if (r.ok) {
      setActionMsg("Notification envoyée à tous les studios ✅");
      setTimeout(() => setActionMsg(""), 4000);
      setShowNotif(false);
      setNotifForm({ titre: "", message: "", type: "info" });
    } else {
      alert("Erreur envoi notification");
    }
  }

  async function updateSpecialites(studio: Studio, spec: string, checked: boolean) {
    const spec_obj = typeof studio.specialites === 'string' ? Object.fromEntries((studio.specialites || 'piercing,tatouage,dermographie').split(',').map(s => [s.trim(), true])) : (studio.specialites || {}); const current = Object.keys(spec_obj).filter(k => spec_obj[k]);
    const updated = checked ? [...new Set([...current, spec])] : current.filter(s => s !== spec);
    await fetch(`/api/super-admin/studios/${studio.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ specialites: updated.join(',') }),
    });
    setActionMsg(`Spécialités de ${studio.nom} mises à jour`);
    setTimeout(() => setActionMsg(""), 3000);
    loadStudios();
  }

  async function loadStudios() {
    const r = await fetch("/api/super-admin/studios", { credentials: "include" });
    if (r.ok) setStudios(await r.json());
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const r = await fetch("/api/super-admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    if (r.ok) { setAuthed(true); }
    else { setLoginError("Identifiants incorrects"); }
  }

  async function handleLogout() {
    await fetch("/api/super-admin/logout", { method: "POST", credentials: "include" });
    setAuthed(false);
    setStudios([]);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/super-admin/studios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...newStudio, specialites: newStudio.specialites.join(',') }),
    });
    const data = await r.json();
    if (r.ok) {
      setCreated({ tempPin: data.tempPin, nomSalon: data.nomSalon, ownerEmail: data.ownerEmail, password: newStudio.password, pin: newStudio.pin });
      setShowCreate(false);
      setNewStudio({ nomSalon: "", ownerEmail: "", password: "", pin: "", planType: "studio", specialites: ["piercing", "tatouage", "dermographie"] });
      loadStudios();
    } else {
      alert("Erreur : " + data.error);
    }
  }

  async function toggleActif(studio: Studio) {
    await fetch(`/api/super-admin/studios/${studio.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ actif: !studio.actif }),
    });
    setActionMsg(`Studio ${studio.nom} ${!studio.actif ? "activé" : "suspendu"}`);
    setTimeout(() => setActionMsg(""), 3000);
    loadStudios();
  }

  async function deleteStudio(studio: Studio) {
    if (!confirm(`Supprimer définitivement "${studio.nom}" ? Cette action est irréversible.`)) return;
    await fetch(`/api/super-admin/studios/${studio.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setActionMsg(`Studio ${studio.nom} supprimé`);
    setTimeout(() => setActionMsg(""), 3000);
    loadStudios();
  }

  async function changePlan(studio: Studio, planType: string) {
    // Plans payants → redirection Stripe Checkout
    if (['solo', 'studio', 'multi'].includes(planType)) {
      const r = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan: planType, studioId: studio.id, email: studio.email }),
      });
      const data = await r.json();
      if (data.url) {
        window.open(data.url, '_blank');
        return;
      }
    }
    // Trial → changement direct sans paiement
    await fetch(`/api/super-admin/studios/${studio.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ planType }),
    });
    setActionMsg(`Plan de ${studio.nom} mis à jour → ${planType}`);
    setTimeout(() => setActionMsg(""), 3000);
    loadStudios();
  }

  const planColors: Record<string, string> = {
    trial: "#f59e0b",
    solo: "#3b82f6",
    studio: "#8b5cf6",
    multi: "#10b981",
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#888", fontFamily: "monospace" }}>Chargement...</div>
    </div>
  );

  if (!authed) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
      <div style={{ background: "#13131a", border: "1px solid #2a2a3a", borderRadius: 16, padding: 40, width: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
          <div style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>Console Admin</div>
          <div style={{ color: "#555", fontSize: 13, marginTop: 4 }}>Intemporelle — Accès restreint</div>
        </div>
        <form onSubmit={handleLogin}>
          <input
            value={username} onChange={e => setUsername(e.target.value)}
            placeholder="Identifiant"
            style={{ width: "100%", padding: "10px 14px", background: "#1e1e2e", border: "1px solid #2a2a3a", borderRadius: 8, color: "#fff", marginBottom: 12, boxSizing: "border-box", outline: "none" }}
          />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe"
            style={{ width: "100%", padding: "10px 14px", background: "#1e1e2e", border: "1px solid #2a2a3a", borderRadius: 8, color: "#fff", marginBottom: 16, boxSizing: "border-box", outline: "none" }}
          />
          {loginError && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 12, textAlign: "center" }}>{loginError}</div>}
          <button type="submit" style={{ width: "100%", padding: "11px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 15 }}>
            Connexion
          </button>
        </form>
      </div>
    </div>
  );

  const actifs = studios.filter(s => s.actif).length;
  const temporaires = studios.filter(s => s.isTemporary).length;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "system-ui", color: "#fff" }}>
      {/* Header */}
      <div style={{ background: "#13131a", borderBottom: "1px solid #2a2a3a", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 24 }}>💎</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Console Super-Admin</div>
            <div style={{ color: "#555", fontSize: 12 }}>studio.intemporelle.eu</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => setShowNotif(true)} style={{ padding: "8px 18px", background: "transparent", border: "1px solid #7c3aed", borderRadius: 8, color: "#a855f7", fontWeight: 600, cursor: "pointer", fontSize: 14, marginRight: 8 }}>
            🔔 Envoyer une notification
          </button>
          <button onClick={() => setShowCreate(true)} style={{ padding: "8px 18px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
            + Nouveau studio
          </button>
          <button onClick={handleLogout} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #2a2a3a", borderRadius: 8, color: "#888", cursor: "pointer", fontSize: 13 }}>
            Déconnexion
          </button>
          <button onClick={() => setShowChangePwd(true)} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #7c3aed", borderRadius: 8, color: "#a855f7", cursor: "pointer", fontSize: 13 }}>🔑 Mot de passe</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Studios total", value: studios.length, icon: "🏢", color: "#7c3aed" },
            { label: "Actifs", value: actifs, icon: "✅", color: "#10b981" },
            { label: "En attente d'onboarding", value: temporaires, icon: "⏳", color: "#f59e0b" },
          ].map(stat => (
            <div key={stat.label} style={{ background: "#13131a", border: "1px solid #2a2a3a", borderRadius: 12, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontSize: 28 }}>{stat.icon}</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ color: "#555", fontSize: 13 }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Message action */}
        {actionMsg && (
          <div style={{ background: "#10b98120", border: "1px solid #10b981", borderRadius: 8, padding: "10px 16px", marginBottom: 20, color: "#10b981", fontSize: 14 }}>
            ✅ {actionMsg}
          </div>
        )}

        {/* Résultat création */}
        {created && (
          <div style={{ background: "#7c3aed20", border: "1px solid #7c3aed", borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>🎉 Studio créé avec succès !</div>
            <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
              <div>📌 <b>Salon :</b> {created.nomSalon}</div>
              <div>📧 <b>Email client :</b> {created.ownerEmail}</div>
              <div style={{ background: "#1e1e2e", borderRadius: 8, padding: "12px 16px", fontFamily: "monospace", fontSize: 18, letterSpacing: 6, textAlign: "center", color: "#a855f7", marginTop: 8 }}>
                PIN temporaire : <b>{created.tempPin}</b>
              </div>
              <div style={{ background: "#1e1e2e", borderRadius: 8, padding: "12px 16px", fontFamily: "monospace", fontSize: 18, letterSpacing: 8, textAlign: "center", color: "#f59e0b", marginTop: 8 }}>
                🔢 Code PIN : <b>{created.pin}</b>
              </div>
              <div style={{ background: "#1e1e2e", borderRadius: 8, padding: "12px 16px", fontFamily: "monospace", fontSize: 15, textAlign: "center", color: "#10b981", marginTop: 8 }}>
                🔐 Mot de passe : <b>{created.password}</b>
              </div>
              <div style={{ color: "#888", fontSize: 12, textAlign: "center", marginTop: 4 }}>Communiquez le PIN et le mot de passe au client — ils serviront à la double sécurité</div>
            </div>
            <button onClick={() => setCreated(null)} style={{ marginTop: 16, padding: "6px 14px", background: "transparent", border: "1px solid #444", borderRadius: 6, color: "#888", cursor: "pointer", fontSize: 12 }}>
              Fermer
            </button>
          </div>
        )}

        {/* Liste studios */}
        <div style={{ background: "#13131a", border: "1px solid #2a2a3a", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #2a2a3a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 600 }}>Tous les studios ({studios.length})</div>
            <button onClick={() => loadStudios()} style={{ padding: "4px 12px", background: "transparent", border: "1px solid #2a2a3a", borderRadius: 6, color: "#666", cursor: "pointer", fontSize: 12 }}>
              🔄 Rafraîchir
            </button>
          </div>

          {studios.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#444" }}>Aucun studio créé</div>
          ) : (
            studios.map((studio, i) => (
              <div key={studio.id} style={{ padding: "16px 24px", borderBottom: i < studios.length - 1 ? "1px solid #1e1e2e" : "none", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                {/* Infos */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{studio.nom}</span>
                    {studio.isTemporary && <span style={{ background: "#f59e0b20", color: "#f59e0b", fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>ONBOARDING</span>}
                    {!studio.actif && <span style={{ background: "#ef444420", color: "#ef4444", fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>SUSPENDU</span>}
                    {studio.email === 'contact@intemporelle.eu' && <span style={{ background: "#10b98120", color: "#10b981", fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>🔒 PROTÉGÉ</span>}
                  </div>
                  <div style={{ color: "#555", fontSize: 12 }}>{studio.ownerEmail || studio.email}</div>
                  <div style={{ color: "#333", fontSize: 11, marginTop: 2 }}>
                    Créé le {new Date(studio.createdAt).toLocaleDateString("fr-FR")}
                    {studio.trialEndsAt && ` · Essai jusqu'au ${new Date(studio.trialEndsAt).toLocaleDateString("fr-FR")}`}
                  </div>
                </div>

                {/* Spécialités */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["piercing", "tatouage", "dermographie"].map(spec => {
                    const spec_obj2 = typeof studio.specialites === 'string' ? Object.fromEntries((studio.specialites || 'piercing,tatouage,dermographie').split(',').map(s => [s.trim(), true])) : (studio.specialites || {}); const specs = Object.keys(spec_obj2).filter(k => spec_obj2[k]);
                    const active = specs.includes(spec);
                    if (!active) return null;
                    return (
                      <button key={spec} onClick={() => updateSpecialites(studio, spec, !active)}
                        style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #10b981", background: "#10b98120", color: "#10b981" }}>
                        {spec === "piercing" ? "💉" : spec === "tatouage" ? "🎨" : "✏️"} {spec}
                      </button>
                    );
                  })}
                </div>
                {/* PIN temporaire */}
                {studio.isTemporary && studio.tempPin && (
                  <div style={{ background: "#1e1e2e", borderRadius: 8, padding: "6px 14px", fontFamily: "monospace", color: "#a855f7", fontSize: 14, letterSpacing: 3 }}>
                    PIN: {studio.tempPin}
                  </div>
                )}



                {/* Lien vers l'app */}
                <button
                  onClick={() => window.open('https://app.intemporelle.eu', '_blank')}
                  style={{ padding: "6px 14px", background: "#10b98120", border: "1px solid #10b981", borderRadius: 6, color: "#10b981", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                >
                  🔗 Ouvrir
                </button>
                {/* Toggle actif */}
                {studio.slug !== 'studio-intemporelle' && studio.email !== 'contact@intemporelle.eu' && <button
                  onClick={() => toggleActif(studio)}
                  style={{ padding: "6px 14px", background: studio.actif ? "#ef444420" : "#10b98120", border: `1px solid ${studio.actif ? "#ef4444" : "#10b981"}`, borderRadius: 6, color: studio.actif ? "#ef4444" : "#10b981", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                >
                  {studio.actif ? "Suspendre" : "Réactiver"}
                </button>}
                {studio.email !== 'contact@intemporelle.eu' && <button
                  onClick={() => deleteStudio(studio)}
                  style={{ padding: "6px 14px", background: "#ef444410", border: "1px solid #ef4444", borderRadius: 6, color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                >
                  🗑 Supprimer
                </button>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal notification */}
      {showNotif && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#13131a", border: "1px solid #2a2a3a", borderRadius: 16, padding: 32, width: 420, maxWidth: "90vw" }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 24 }}>🔔 Envoyer une notification</div>
            <form onSubmit={sendNotification}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#888", fontSize: 12, marginBottom: 6 }}>DESTINATAIRES</label>
                <select value={notifForm.destinataire} onChange={e => setNotifForm({ ...notifForm, destinataire: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", background: "#1e1e2e", border: "1px solid #2a2a3a", borderRadius: 8, color: "#fff", boxSizing: "border-box" }}>
                  <option value="tous">📢 Tous les studios</option>
                  <option value="piercing">💉 Pierceurs uniquement</option>
                  <option value="tatouage">🎨 Tatoueurs uniquement</option>
                  <option value="dermographie">✏️ Dermographes uniquement</option>
                  <option value="studio">🏪 Un studio spécifique</option>
                </select>
              </div>
              {notifForm.destinataire === "studio" && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", color: "#888", fontSize: 12, marginBottom: 6 }}>CHOISIR LE STUDIO</label>
                  <select value={notifForm.studioId} onChange={e => setNotifForm({ ...notifForm, studioId: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", background: "#1e1e2e", border: "1px solid #2a2a3a", borderRadius: 8, color: "#fff", boxSizing: "border-box" }}>
                    <option value="">-- Choisir --</option>
                    {studios.map(s => <option key={s.id} value={String(s.id)}>{s.nom} ({s.email})</option>)}
                  </select>
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#888", fontSize: 12, marginBottom: 6 }}>TYPE</label>
                <select value={notifForm.type} onChange={e => setNotifForm({ ...notifForm, type: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", background: "#1e1e2e", border: "1px solid #2a2a3a", borderRadius: 8, color: "#fff", boxSizing: "border-box" }}>
                  <option value="info">ℹ️ Info</option>
                  <option value="warning">⚠️ Avertissement</option>
                  <option value="success">✅ Succès</option>
                  <option value="error">❌ Urgent</option>
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#888", fontSize: 12, marginBottom: 6 }}>TITRE</label>
                <input value={notifForm.titre} onChange={e => setNotifForm({ ...notifForm, titre: e.target.value })}
                  placeholder="Ex: Mise à jour disponible" required
                  style={{ width: "100%", padding: "10px 14px", background: "#1e1e2e", border: "1px solid #2a2a3a", borderRadius: 8, color: "#fff", boxSizing: "border-box", outline: "none" }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", color: "#888", fontSize: 12, marginBottom: 6 }}>MESSAGE</label>
                <textarea value={notifForm.message} onChange={e => setNotifForm({ ...notifForm, message: e.target.value })}
                  placeholder="Votre message aux studios..." required rows={4}
                  style={{ width: "100%", padding: "10px 14px", background: "#1e1e2e", border: "1px solid #2a2a3a", borderRadius: 8, color: "#fff", boxSizing: "border-box", outline: "none", resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setShowNotif(false)} style={{ flex: 1, padding: "10px", background: "transparent", border: "1px solid #2a2a3a", borderRadius: 8, color: "#888", cursor: "pointer" }}>
                  Annuler
                </button>
                <button type="submit" disabled={sendingNotif} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                  {sendingNotif ? "Envoi..." : 
                    notifForm.destinataire === "tous" ? "Envoyer à tous 🔔" :
                    notifForm.destinataire === "piercing" ? "Envoyer aux pierceurs 💉" :
                    notifForm.destinataire === "tatouage" ? "Envoyer aux tatoueurs 🎨" :
                    notifForm.destinataire === "dermographie" ? "Envoyer aux dermographes ✏️" :
                    "Envoyer au studio 🏪"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal création */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#13131a", border: "1px solid #2a2a3a", borderRadius: 16, padding: 32, width: 420, maxWidth: "90vw" }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 24 }}>Créer un nouveau studio</div>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#888", fontSize: 12, marginBottom: 6 }}>NOM DU SALON</label>
                <input
                  value={newStudio.nomSalon}
                  onChange={e => setNewStudio({ ...newStudio, nomSalon: e.target.value })}
                  placeholder="Ex: Studio Lumière"
                  required
                  style={{ width: "100%", padding: "10px 14px", background: "#1e1e2e", border: "1px solid #2a2a3a", borderRadius: 8, color: "#fff", boxSizing: "border-box", outline: "none" }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#888", fontSize: 12, marginBottom: 6 }}>EMAIL DU PROPRIÉTAIRE</label>
                <input
                  type="email"
                  value={newStudio.ownerEmail}
                  onChange={e => setNewStudio({ ...newStudio, ownerEmail: e.target.value })}
                  placeholder="patron@salon.fr"
                  required
                  style={{ width: "100%", padding: "10px 14px", background: "#1e1e2e", border: "1px solid #2a2a3a", borderRadius: 8, color: "#fff", boxSizing: "border-box", outline: "none" }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#888", fontSize: 12, marginBottom: 6 }}>CODE PIN (4 chiffres)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  value={newStudio.pin}
                  onChange={e => setNewStudio({ ...newStudio, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="Ex: 1234"
                  required
                  style={{ width: "100%", padding: "10px 14px", background: "#1e1e2e", border: "1px solid #2a2a3a", borderRadius: 8, color: "#fff", boxSizing: "border-box", outline: "none", letterSpacing: 8, fontSize: 18 }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#888", fontSize: 12, marginBottom: 6 }}>MOT DE PASSE</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newStudio.password}
                    onChange={e => setNewStudio({ ...newStudio, password: e.target.value })}
                    placeholder="Mot de passe du studio"
                    required
                    style={{ width: "100%", padding: "10px 44px 10px 14px", background: "#1e1e2e", border: "1px solid #2a2a3a", borderRadius: 8, color: "#fff", boxSizing: "border-box", outline: "none" }}
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 18 }}>
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#888", fontSize: 12, marginBottom: 8 }}>SPÉCIALITÉS</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {["piercing", "tatouage", "dermographie"].map(s => (
                    <div key={s} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ color: "#ccc", fontSize: 13, textTransform: "capitalize" }}>{s}</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button type="button"
                          onClick={() => setNewStudio(n => ({ ...n, specialites: [...new Set([...n.specialites, s])] }))}
                          style={{ padding: "4px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                            background: newStudio.specialites.includes(s) ? "#a855f7" : "#333",
                            color: newStudio.specialites.includes(s) ? "#fff" : "#888", fontWeight: 600, fontSize: 13 }}>
                          Oui
                        </button>
                        <button type="button"
                          onClick={() => setNewStudio(n => ({ ...n, specialites: n.specialites.filter(x => x !== s) }))}
                          style={{ padding: "4px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                            background: !newStudio.specialites.includes(s) ? "#ef4444" : "#333",
                            color: !newStudio.specialites.includes(s) ? "#fff" : "#888", fontWeight: 600, fontSize: 13 }}>
                          Non
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, padding: "10px", background: "transparent", border: "1px solid #2a2a3a", borderRadius: 8, color: "#888", cursor: "pointer" }}>
                  Annuler
                </button>
                <button type="submit" style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                  Créer le studio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showChangePwd && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
          <div style={{background:"#13131f",border:"1px solid #2a2a3a",borderRadius:12,padding:32,width:380}}>
            <h3 style={{color:"#fff",marginBottom:20,fontSize:18,fontWeight:700}}>🔑 Changer le mot de passe</h3>
            <div style={{marginBottom:12}}>
              <label style={{color:"#888",fontSize:13,display:"block",marginBottom:6}}>Ancien mot de passe</label>
              <input type="password" value={oldPwd} onChange={e=>setOldPwd(e.target.value)} style={{width:"100%",padding:"10px 12px",background:"#1a1a2e",border:"1px solid #2a2a3a",borderRadius:8,color:"#fff",fontSize:14,boxSizing:"border-box"}} />
            </div>
            <div style={{marginBottom:12}}>
              <label style={{color:"#888",fontSize:13,display:"block",marginBottom:6}}>Nouveau mot de passe</label>
              <input type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} style={{width:"100%",padding:"10px 12px",background:"#1a1a2e",border:"1px solid #2a2a3a",borderRadius:8,color:"#fff",fontSize:14,boxSizing:"border-box"}} />
            </div>
            <div style={{marginBottom:20}}>
              <label style={{color:"#888",fontSize:13,display:"block",marginBottom:6}}>Confirmer</label>
              <input type="password" value={confirmPwd} onChange={e=>setConfirmPwd(e.target.value)} style={{width:"100%",padding:"10px 12px",background:"#1a1a2e",border:"1px solid #2a2a3a",borderRadius:8,color:"#fff",fontSize:14,boxSizing:"border-box"}} />
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={async()=>{
                if(newPwd!==confirmPwd){alert("Mots de passe différents");return;}
                const r=await fetch("/api/super-admin/change-password",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({oldPassword:oldPwd,newPassword:newPwd})});
                if(r.ok){alert("Mot de passe changé !");setShowChangePwd(false);setOldPwd("");setNewPwd("");setConfirmPwd("");}
                else{alert("Ancien mot de passe incorrect");}
              }} style={{flex:1,padding:"10px",background:"linear-gradient(135deg,#7c3aed,#a855f7)",border:"none",borderRadius:8,color:"#fff",fontWeight:600,cursor:"pointer"}}>Changer</button>
              <button onClick={()=>setShowChangePwd(false)} style={{flex:1,padding:"10px",background:"transparent",border:"1px solid #2a2a3a",borderRadius:8,color:"#888",cursor:"pointer"}}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

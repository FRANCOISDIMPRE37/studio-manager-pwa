import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Tab = "dashboard" | "studios" | "licences" | "articles" | "notifications" | "services" | "invitations" | "nouveau-salon";

const PLAN_LABELS: Record<string, string> = {
  trial: "Essai",
  solo: "Solo",
  studio: "Studio",
  multi: "Multi",
};

const PLAN_COLORS: Record<string, string> = {
  trial: "#6b7280",
  solo: "#3b82f6",
  studio: "#8b5cf6",
  multi: "#f59e0b",
};

const STATUS_COLORS: Record<string, string> = {
  active: "#22c55e",
  suspended: "#f59e0b",
  expired: "#ef4444",
  cancelled: "#6b7280",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  suspended: "Suspendu",
  expired: "Expiré",
  cancelled: "Annulé",
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  // ====== QUERIES ======
  const stats = trpc.admin.getStats.useQuery();
  const studiosWithLicenses = trpc.admin.listStudiosWithLicenses.useQuery();
  const articles = trpc.admin.listArticles.useQuery({ statut: undefined });
  const notifications = trpc.admin.getAllNotifications.useQuery();
  const services = trpc.admin.listSharedServices.useQuery({ actifOnly: false });
  const invitations = trpc.admin.listInvitations.useQuery();

  const utils = trpc.useUtils();

  // ====== MUTATIONS ======
  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => { utils.admin.listStudiosWithLicenses.invalidate(); toast.success("Studio supprimé"); },
    onError: (e) => toast.error("Erreur : " + e.message),
  });

  const upsertLicense = trpc.admin.upsertLicense.useMutation({
    onSuccess: () => { utils.admin.listStudiosWithLicenses.invalidate(); toast.success("Licence mise à jour"); },
    onError: (e) => toast.error("Erreur : " + e.message),
  });

  const createArticle = trpc.admin.createArticle.useMutation({
    onSuccess: () => {
      utils.admin.listArticles.invalidate();
      setNewArticle({ titre: "", contenu: "", type: "annonce", statut: "publie", important: false });
      toast.success("Article créé");
    },
    onError: (e) => toast.error("Erreur : " + e.message),
  });

  const updateArticle = trpc.admin.updateArticle.useMutation({
    onSuccess: () => { utils.admin.listArticles.invalidate(); setEditingArticle(null); toast.success("Article mis à jour"); },
    onError: (e) => toast.error("Erreur : " + e.message),
  });

  const deleteArticle = trpc.admin.deleteArticle.useMutation({
    onSuccess: () => { utils.admin.listArticles.invalidate(); toast.success("Article supprimé"); },
    onError: (e) => toast.error("Erreur : " + e.message),
  });

  const sendNotif = trpc.admin.sendNotification.useMutation({
    onSuccess: () => {
      utils.admin.getAllNotifications.invalidate();
      setNewNotif({ titre: "", message: "", type: "info" });
      toast.success("Notification envoyée");
    },
    onError: (e) => toast.error("Erreur : " + e.message),
  });

  const createService = trpc.admin.createSharedService.useMutation({
    onSuccess: () => {
      utils.admin.listSharedServices.invalidate();
      setNewService({ nom: "", type: "piercing", description: "", zone: "", prixConseille: "", dureeMinutes: "" });
      toast.success("Service créé");
    },
    onError: (e) => toast.error("Erreur : " + e.message),
  });

  const updateService = trpc.admin.updateSharedService.useMutation({
    onSuccess: () => { utils.admin.listSharedServices.invalidate(); },
    onError: (e) => toast.error("Erreur : " + e.message),
  });

  const deleteService = trpc.admin.deleteSharedService.useMutation({
    onSuccess: () => { utils.admin.listSharedServices.invalidate(); toast.success("Service supprimé"); },
    onError: (e) => toast.error("Erreur : " + e.message),
  });

  const createInvitation = trpc.admin.createInvitation.useMutation({
    onSuccess: (data) => {
      utils.admin.listInvitations.invalidate();
      setInvitCode(data.code);
      toast.success(`Code généré : ${data.code}`);
    },
    onError: (e) => toast.error("Erreur : " + e.message),
  });

  // ====== LOCAL STATE ======
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [editingLicense, setEditingLicense] = useState<number | null>(null);
  const [licenseForm, setLicenseForm] = useState<any>({});
  const [editingArticle, setEditingArticle] = useState<any | null>(null);
  const [newArticle, setNewArticle] = useState({ titre: "", contenu: "", type: "annonce" as const, statut: "publie" as const, important: false });
  const [newNotif, setNewNotif] = useState({ titre: "", message: "", type: "info" as const });
  const [newService, setNewService] = useState({ nom: "", type: "piercing" as const, description: "", zone: "", prixConseille: "", dureeMinutes: "" });
  const [newInvit, setNewInvit] = useState({ email: "", planType: "trial" as const, trialDays: 30 });
  const [invitCode, setInvitCode] = useState<string | null>(null);

  // ====== NOUVEAU SALON ======
  const [newSalon, setNewSalon] = useState({
    nomSalon: "",
    slug: "",
    email: "",
    telephone: "",
    ville: "",
    planType: "studio" as "starter" | "studio" | "premium",
    trialDays: 30,
    maxClients: 500,
    maxUsers: 3,
    featureClients: true,
    featureDocuments: true,
    featureAgenda: true,
    featureSms: false,
    featureMultiUsers: false,
    featureExport: true,
    notes: "",
  });
  const [provisionResult, setProvisionResult] = useState<any>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  const checkSlug = trpc.provision.checkSlug.useQuery(
    { slug: newSalon.slug },
    { enabled: newSalon.slug.length >= 2 }
  );

  const createStudio = trpc.provision.createStudio.useMutation({
    onSuccess: (data) => {
      setProvisionResult(data);
      utils.admin.listStudiosWithLicenses.invalidate();
      if (data.success) {
        toast.success(`✅ Salon "${newSalon.nomSalon}" créé avec succès !`);
      } else {
        toast.error("Création partielle — vérifiez les étapes ci-dessous");
      }
    },
    onError: (e) => toast.error("Erreur : " + e.message),
  });

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "dashboard", label: "Tableau de bord", icon: "📊" },
    { id: "studios", label: "Studios", icon: "🏢" },
    { id: "licences", label: "Licences", icon: "🔑" },
    { id: "articles", label: "Articles", icon: "📝" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "services", label: "Services", icon: "⚙️" },
    { id: "invitations", label: "Invitations", icon: "✉️" },
    { id: "nouveau-salon", label: "Nouveau Salon", icon: "🚀" },
  ];

  const inputStyle = { background: "#0f1117", border: "1px solid rgba(255,255,255,0.15)", color: "white", marginTop: 4 };
  const labelStyle = { color: "rgba(255,255,255,0.7)", fontSize: "12px" } as const;

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "white", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a1f2e 0%, #0f1117 100%)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "16px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👑</div>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "white" }}>Intemporelle Admin</h1>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Console de gestion multi-studios</p>
        </div>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 73px)" }}>
        {/* Sidebar */}
        <div style={{ width: 220, background: "#1a1f2e", borderRight: "1px solid rgba(255,255,255,0.08)", padding: "16px 0", flexShrink: 0 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: "100%", textAlign: "left", padding: "10px 20px", border: "none", cursor: "pointer",
                background: activeTab === tab.id ? "rgba(99,102,241,0.15)" : "transparent",
                color: activeTab === tab.id ? "#818cf8" : "rgba(255,255,255,0.6)",
                borderLeft: activeTab === tab.id ? "3px solid #6366f1" : "3px solid transparent",
                fontSize: 14, display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>

          {/* ====== DASHBOARD ====== */}
          {activeTab === "dashboard" && (
            <div>
              <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700 }}>Tableau de bord</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Studios inscrits", value: stats.data?.totalStudios ?? "—", icon: "🏢", color: "#6366f1" },
                  { label: "Clients totaux", value: stats.data?.totalClients ?? "—", icon: "👥", color: "#22c55e" },
                  { label: "Articles publiés", value: articles.data?.filter((a: any) => a.statut === "publie").length ?? "—", icon: "📝", color: "#f59e0b" },
                  { label: "Notifications", value: notifications.data?.length ?? "—", icon: "🔔", color: "#8b5cf6" },
                ].map(card => (
                  <div key={card.label} style={{ background: "#1a1f2e", borderRadius: 12, padding: 20, border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{card.icon}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: card.color }}>{card.value}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{card.label}</div>
                  </div>
                ))}
              </div>
              <Card style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.08)" }}>
                <CardHeader><CardTitle style={{ color: "white", fontSize: 16 }}>Derniers studios inscrits</CardTitle></CardHeader>
                <CardContent>
                  <table style={{ width: "100%", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                        {["Nom", "Email", "Plan", "Statut", "Inscrit le"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 8px" }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {(studiosWithLicenses.data ?? []).slice(0, 5).map((s: any) => (
                        <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <td style={{ padding: "8px 8px", color: "white", fontWeight: 500 }}>{s.salonNom || s.name || "—"}</td>
                          <td style={{ padding: "8px 8px", color: "rgba(255,255,255,0.6)" }}>{s.email || "—"}</td>
                          <td style={{ padding: "8px 8px" }}>
                            <span style={{ background: `${PLAN_COLORS[s.planType] || "#6b7280"}22`, color: PLAN_COLORS[s.planType] || "#6b7280", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>
                              {PLAN_LABELS[s.planType] || "—"}
                            </span>
                          </td>
                          <td style={{ padding: "8px 8px" }}>
                            <span style={{ background: `${STATUS_COLORS[s.licenseStatus] || "#6b7280"}22`, color: STATUS_COLORS[s.licenseStatus] || "#6b7280", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>
                              {STATUS_LABELS[s.licenseStatus] || "Sans licence"}
                            </span>
                          </td>
                          <td style={{ padding: "8px 8px", color: "rgba(255,255,255,0.5)" }}>{new Date(s.createdAt).toLocaleDateString("fr-FR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ====== STUDIOS ====== */}
          {activeTab === "studios" && (
            <div>
              <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700 }}>Gestion des studios ({studiosWithLicenses.data?.length ?? 0})</h2>
              <div style={{ background: "#1a1f2e", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)" }}>
                      {["#", "Salon", "Email", "Ville", "Plan", "Statut", "Expiration", "Actions"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "12px 12px", fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(studiosWithLicenses.data ?? []).map((s: any) => (
                      <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.4)", fontSize: 11 }}>#{s.id}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ color: "white", fontWeight: 500 }}>{s.salonNom || s.name || "—"}</div>
                          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{s.loginMethod === "email" ? "📧 Email" : "🔢 PIN"}</div>
                        </td>
                        <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.6)" }}>{s.email || "—"}</td>
                        <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)" }}>{s.ville || "—"}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ background: `${PLAN_COLORS[s.planType] || "#6b7280"}22`, color: PLAN_COLORS[s.planType] || "#6b7280", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>
                            {PLAN_LABELS[s.planType] || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ background: `${STATUS_COLORS[s.licenseStatus] || "#6b7280"}22`, color: STATUS_COLORS[s.licenseStatus] || "#6b7280", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>
                            {STATUS_LABELS[s.licenseStatus] || "Sans licence"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                          {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString("fr-FR") : "—"}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => {
                                setEditingLicense(s.id);
                                setLicenseForm({ planType: s.planType || "trial", status: s.licenseStatus || "active", expiresAt: s.expiresAt ? new Date(s.expiresAt).toISOString().split("T")[0] : "", notes: s.licenseNotes || "", maxClients: s.maxClients || 100, maxUsers: s.maxUsers || 1, featureSms: s.featureSms || false, featureMultiUsers: s.featureMultiUsers || false });
                                setActiveTab("licences");
                              }}
                              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid #6366f1", background: "transparent", color: "#818cf8", cursor: "pointer" }}
                            >
                              Licence
                            </button>
                            {confirmDelete === s.id ? (
                              <>
                                <button onClick={() => { deleteUser.mutate({ userId: s.id }); setConfirmDelete(null); }} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "none", background: "#ef4444", color: "white", cursor: "pointer" }}>Oui</button>
                                <button onClick={() => setConfirmDelete(null)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid #6b7280", background: "transparent", color: "#9ca3af", cursor: "pointer" }}>Non</button>
                              </>
                            ) : (
                              <button onClick={() => setConfirmDelete(s.id)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid #ef4444", background: "transparent", color: "#f87171", cursor: "pointer" }}>Suppr.</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(studiosWithLicenses.data ?? []).length === 0 && (
                  <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>Aucun studio inscrit</div>
                )}
              </div>
            </div>
          )}

          {/* ====== LICENCES ====== */}
          {activeTab === "licences" && (
            <div>
              <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700 }}>Gestion des licences</h2>
              {editingLicense && (
                <Card style={{ background: "#1a1f2e", border: "1px solid #6366f1", marginBottom: 24 }}>
                  <CardHeader><CardTitle style={{ color: "white", fontSize: 16 }}>Modifier la licence — Studio #{editingLicense}</CardTitle></CardHeader>
                  <CardContent>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <Label style={labelStyle}>Plan</Label>
                        <Select value={licenseForm.planType} onValueChange={v => setLicenseForm((f: any) => ({ ...f, planType: v }))}>
                          <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="trial">Essai</SelectItem>
                            <SelectItem value="solo">Solo</SelectItem>
                            <SelectItem value="studio">Studio</SelectItem>
                            <SelectItem value="multi">Multi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label style={labelStyle}>Statut</Label>
                        <Select value={licenseForm.status} onValueChange={v => setLicenseForm((f: any) => ({ ...f, status: v }))}>
                          <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="suspended">Suspendu</SelectItem>
                            <SelectItem value="expired">Expiré</SelectItem>
                            <SelectItem value="cancelled">Annulé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label style={labelStyle}>Date d'expiration</Label>
                        <Input type="date" value={licenseForm.expiresAt} onChange={e => setLicenseForm((f: any) => ({ ...f, expiresAt: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <Label style={labelStyle}>Max clients (0 = illimité)</Label>
                        <Input type="number" value={licenseForm.maxClients} onChange={e => setLicenseForm((f: any) => ({ ...f, maxClients: parseInt(e.target.value) || 0 }))} style={inputStyle} />
                      </div>
                      <div>
                        <Label style={labelStyle}>Max utilisateurs</Label>
                        <Input type="number" value={licenseForm.maxUsers} onChange={e => setLicenseForm((f: any) => ({ ...f, maxUsers: parseInt(e.target.value) || 1 }))} style={inputStyle} />
                      </div>
                      <div>
                        <Label style={labelStyle}>Notes internes</Label>
                        <Input value={licenseForm.notes} onChange={e => setLicenseForm((f: any) => ({ ...f, notes: e.target.value }))} style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ marginTop: 16, display: "flex", gap: 16 }}>
                      {[{ key: "featureSms", label: "SMS activé" }, { key: "featureMultiUsers", label: "Multi-utilisateurs" }].map(f => (
                        <label key={f.key} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                          <input type="checkbox" checked={licenseForm[f.key] || false} onChange={e => setLicenseForm((fm: any) => ({ ...fm, [f.key]: e.target.checked }))} />
                          {f.label}
                        </label>
                      ))}
                    </div>
                    <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                      <Button onClick={() => {
                        upsertLicense.mutate({ userId: editingLicense, planType: licenseForm.planType, status: licenseForm.status, expiresAt: licenseForm.expiresAt ? new Date(licenseForm.expiresAt) : null, maxClients: licenseForm.maxClients, maxUsers: licenseForm.maxUsers, notes: licenseForm.notes, featureSms: licenseForm.featureSms, featureMultiUsers: licenseForm.featureMultiUsers });
                        setEditingLicense(null);
                      }} style={{ background: "#6366f1", color: "white" }}>Enregistrer</Button>
                      <Button variant="outline" onClick={() => setEditingLicense(null)} style={{ borderColor: "rgba(255,255,255,0.2)", color: "white" }}>Annuler</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              <div style={{ background: "#1a1f2e", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)" }}>
                      {["Studio", "Plan", "Statut", "Expiration", "Clients max", "Fonctionnalités", "Actions"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "12px 12px", fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(studiosWithLicenses.data ?? []).map((s: any) => (
                      <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ color: "white", fontWeight: 500 }}>{s.salonNom || s.name || "—"}</div>
                          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{s.email}</div>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ background: `${PLAN_COLORS[s.planType] || "#6b7280"}22`, color: PLAN_COLORS[s.planType] || "#6b7280", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>
                            {PLAN_LABELS[s.planType] || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ background: `${STATUS_COLORS[s.licenseStatus] || "#6b7280"}22`, color: STATUS_COLORS[s.licenseStatus] || "#6b7280", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>
                            {STATUS_LABELS[s.licenseStatus] || "Sans licence"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                          {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString("fr-FR") : "Illimitée"}
                        </td>
                        <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.6)" }}>{s.maxClients === 0 ? "∞" : s.maxClients || "100"}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {s.featureSms && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#22c55e22", color: "#22c55e" }}>SMS</span>}
                            {s.featureMultiUsers && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#8b5cf622", color: "#a78bfa" }}>Multi</span>}
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <button onClick={() => { setEditingLicense(s.id); setLicenseForm({ planType: s.planType || "trial", status: s.licenseStatus || "active", expiresAt: s.expiresAt ? new Date(s.expiresAt).toISOString().split("T")[0] : "", notes: s.licenseNotes || "", maxClients: s.maxClients || 100, maxUsers: s.maxUsers || 1, featureSms: s.featureSms || false, featureMultiUsers: s.featureMultiUsers || false }); }}
                            style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid #6366f1", background: "transparent", color: "#818cf8", cursor: "pointer" }}>
                            Modifier
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ====== ARTICLES ====== */}
          {activeTab === "articles" && (
            <div>
              <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700 }}>Articles & Annonces</h2>
              <Card style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 24 }}>
                <CardHeader><CardTitle style={{ color: "white", fontSize: 15 }}>Nouvel article</CardTitle></CardHeader>
                <CardContent>
                  <div style={{ display: "grid", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                      <div>
                        <Label style={labelStyle}>Titre</Label>
                        <Input value={newArticle.titre} onChange={e => setNewArticle(a => ({ ...a, titre: e.target.value }))} placeholder="Titre de l'article..." style={inputStyle} />
                      </div>
                      <div>
                        <Label style={labelStyle}>Type</Label>
                        <Select value={newArticle.type} onValueChange={v => setNewArticle(a => ({ ...a, type: v as any }))}>
                          <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="annonce">Annonce</SelectItem>
                            <SelectItem value="mise_a_jour">Mise à jour</SelectItem>
                            <SelectItem value="legal">Légal</SelectItem>
                            <SelectItem value="formation">Formation</SelectItem>
                            <SelectItem value="promo">Promotion</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label style={labelStyle}>Statut</Label>
                        <Select value={newArticle.statut} onValueChange={v => setNewArticle(a => ({ ...a, statut: v as any }))}>
                          <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="brouillon">Brouillon</SelectItem>
                            <SelectItem value="publie">Publié</SelectItem>
                            <SelectItem value="archive">Archivé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label style={labelStyle}>Contenu</Label>
                      <Textarea value={newArticle.contenu} onChange={e => setNewArticle(a => ({ ...a, contenu: e.target.value }))} placeholder="Contenu de l'article..." rows={4} style={inputStyle} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                        <input type="checkbox" checked={newArticle.important} onChange={e => setNewArticle(a => ({ ...a, important: e.target.checked }))} />
                        Important (priorité)
                      </label>
                      <Button onClick={() => createArticle.mutate(newArticle)} disabled={!newArticle.titre || !newArticle.contenu || createArticle.isPending} style={{ background: "#6366f1", color: "white" }}>
                        {createArticle.isPending ? "Création..." : "Créer l'article"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div style={{ display: "grid", gap: 12 }}>
                {(articles.data ?? []).map((article: any) => (
                  <div key={article.id} style={{ background: "#1a1f2e", borderRadius: 10, padding: 16, border: `1px solid ${article.important ? "#f59e0b44" : "rgba(255,255,255,0.08)"}` }}>
                    {editingArticle?.id === article.id ? (
                      <div style={{ display: "grid", gap: 10 }}>
                        <Input value={editingArticle.titre} onChange={e => setEditingArticle((a: any) => ({ ...a, titre: e.target.value }))} style={inputStyle} />
                        <Textarea value={editingArticle.contenu} onChange={e => setEditingArticle((a: any) => ({ ...a, contenu: e.target.value }))} rows={3} style={inputStyle} />
                        <div style={{ display: "flex", gap: 8 }}>
                          <Button onClick={() => updateArticle.mutate({ id: editingArticle.id, titre: editingArticle.titre, contenu: editingArticle.contenu, statut: editingArticle.statut })} style={{ background: "#6366f1", color: "white", fontSize: 12 }}>Enregistrer</Button>
                          <Button variant="outline" onClick={() => setEditingArticle(null)} style={{ borderColor: "rgba(255,255,255,0.2)", color: "white", fontSize: 12 }}>Annuler</Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {article.important && <span style={{ fontSize: 14 }}>⭐</span>}
                            <span style={{ color: "white", fontWeight: 600, fontSize: 15 }}>{article.titre}</span>
                          </div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: article.statut === "publie" ? "#22c55e22" : "#6b728022", color: article.statut === "publie" ? "#22c55e" : "#9ca3af" }}>
                              {article.statut === "publie" ? "Publié" : article.statut === "brouillon" ? "Brouillon" : "Archivé"}
                            </span>
                            <button onClick={() => setEditingArticle(article)} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, border: "1px solid #6366f1", background: "transparent", color: "#818cf8", cursor: "pointer" }}>Éditer</button>
                            <button onClick={() => deleteArticle.mutate({ id: article.id })} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, border: "1px solid #ef4444", background: "transparent", color: "#f87171", cursor: "pointer" }}>Suppr.</button>
                          </div>
                        </div>
                        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>{article.contenu.substring(0, 200)}{article.contenu.length > 200 ? "..." : ""}</p>
                        <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{new Date(article.createdAt).toLocaleDateString("fr-FR")} · {article.type}</div>
                      </div>
                    )}
                  </div>
                ))}
                {(articles.data ?? []).length === 0 && <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>Aucun article créé</div>}
              </div>
            </div>
          )}

          {/* ====== NOTIFICATIONS ====== */}
          {activeTab === "notifications" && (
            <div>
              <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700 }}>Notifications</h2>
              <Card style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 24 }}>
                <CardHeader><CardTitle style={{ color: "white", fontSize: 15 }}>Envoyer une notification</CardTitle></CardHeader>
                <CardContent>
                  <div style={{ display: "grid", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <Label style={labelStyle}>Titre</Label>
                        <Input value={newNotif.titre} onChange={e => setNewNotif(n => ({ ...n, titre: e.target.value }))} placeholder="Titre..." style={inputStyle} />
                      </div>
                      <div>
                        <Label style={labelStyle}>Type</Label>
                        <Select value={newNotif.type} onValueChange={v => setNewNotif(n => ({ ...n, type: v as any }))}>
                          <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="info">ℹ️ Info</SelectItem>
                            <SelectItem value="warning">⚠️ Avertissement</SelectItem>
                            <SelectItem value="success">✅ Succès</SelectItem>
                            <SelectItem value="error">❌ Erreur</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label style={labelStyle}>Message</Label>
                      <Textarea value={newNotif.message} onChange={e => setNewNotif(n => ({ ...n, message: e.target.value }))} placeholder="Message à envoyer à tous les studios..." rows={3} style={inputStyle} />
                    </div>
                    <Button onClick={() => sendNotif.mutate(newNotif)} disabled={!newNotif.titre || !newNotif.message || sendNotif.isPending} style={{ background: "#6366f1", color: "white", width: "fit-content" }}>
                      {sendNotif.isPending ? "Envoi..." : "Envoyer à tous les studios"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <div style={{ display: "grid", gap: 8 }}>
                {(notifications.data ?? []).map((n: any) => (
                  <div key={n.id} style={{ background: "#1a1f2e", borderRadius: 8, padding: 14, border: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ color: "white", fontWeight: 500, fontSize: 14 }}>{n.titre}</div>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>{n.message}</div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                      <div>{n.type}</div>
                      <div>{new Date(n.createdAt).toLocaleDateString("fr-FR")}</div>
                    </div>
                  </div>
                ))}
                {(notifications.data ?? []).length === 0 && <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>Aucune notification envoyée</div>}
              </div>
            </div>
          )}

          {/* ====== SERVICES ====== */}
          {activeTab === "services" && (
            <div>
              <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700 }}>Catalogue de services partagés</h2>
              <Card style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 24 }}>
                <CardHeader><CardTitle style={{ color: "white", fontSize: 15 }}>Nouveau service</CardTitle></CardHeader>
                <CardContent>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    <div><Label style={labelStyle}>Nom</Label><Input value={newService.nom} onChange={e => setNewService(s => ({ ...s, nom: e.target.value }))} placeholder="Nom du service..." style={inputStyle} /></div>
                    <div>
                      <Label style={labelStyle}>Type</Label>
                      <Select value={newService.type} onValueChange={v => setNewService(s => ({ ...s, type: v as any }))}>
                        <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="piercing">Piercing</SelectItem>
                          <SelectItem value="tatouage">Tatouage</SelectItem>
                          <SelectItem value="dermographie">Dermographie</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label style={labelStyle}>Zone</Label><Input value={newService.zone} onChange={e => setNewService(s => ({ ...s, zone: e.target.value }))} placeholder="Ex: Oreille, Nez..." style={inputStyle} /></div>
                    <div><Label style={labelStyle}>Prix conseillé (€)</Label><Input type="number" value={newService.prixConseille} onChange={e => setNewService(s => ({ ...s, prixConseille: e.target.value }))} placeholder="Ex: 45" style={inputStyle} /></div>
                    <div><Label style={labelStyle}>Durée (min)</Label><Input type="number" value={newService.dureeMinutes} onChange={e => setNewService(s => ({ ...s, dureeMinutes: e.target.value }))} placeholder="Ex: 30" style={inputStyle} /></div>
                    <div><Label style={labelStyle}>Description</Label><Input value={newService.description} onChange={e => setNewService(s => ({ ...s, description: e.target.value }))} placeholder="Description..." style={inputStyle} /></div>
                  </div>
                  <Button onClick={() => createService.mutate({ nom: newService.nom, type: newService.type, zone: newService.zone || undefined, description: newService.description || undefined, prixConseille: newService.prixConseille ? parseInt(newService.prixConseille) * 100 : undefined, dureeMinutes: newService.dureeMinutes ? parseInt(newService.dureeMinutes) : undefined })}
                    disabled={!newService.nom || createService.isPending} style={{ background: "#6366f1", color: "white", marginTop: 12 }}>
                    {createService.isPending ? "Création..." : "Ajouter au catalogue"}
                  </Button>
                </CardContent>
              </Card>
              <div style={{ background: "#1a1f2e", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)" }}>
                      {["Nom", "Type", "Zone", "Prix", "Durée", "Statut", "Action"].map(h => <th key={h} style={{ textAlign: "left", padding: "12px 12px", fontWeight: 500 }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(services.data ?? []).map((s: any) => (
                      <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "10px 12px", color: "white", fontWeight: 500 }}>{s.nom}</td>
                        <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.6)" }}>{s.type}</td>
                        <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)" }}>{s.zone || "—"}</td>
                        <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.6)" }}>{s.prixConseille ? `${(s.prixConseille / 100).toFixed(0)}€` : "—"}</td>
                        <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)" }}>{s.dureeMinutes ? `${s.dureeMinutes}min` : "—"}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: s.actif ? "#22c55e22" : "#6b728022", color: s.actif ? "#22c55e" : "#9ca3af" }}>{s.actif ? "Actif" : "Inactif"}</span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => updateService.mutate({ id: s.id, actif: !s.actif })} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, border: "1px solid #6366f1", background: "transparent", color: "#818cf8", cursor: "pointer" }}>{s.actif ? "Désactiver" : "Activer"}</button>
                            <button onClick={() => deleteService.mutate({ id: s.id })} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, border: "1px solid #ef4444", background: "transparent", color: "#f87171", cursor: "pointer" }}>Suppr.</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(services.data ?? []).length === 0 && <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>Aucun service dans le catalogue</div>}
              </div>
            </div>
          )}

          {/* ====== INVITATIONS ====== */}
          {activeTab === "invitations" && (
            <div>
              <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700 }}>Codes d'invitation</h2>
              <Card style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 24 }}>
                <CardHeader><CardTitle style={{ color: "white", fontSize: 15 }}>Générer un code d'invitation</CardTitle></CardHeader>
                <CardContent>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    <div><Label style={labelStyle}>Email (optionnel)</Label><Input value={newInvit.email} onChange={e => setNewInvit(i => ({ ...i, email: e.target.value }))} placeholder="contact@studio.fr" style={inputStyle} /></div>
                    <div>
                      <Label style={labelStyle}>Plan</Label>
                      <Select value={newInvit.planType} onValueChange={v => setNewInvit(i => ({ ...i, planType: v as any }))}>
                        <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trial">Essai</SelectItem>
                          <SelectItem value="solo">Solo</SelectItem>
                          <SelectItem value="studio">Studio</SelectItem>
                          <SelectItem value="multi">Multi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label style={labelStyle}>Jours d'essai</Label><Input type="number" value={newInvit.trialDays} onChange={e => setNewInvit(i => ({ ...i, trialDays: parseInt(e.target.value) || 30 }))} style={inputStyle} /></div>
                  </div>
                  <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
                    <Button onClick={() => createInvitation.mutate({ email: newInvit.email || undefined, planType: newInvit.planType, trialDays: newInvit.trialDays })} disabled={createInvitation.isPending} style={{ background: "#6366f1", color: "white" }}>
                      {createInvitation.isPending ? "Génération..." : "Générer le code"}
                    </Button>
                    {invitCode && (
                      <div style={{ background: "#22c55e22", border: "1px solid #22c55e44", borderRadius: 8, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "#22c55e", fontWeight: 700, fontSize: 16, letterSpacing: 2 }}>{invitCode}</span>
                        <button onClick={() => { navigator.clipboard.writeText(invitCode); toast.success("Code copié !"); }} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "1px solid #22c55e44", background: "transparent", color: "#22c55e", cursor: "pointer" }}>Copier</button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <div style={{ background: "#1a1f2e", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)" }}>
                      {["Code", "Email", "Plan", "Jours essai", "Utilisé", "Créé le"].map(h => <th key={h} style={{ textAlign: "left", padding: "12px 12px", fontWeight: 500 }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(invitations.data ?? []).map((inv: any) => (
                      <tr key={inv.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "#818cf8", fontWeight: 600 }}>{inv.code}</td>
                        <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.6)" }}>{inv.email || "—"}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ background: `${PLAN_COLORS[inv.planType] || "#6b7280"}22`, color: PLAN_COLORS[inv.planType] || "#6b7280", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>
                            {PLAN_LABELS[inv.planType] || inv.planType}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)" }}>{inv.trialDays}j</td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: inv.usedByUserId ? "#22c55e22" : "#6b728022", color: inv.usedByUserId ? "#22c55e" : "#9ca3af" }}>
                            {inv.usedByUserId ? "✓ Utilisé" : "En attente"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{new Date(inv.createdAt).toLocaleDateString("fr-FR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(invitations.data ?? []).length === 0 && <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>Aucun code d'invitation généré</div>}
              </div>
            </div>
          )}

        {/* ====== NOUVEAU SALON ====== */}
          {activeTab === "nouveau-salon" && (
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>🚀 Créer un nouveau salon</h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 24 }}>
                Provisionnement automatique : DNS IONOS → Nginx + SSL OVH → Licence en base de données
              </p>

              {provisionResult ? (
                <div>
                  {/* Résultat du provisionnement */}
                  <div style={{ background: provisionResult.success ? "#052e16" : "#2d0a0a", border: `1px solid ${provisionResult.success ? "#16a34a" : "#dc2626"}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{provisionResult.success ? "✅" : "⚠️"}</div>
                    <h3 style={{ margin: "0 0 4px", color: provisionResult.success ? "#4ade80" : "#f87171" }}>
                      {provisionResult.success ? "Salon créé avec succès !" : "Création partielle"}
                    </h3>
                    {provisionResult.domain && (
                      <p style={{ margin: "4px 0", color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                        🌐 URL : <a href={`https://${provisionResult.domain}`} target="_blank" rel="noreferrer" style={{ color: "#818cf8" }}>https://{provisionResult.domain}</a>
                      </p>
                    )}
                    {provisionResult.tempPassword && (
                      <p style={{ margin: "4px 0", color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                        🔑 Mot de passe temporaire : <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: 4, color: "#fbbf24" }}>{provisionResult.tempPassword}</code>
                      </p>
                    )}
                  </div>

                  {/* Détail des étapes */}
                  <div style={{ marginBottom: 24 }}>
                    <h4 style={{ margin: "0 0 12px", color: "rgba(255,255,255,0.7)", fontSize: 14, textTransform: "uppercase", letterSpacing: 1 }}>Détail des étapes</h4>
                    {(provisionResult.steps || []).map((step: any, i: number) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 16px", background: "#1a1f2e", borderRadius: 8, marginBottom: 8, border: `1px solid ${step.status === 'ok' ? '#16a34a' : step.status === 'error' ? '#dc2626' : '#6b7280'}33` }}>
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{step.status === 'ok' ? '✅' : step.status === 'error' ? '❌' : '⏭️'}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: step.status === 'ok' ? '#4ade80' : step.status === 'error' ? '#f87171' : '#9ca3af' }}>{step.step}</div>
                          {step.detail && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{step.detail}</div>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button onClick={() => { setProvisionResult(null); setNewSalon({ nomSalon: "", slug: "", email: "", telephone: "", ville: "", planType: "studio", trialDays: 30, maxClients: 500, maxUsers: 3, featureClients: true, featureDocuments: true, featureAgenda: true, featureSms: false, featureMultiUsers: false, featureExport: true, notes: "" }); }} style={{ background: "#6366f1", color: "white" }}>
                    Créer un autre salon
                  </Button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                  {/* Colonne gauche : infos salon */}
                  <div>
                    <Card style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 16 }}>
                      <CardHeader><CardTitle style={{ color: "white", fontSize: 16 }}>📋 Informations du salon</CardTitle></CardHeader>
                      <CardContent style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div>
                          <Label style={labelStyle}>Nom du salon *</Label>
                          <Input style={inputStyle} placeholder="Ex: Salon Beauté Paris" value={newSalon.nomSalon}
                            onChange={e => setNewSalon(s => ({ ...s, nomSalon: e.target.value, slug: s.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))} />
                        </div>
                        <div>
                          <Label style={labelStyle}>Sous-domaine (slug) * — sera : slug.intemporelle.eu</Label>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                            <Input style={{ ...inputStyle, marginTop: 0, flex: 1 }} placeholder="ex: salon-paris" value={newSalon.slug}
                              onChange={e => setNewSalon(s => ({ ...s, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} />
                            <span style={{ fontSize: 12, color: checkSlug.data?.available === false ? '#f87171' : checkSlug.data?.available === true ? '#4ade80' : 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
                              {newSalon.slug.length >= 2 ? (checkSlug.isLoading ? '⏳' : checkSlug.data?.available ? '✅ Disponible' : '❌ Pris') : ''}
                            </span>
                          </div>
                          {newSalon.slug && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>→ https://{newSalon.slug}.intemporelle.eu</div>}
                        </div>
                        <div>
                          <Label style={labelStyle}>Email du gérant *</Label>
                          <Input style={inputStyle} type="email" placeholder="contact@salon.fr" value={newSalon.email}
                            onChange={e => setNewSalon(s => ({ ...s, email: e.target.value }))} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div>
                            <Label style={labelStyle}>Téléphone</Label>
                            <Input style={inputStyle} placeholder="06 XX XX XX XX" value={newSalon.telephone}
                              onChange={e => setNewSalon(s => ({ ...s, telephone: e.target.value }))} />
                          </div>
                          <div>
                            <Label style={labelStyle}>Ville</Label>
                            <Input style={inputStyle} placeholder="Paris" value={newSalon.ville}
                              onChange={e => setNewSalon(s => ({ ...s, ville: e.target.value }))} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Colonne droite : licence */}
                  <div>
                    <Card style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 16 }}>
                      <CardHeader><CardTitle style={{ color: "white", fontSize: 16 }}>🔑 Configuration de la licence</CardTitle></CardHeader>
                      <CardContent style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div>
                          <Label style={labelStyle}>Plan</Label>
                          <Select value={newSalon.planType} onValueChange={v => setNewSalon(s => ({ ...s, planType: v as any }))}>
                            <SelectTrigger style={{ ...inputStyle, marginTop: 4 }}><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="starter">Starter</SelectItem>
                              <SelectItem value="studio">Studio</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                          <div>
                            <Label style={labelStyle}>Jours d'essai</Label>
                            <Input style={inputStyle} type="number" min={0} max={90} value={newSalon.trialDays}
                              onChange={e => setNewSalon(s => ({ ...s, trialDays: parseInt(e.target.value) || 0 }))} />
                          </div>
                          <div>
                            <Label style={labelStyle}>Max clients</Label>
                            <Input style={inputStyle} type="number" value={newSalon.maxClients}
                              onChange={e => setNewSalon(s => ({ ...s, maxClients: parseInt(e.target.value) || 500 }))} />
                          </div>
                          <div>
                            <Label style={labelStyle}>Max utilisateurs</Label>
                            <Input style={inputStyle} type="number" value={newSalon.maxUsers}
                              onChange={e => setNewSalon(s => ({ ...s, maxUsers: parseInt(e.target.value) || 1 }))} />
                          </div>
                        </div>
                        <div>
                          <Label style={labelStyle}>Fonctionnalités activées</Label>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
                            {[
                              { key: 'featureClients', label: '👥 Clients' },
                              { key: 'featureDocuments', label: '📄 Documents' },
                              { key: 'featureAgenda', label: '📅 Agenda' },
                              { key: 'featureSms', label: '💬 SMS' },
                              { key: 'featureMultiUsers', label: '👤 Multi-users' },
                              { key: 'featureExport', label: '📤 Export' },
                            ].map(f => (
                              <label key={f.key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 10px", background: (newSalon as any)[f.key] ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)", borderRadius: 6, border: `1px solid ${(newSalon as any)[f.key] ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
                                <input type="checkbox" checked={(newSalon as any)[f.key]}
                                  onChange={e => setNewSalon(s => ({ ...s, [f.key]: e.target.checked }))}
                                  style={{ accentColor: '#6366f1' }} />
                                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{f.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label style={labelStyle}>Notes internes</Label>
                          <Textarea style={{ ...inputStyle, resize: 'none' }} rows={2} placeholder="Notes sur ce salon..." value={newSalon.notes}
                            onChange={e => setNewSalon(s => ({ ...s, notes: e.target.value }))} />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Bouton de création sur toute la largeur */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Card style={{ background: "linear-gradient(135deg, #1e1b4b, #1a1f2e)", border: "1px solid rgba(99,102,241,0.3)" }}>
                      <CardContent style={{ padding: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                          <div>
                            <h3 style={{ margin: 0, color: "white", fontSize: 16 }}>Résumé du provisionnement</h3>
                            <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                              {newSalon.slug ? `https://${newSalon.slug}.intemporelle.eu` : "Renseignez le slug"}
                              {" → "}
                              {newSalon.planType} · {newSalon.trialDays}j essai · {newSalon.maxClients} clients max
                            </p>
                            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>1. DNS IONOS</span>
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>→</span>
                              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>2. Nginx + SSL OVH</span>
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>→</span>
                              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>3. Licence DB</span>
                            </div>
                          </div>
                          <Button
                            disabled={!newSalon.nomSalon || !newSalon.slug || !newSalon.email || checkSlug.data?.available === false || createStudio.isPending}
                            onClick={() => createStudio.mutate(newSalon)}
                            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", padding: "12px 28px", fontSize: 15, fontWeight: 600, opacity: (!newSalon.nomSalon || !newSalon.slug || !newSalon.email || checkSlug.data?.available === false) ? 0.5 : 1 }}
                          >
                            {createStudio.isPending ? "⏳ Provisionnement en cours..." : "🚀 Créer le salon"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

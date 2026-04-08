import { useState } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '@/lib/app-context';
import {
  Shield,
  ChevronLeft,
  FileText,
  Users,
  CheckCircle,
  Clock,
  UserPlus,
  X,
  Trash2,
  Pencil,
  Printer,
} from 'lucide-react';
import type { Client, ClientDocument } from '@/lib/types';

type Tab = 'engagement' | 'salaries';

const emptyForm = { prenom: '', nom: '', poste: '', telephone: '' };

export default function RgpdSalarie() {
  const [, navigate] = useLocation();
  const { state, addClient, updateClient, deleteClient } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('engagement');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editForm, setEditForm] = useState({ prenom: '', nom: '', poste: '', telephone: '' });
  const [editSaving, setEditSaving] = useState(false);

  const clients: Client[] = (state.clients || []).filter((c: Client) => c.estSalarie === true);

  const hasSignedEngagement = (client: Client): boolean => {
    return (
      client.documents?.some(
        (doc: ClientDocument) =>
          doc.type === 'engagement_confidentialite' && doc.status === 'signed'
      ) ?? false
    );
  };

  const getSignatureDate = (client: Client): string | null => {
    const doc = client.documents?.find(
      (d: ClientDocument) => d.type === 'engagement_confidentialite'
    );
    return doc?.dateSigned ?? doc?.dateCreation ?? null;
  };

  const handleOpen = () => {
    if (!selectedClientId) return;
    navigate(`/clients/${selectedClientId}/document/engagement_confidentialite`);
  };

  const handleCreateSalarie = async () => {
    if (!form.prenom.trim() || !form.nom.trim()) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const suppression = (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 5);
        return d.toISOString().split('T')[0];
      })();
      await addClient({
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        dateNaissance: new Date().toISOString().split('T')[0],
        adresse: '',
        codePostal: '',
        ville: '',
        telephone: form.telephone.trim(),
        email: undefined,
        estMineur: false,
        prestations: [],
        documentsAssocies: [],
        documents: [],
        photos: [],
        dateConsentement: today,
        dateSuppressionPrevue: suppression,
        rgpdDroitsExerces: [],
        estArchive: false,
        estSalarie: true,
        notes: form.poste ? `Poste : ${form.poste.trim()}` : undefined,
      });
      setForm(emptyForm);
      setShowNewForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSalarie = async () => {
    if (!editingClient || !editForm.prenom.trim() || !editForm.nom.trim()) return;
    setEditSaving(true);
    try {
      await updateClient({
        ...editingClient,
        nom: editForm.nom.trim(),
        prenom: editForm.prenom.trim(),
        telephone: editForm.telephone.trim(),
        notes: editForm.poste ? `Poste : ${editForm.poste.trim()}` : editingClient.notes,
      });
      setEditingClient(null);
    } finally {
      setEditSaving(false);
    }
  };
  const handlePrintEngagement = (client: Client) => {
    const doc = client.documents?.find(d => d.type === 'engagement_confidentialite');
    const dateSigned = doc?.dateSigned ? new Date(doc.dateSigned).toLocaleDateString('fr-FR') : 'Non signé';
    const poste = client.notes?.startsWith('Poste :') ? client.notes.replace('Poste : ', '') : '';
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Engagement RGPD — ${client.prenom} ${client.nom}</title><style>
      body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; color: #1a1a2e; }
      h1 { color: #0088a9; border-bottom: 2px solid #0088a9; padding-bottom: 8px; }
      .badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 20px; font-size: 13px; margin-bottom: 20px; }
      .info-row { display: flex; gap: 20px; margin-bottom: 8px; }
      .label { font-weight: bold; min-width: 140px; color: #555; }
      .section { margin-top: 24px; padding: 16px; background: #f5f5f5; border-radius: 8px; }
      .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888; }
      @media print { body { margin: 20px; } }
    </style></head><body>
      <h1>Engagement de Confidentialité — RGPD Art. 29</h1>
      <div class="badge">✓ Signé le ${dateSigned}</div>
      <div class="info-row"><span class="label">Nom complet :</span><span>${client.prenom} ${client.nom}</span></div>
      <div class="info-row"><span class="label">Poste :</span><span>${poste || '—'}</span></div>
      <div class="info-row"><span class="label">Téléphone :</span><span>${client.telephone || '—'}</span></div>
      <div class="info-row"><span class="label">Date de signature :</span><span>${dateSigned}</span></div>
      <div class="section">
        <strong>Objet :</strong> Données personnelles clients — Fiche 15<br><br>
        Je soussigné(e) <strong>${client.prenom} ${client.nom}</strong>, en qualité de <strong>${poste || 'employé(e)'}</strong>,
        m'engage à respecter la confidentialité des données personnelles des clients auxquelles j'ai accès dans le cadre de mes fonctions,
        conformément au Règlement Général sur la Protection des Données (RGPD — Art. 29).
      </div>
      <div class="footer">Document généré par Studio Manager · Intemporelle · ${new Date().toLocaleDateString('fr-FR')}</div>
      <script>window.onload = function(){ window.print(); }<\/script>
    </body></html>`);
    win.document.close();
  };
  const signedClients = clients.filter(hasSignedEngagement);
  const unsignedClients = clients.filter(c => !hasSignedEngagement(c));

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--brand-border)',
    color: 'var(--brand-text)',
  };

  return (
    <>
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm mb-6"
        style={{ color: 'var(--brand-cyan)' }}
      >
        <ChevronLeft size={16} />
        Retour
      </button>

      <div className="flex items-center gap-3 mb-2">
        <Shield size={28} style={{ color: 'var(--brand-cyan)' }} />
        <h1 className="text-2xl font-bold" style={{ color: 'var(--brand-cyan)' }}>
          Engagement de Confidentialité
        </h1>
      </div>
      <p className="text-sm mb-6" style={{ color: 'var(--brand-text-muted)' }}>
        Doc 11 — RGPD Art. 29 · À faire signer par chaque salarié
      </p>

      {/* Onglets */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-xl"
        style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}
      >
        <button
          onClick={() => setActiveTab('engagement')}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all"
          style={{
            background: activeTab === 'engagement' ? 'var(--brand-cyan)' : 'transparent',
            color: activeTab === 'engagement' ? 'var(--brand-navy)' : 'var(--brand-text-muted)',
          }}
        >
          <FileText size={15} />
          Engagement
        </button>
        <button
          onClick={() => setActiveTab('salaries')}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all"
          style={{
            background: activeTab === 'salaries' ? 'var(--brand-cyan)' : 'transparent',
            color: activeTab === 'salaries' ? 'var(--brand-navy)' : 'var(--brand-text-muted)',
          }}
        >
          <Users size={15} />
          Salariés
          {clients.length > 0 && (
            <span
              className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
              style={{
                background: activeTab === 'salaries' ? 'rgba(0,0,0,0.2)' : 'rgba(0,188,212,0.15)',
                color: activeTab === 'salaries' ? 'var(--brand-navy)' : 'var(--brand-cyan)',
              }}
            >
              {clients.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Onglet Engagement ── */}
      {activeTab === 'engagement' && (
        <>
          <div
            className="rounded-xl p-6 mb-4"
            style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText size={18} style={{ color: 'var(--brand-cyan)' }} />
              <span className="font-semibold" style={{ color: 'var(--brand-text)' }}>
                Sélectionner un salarié
              </span>
            </div>

            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm mb-4"
              style={inputStyle}
            >
              <option value="">-- Choisir un salarié --</option>
              {clients.map((c: Client) => (
                <option key={c.id} value={c.id}>
                  {c.prenom} {c.nom}
                  {hasSignedEngagement(c) ? ' ✓' : ''}
                </option>
              ))}
            </select>

            <button
              onClick={handleOpen}
              disabled={!selectedClientId}
              className="w-full py-3 rounded-lg font-semibold text-sm"
              style={{
                background: selectedClientId ? 'var(--brand-cyan)' : 'rgba(255,255,255,0.1)',
                color: selectedClientId ? 'var(--brand-navy)' : 'var(--brand-text-muted)',
                cursor: selectedClientId ? 'pointer' : 'not-allowed',
              }}
            >
              Ouvrir le formulaire
            </button>
          </div>

          <div
            className="rounded-xl p-4 text-xs"
            style={{
              background: 'rgba(0,188,212,0.07)',
              border: '1px solid rgba(0,188,212,0.2)',
              color: 'var(--brand-text-muted)',
            }}
          >
            <strong style={{ color: 'var(--brand-cyan)' }}>Base légale :</strong> Art. 29 RGPD — Le
            sous-traitant et toute personne agissant sous son autorité traitent les données uniquement
            sur instruction du responsable de traitement. Conservation : durée du contrat + 5 ans.
          </div>
        </>
      )}

      {/* ── Onglet Salariés ── */}
      {activeTab === 'salaries' && (
        <div className="space-y-4">
          {/* Statistiques */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
            >
              <CheckCircle size={20} style={{ color: '#22c55e' }} />
              <div>
                <div className="text-lg font-bold" style={{ color: '#22c55e' }}>
                  {signedClients.length}
                </div>
                <div className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>Signé(s)</div>
              </div>
            </div>
            <div
              className="rounded-xl p-4 flex items-center gap-3"
              style={{
                background: 'rgba(251,191,36,0.08)',
                border: '1px solid rgba(251,191,36,0.2)',
              }}
            >
              <Clock size={20} style={{ color: '#fbbf24' }} />
              <div>
                <div className="text-lg font-bold" style={{ color: '#fbbf24' }}>
                  {unsignedClients.length}
                </div>
                <div className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>En attente</div>
              </div>
            </div>
          </div>

          {/* Bouton Nouveau salarié */}
          {!showNewForm && (
            <button
              onClick={() => setShowNewForm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
              style={{
                background: 'rgba(0,188,212,0.12)',
                border: '1px dashed var(--brand-cyan)',
                color: 'var(--brand-cyan)',
              }}
            >
              <UserPlus size={16} />
              Nouveau salarié
            </button>
          )}

          {/* Formulaire nouveau salarié */}
          {showNewForm && (
            <div
              className="rounded-xl p-5"
              style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-sm" style={{ color: 'var(--brand-cyan)' }}>
                  Nouveau salarié
                </span>
                <button
                  onClick={() => { setShowNewForm(false); setForm(emptyForm); }}
                  style={{ color: 'var(--brand-text-muted)' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--brand-text-muted)' }}>
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={form.prenom}
                    onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                    placeholder="Prénom"
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--brand-text-muted)' }}>
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                    placeholder="Nom"
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--brand-text-muted)' }}>
                    Poste
                  </label>
                  <input
                    type="text"
                    value={form.poste}
                    onChange={e => setForm(f => ({ ...f, poste: e.target.value }))}
                    placeholder="ex : Pierceur, Tatoueur…"
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--brand-text-muted)' }}>
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={form.telephone}
                    onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                    placeholder="06 …"
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={inputStyle}
                  />
                </div>
              </div>

              <button
                onClick={handleCreateSalarie}
                disabled={!form.prenom.trim() || !form.nom.trim() || saving}
                className="w-full py-2.5 rounded-lg text-sm font-semibold"
                style={{
                  background:
                    form.prenom.trim() && form.nom.trim() && !saving
                      ? 'var(--brand-cyan)'
                      : 'rgba(255,255,255,0.1)',
                  color:
                    form.prenom.trim() && form.nom.trim() && !saving
                      ? 'var(--brand-navy)'
                      : 'var(--brand-text-muted)',
                  cursor:
                    form.prenom.trim() && form.nom.trim() && !saving ? 'pointer' : 'not-allowed',
                }}
              >
                {saving ? 'Enregistrement…' : 'Créer le salarié'}
              </button>
            </div>
          )}

          {/* Liste des salariés */}
          {clients.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}
            >
              <Users size={36} className="mx-auto mb-3" style={{ color: 'var(--brand-text-muted)' }} />
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--brand-text)' }}>
                Aucun salarié enregistré
              </p>
              <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
                Cliquez sur "Nouveau salarié" pour en créer un
              </p>
            </div>
          ) : (
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--brand-border)' }}
            >
              {clients.map((client: Client, idx: number) => {
                const isSigned = hasSignedEngagement(client);
                const date = getSignatureDate(client);
                const poste = client.notes?.startsWith('Poste :')
                  ? client.notes.replace('Poste : ', '')
                  : null;
                return (
                  <div
                    key={client.id}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer"
                    style={{
                      background:
                        idx % 2 === 0 ? 'var(--brand-surface)' : 'rgba(255,255,255,0.02)',
                      borderBottom:
                        idx < clients.length - 1 ? '1px solid var(--brand-border)' : 'none',
                    }}
                    onClick={() =>
                      navigate(
                        `/clients/${client.id}/document/engagement_confidentialite`
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: 'rgba(0,188,212,0.15)', color: 'var(--brand-cyan)' }}
                      >
                        {client.prenom?.[0]?.toUpperCase()}
                        {client.nom?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--brand-text)' }}>
                          {client.prenom} {client.nom}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
                          {poste && <span className="mr-2">{poste}</span>}
                          {date && (
                            <span>
                              {isSigned ? 'Signé le ' : 'Créé le '}
                              {new Date(date).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      {isSigned ? (
                        <span
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                          style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}
                        >
                          <CheckCircle size={12} />
                          Signé
                        </span>
                      ) : (
                        <span
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                          style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}
                        >
                          <Clock size={12} />
                          En attente
                        </span>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); setEditForm({ prenom: client.prenom || '', nom: client.nom || '', poste: client.notes?.startsWith('Poste :') ? client.notes.replace('Poste : ', '') : '', telephone: client.telephone || '' }); setEditingClient(client); }}
                        title="Modifier ce salarié"
                        style={{ padding: '5px 8px', borderRadius: 8, background: 'rgba(0,188,212,0.1)', border: '1px solid rgba(0,188,212,0.2)', color: 'var(--brand-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Pencil size={13} />
                      </button>
                      {isSigned && (
                        <button
                          onClick={e => { e.stopPropagation(); handlePrintEngagement(client); }}
                          title="Imprimer l'engagement signé"
                          style={{ padding: '5px 8px', borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <Printer size={13} />
                        </button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); if(window.confirm('Supprimer ce salarié ?')) deleteClient(client.id); }}
                        title="Supprimer ce salarié"
                        style={{ padding: '5px 8px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>

    {/* Modal d'édition salarié */}
    {editingClient && (
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        onClick={() => setEditingClient(null)}
      >
        <div
          style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ color: 'var(--brand-cyan)', fontWeight: 700, fontSize: 16 }}>Modifier le salarié</h3>
            <button onClick={() => setEditingClient(null)} style={{ background: 'none', border: 'none', color: 'var(--brand-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
          </div>
          {[
            { label: 'Prénom *', key: 'prenom', placeholder: 'Prénom' },
            { label: 'Nom *', key: 'nom', placeholder: 'Nom de famille' },
            { label: 'Poste', key: 'poste', placeholder: 'Ex: Tatoueur, Gérant…' },
            { label: 'Téléphone', key: 'telephone', placeholder: '06 XX XX XX XX' },
          ].map(({ label, key, placeholder }) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--brand-text-muted)', marginBottom: 4 }}>{label}</label>
              <input
                value={editForm[key as keyof typeof editForm]}
                onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
          ))}
          <button
            onClick={handleEditSalarie}
            disabled={!editForm.prenom.trim() || !editForm.nom.trim() || editSaving}
            style={{ width: '100%', padding: '10px 0', borderRadius: 8, background: 'var(--brand-cyan)', color: 'var(--brand-navy)', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', marginTop: 8 }}
          >
            {editSaving ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    )}
    </>
  );
}

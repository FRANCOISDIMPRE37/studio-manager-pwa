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
} from 'lucide-react';
import type { Client, ClientDocument } from '@/lib/types';

type Tab = 'engagement' | 'salaries';

const emptyForm = { prenom: '', nom: '', poste: '', telephone: '' };

export default function RgpdSalarie() {
  const [, navigate] = useLocation();
  const { state, addClient } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('engagement');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const clients: Client[] = state.clients || [];

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
        dateNaissance: '',
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
        notes: form.poste ? `Poste : ${form.poste.trim()}` : undefined,
      });
      setForm(emptyForm);
      setShowNewForm(false);
    } finally {
      setSaving(false);
    }
  };

  const signedClients = clients.filter(hasSignedEngagement);
  const unsignedClients = clients.filter(c => !hasSignedEngagement(c));

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--brand-border)',
    color: 'var(--brand-text)',
  };

  return (
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
                    <div className="flex items-center gap-2 shrink-0">
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

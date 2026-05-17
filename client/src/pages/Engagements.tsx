import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { trpc } from '@/lib/trpc';
import { Shield, Trash2, CheckCircle, Clock, PenLine } from 'lucide-react';
import { useLocation } from 'wouter';
import type { Client, ClientDocument } from '@/lib/types';

export default function Engagements() {
  const { state, updateClient } = useApp();
  const [, navigate] = useLocation();
  const [deleting, setDeleting] = useState<string | null>(null);

  const updateDocMutation = trpc.documents.update.useMutation();

  // Salariés uniquement
  const salaries: Client[] = (state.clients || []).filter((c: Client) => c.estSalarie === true);

  // Engagements signés (depuis les documents en mémoire/base)
  const engagements = salaries.flatMap((salarie: Client) => {
    const docs: ClientDocument[] = salarie.documents || [];
    return docs
      .filter((d: ClientDocument) => d.type === 'engagement_confidentialite' && d.status === 'signed')
      .map((d: ClientDocument) => ({
        salarieId: salarie.id,
        salarie,
        salarieName: `${salarie.prenom} ${salarie.nom}`,
        poste: salarie.notes?.startsWith('Poste :') ? salarie.notes.replace('Poste : ', '') : null,
        date: d.dateSigned || d.dateCreation || '',
        docId: d.id,
        doc: d,
      }));
  });

  // Salariés sans engagement signé
  const enAttente = salaries.filter((s: Client) =>
    !(s.documents || []).some((d: ClientDocument) => d.type === 'engagement_confidentialite' && d.status === 'signed')
  );

  const handleDelete = async (salarieId: string, docId: string, salarieName: string, salarie: Client) => {
    if (!window.confirm(`Supprimer l'engagement RGPD de ${salarieName} ?\nCette action est irréversible.`)) return;
    setDeleting(docId);
    try {
      // Supprimer en base
      await updateDocMutation.mutateAsync({ id: docId, status: 'empty', signatureClient: '', dateSigned: '' });
      // Mettre à jour le contexte local
      const updatedDocs = (salarie.documents || []).map((d: ClientDocument) =>
        d.id === docId ? { ...d, status: 'empty' as const, signatureClient: undefined, dateSigned: undefined } : d
      );
      await updateClient({ ...salarie, documents: updatedDocs });
    } catch (e) {
      console.error('[Engagements] Erreur suppression:', e);
      alert('Erreur lors de la suppression. Veuillez réessayer.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={22} color="#00bcd4" />
          <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: 0 }}>Engagements RGPD</h1>
        </div>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' }}>
          Art. 29 — Fiche 15
        </span>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 24 }}>
        Données personnelles clients — à signer par tout employé, stagiaire ou prestataire ayant accès aux données clients.
      </p>

      {/* Statistiques */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        <div style={{ flex: 1, padding: '14px 16px', borderRadius: 12, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#22c55e' }}>{engagements.length}</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Signé{engagements.length > 1 ? 's' : ''}</p>
        </div>
        <div style={{ flex: 1, padding: '14px 16px', borderRadius: 12, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#fbbf24' }}>{enAttente.length}</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>En attente</p>
        </div>
        <div style={{ flex: 1, padding: '14px 16px', borderRadius: 12, background: 'rgba(0,188,212,0.08)', border: '1px solid rgba(0,188,212,0.2)' }}>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#00bcd4' }}>{salaries.length}</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Salarié{salaries.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Engagements signés */}
      {engagements.length === 0 && enAttente.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
          <Shield size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
          <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>Aucun salarié enregistré</p>
          <p style={{ margin: '6px 0 0', fontSize: 12 }}>Créez un salarié depuis l'onglet Salariés pour commencer.</p>
        </div>
      ) : (
        <>
          {engagements.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', marginBottom: 10, textTransform: 'uppercase' }}>
                Engagements signés ({engagements.length})
              </p>
              {engagements.map((e, i) => (
                <div
                  key={`${e.salarieId}-${e.docId}-${i}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, marginBottom: 8 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,188,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#00bcd4', flexShrink: 0 }}>
                      {`${e.salarie.prenom?.[0] || ''}${e.salarie.nom?.[0] || ''}`.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: 'white', fontSize: 14 }}>{e.salarieName}</p>
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                        {e.poste && <span style={{ marginRight: 6 }}>{e.poste}</span>}
                        {e.date && <span>· Signé le {new Date(e.date).toLocaleDateString('fr-FR')}</span>}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '4px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.12)', color: '#22c55e', fontWeight: 600 }}>
                      <CheckCircle size={11} />
                      Signé
                    </span>
                    <button
                      onClick={() => handleDelete(e.salarieId, e.docId, e.salarieName, e.salarie)}
                      disabled={deleting === e.docId}
                      title="Supprimer cet engagement"
                      style={{ padding: '6px 9px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: deleting === e.docId ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: deleting === e.docId ? 0.5 : 1 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* En attente */}
          {enAttente.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', marginBottom: 10, textTransform: 'uppercase' }}>
                En attente de signature ({enAttente.length})
              </p>
              {enAttente.map((s: Client) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fbbf24', flexShrink: 0 }}>
                      {`${s.prenom?.[0] || ''}${s.nom?.[0] || ''}`.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: 'white', fontSize: 14 }}>{s.prenom} {s.nom}</p>
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                        {s.notes?.startsWith('Poste :') ? s.notes.replace('Poste : ', '') : 'Salarié'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/rgpd-salarie?salarieId=${s.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 12px', borderRadius: 20, background: 'rgba(99,102,241,0.15)', color: '#6366f1', fontWeight: 600, border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer' }}
                  >
                    <PenLine size={11} />
                    Signer
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

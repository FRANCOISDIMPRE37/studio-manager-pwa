import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function Salaries() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ prenom: '', nom: '', pin: '', role: 'employe' as const });
  const utils = trpc.useUtils();
  const list = trpc.studioUsers.list.useQuery();
  const del = trpc.studioUsers.delete.useMutation({ onSuccess: () => { utils.studioUsers.list.invalidate(); toast.success('Salarié supprimé'); } });
  const create = trpc.studioUsers.create.useMutation({
    onSuccess: () => { utils.studioUsers.list.invalidate(); setShowForm(false); setForm({ prenom: '', nom: '', pin: '', role: 'employe' }); toast.success('Salarié créé !'); },
    onError: (e) => toast.error(e.message)
  });
  const handleCreate = () => {
    if (!form.prenom || !form.nom || !form.pin) return toast.error('Remplissez tous les champs');
    if (form.pin.length !== 4) return toast.error('Le PIN doit être 4 chiffres');
    const login = (form.prenom + form.nom).toLowerCase().replace(/[^a-z0-9]/g, '') + Date.now();
    const password = Math.random().toString(36).slice(2, 10);
    create.mutate({ ...form, login, password });
  };
  const inp = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', borderRadius: 10, padding: '12px 14px', width: '100%', fontSize: 14 } as React.CSSProperties;
  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'white' }}>Salariés</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: 'white', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>+ Ajouter</button>
      </div>
      {showForm && (
        <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', color: 'white', fontSize: 16 }}>Nouveau salarié</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 4 }}>Prénom *</label><input style={inp} value={form.prenom} onChange={e => setForm(f => ({...f, prenom: e.target.value}))} /></div>
            <div><label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 4 }}>Nom *</label><input style={inp} value={form.nom} onChange={e => setForm(f => ({...f, nom: e.target.value}))} /></div>
            <div><label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 4 }}>PIN 4 chiffres *</label><input style={inp} maxLength={4} inputMode="numeric" value={form.pin} onChange={e => setForm(f => ({...f, pin: e.target.value.replace(/\D/g,'')}))} /></div>
            <div><label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'block', marginBottom: 4 }}>Rôle</label><select style={inp} value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value as any}))}><option value="employe">Employé</option><option value="admin">Admin</option><option value="stagiaire">Stagiaire</option></select></div>
          </div>
          <button onClick={handleCreate} disabled={create.isPending} style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', color: 'white', borderRadius: 10, padding: '14px', fontWeight: 700, cursor: 'pointer', width: '100%', fontSize: 15 }}>{create.isPending ? 'Création...' : 'Créer le salarié'}</button>
        </div>
      )}
      {(list.data ?? []).length === 0 && !showForm && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}><p style={{ fontSize: 40 }}>👥</p><p>Aucun salarié</p></div>}
      {(list.data ?? []).map((s: any) => (
        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, marginBottom: 10 }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: 'white', fontSize: 16 }}>{s.prenom} {s.nom}</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{s.role} · PIN {s.hasPinSet ? '✅' : '❌'}</p>
          </div>
          <button onClick={() => del.mutate({ id: s.id })} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>Supprimer</button>
        </div>
      ))}
    </div>
  );
}

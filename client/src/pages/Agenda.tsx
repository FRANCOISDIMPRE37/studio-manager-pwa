/*
 * DESIGN: Studio Nocturne — Agenda avec vue semaine et liste des RDV
 */
import { useState, useMemo } from 'react';
import { useApp } from '@/lib/app-context';
import { ChevronLeft, ChevronRight, Plus, Clock, X } from 'lucide-react';
import { RendezVous, RDVType, RDVStatut, RDV_TYPE_LABELS, RDV_STATUT_LABELS, RDV_STATUT_COLORS } from '@/lib/types';
import { toast } from 'sonner';

function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function AddRDVModal({ onClose, defaultDate }: { onClose: () => void; defaultDate: string }) {
  const { addRDV, state } = useApp();
  const [form, setForm] = useState({
    date: defaultDate, heureDebut: '10:00', heureFin: '11:00',
    clientId: '', clientNom: '', clientTelephone: '',
    type: 'piercing' as RDVType, zone: '', notes: '', statut: 'confirme' as RDVStatut,
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleClientChange = (id: string) => {
    const client = state.clients.find(c => c.id === id);
    if (client) {
      setForm(f => ({ ...f, clientId: id, clientNom: `${client.prenom} ${client.nom}`, clientTelephone: client.telephone }));
    } else {
      setForm(f => ({ ...f, clientId: '', clientNom: '', clientTelephone: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addRDV({ date: form.date, heureDebut: form.heureDebut, heureFin: form.heureFin, clientId: form.clientId || undefined, clientNom: form.clientNom || undefined, clientTelephone: form.clientTelephone || undefined, type: form.type, zone: form.zone || undefined, notes: form.notes || undefined, statut: form.statut });
    toast.success('Rendez-vous créé');
    onClose();
  };

  const inputStyle: React.CSSProperties = { background: 'var(--brand-navy)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', width: '100%', fontSize: '14px', outline: 'none' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', color: 'var(--brand-text-muted)', marginBottom: '4px', fontWeight: 500 };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-xl" style={{ background: 'var(--brand-navy-light)', border: '1px solid var(--brand-border)' }}>
        <div className="flex items-center justify-between p-4 border-b sticky top-0" style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-navy-light)' }}>
          <h2 className="text-base font-700" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>Nouveau rendez-vous</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10"><X size={18} style={{ color: 'var(--brand-text-muted)' }} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3"><label style={labelStyle}>Date</label><input type="date" style={inputStyle} value={form.date} onChange={e => set('date', e.target.value)} required /></div>
            <div><label style={labelStyle}>Début</label><input type="time" style={inputStyle} value={form.heureDebut} onChange={e => set('heureDebut', e.target.value)} /></div>
            <div><label style={labelStyle}>Fin</label><input type="time" style={inputStyle} value={form.heureFin} onChange={e => set('heureFin', e.target.value)} /></div>
            <div><label style={labelStyle}>Statut</label>
              <select style={inputStyle} value={form.statut} onChange={e => set('statut', e.target.value)}>
                <option value="confirme">Confirmé</option>
                <option value="en_attente">En attente</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Client (optionnel)</label>
            <select style={inputStyle} value={form.clientId} onChange={e => handleClientChange(e.target.value)}>
              <option value="">— Nouveau client / Sans client —</option>
              {state.clients.filter(c => !c.estArchive).map(c => (
                <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
              ))}
            </select>
          </div>
          {!form.clientId && (
            <div className="grid grid-cols-2 gap-3">
              <div><label style={labelStyle}>Nom du client</label><input style={inputStyle} value={form.clientNom} onChange={e => set('clientNom', e.target.value)} /></div>
              <div><label style={labelStyle}>Téléphone</label><input type="tel" style={inputStyle} value={form.clientTelephone} onChange={e => set('clientTelephone', e.target.value)} /></div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Type</label>
              <select style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}>
                {Object.entries(RDV_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Zone</label><input style={inputStyle} value={form.zone} onChange={e => set('zone', e.target.value)} placeholder="ex: Hélix, Avant-bras..." /></div>
          </div>
          <div><label style={labelStyle}>Notes</label><textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-lg text-sm font-600" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-muted)', fontWeight: 600 }}>Annuler</button>
            <button type="submit" className="flex-1 py-3 rounded-lg text-sm font-700" style={{ background: 'var(--brand-cyan)', color: 'var(--brand-navy)', fontWeight: 700 }}>Créer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Agenda() {
  const { state, deleteRDV, updateRDV } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDate, setSelectedDate] = useState(fmt(new Date()));

  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const dayRDV = useMemo(() =>
    state.rendezVous.filter(r => r.date === selectedDate).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut)),
    [state.rendezVous, selectedDate]
  );

  const getRDVCount = (date: Date) => state.rendezVous.filter(r => r.date === fmt(date)).length;

  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };
  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const today = fmt(new Date());

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-700" style={{ color: 'var(--brand-text)', fontFamily: 'Outfit', fontWeight: 700 }}>Agenda</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-600 active:scale-95" style={{ background: 'var(--brand-cyan)', color: 'var(--brand-navy)', fontWeight: 600 }}>
          <Plus size={16} /><span className="hidden md:inline">Nouveau RDV</span>
        </button>
      </div>

      {/* Week navigation */}
      <div className="studio-card p-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-white/10 transition-all"><ChevronLeft size={18} style={{ color: 'var(--brand-text-muted)' }} /></button>
          <span className="text-sm font-600" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>
            {weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – {weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-white/10 transition-all"><ChevronRight size={18} style={{ color: 'var(--brand-text-muted)' }} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, i) => {
            const d = fmt(day);
            const isToday = d === today;
            const isSelected = d === selectedDate;
            const count = getRDVCount(day);
            return (
              <button key={i} onClick={() => setSelectedDate(d)} className="flex flex-col items-center py-2 rounded-lg transition-all"
                style={{ background: isSelected ? 'var(--brand-cyan-dim)' : isToday ? 'rgba(255,255,255,0.05)' : 'transparent', border: `1px solid ${isSelected ? 'var(--brand-cyan)' : isToday ? 'rgba(255,255,255,0.1)' : 'transparent'}` }}>
                <span className="text-xs" style={{ color: isSelected ? 'var(--brand-cyan)' : 'var(--brand-text-muted)' }}>{dayNames[i]}</span>
                <span className="text-sm font-700 mt-0.5" style={{ color: isSelected ? 'var(--brand-cyan)' : isToday ? 'white' : 'var(--brand-text)', fontWeight: 700 }}>{day.getDate()}</span>
                {count > 0 && <div className="w-1.5 h-1.5 rounded-full mt-1" style={{ background: isSelected ? 'var(--brand-cyan)' : '#4CAF50' }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* RDV list for selected day */}
      <div>
        <h2 className="text-sm font-600 mb-3" style={{ color: 'var(--brand-text-muted)', fontWeight: 600 }}>
          {new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          <span className="ml-2" style={{ color: 'var(--brand-cyan)' }}>{dayRDV.length} RDV</span>
        </h2>
        {dayRDV.length === 0 ? (
          <div className="text-center py-12">
            <Clock size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--brand-text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>Aucun rendez-vous ce jour</p>
            <button onClick={() => setShowAdd(true)} className="mt-3 text-sm px-4 py-2 rounded-lg" style={{ background: 'var(--brand-cyan-dim)', color: 'var(--brand-cyan)', border: '1px solid var(--brand-cyan)' }}>
              Ajouter un RDV
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {dayRDV.map(rdv => {
              const statutColor = RDV_STATUT_COLORS[rdv.statut];
              return (
                <div key={rdv.id} className="studio-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-full min-h-12 rounded-full flex-shrink-0" style={{ background: statutColor }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-600" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>{rdv.heureDebut} – {rdv.heureFin}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: statutColor + '22', color: statutColor, border: `1px solid ${statutColor}` }}>{RDV_STATUT_LABELS[rdv.statut]}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(131,208,245,0.1)', color: 'var(--brand-cyan)', border: '1px solid rgba(131,208,245,0.3)' }}>{RDV_TYPE_LABELS[rdv.type]}</span>
                      </div>
                      <p className="text-sm mt-1" style={{ color: 'var(--brand-text)' }}>{rdv.clientNom || 'Client non renseigné'}</p>
                      {rdv.zone && <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>Zone : {rdv.zone}</p>}
                      {rdv.notes && <p className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>{rdv.notes}</p>}
                    </div>
                    <div className="flex gap-2">
                      {rdv.statut !== 'termine' && (
                        <button onClick={() => { updateRDV({ ...rdv, statut: 'termine' }); toast.success('RDV marqué terminé'); }}
                          className="text-xs px-2 py-1 rounded" style={{ background: '#4CAF5022', color: '#4CAF50', border: '1px solid #4CAF50' }}>
                          ✓
                        </button>
                      )}
                      <button onClick={() => { deleteRDV(rdv.id); toast.success('RDV supprimé'); }}
                        className="text-xs px-2 py-1 rounded" style={{ background: '#F4433622', color: '#F44336', border: '1px solid #F44336' }}>
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAdd && <AddRDVModal onClose={() => setShowAdd(false)} defaultDate={selectedDate} />}
    </div>
  );
}

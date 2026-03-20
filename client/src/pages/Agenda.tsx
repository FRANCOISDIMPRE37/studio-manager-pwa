/**
 * DESIGN: Studio Nocturne — Agenda avec vues Jour / Semaine / Mois
 */
import { useState, useMemo, useRef } from 'react';
import { useApp } from '@/lib/app-context';
import { ChevronLeft, ChevronRight, Plus, Clock, X, Calendar, CalendarDays, CalendarRange, Bell, CheckCircle, AlertCircle, MinusCircle } from 'lucide-react';
import { RendezVous, RDVType, RDVStatut, RDV_TYPE_LABELS, RDV_STATUT_LABELS, RDV_STATUT_COLORS } from '@/lib/types';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

type View = 'jour' | 'semaine' | 'mois';

function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// ─── Modal Ajout RDV ───────────────────────────────────────────────────────────
function AddRDVModal({ onClose, defaultDate, defaultHeure }: { onClose: () => void; defaultDate: string; defaultHeure?: string }) {
  const { addRDV, state } = useApp();
  const [form, setForm] = useState({
    date: defaultDate,
    heureDebut: defaultHeure || '10:00',
    heureFin: defaultHeure ? `${String(Math.min(Number(defaultHeure.split(':')[0]) + 1, 23)).padStart(2, '0')}:00` : '11:00',
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
    addRDV({
      date: form.date, heureDebut: form.heureDebut, heureFin: form.heureFin,
      clientId: form.clientId || undefined, clientNom: form.clientNom || undefined,
      clientTelephone: form.clientTelephone || undefined,
      type: form.type, zone: form.zone || undefined, notes: form.notes || undefined, statut: form.statut,
    });
    toast.success('Rendez-vous créé');
    onClose();
  };

  const inp: React.CSSProperties = { background: 'var(--brand-navy)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', width: '100%', fontSize: '14px', outline: 'none' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', color: 'var(--brand-text-muted)', marginBottom: '4px', fontWeight: 500 };

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
            <div className="col-span-3"><label style={lbl}>Date</label><input type="date" style={inp} value={form.date} onChange={e => set('date', e.target.value)} required /></div>
            <div><label style={lbl}>Début</label><input type="time" style={inp} value={form.heureDebut} onChange={e => set('heureDebut', e.target.value)} /></div>
            <div><label style={lbl}>Fin</label><input type="time" style={inp} value={form.heureFin} onChange={e => set('heureFin', e.target.value)} /></div>
            <div><label style={lbl}>Statut</label>
              <select style={inp} value={form.statut} onChange={e => set('statut', e.target.value)}>
                <option value="confirme">Confirmé</option>
                <option value="en_attente">En attente</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>Client (optionnel)</label>
            <select style={inp} value={form.clientId} onChange={e => handleClientChange(e.target.value)}>
              <option value="">— Nouveau client / Sans client —</option>
              {state.clients.filter(c => !c.estArchive).map(c => (
                <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
              ))}
            </select>
          </div>
          {!form.clientId && (
            <div className="grid grid-cols-2 gap-3">
              <div><label style={lbl}>Nom du client</label><input style={inp} value={form.clientNom} onChange={e => set('clientNom', e.target.value)} /></div>
              <div><label style={lbl}>Téléphone</label><input type="tel" style={inp} value={form.clientTelephone} onChange={e => set('clientTelephone', e.target.value)} /></div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={lbl}>Type</label>
              <select style={inp} value={form.type} onChange={e => set('type', e.target.value)}>
                {Object.entries(RDV_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Zone</label><input style={inp} value={form.zone} onChange={e => set('zone', e.target.value)} placeholder="ex: Hélix, Avant-bras..." /></div>
          </div>
          <div><label style={lbl}>Notes</label><textarea style={{ ...inp, resize: 'vertical', minHeight: '60px' }} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-muted)', fontWeight: 600 }}>Annuler</button>
            <button type="submit" className="flex-1 py-3 rounded-lg text-sm" style={{ background: 'var(--brand-cyan)', color: 'var(--brand-navy)', fontWeight: 700 }}>Créer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Carte RDV compacte ────────────────────────────────────────────────────────
function RDVCard({ rdv, onDelete, onDone, compact = false }: { rdv: RendezVous; onDelete: () => void; onDone: () => void; compact?: boolean }) {
  const color = RDV_STATUT_COLORS[rdv.statut];
  return (
    <div className="rounded-lg p-2 text-xs overflow-hidden" style={{ background: color + '18', border: `1px solid ${color}55`, borderLeft: `3px solid ${color}` }}>
      <div className="flex items-center justify-between gap-1">
        <span className="font-700 truncate" style={{ color, fontWeight: 700 }}>{rdv.heureDebut}–{rdv.heureFin}</span>
        <div className="flex gap-1 flex-shrink-0">
          {rdv.statut !== 'termine' && (
            <button onClick={onDone} className="px-1.5 py-0.5 rounded text-xs" style={{ background: '#4CAF5022', color: '#4CAF50', border: '1px solid #4CAF5055' }}>✓</button>
          )}
          <button onClick={onDelete} className="px-1.5 py-0.5 rounded text-xs" style={{ background: '#F4433622', color: '#F44336', border: '1px solid #F4433655' }}>✕</button>
        </div>
      </div>
      <p className="truncate mt-0.5" style={{ color: 'var(--brand-text)' }}>{rdv.clientNom || 'Sans client'}</p>
      {!compact && rdv.zone && <p className="truncate" style={{ color: 'var(--brand-text-muted)' }}>{rdv.zone}</p>}
    </div>
  );
}

// ─── Vue JOUR ─────────────────────────────────────────────────────────────────
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8h → 20h

function VueJour({ date, rdvs, onAdd, onDelete, onDone }: {
  date: Date; rdvs: RendezVous[];
  onAdd: (h: string) => void; onDelete: (id: string) => void; onDone: (rdv: RendezVous) => void;
}) {
  const dayRdvs = rdvs.filter(r => r.date === fmt(date)).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));

  return (
    <div className="studio-card overflow-hidden">
      <div className="p-3 border-b" style={{ borderColor: 'var(--brand-border)' }}>
        <p className="text-sm font-700" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>
          {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--brand-cyan)' }}>{dayRdvs.length} rendez-vous</p>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {HOURS.map(h => {
          const hStr = `${String(h).padStart(2, '0')}:00`;
          const slotRdvs = dayRdvs.filter(r => {
            const start = timeToMinutes(r.heureDebut);
            const slotStart = h * 60;
            const slotEnd = (h + 1) * 60;
            return start >= slotStart && start < slotEnd;
          });
          const isNow = new Date().getHours() === h && fmt(date) === fmt(new Date());
          return (
            <div key={h} className="flex gap-2 border-b" style={{ borderColor: 'var(--brand-border)', minHeight: '56px' }}>
              <div className="w-14 flex-shrink-0 flex items-start justify-end pt-2 pr-2">
                <span className="text-xs" style={{ color: isNow ? 'var(--brand-cyan)' : 'var(--brand-text-muted)', fontWeight: isNow ? 700 : 400 }}>{hStr}</span>
              </div>
              <div className="flex-1 py-1 pr-2 space-y-1">
                {isNow && <div className="h-0.5 rounded-full mb-1" style={{ background: 'var(--brand-cyan)', opacity: 0.6 }} />}
                {slotRdvs.map(rdv => (
                  <RDVCard key={rdv.id} rdv={rdv}
                    onDelete={() => onDelete(rdv.id)}
                    onDone={() => onDone(rdv)} />
                ))}
                {slotRdvs.length === 0 && (
                  <button onClick={() => onAdd(hStr)} className="w-full h-8 rounded text-xs opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1"
                    style={{ border: '1px dashed var(--brand-border)', color: 'var(--brand-text-muted)' }}>
                    <Plus size={12} /> Ajouter
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Vue SEMAINE ──────────────────────────────────────────────────────────────
function VueSemaine({ weekDays, rdvs, today, onAdd, onDelete, onDone }: {
  weekDays: Date[]; rdvs: RendezVous[]; today: string;
  onAdd: (date: string, h: string) => void; onDelete: (id: string) => void; onDone: (rdv: RendezVous) => void;
}) {
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="studio-card overflow-hidden">
      {/* Header jours */}
      <div className="grid border-b" style={{ gridTemplateColumns: '48px repeat(7, 1fr)', borderColor: 'var(--brand-border)' }}>
        <div className="p-2" />
        {weekDays.map((day, i) => {
          const d = fmt(day);
          const isToday = d === today;
          const count = rdvs.filter(r => r.date === d).length;
          return (
            <div key={i} className="p-2 text-center border-l" style={{ borderColor: 'var(--brand-border)', background: isToday ? 'rgba(131,208,245,0.06)' : 'transparent' }}>
              <p className="text-xs" style={{ color: isToday ? 'var(--brand-cyan)' : 'var(--brand-text-muted)' }}>{dayNames[i]}</p>
              <p className="text-sm font-700" style={{ color: isToday ? 'var(--brand-cyan)' : 'var(--brand-text)', fontWeight: 700 }}>{day.getDate()}</p>
              {count > 0 && <div className="w-1.5 h-1.5 rounded-full mx-auto mt-0.5" style={{ background: isToday ? 'var(--brand-cyan)' : '#4CAF50' }} />}
            </div>
          );
        })}
      </div>
      {/* Grille horaire */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
        {HOURS.map(h => {
          const hStr = `${String(h).padStart(2, '0')}:00`;
          const isNowHour = new Date().getHours() === h;
          return (
            <div key={h} className="grid border-b" style={{ gridTemplateColumns: '48px repeat(7, 1fr)', borderColor: 'var(--brand-border)', minHeight: '52px' }}>
              <div className="flex items-start justify-end pt-1.5 pr-2">
                <span className="text-xs" style={{ color: isNowHour ? 'var(--brand-cyan)' : 'var(--brand-text-muted)', fontWeight: isNowHour ? 700 : 400 }}>{hStr}</span>
              </div>
              {weekDays.map((day, di) => {
                const d = fmt(day);
                const isToday = d === today;
                const slotRdvs = rdvs.filter(r => {
                  if (r.date !== d) return false;
                  const start = timeToMinutes(r.heureDebut);
                  return start >= h * 60 && start < (h + 1) * 60;
                });
                return (
                  <div key={di} className="border-l p-0.5 space-y-0.5 relative"
                    style={{ borderColor: 'var(--brand-border)', background: isToday && isNowHour ? 'rgba(131,208,245,0.04)' : 'transparent' }}>
                    {slotRdvs.map(rdv => (
                      <RDVCard key={rdv.id} rdv={rdv} compact
                        onDelete={() => onDelete(rdv.id)}
                        onDone={() => onDone(rdv)} />
                    ))}
                    {slotRdvs.length === 0 && (
                      <button onClick={() => onAdd(d, hStr)} className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                        style={{ color: 'var(--brand-text-muted)' }}>
                        <Plus size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Vue MOIS ─────────────────────────────────────────────────────────────────
function VueMois({ currentDate, rdvs, today, onDayClick, onAdd }: {
  currentDate: Date; rdvs: RendezVous[]; today: string;
  onDayClick: (d: string) => void; onAdd: (d: string) => void;
}) {
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const { cells } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // offset: Monday = 0
    const startOffset = (firstDay.getDay() + 6) % 7;
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return { cells };
  }, [currentDate]);

  return (
    <div className="studio-card overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--brand-border)' }}>
        {dayNames.map(d => (
          <div key={d} className="p-2 text-center">
            <span className="text-xs font-600" style={{ color: 'var(--brand-text-muted)', fontWeight: 600 }}>{d}</span>
          </div>
        ))}
      </div>
      {/* Grille */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="border-b border-r p-1" style={{ borderColor: 'var(--brand-border)', minHeight: '80px', opacity: 0.2 }} />;
          const d = fmt(day);
          const isToday = d === today;
          const dayRdvs = rdvs.filter(r => r.date === d);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          return (
            <div key={i} onClick={() => onDayClick(d)}
              className="border-b border-r p-1 cursor-pointer transition-all hover:bg-white/5"
              style={{ borderColor: 'var(--brand-border)', minHeight: '80px', background: isToday ? 'rgba(131,208,245,0.06)' : 'transparent' }}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full`}
                  style={{
                    background: isToday ? 'var(--brand-cyan)' : 'transparent',
                    color: isToday ? 'var(--brand-navy)' : isCurrentMonth ? 'var(--brand-text)' : 'var(--brand-text-muted)',
                    fontWeight: isToday ? 700 : 400,
                  }}>
                  {day.getDate()}
                </span>
                {dayRdvs.length > 0 && (
                  <button onClick={e => { e.stopPropagation(); onAdd(d); }}
                    className="w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100"
                    style={{ background: 'var(--brand-cyan-dim)', color: 'var(--brand-cyan)' }}>
                    <Plus size={10} />
                  </button>
                )}
              </div>
              <div className="space-y-0.5">
                {dayRdvs.slice(0, 3).map(rdv => {
                  const color = RDV_STATUT_COLORS[rdv.statut];
                  return (
                    <div key={rdv.id} className="text-xs px-1 py-0.5 rounded truncate"
                      style={{ background: color + '22', color, borderLeft: `2px solid ${color}`, fontSize: '10px' }}>
                      {rdv.heureDebut} {rdv.clientNom?.split(' ')[0] || RDV_TYPE_LABELS[rdv.type]}
                    </div>
                  );
                })}
                {dayRdvs.length > 3 && (
                  <p className="text-xs" style={{ color: 'var(--brand-text-muted)', fontSize: '10px' }}>+{dayRdvs.length - 3} autres</p>
                )}
                {dayRdvs.length === 0 && (
                  <button onClick={e => { e.stopPropagation(); onAdd(d); }}
                    className="w-full text-xs py-1 rounded opacity-0 hover:opacity-100 transition-opacity"
                    style={{ border: '1px dashed var(--brand-border)', color: 'var(--brand-text-muted)', fontSize: '10px' }}>
                    + RDV
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────────
export default function Agenda() {
  const { state, deleteRDV, updateRDV } = useApp();
  const [view, setView] = useState<View>('semaine');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [addDate, setAddDate] = useState(fmt(new Date()));
  const [addHeure, setAddHeure] = useState<string | undefined>(undefined);

  const today = fmt(new Date());

  // Semaine courante (Lun → Dim)
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

  // Navigation
  const prev = () => {
    const d = new Date(currentDate);
    if (view === 'jour') d.setDate(d.getDate() - 1);
    else if (view === 'semaine') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };
  const next = () => {
    const d = new Date(currentDate);
    if (view === 'jour') d.setDate(d.getDate() + 1);
    else if (view === 'semaine') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };
  const goToday = () => setCurrentDate(new Date());

  // Titre de navigation
  const navTitle = useMemo(() => {
    if (view === 'jour') return currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (view === 'semaine') return `${weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }, [view, currentDate, weekDays]);

  const handleAdd = (date: string, heure?: string) => {
    setAddDate(date);
    setAddHeure(heure);
    setShowAdd(true);
  };

  const handleDelete = (id: string) => { deleteRDV(id); toast.success('RDV supprimé'); };
  const handleDone = (rdv: RendezVous) => { updateRDV({ ...rdv, statut: 'termine' }); toast.success('RDV marqué terminé'); };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Barre de contrôle */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Sélecteur de vue */}
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--brand-border)' }}>
          {([
            { key: 'jour', label: 'Jour', icon: CalendarDays },
            { key: 'semaine', label: 'Semaine', icon: CalendarRange },
            { key: 'mois', label: 'Mois', icon: Calendar },
          ] as { key: View; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setView(key)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm transition-all"
              style={{
                background: view === key ? 'var(--brand-cyan-dim)' : 'transparent',
                color: view === key ? 'var(--brand-cyan)' : 'var(--brand-text-muted)',
                fontWeight: view === key ? 700 : 400,
                borderRight: key !== 'mois' ? '1px solid var(--brand-border)' : 'none',
              }}>
              <Icon size={14} /><span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button onClick={prev} className="p-2 rounded-lg hover:bg-white/10 transition-all">
            <ChevronLeft size={18} style={{ color: 'var(--brand-text-muted)' }} />
          </button>
          <button onClick={goToday} className="px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-muted)' }}>
            Aujourd'hui
          </button>
          <button onClick={next} className="p-2 rounded-lg hover:bg-white/10 transition-all">
            <ChevronRight size={18} style={{ color: 'var(--brand-text-muted)' }} />
          </button>
        </div>

        {/* Titre période */}
        <span className="text-sm font-600 flex-1 text-center sm:text-left capitalize"
          style={{ color: 'var(--brand-text)', fontWeight: 600 }}>{navTitle}</span>

        {/* Bouton Nouveau RDV */}
        <button onClick={() => handleAdd(today)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm active:scale-95"
          style={{ background: 'var(--brand-cyan)', color: 'var(--brand-navy)', fontWeight: 700 }}>
          <Plus size={16} /><span className="hidden sm:inline">Nouveau RDV</span>
        </button>
      </div>

      {/* Vues */}
      {view === 'jour' && (
        <VueJour
          date={currentDate}
          rdvs={state.rendezVous}
          onAdd={h => handleAdd(fmt(currentDate), h)}
          onDelete={handleDelete}
          onDone={handleDone}
        />
      )}
      {view === 'semaine' && (
        <VueSemaine
          weekDays={weekDays}
          rdvs={state.rendezVous}
          today={today}
          onAdd={(d, h) => handleAdd(d, h)}
          onDelete={handleDelete}
          onDone={handleDone}
        />
      )}
      {view === 'mois' && (
        <VueMois
          currentDate={currentDate}
          rdvs={state.rendezVous}
          today={today}
          onDayClick={d => { setView('jour'); setCurrentDate(new Date(d + 'T12:00:00')); }}
          onAdd={d => handleAdd(d)}
        />
      )}

      {showAdd && (
        <AddRDVModal
          onClose={() => setShowAdd(false)}
          defaultDate={addDate}
          defaultHeure={addHeure}
        />
      )}

      {/* Panneau rappels automatiques */}
      <PanneauRappels />
    </div>
  );
}

// ─── Panneau Rappels Automatiques ─────────────────────────────────────────────
function PanneauRappels() {
  const { data, isLoading } = trpc.rappels.getStatus.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  const rappels = data?.rappels || [];

  if (isLoading) return null;

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--brand-navy)', border: '1px solid var(--brand-border)' }}>
      <div className="flex items-center gap-2">
        <Bell size={16} style={{ color: 'var(--brand-cyan)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>Rappels automatiques (24h avant RDV)</h3>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(131,208,245,0.1)', color: 'var(--brand-cyan)' }}>
          {rappels.filter((r: any) => r.statut === 'envoye').length} envoyé(s)
        </span>
      </div>

      {rappels.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
          Aucun rappel envoyé pour l'instant. Le système vérifie automatiquement toutes les heures.
        </p>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {rappels.map((r: any) => (
            <div key={r.id} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              {r.statut === 'envoye' && <CheckCircle size={13} style={{ color: '#4ade80', flexShrink: 0 }} />}
              {r.statut === 'erreur' && <AlertCircle size={13} style={{ color: '#f87171', flexShrink: 0 }} />}
              {r.statut === 'ignore' && <MinusCircle size={13} style={{ color: 'var(--brand-text-muted)', flexShrink: 0 }} />}
              <span style={{ color: 'var(--brand-text)' }}>{r.clientNom || 'Client inconnu'}</span>
              <span style={{ color: 'var(--brand-text-muted)' }}>—</span>
              <span style={{ color: 'var(--brand-text-muted)' }}>{r.rdvDate} à {r.rdvHeure}</span>
              {r.clientEmail && <span className="ml-auto truncate max-w-32" style={{ color: 'var(--brand-text-muted)' }}>{r.clientEmail}</span>}
              {r.statut === 'erreur' && r.errorMessage && (
                <span className="ml-auto text-xs" style={{ color: '#f87171' }} title={r.errorMessage}>Erreur</span>
              )}
              {r.statut === 'ignore' && (
                <span className="ml-auto" style={{ color: 'var(--brand-text-muted)' }}>Pas d'email</span>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
        Les rappels sont envoyés automatiquement depuis <strong style={{ color: 'var(--brand-text)' }}>societe@intemporel.tech</strong> toutes les heures.
      </p>
    </div>
  );
}

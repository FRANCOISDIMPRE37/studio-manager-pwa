import { useState, useRef } from 'react';
import { Search, ArrowLeft, Trash2, Eye, X, Plus, Camera, Printer } from 'lucide-react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';

interface ArchiveDossier {
  id: number;
  nom: string;
  prenom: string;
  dateNumerisation: string;
  photos: string[];
}

export default function ArchivesNumerisees() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ArchiveDossier | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [dateVisite, setDateVisite] = useState(new Date().toLocaleDateString('fr-FR'));
  const photoRef = useRef<HTMLInputElement>(null);

  const { data: archives = [], refetch } = trpc.archives.list.useQuery();
  const createMutation = trpc.archives.create.useMutation({ onSuccess: () => refetch() });
  const deleteMutation = trpc.archives.delete.useMutation({ onSuccess: () => { refetch(); setSelected(null); } });

  const filtered = (archives as ArchiveDossier[]).filter(a =>
    (a.nom + ' ' + a.prenom).toLowerCase().includes(search.toLowerCase())
  );

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setLoadingPhotos(true);
    let loaded = 0;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const result = ev.target?.result as string;
        if (result) setPhotos(p => [...p, result]);
        loaded++;
        if (loaded === files.length) setLoadingPhotos(false);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!nom.trim() || !prenom.trim()) return;
    try {
      await createMutation.mutateAsync({
        nom: nom.trim(),
        prenom: prenom.trim(),
        dateNumerisation: new Date().toISOString().split('T')[0],
        typeDocument: '',
        praticien: '',
        periode: '',
        notes: '',
        photos: photos.map(p => p.substring(0, 500000)),
      });
      setShowForm(false);
      setNom('');
      setPrenom('');
      setPhotos([]);
      setDateVisite(new Date().toISOString().split('T')[0]);
    } catch (e: any) {
      alert('Erreur sauvegarde: ' + (e?.message || 'inconnue') + ' | taille photos: ' + photos.map(p => Math.round(p.length/1024) + 'kb').join(', '));
    }
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-navy)' }}>
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3" style={{ background: 'var(--brand-card)', borderBottom: '1px solid var(--brand-border)' }}>
        <button onClick={() => navigate('/documents')} className="p-2 rounded-lg hover:bg-white/10">
          <ArrowLeft size={20} style={{ color: 'var(--brand-text)' }} />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-700" style={{ color: '#1b5e20', fontWeight: 700 }}>📁 Archives Numérisées</h1>
          <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>{filtered.length} dossier(s)</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-600" style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', color: '#10b981', fontWeight: 600 }}>
          <Plus size={16} /> Nouveau
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-lg rounded-t-2xl p-6" style={{ background: 'var(--brand-card)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-700 text-base" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>📋 Nouveau dossier archivé</h2>
              <button onClick={() => setShowForm(false)}><X size={20} style={{ color: 'var(--brand-text-muted)' }} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--brand-text-muted)' }}>DATE DE VISITE (JJ/MM/AAAA)</label>
                <input type="text" inputMode="numeric" placeholder="JJ/MM/AAAA" value={dateVisite} onChange={e => setDateVisite(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--brand-text-muted)' }}>NOM *</label>
                <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom du client" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--brand-text-muted)' }}>PRÉNOM *</label>
                <input value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Prénom du client" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }} />
              </div>
              <div>
                <label className="text-xs mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>PHOTOS</label>
                <input ref={photoRef} type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={handlePhoto} />
                <button onClick={() => photoRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm" style={{ background: 'rgba(131,208,245,0.1)', border: '2px dashed rgba(131,208,245,0.4)', color: 'var(--brand-cyan)' }}>
                  <Camera size={18} /> 📷 Prendre / Ajouter des photos
                </button>
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {photos.map((p, i) => (
                      <div key={i} className="relative">
                        <img src={p} className="w-full h-20 object-cover rounded-lg" />
                        <button onClick={() => setPhotos(ph => ph.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ background: '#ef4444', color: '#fff' }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={handleSave} disabled={!nom.trim() || !prenom.trim() || loadingPhotos} className="w-full py-3 rounded-xl text-sm font-700 mt-2" style={{ background: (!nom.trim() || !prenom.trim()) ? '#333' : '#10b981', color: '#fff', fontWeight: 700 }}>
                {loadingPhotos ? '⏳ Chargement photo...' : '✓ Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--brand-card)', border: '1px solid var(--brand-border)' }}>
          <Search size={16} style={{ color: 'var(--brand-text-muted)' }} />
          <input type="text" placeholder="Rechercher par nom..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--brand-text)' }} />
          {search && <button onClick={() => setSearch('')}><X size={14} style={{ color: 'var(--brand-text-muted)' }} /></button>}
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--brand-text-muted)' }}>
            <p className="text-4xl mb-3">📂</p>
            <p className="text-sm">Aucun dossier archivé</p>
            <p className="text-xs mt-1">Appuyez sur "+ Nouveau" pour commencer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((a: any) => (
              <div key={a.id} className="rounded-xl p-4" style={{ background: 'var(--brand-card)', border: '1px solid var(--brand-border)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-700 text-sm" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>{a.nom} {a.prenom}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>Numérisé le {new Date(a.dateNumerisation).toLocaleDateString('fr-FR')}</p>
                    {a.photos?.length > 0 && <p className="text-xs mt-1" style={{ color: '#607D8B' }}>📷 {a.photos.length} photo(s)</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelected(a)} className="p-2 rounded-lg" style={{ background: 'rgba(96,125,139,0.2)' }}><Eye size={14} style={{ color: '#607D8B' }} /></button>
                    <button onClick={() => handleDelete(a.id)} className="p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)' }}><Trash2 size={14} style={{ color: '#ef4444' }} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto" style={{ background: 'var(--brand-card)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-700 text-base" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>{selected.nom} {selected.prenom}</h2>
              <div className="flex gap-2">
              <button onClick={() => {
                const win = window.open('', '_blank');
                if (!win) return;
                win.document.write(`<html><head><title>${selected.nom} ${selected.prenom}</title><style>body{font-family:sans-serif;padding:20px} img{max-width:100%;margin:8px 0;border-radius:8px} h1{font-size:18px} p{color:#555;font-size:14px}</style></head><body><h1>${selected.nom} ${selected.prenom}</h1><p>Numérisé le ${new Date(selected.dateNumerisation).toLocaleDateString('fr-FR')}</p>${(selected.photos||[]).map((p: string) => `<img src="${p}" />`).join('')}</body></html>`);
                win.document.close();
                win.print();
              }} className="p-2 rounded-lg" style={{ background: 'rgba(131,208,245,0.1)' }}>
                <Printer size={18} style={{ color: 'var(--brand-cyan)' }} />
              </button>
              <button onClick={() => setSelected(null)}><X size={20} style={{ color: 'var(--brand-text-muted)' }} /></button>
            </div>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--brand-text-muted)' }}>Numérisé le {new Date(selected.dateNumerisation).toLocaleDateString('fr-FR')}</p>
            {selected.photos?.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {selected.photos.map((p, i) => (
                  <img key={i} src={p} alt={`photo ${i+1}`} className="w-full rounded-lg object-cover" style={{ maxHeight: 200 }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

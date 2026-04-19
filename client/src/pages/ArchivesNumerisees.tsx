import { useState, useEffect } from 'react';
import { Search, ArrowLeft, Trash2, Eye, X } from 'lucide-react';
import { useLocation } from 'wouter';

interface ArchiveDossier {
  id: number;
  nom: string;
  prenom: string;
  dateNumerisation: string;
  typeDocument: string;
  praticien: string;
  periode: string;
  notes: string;
  photos: { id: number; url: string; nom: string; date: string }[];
  savedAt: string;
}

export default function ArchivesNumerisees() {
  const [, navigate] = useLocation();
  const [archives, setArchives] = useState<ArchiveDossier[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ArchiveDossier | null>(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('sm_archives_dossiers') || '[]');
    setArchives(stored.reverse());
  }, []);

  const filtered = archives.filter(a =>
    `${a.nom} ${a.prenom} ${a.typeDocument} ${a.praticien}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: number) => {
    const updated = archives.filter(a => a.id !== id);
    setArchives(updated);
    localStorage.setItem('sm_archives_dossiers', JSON.stringify([...updated].reverse()));
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-navy)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3" style={{ background: 'var(--brand-card)', borderBottom: '1px solid var(--brand-border)' }}>
        <button onClick={() => navigate('/documents')} className="p-2 rounded-lg hover:bg-white/10">
          <ArrowLeft size={20} style={{ color: 'var(--brand-text)' }} />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-700" style={{ color: '#1b5e20', fontWeight: 700 }}>📁 Archives Numérisées</h1>
          <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>{filtered.length} dossier(s)</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Recherche */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--brand-card)', border: '1px solid var(--brand-border)' }}>
          <Search size={16} style={{ color: 'var(--brand-text-muted)' }} />
          <input
            type="text"
            placeholder="Rechercher par nom, type de document, praticien..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--brand-text)' }}
          />
          {search && <button onClick={() => setSearch('')}><X size={14} style={{ color: 'var(--brand-text-muted)' }} /></button>}
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--brand-text-muted)' }}>
            <p className="text-4xl mb-3">📂</p>
            <p className="text-sm">Aucun dossier archivé</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(a => (
              <div key={a.id} className="rounded-xl p-4" style={{ background: 'var(--brand-card)', border: '1px solid var(--brand-border)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-700 text-sm" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>{a.nom} {a.prenom}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>{a.typeDocument} {a.periode ? `· ${a.periode}` : ''}</p>
                    <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>Numérisé le {a.dateNumerisation} {a.praticien ? `· par ${a.praticien}` : ''}</p>
                    {a.photos?.length > 0 && <p className="text-xs mt-1" style={{ color: '#607D8B' }}>📷 {a.photos.length} photo(s)</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelected(a)} className="p-2 rounded-lg" style={{ background: 'rgba(96,125,139,0.2)' }}>
                      <Eye size={14} style={{ color: '#607D8B' }} />
                    </button>
                    <button onClick={() => handleDelete(a.id)} className="p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)' }}>
                      <Trash2 size={14} style={{ color: '#ef4444' }} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal détail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto" style={{ background: 'var(--brand-card)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-700 text-base" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>{selected.nom} {selected.prenom}</h2>
              <button onClick={() => setSelected(null)}><X size={20} style={{ color: 'var(--brand-text-muted)' }} /></button>
            </div>
            <div className="space-y-2 text-sm mb-4" style={{ color: 'var(--brand-text)' }}>
              <p><strong>Type :</strong> {selected.typeDocument}</p>
              <p><strong>Période :</strong> {selected.periode}</p>
              <p><strong>Praticien :</strong> {selected.praticien}</p>
              <p><strong>Date numérisation :</strong> {selected.dateNumerisation}</p>
              {selected.notes && <p><strong>Notes :</strong> {selected.notes}</p>}
            </div>
            {selected.photos?.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {selected.photos.map((p, i) => (
                  <img key={i} src={p.url} alt={p.nom} className="w-full rounded-lg object-cover" style={{ maxHeight: 200 }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

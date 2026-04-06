import { useState, useEffect } from 'react';

export default function SuperAdmin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [studios, setStudios] = useState([]);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const res = await fetch('/api/super-admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (res.ok) {
      setIsLoggedIn(true);
      loadStudios();
    } else {
      setError('Identifiants incorrects');
    }
  };

  const loadStudios = async () => {
    const res = await fetch('/api/super-admin/studios');
    if (res.ok) {
      const data = await res.json();
      setStudios(data);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--brand-bg)' }}>
        <div className="studio-card p-8 w-96">
          <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--brand-cyan)' }}>🚀 Super Admin</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--brand-text)' }}>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }} />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--brand-text)' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }} />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" className="w-full py-3 rounded-lg font-semibold" style={{ background: 'var(--brand-cyan)', color: '#000' }}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ background: 'var(--brand-bg)' }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--brand-cyan)' }}>🚀 Console Super Admin</h1>
        <div className="flex gap-4 mb-6">
          <button onClick={() => window.location.href = '/clients'} className="px-6 py-3 rounded-lg font-semibold" style={{ background: 'var(--brand-cyan)', color: '#000' }}>
            🏠 Accéder à l'application
          </button>
          <button onClick={() => { document.cookie = 'super_admin_session=; Max-Age=0'; window.location.reload(); }} className="px-6 py-3 rounded-lg font-semibold" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }}>
            🚪 Déconnexion
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <button onClick={() => window.location.href = '/clients'} className="px-6 py-3 rounded-lg font-semibold" style={{ background: 'var(--brand-cyan)', color: '#000' }}>
            🏠 Accéder à l'application
          </button>
          <button onClick={() => { document.cookie = 'super_admin_session=; Max-Age=0'; window.location.reload(); }} className="px-6 py-3 rounded-lg font-semibold" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }}>
            🚪 Déconnexion
          </button>
        </div>

        <div className="studio-card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>📊 Statistiques</h2>
          <p style={{ color: 'var(--brand-text-muted)' }}>Total salons : {studios.length}</p>
        </div>
        <div className="studio-card p-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>📝 Liste des salons</h2>
          <div className="space-y-3">
            {studios.map((studio: any) => (
              <div key={studio.id} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--brand-text)' }}>{studio.nom}</h3>
                    <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>{studio.email}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>Slug : {studio.slug} • Créé le : {new Date(studio.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <button onClick={() => window.location.href = `mailto:${studio.email}`} className="px-4 py-2 rounded text-sm" style={{ background: 'var(--brand-cyan)', color: '#000' }}>📧 Envoyer email</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

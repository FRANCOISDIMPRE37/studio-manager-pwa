import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
export interface EmployeSession { id: number; prenom: string; nom: string; role: 'admin' | 'employe' | 'stagiaire'; loginAt: string; }
interface Ctx { employe: EmployeSession | null; setEmploye: (e: EmployeSession | null) => void; logout: () => void; isLoggedIn: boolean; }
const KEY = 'studio_employe_session';
const TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30 jours
const EmployeSessionContext = createContext<Ctx>({ employe: null, setEmploye: () => {}, logout: () => {}, isLoggedIn: false });
export function EmployeSessionProvider({ children }: { children: React.ReactNode }) {
  const [employe, setEmployeState] = useState<EmployeSession | null>(() => {
    try {
      const s = sessionStorage.getItem(KEY); if (!s) return null;
      const p: EmployeSession = JSON.parse(s);
      if (Date.now() - new Date(p.loginAt).getTime() > TIMEOUT) { sessionStorage.removeItem(KEY); return null; }
      return p;
    } catch { return null; }
  });
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const schedule = useCallback(() => {
    if (ref.current) clearTimeout(ref.current);
    ref.current = setTimeout(() => { setEmployeState(null); sessionStorage.removeItem(KEY); }, TIMEOUT);
  }, []);
  const setEmploye = useCallback((e: EmployeSession | null) => {
    if (e) { sessionStorage.setItem(KEY, JSON.stringify(e)); schedule(); }
    else { sessionStorage.removeItem(KEY); if (ref.current) clearTimeout(ref.current); }
    setEmployeState(e);
  }, [schedule]);
  const logout = useCallback(() => setEmploye(null), [setEmploye]);
  useEffect(() => { if (!employe) return; schedule(); return () => { if (ref.current) clearTimeout(ref.current); }; }, [employe, schedule]);
  return <EmployeSessionContext.Provider value={{ employe, setEmploye, logout, isLoggedIn: !!employe }}>{children}</EmployeSessionContext.Provider>;
}
export function useEmployeSession() { return useContext(EmployeSessionContext); }

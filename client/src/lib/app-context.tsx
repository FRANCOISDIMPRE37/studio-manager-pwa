import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Client, SalonInfo, DashboardStats, RGPDStatus, RendezVous, calculateRGPDStatus } from './types';
import { nanoid } from 'nanoid';

interface AppState {
  clients: Client[];
  salonInfo: SalonInfo | null;
  rendezVous: RendezVous[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemo: boolean;
}

type AppAction =
  | { type: 'SET_CLIENTS'; payload: Client[] }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: Client }
  | { type: 'DELETE_CLIENT'; payload: string }
  | { type: 'SET_SALON_INFO'; payload: SalonInfo }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_RDV'; payload: RendezVous[] }
  | { type: 'ADD_RDV'; payload: RendezVous }
  | { type: 'UPDATE_RDV'; payload: RendezVous }
  | { type: 'DELETE_RDV'; payload: string }
  | { type: 'SET_DEMO'; payload: boolean }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOAD_STATE': return { ...state, ...action.payload };
    case 'SET_CLIENTS': return { ...state, clients: action.payload };
    case 'SET_RDV': return { ...state, rendezVous: action.payload };
    case 'ADD_RDV': return { ...state, rendezVous: [...state.rendezVous, action.payload] };
    case 'UPDATE_RDV': return { ...state, rendezVous: state.rendezVous.map(r => r.id === action.payload.id ? action.payload : r) };
    case 'DELETE_RDV': return { ...state, rendezVous: state.rendezVous.filter(r => r.id !== action.payload) };
    case 'ADD_CLIENT': return { ...state, clients: [action.payload, ...state.clients] };
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(c =>
          c.id === action.payload.id
            ? { ...action.payload, rgpdStatus: calculateRGPDStatus(action.payload.dateSuppressionPrevue) }
            : c
        ),
      };
    case 'DELETE_CLIENT': return { ...state, clients: state.clients.filter(c => c.id !== action.payload) };
    case 'SET_SALON_INFO': return { ...state, salonInfo: action.payload };
    case 'SET_LOADING': return { ...state, isLoading: action.payload };
    case 'SET_AUTHENTICATED': return { ...state, isAuthenticated: action.payload };
    case 'SET_DEMO': return { ...state, isDemo: action.payload };
    default: return state;
  }
}

// Demo data
const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const daysAgo = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };
const daysFromNow = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d); };
const yearsAgo = (n: number) => { const d = new Date(today); d.setFullYear(d.getFullYear() - n); return fmt(d); };

const DEMO_SALON: SalonInfo = {
  nom: 'Ink & Soul Studio',
  raisonSociale: 'SARL INK & SOUL',
  adresse: '14 rue des Arts',
  codePostal: '75011',
  ville: 'Paris',
  telephone: '01 42 00 11 22',
  email: 'contact@inkandsoul.fr',
  siret: '123 456 789 00012',
  nomPierceur: 'Léa Moreau',
  nomTatoueur: 'Maxime Durand',
  nomDermographe: 'Sophie Laurent',
};

const DEMO_CLIENTS: Client[] = [
  {
    id: 'demo-1', nom: 'MARTIN', prenom: 'Sophie', dateNaissance: yearsAgo(28),
    adresse: '23 avenue Victor Hugo', codePostal: '75016', ville: 'Paris',
    telephone: '06 12 34 56 78', email: 'sophie.martin@email.fr',
    pieceIdentiteType: 'CNI', pieceIdentiteNumero: 'FR1234567',
    estMineur: false,
    prestations: [{ id: 'p1', type: 'piercing', zone: 'Oreille (hélix)', date: daysAgo(45), description: 'Hélix droit, bijou titane 1.2mm — 45€', documents: [], photos: [] }],
    documentsAssocies: ['questionnaire_majeur', 'soins_oreilles'],
    documents: [{ id: 'd1', type: 'questionnaire_majeur', status: 'signed', dateCreation: daysAgo(45), dateSigned: daysAgo(45), data: {} }],
    photos: [], dateCreation: daysAgo(45), dateConsentement: daysAgo(45),
    dateSuppressionPrevue: daysFromNow(365 * 5 - 45), rgpdStatus: 'ok', rgpdDroitsExerces: [], estArchive: false,
  },
  {
    id: 'demo-2', nom: 'DUPONT', prenom: 'Lucas', dateNaissance: yearsAgo(22),
    adresse: '8 rue de la Paix', codePostal: '69001', ville: 'Lyon',
    telephone: '07 23 45 67 89', email: 'lucas.dupont@email.fr',
    estMineur: false,
    prestations: [{ id: 'p2', type: 'tatouage', zone: 'Avant-bras gauche', date: daysAgo(120), description: 'Mandala géométrique — 180€', documents: [], photos: [] }],
    documentsAssocies: ['cicatrisation_tatouage'],
    documents: [{ id: 'd2', type: 'cicatrisation_tatouage', status: 'signed', dateCreation: daysAgo(120), dateSigned: daysAgo(120), data: {} }],
    photos: [], dateCreation: daysAgo(120), dateConsentement: daysAgo(120),
    dateSuppressionPrevue: daysFromNow(365 * 5 - 120), rgpdStatus: 'ok', rgpdDroitsExerces: [], estArchive: false,
  },
  {
    id: 'demo-3', nom: 'BERNARD', prenom: 'Emma', dateNaissance: yearsAgo(16),
    adresse: '5 place du Capitole', codePostal: '31000', ville: 'Toulouse',
    telephone: '06 34 56 78 90',
    estMineur: true,
    prestations: [{ id: 'p3', type: 'piercing', zone: 'Lobe oreille', date: daysAgo(10), description: 'Lobe droit, boucle dorée — 30€', documents: [], photos: [] }],
    documentsAssocies: ['questionnaire_mineur', 'autorisation_parentale'],
    documents: [
      { id: 'd3', type: 'questionnaire_mineur', status: 'signed', dateCreation: daysAgo(10), dateSigned: daysAgo(10), data: {} },
      { id: 'd4', type: 'autorisation_parentale', status: 'signed', dateCreation: daysAgo(10), dateSigned: daysAgo(10), data: {} },
    ],
    photos: [], dateCreation: daysAgo(10), dateConsentement: daysAgo(10),
    dateSuppressionPrevue: daysFromNow(365 * 5 - 10), rgpdStatus: 'ok', rgpdDroitsExerces: [], estArchive: false,
  },
  {
    id: 'demo-4', nom: 'LEROY', prenom: 'Thomas', dateNaissance: yearsAgo(35),
    adresse: '12 boulevard Haussmann', codePostal: '75009', ville: 'Paris',
    telephone: '06 45 67 89 01',
    estMineur: false,
    prestations: [{ id: 'p4', type: 'dermographie', zone: 'Sourcils', date: daysAgo(200), description: 'Microblading sourcils — 250€', documents: [], photos: [] }],
    documentsAssocies: ['cicatrisation_dermographie'],
    documents: [{ id: 'd5', type: 'cicatrisation_dermographie', status: 'filled', dateCreation: daysAgo(200), data: {} }],
    photos: [], dateCreation: daysAgo(200), dateConsentement: daysAgo(200),
    dateSuppressionPrevue: daysFromNow(365 * 5 - 200), rgpdStatus: 'warning', rgpdDroitsExerces: [], estArchive: false,
  },
  {
    id: 'demo-5', nom: 'PETIT', prenom: 'Chloé', dateNaissance: yearsAgo(29),
    adresse: '3 rue Sainte-Catherine', codePostal: '33000', ville: 'Bordeaux',
    telephone: '07 56 78 90 12',
    estMineur: false,
    prestations: [],
    documentsAssocies: [],
    documents: [],
    photos: [], dateCreation: daysAgo(1800),
    dateSuppressionPrevue: daysFromNow(25), rgpdStatus: 'urgent', rgpdDroitsExerces: [], estArchive: false,
  },
];

const DEMO_RDV: RendezVous[] = [
  { id: 'rdv-1', date: fmt(today), heureDebut: '10:00', heureFin: '11:00', clientId: 'demo-1', clientNom: 'Sophie MARTIN', type: 'piercing', zone: 'Narine', statut: 'confirme', dateCreation: daysAgo(3) },
  { id: 'rdv-2', date: fmt(today), heureDebut: '14:00', heureFin: '16:00', clientId: 'demo-2', clientNom: 'Lucas DUPONT', type: 'tatouage', zone: 'Épaule', statut: 'en_attente', dateCreation: daysAgo(1) },
  { id: 'rdv-3', date: daysFromNow(1), heureDebut: '09:30', heureFin: '10:30', clientNom: 'Marie GARCIA', type: 'consultation', statut: 'confirme', dateCreation: daysAgo(2) },
  { id: 'rdv-4', date: daysFromNow(2), heureDebut: '11:00', heureFin: '12:00', clientId: 'demo-3', clientNom: 'Emma BERNARD', type: 'piercing', zone: 'Hélix', statut: 'confirme', dateCreation: daysAgo(1) },
];

// Storage keys
const STORAGE_KEYS = {
  clients: 'sm_clients',
  salonInfo: 'sm_salon_info',
  rdv: 'sm_rdv',
  auth: 'sm_auth',
  pin: 'sm_pin',
};

function loadFromStorage<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function saveToStorage(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* ignore */ }
}

interface AppContextValue {
  state: AppState;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  addRDV: (rdv: Omit<RendezVous, 'id' | 'dateCreation'>) => void;
  updateRDV: (rdv: RendezVous) => void;
  deleteRDV: (id: string) => void;
  addClient: (client: Omit<Client, 'id' | 'dateCreation' | 'rgpdStatus'>) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  updateSalonInfo: (info: SalonInfo) => void;
  setAuthenticated: (val: boolean) => void;
  getDashboardStats: () => DashboardStats;
  getClientById: (id: string) => Client | undefined;
  searchClients: (query: string) => Client[];
  verifyPin: (pin: string) => boolean;
  setPin: (pin: string) => void;
  hasPin: () => boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, {
    clients: [],
    salonInfo: null,
    rendezVous: [],
    isLoading: true,
    isAuthenticated: false,
    isDemo: false,
  });

  // Load from localStorage on mount
  useEffect(() => {
    const clients = loadFromStorage<Client[]>(STORAGE_KEYS.clients) || [];
    const salonInfo = loadFromStorage<SalonInfo>(STORAGE_KEYS.salonInfo);
    const rdv = loadFromStorage<RendezVous[]>(STORAGE_KEYS.rdv) || [];
    const isAuthenticated = loadFromStorage<boolean>(STORAGE_KEYS.auth) || false;

    // Update RGPD statuses
    const updatedClients = clients.map(c => ({
      ...c,
      rgpdStatus: calculateRGPDStatus(c.dateSuppressionPrevue) as RGPDStatus,
    }));

    dispatch({ type: 'LOAD_STATE', payload: { clients: updatedClients, salonInfo, rendezVous: rdv, isAuthenticated, isLoading: false } });
  }, []);

  // Persist clients
  useEffect(() => {
    if (!state.isLoading && !state.isDemo) {
      saveToStorage(STORAGE_KEYS.clients, state.clients);
    }
  }, [state.clients, state.isLoading, state.isDemo]);

  // Persist RDV
  useEffect(() => {
    if (!state.isLoading && !state.isDemo) {
      saveToStorage(STORAGE_KEYS.rdv, state.rendezVous);
    }
  }, [state.rendezVous, state.isLoading, state.isDemo]);

  // Persist salon info
  useEffect(() => {
    if (state.salonInfo && !state.isDemo) {
      saveToStorage(STORAGE_KEYS.salonInfo, state.salonInfo);
    }
  }, [state.salonInfo, state.isDemo]);

  const enterDemoMode = useCallback(() => {
    dispatch({ type: 'SET_DEMO', payload: true });
    dispatch({ type: 'SET_CLIENTS', payload: DEMO_CLIENTS });
    dispatch({ type: 'SET_RDV', payload: DEMO_RDV });
    dispatch({ type: 'SET_SALON_INFO', payload: DEMO_SALON });
    dispatch({ type: 'SET_AUTHENTICATED', payload: true });
  }, []);

  const exitDemoMode = useCallback(() => {
    dispatch({ type: 'SET_DEMO', payload: false });
    const clients = loadFromStorage<Client[]>(STORAGE_KEYS.clients) || [];
    const salonInfo = loadFromStorage<SalonInfo>(STORAGE_KEYS.salonInfo);
    const rdv = loadFromStorage<RendezVous[]>(STORAGE_KEYS.rdv) || [];
    dispatch({ type: 'SET_CLIENTS', payload: clients });
    dispatch({ type: 'SET_RDV', payload: rdv });
    if (salonInfo) dispatch({ type: 'SET_SALON_INFO', payload: salonInfo });
    dispatch({ type: 'SET_AUTHENTICATED', payload: false });
  }, []);

  const addRDV = useCallback((rdv: Omit<RendezVous, 'id' | 'dateCreation'>) => {
    const newRDV: RendezVous = { ...rdv, id: nanoid(), dateCreation: fmt(new Date()) };
    dispatch({ type: 'ADD_RDV', payload: newRDV });
  }, []);

  const updateRDV = useCallback((rdv: RendezVous) => {
    dispatch({ type: 'UPDATE_RDV', payload: rdv });
  }, []);

  const deleteRDV = useCallback((id: string) => {
    dispatch({ type: 'DELETE_RDV', payload: id });
  }, []);

  const addClient = useCallback((client: Omit<Client, 'id' | 'dateCreation' | 'rgpdStatus'>) => {
    const dateCreation = fmt(new Date());
    const dateSuppressionPrevue = (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 5);
      return fmt(d);
    })();
    const newClient: Client = {
      ...client,
      id: nanoid(),
      dateCreation,
      dateSuppressionPrevue: client.dateSuppressionPrevue || dateSuppressionPrevue,
      rgpdStatus: 'ok',
    };
    dispatch({ type: 'ADD_CLIENT', payload: newClient });
  }, []);

  const updateClient = useCallback((client: Client) => {
    dispatch({ type: 'UPDATE_CLIENT', payload: client });
  }, []);

  const deleteClient = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CLIENT', payload: id });
  }, []);

  const updateSalonInfo = useCallback((info: SalonInfo) => {
    dispatch({ type: 'SET_SALON_INFO', payload: info });
  }, []);

  const setAuthenticated = useCallback((val: boolean) => {
    dispatch({ type: 'SET_AUTHENTICATED', payload: val });
    saveToStorage(STORAGE_KEYS.auth, val);
  }, []);

  const getDashboardStats = useCallback((): DashboardStats => {
    const actifs = state.clients.filter(c => !c.estArchive);
    return {
      totalClients: state.clients.length,
      clientsActifs: actifs.length,
      clientsMineurs: actifs.filter(c => c.estMineur).length,
      clientsArchives: state.clients.filter(c => c.estArchive).length,
      alertesRGPD: actifs.filter(c => c.rgpdStatus === 'warning' || c.rgpdStatus === 'urgent').length,
      alertesUrgentes: actifs.filter(c => c.rgpdStatus === 'urgent' || c.rgpdStatus === 'expired').length,
    };
  }, [state.clients]);

  const getClientById = useCallback((id: string) => {
    return state.clients.find(c => c.id === id);
  }, [state.clients]);

  const searchClients = useCallback((query: string) => {
    const q = query.toLowerCase();
    return state.clients.filter(c =>
      (c.nom + ' ' + c.prenom).toLowerCase().includes(q) ||
      c.telephone.includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  }, [state.clients]);

  const verifyPin = useCallback((pin: string) => {
    const stored = localStorage.getItem(STORAGE_KEYS.pin);
    return stored === pin;
  }, []);

  const setPin = useCallback((pin: string) => {
    localStorage.setItem(STORAGE_KEYS.pin, pin);
  }, []);

  const hasPin = useCallback(() => {
    return !!localStorage.getItem(STORAGE_KEYS.pin);
  }, []);

  return (
    <AppContext.Provider value={{
      state, enterDemoMode, exitDemoMode,
      addRDV, updateRDV, deleteRDV,
      addClient, updateClient, deleteClient,
      updateSalonInfo, setAuthenticated,
      getDashboardStats, getClientById, searchClients,
      verifyPin, setPin, hasPin,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

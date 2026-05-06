import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Client, SalonInfo, DashboardStats, RGPDStatus, RendezVous, Prestation, ClientDocument, calculateRGPDStatus } from './types';
import { nanoid } from 'nanoid';
import { trpc } from './trpc';
import { useEmployeSession } from '@/contexts/EmployeSessionContext';

interface AppState {
  clients: Client[];
  salonInfo: SalonInfo | null;
  rendezVous: RendezVous[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemo: boolean;
  isSyncing: boolean;
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
  | { type: 'SET_SYNCING'; payload: boolean }
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
    case 'SET_SYNCING': return { ...state, isSyncing: action.payload };
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
    documentsAssocies: ['questionnaire_tatouage_majeur'],
    documents: [{ id: 'd2', type: 'questionnaire_tatouage_majeur', status: 'signed', dateCreation: daysAgo(120), dateSigned: daysAgo(120), data: {} }],
    photos: [], dateCreation: daysAgo(120), dateConsentement: daysAgo(120),
    dateSuppressionPrevue: daysFromNow(365 * 5 - 120), rgpdStatus: 'ok', rgpdDroitsExerces: [], estArchive: false,
  },
  {
    id: 'demo-3', nom: 'BERNARD', prenom: 'Emma', dateNaissance: yearsAgo(16),
    adresse: '5 place du Capitole', codePostal: '31000', ville: 'Toulouse',
    telephone: '06 34 56 78 90',
    estMineur: true,
    prestations: [{ id: 'p3', type: 'piercing', zone: 'Lobe oreille', date: daysAgo(10), description: 'Lobe droit, boucle dorée — 30€', documents: [], photos: [] }],
    documentsAssocies: ['questionnaire_mineur'],
    documents: [
      { id: 'd3', type: 'questionnaire_mineur', status: 'signed', dateCreation: daysAgo(10), dateSigned: daysAgo(10), data: {} },
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
    documentsAssocies: ['questionnaire_tatouage_majeur'],
    documents: [{ id: 'd5', type: 'questionnaire_tatouage_majeur', status: 'filled', dateCreation: daysAgo(200), data: {} }],
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

// Toutes les données sont chargées depuis le serveur OVH (BDD MySQL)
// Aucun localStorage n'est utilisé dans cette application

// Helper: convert DB client row to Client type
function dbClientToClient(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    nom: row.nom as string,
    prenom: row.prenom as string,
    dateNaissance: row.dateNaissance as string,
    adresse: (row.adresse as string) || '',
    codePostal: (row.codePostal as string) || '',
    ville: (row.ville as string) || '',
    telephone: row.telephone as string,
    email: row.email as string | undefined,
    pieceIdentiteType: row.pieceIdentiteType as Client['pieceIdentiteType'],
    pieceIdentiteNumero: row.pieceIdentiteNumero as string | undefined,
    estMineur: Boolean(row.estMineur),
    estArchive: Boolean(row.estArchive),
    dateArchivage: row.dateArchivage as string | undefined,
    dateConsentement: row.dateConsentement as string | undefined,
    dateSuppressionPrevue: row.dateSuppressionPrevue as string,
    rgpdStatus: calculateRGPDStatus(row.dateSuppressionPrevue as string),
    rgpdDroitsExerces: (row.rgpdDroitsExerces as Client['rgpdDroitsExerces']) || [],
    dateCreation: row.createdAt ? new Date(row.createdAt as string).toISOString().split('T')[0] : fmt(new Date()),
    dateModification: row.updatedAt ? new Date(row.updatedAt as string).toISOString().split('T')[0] : undefined,
    prestations: [],
    documentsAssocies: [],
    documents: [],
    photos: [],
  };
}

// Helper: convert DB RDV row to RendezVous type
function dbRDVToRDV(row: Record<string, unknown>): RendezVous {
  return {
    id: row.id as string,
    date: row.date as string,
    heureDebut: row.heureDebut as string,
    heureFin: row.heureFin as string,
    clientId: row.clientId as string | undefined,
    clientNom: row.clientNom as string | undefined,
    clientTelephone: row.clientTelephone as string | undefined,
    type: row.type as RendezVous['type'],
    zone: row.zone as string | undefined,
    notes: row.notes as string | undefined,
    statut: row.statut as RendezVous['statut'],
    dateCreation: row.createdAt ? new Date(row.createdAt as string).toISOString().split('T')[0] : fmt(new Date()),
  };
}

interface AppContextValue {
  state: AppState;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  addRDV: (rdv: Omit<RendezVous, 'id' | 'dateCreation'>) => Promise<void>;
  updateRDV: (rdv: RendezVous) => Promise<void>;
  deleteRDV: (id: string) => Promise<void>;
  addClient: (client: Omit<Client, 'id' | 'dateCreation' | 'rgpdStatus'>) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  updateSalonInfo: (info: SalonInfo) => Promise<void>;
  setAuthenticated: (val: boolean) => void;
  getDashboardStats: () => DashboardStats;
  getClientById: (id: string) => Client | undefined;
  searchClients: (query: string) => Client[];
  verifyPin: (pin: string) => boolean;
  setPin: (pin: string) => void;
  hasPin: () => boolean;
  syncFromCloud: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

// Inner component that has access to tRPC hooks
function AppProviderInner({ children, dispatch, state }: {
  children: React.ReactNode;
  dispatch: React.Dispatch<AppAction>;
  state: AppState;
}) {
  const utils = trpc.useUtils();
  const { employe: employeeSession } = useEmployeSession();

  // tRPC mutations
  const createClientMutation = trpc.clients.create.useMutation();
  const updateClientMutation = trpc.clients.update.useMutation();
  const deleteClientMutation = trpc.clients.delete.useMutation();
  const createRDVMutation = trpc.rdv.create.useMutation();
  const updateRDVMutation = trpc.rdv.update.useMutation();
  const deleteRDVMutation = trpc.rdv.delete.useMutation();
  const updateSalonMutation = trpc.salon.update.useMutation();
  const createDocumentMutation = trpc.documents.create.useMutation();
  const updateDocumentMutation = trpc.documents.update.useMutation();

  // Sync from cloud
  const syncFromCloud = useCallback(async () => {
    if (state.isDemo) return;
    try {
      dispatch({ type: 'SET_SYNCING', payload: true });
      const [dbClients, dbRDV, dbSalon, dbPrestations, dbDocuments] = await Promise.all([
        utils.clients.list.fetch(employeeSession ? { employeeId: employeeSession.id } : undefined),
        utils.rdv.list.fetch(),
        utils.salon.get.fetch(),
        utils.prestations.listAll.fetch(),
        utils.documents.listAll.fetch(),
      ]);

      const clients = (dbClients as Record<string, unknown>[]).map(dbClientToClient);
      const rdv = (dbRDV as Record<string, unknown>[]).map(dbRDVToRDV);

      // Group prestations and documents by clientId
      const prestationsByClient = new Map<string, Prestation[]>();
      for (const p of (dbPrestations as Record<string, unknown>[]) ) {
        const clientId = p.clientId as string;
        if (!prestationsByClient.has(clientId)) prestationsByClient.set(clientId, []);
        prestationsByClient.get(clientId)!.push({
          id: p.id as string,
          date: p.date as string,
          type: p.type as Prestation['type'],
          zone: p.zone as string,
          description: p.description as string | undefined,
          documents: [],
          photos: (p.photos as string[]) || [],
        });
      }

      const documentsByClient = new Map<string, ClientDocument[]>();
      for (const d of (dbDocuments as Record<string, unknown>[]) ) {
        const clientId = d.clientId as string;
        if (!documentsByClient.has(clientId)) documentsByClient.set(clientId, []);
        documentsByClient.get(clientId)!.push({
          id: d.id as string,
          type: d.type as ClientDocument['type'],
          status: d.status as ClientDocument['status'],
          data: (d.data as Record<string, unknown>) || {},
          signatureClient: d.signatureClient as string | undefined,
          signatureProfessionnel: d.signatureProfessionnel as string | undefined,
          signatureRepresentant: d.signatureRepresentant as string | undefined,
          dateCreation: d.createdAt ? new Date(d.createdAt as string).toISOString().split('T')[0] : fmt(new Date()),
          dateSigned: d.dateSigned as string | undefined,
        });
      }

      // Données exclusivement depuis le serveur OVH — aucun merge localStorage
      const mergedClients = clients.map(dbC => {
        const dbPrestList = prestationsByClient.get(dbC.id) || [];
        const dbDocList = documentsByClient.get(dbC.id) || [];

        return {
          ...dbC,
          prestations: dbPrestList,
          documentsAssocies: dbDocList.map(d => d.type) as Client['documentsAssocies'],
          documents: dbDocList,
          photos: [],
        };
      });

      dispatch({ type: 'SET_CLIENTS', payload: mergedClients });
      dispatch({ type: 'SET_RDV', payload: rdv });

      if (dbSalon) {
        const salonInfo: SalonInfo = {
          nom: (dbSalon as Record<string, unknown>).nom as string || '',
          raisonSociale: (dbSalon as Record<string, unknown>).raisonSociale as string | undefined,
          adresse: (dbSalon as Record<string, unknown>).adresse as string || '',
          codePostal: (dbSalon as Record<string, unknown>).codePostal as string || '',
          ville: (dbSalon as Record<string, unknown>).ville as string || '',
          telephone: (dbSalon as Record<string, unknown>).telephone as string || '',
          email: (dbSalon as Record<string, unknown>).email as string || '',
          siret: (dbSalon as Record<string, unknown>).siret as string || '',
          nomPierceur: (dbSalon as Record<string, unknown>).nomPierceur as string || '',
          nomTatoueur: (dbSalon as Record<string, unknown>).nomTatoueur as string | undefined,
          nomDermographe: (dbSalon as Record<string, unknown>).nomDermographe as string | undefined,
        };
        // Charger les spécialités depuis le serveur
        try {
          const studioInfoRes = await fetch('/api/studio-info', { credentials: 'include' });
          if (studioInfoRes.ok) {
            const studioInfo = await studioInfoRes.json();
            const specs = (studioInfo.specialites || '').split(',');
              salonInfo.specialites = {
                piercing: specs.includes('piercing'),
                tatouage: specs.includes('tatouage'),
                dermographie: specs.includes('dermographie'),
              };
          }
        } catch {}
        dispatch({ type: 'SET_SALON_INFO', payload: salonInfo });
      }

      console.info(`[Sync] ✅ Synced: ${clients.length} clients, ${(dbPrestations as unknown[]).length} prestations, ${(dbDocuments as unknown[]).length} documents`);
    } catch (err) {
      console.warn('[Sync] Cloud sync failed, using local data:', err);
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  }, [state.isDemo, utils]);

  const enterDemoMode = useCallback(() => {
    dispatch({ type: 'SET_DEMO', payload: true });
    dispatch({ type: 'SET_CLIENTS', payload: DEMO_CLIENTS });
    dispatch({ type: 'SET_RDV', payload: DEMO_RDV });
    dispatch({ type: 'SET_SALON_INFO', payload: DEMO_SALON });
    dispatch({ type: 'SET_AUTHENTICATED', payload: true });
  }, []);

  const exitDemoMode = useCallback(() => {
    dispatch({ type: 'SET_DEMO', payload: false });
    dispatch({ type: 'SET_CLIENTS', payload: [] });
    dispatch({ type: 'SET_RDV', payload: [] });
    dispatch({ type: 'SET_AUTHENTICATED', payload: false });
    // Les données seront rechargées depuis le serveur OVH au prochain syncFromCloud
  }, []);

  const addRDV = useCallback(async (rdv: Omit<RendezVous, 'id' | 'dateCreation'>) => {
    const newRDV: RendezVous = { ...rdv, id: nanoid(), dateCreation: fmt(new Date()) };
    dispatch({ type: 'ADD_RDV', payload: newRDV });
    if (!state.isDemo) {
      try {
        await createRDVMutation.mutateAsync({ ...newRDV });
      } catch (err) {
        console.warn('[Sync] RDV create failed:', err);
      }
    }
  }, [state.isDemo, createRDVMutation]);

  const updateRDV = useCallback(async (rdv: RendezVous) => {
    dispatch({ type: 'UPDATE_RDV', payload: rdv });
    if (!state.isDemo) {
      try {
        await updateRDVMutation.mutateAsync({ ...rdv });
      } catch (err) {
        console.warn('[Sync] RDV update failed:', err);
      }
    }
  }, [state.isDemo, updateRDVMutation]);

  const deleteRDV = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_RDV', payload: id });
    if (!state.isDemo) {
      try {
        await deleteRDVMutation.mutateAsync({ id });
      } catch (err) {
        console.warn('[Sync] RDV delete failed:', err);
      }
    }
  }, [state.isDemo, deleteRDVMutation]);

  const addClient = useCallback(async (client: Omit<Client, 'id' | 'dateCreation' | 'rgpdStatus'>) => {
    const dateCreation = fmt(new Date());
    const dateSuppressionPrevue = (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 5);
      return fmt(d);
    })();
    // Générer un numéro de client unique basé sur le nombre de clients existants
    const nextNum = (state.clients.length || 0) + 1;
    const numeroClient = `CLI-${String(nextNum).padStart(4, '0')}`;
    const newClient: Client = {
      ...client,
      id: nanoid(),
      numeroClient,
      dateCreation,
      dateSuppressionPrevue: client.dateSuppressionPrevue || dateSuppressionPrevue,
      rgpdStatus: 'ok',
    };
    dispatch({ type: 'ADD_CLIENT', payload: newClient });
    if (!state.isDemo) {
      try {
        await createClientMutation.mutateAsync({
          id: newClient.id,
          nom: newClient.nom,
          prenom: newClient.prenom,
          dateNaissance: newClient.dateNaissance,
          adresse: newClient.adresse,
          codePostal: newClient.codePostal,
          ville: newClient.ville,
          telephone: newClient.telephone,
          email: newClient.email,
          pieceIdentiteType: newClient.pieceIdentiteType,
          pieceIdentiteNumero: newClient.pieceIdentiteNumero,
          estMineur: newClient.estMineur,
          estArchive: newClient.estArchive,
          estSalarie: newClient.estSalarie ?? false,
          dateArchivage: newClient.dateArchivage,
          dateConsentement: newClient.dateConsentement,
          dateSuppressionPrevue: newClient.dateSuppressionPrevue,
          rgpdDroitsExerces: newClient.rgpdDroitsExerces || [],
          employeeId: employeeSession?.id || undefined,
        });
      } catch (err) {
        console.warn('[Sync] Client create failed:', err);
      }
      
      // Créer les documents associés sur le serveur
      if (newClient.documentsAssocies && newClient.documentsAssocies.length > 0) {
        for (const docType of newClient.documentsAssocies) {
          try {
            await createDocumentMutation.mutateAsync({
              id: `doc-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
              clientId: newClient.id,
              type: docType,
              status: 'empty',
              data: {},
            });
          } catch (err) {
            console.error('[Sync] Document create failed:', err);
          }
        }
      }
    }
  }, [state.isDemo, createClientMutation, createDocumentMutation]);

  const updateClient = useCallback(async (client: Client) => {
    dispatch({ type: 'UPDATE_CLIENT', payload: client });
    if (!state.isDemo) {
      try {
        await updateClientMutation.mutateAsync({
          id: client.id,
          nom: client.nom,
          prenom: client.prenom,
          dateNaissance: client.dateNaissance,
          adresse: client.adresse,
          codePostal: client.codePostal,
          ville: client.ville,
          telephone: client.telephone,
          email: client.email,
          pieceIdentiteType: client.pieceIdentiteType,
          pieceIdentiteNumero: client.pieceIdentiteNumero,
          estMineur: client.estMineur,
          estArchive: client.estArchive,
          dateArchivage: client.dateArchivage,
          dateConsentement: client.dateConsentement,
          dateSuppressionPrevue: client.dateSuppressionPrevue,
          rgpdDroitsExerces: client.rgpdDroitsExerces || [],
        });
      } catch (err) {
        console.warn('[Sync] Client update failed:', err);
      }
    }
  }, [state.isDemo, updateClientMutation]);

  const deleteClient = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_CLIENT', payload: id });
    if (!state.isDemo) {
      try {
        await deleteClientMutation.mutateAsync({ id });
      } catch (err) {
        console.warn('[Sync] Client delete failed:', err);
      }
    }
  }, [state.isDemo, deleteClientMutation]);

  const updateSalonInfo = useCallback(async (info: SalonInfo) => {
    dispatch({ type: 'SET_SALON_INFO', payload: info });
    if (!state.isDemo) {
      try {
        await updateSalonMutation.mutateAsync({
          nom: info.nom,
          raisonSociale: info.raisonSociale,
          adresse: info.adresse,
          codePostal: info.codePostal,
          ville: info.ville,
          telephone: info.telephone,
          email: info.email,
          siret: info.siret,
          nomPierceur: info.nomPierceur,
          nomTatoueur: info.nomTatoueur,
          nomDermographe: info.nomDermographe,
        });
      } catch (err) {
        console.warn('[Sync] Salon update failed:', err);
      }
    }
  }, [state.isDemo, updateSalonMutation]);

  // Sync automatique depuis le serveur OVH au démarrage dès que l'utilisateur est authentifié
  useEffect(() => {
    if (state.isAuthenticated && !state.isDemo && !state.isLoading) {
      syncFromCloud();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated, state.isLoading]);

  const setAuthenticated = useCallback((val: boolean) => {
    dispatch({ type: 'SET_AUTHENTICATED', payload: val });
    // Sync from cloud when authenticated
    if (val && !state.isDemo) {
      setTimeout(() => syncFromCloud(), 100);
    }
  }, [state.isDemo, syncFromCloud]);

  // Archivage automatique RGPD à 3 ans
  useEffect(() => {
    if (!state.isAuthenticated || state.clients.length === 0) return;
    const now = new Date();
    const clientsAArchiver = state.clients.filter(c => {
      if (c.estArchive) return false;
      const dateCreation = new Date(c.dateCreation);
      const dateArchivageAuto = new Date(dateCreation);
      dateArchivageAuto.setFullYear(dateArchivageAuto.getFullYear() + 3);
      return now >= dateArchivageAuto;
    });
    if (clientsAArchiver.length === 0) return;
    clientsAArchiver.forEach(c => {
      const clientArchive: Client = {
        ...c,
        estArchive: true,
        dateArchivage: now.toISOString().split('T')[0],
        // Anonymisation des données personnelles après 3 ans
        telephone: 'Anonymisé',
        adresse: '',
        codePostal: '',
        ville: '',
        notes: c.notes ? '[Archivé automatiquement après 3 ans]' : undefined,
      };
      updateClient(clientArchive);
    });
    if (clientsAArchiver.length > 0) {
      console.info(`[RGPD] ${clientsAArchiver.length} client(s) archivé(s) automatiquement (délai 3 ans dépassé)`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated, state.clients.length]);

  const getDashboardStats = useCallback((): DashboardStats => {
    const actifs = state.clients.filter(c => !c.estArchive);
    return {
      totalClients: state.clients.length,
      clientsActifs: actifs.length,
      clientsMajeurs: actifs.filter(c => !c.estMineur).length,
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
  const hashPin = async (pin: string): Promise<string> => { const data = new TextEncoder().encode("sm_salt_2026_" + pin); const buf = await crypto.subtle.digest("SHA-256", data); return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join(""); };
  // PIN géré côté serveur OVH (salon_settings.pinHash) — aucun localStorage
  const verifyPin = useCallback((_pin: string) => false, []);
  const setPin = useCallback((_pin: string) => {}, []);
  const hasPin = useCallback(() => false, []);

  return (
    <AppContext.Provider value={{
      state, enterDemoMode, exitDemoMode,
      addRDV, updateRDV, deleteRDV,
      addClient, updateClient, deleteClient,
      updateSalonInfo, setAuthenticated,
      getDashboardStats, getClientById, searchClients,
      verifyPin, setPin, hasPin, syncFromCloud,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, {
    clients: [],
    salonInfo: null,
    rendezVous: [],
    isLoading: true,
    isAuthenticated: false,
    isDemo: false,
    isSyncing: false,
  });

  // Chargement initial depuis le serveur OVH uniquement (aucun localStorage)
  useEffect(() => {
    fetch('/api/studio-info', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const isAuthenticated = !!data;
        dispatch({ type: 'LOAD_STATE', payload: { isAuthenticated, isLoading: false } });
      })
      .catch(() => {
        dispatch({ type: 'LOAD_STATE', payload: { isLoading: false } });
      });
  }, []);

  return (
    <AppProviderInner dispatch={dispatch} state={state}>
      {children}
    </AppProviderInner>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

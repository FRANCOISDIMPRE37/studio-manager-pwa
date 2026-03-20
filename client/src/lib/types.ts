// Types de prestations
export type PrestationType = 'piercing' | 'tatouage' | 'dermographie';

// Statut RGPD
export type RGPDStatus = 'ok' | 'warning' | 'urgent' | 'expired';

// Statut d'un document
export type DocumentStatus = 'empty' | 'filled' | 'signed';

// Droits RGPD exercés
export interface RGPDRight {
  type: 'acces' | 'rectification' | 'effacement' | 'opposition';
  date: string;
  note?: string;
}

// Types de documents
export type DocumentType =
  | 'questionnaire_mineur'
  | 'autorisation_parentale'
  | 'questionnaire_majeur'
  | 'fiche_seance_piercing'
  | 'soins_oreilles'
  | 'soins_nez'
  | 'soins_bouche_levres'
  | 'soins_nombril'
  | 'soins_mamelons'
  | 'soins_arcade_sourcil'
  | 'soins_surface_dermal'
  | 'questionnaire_tatouage_majeur'
  | 'questionnaire_dermographe'
  | 'consentement_soins_tatouage'
  | 'soins_dermographe'
  | 'engagement_confidentialite'
  | 'affichage_salon'
  | 'fiche_seance_tatouage'
;

// Document rempli
export interface ClientDocument {
  id: string;
  type: DocumentType;
  status: DocumentStatus;
  data: Record<string, unknown>;
  signatureClient?: string;
  signatureProfessionnel?: string;
  signatureRepresentant?: string;
  dateCreation: string;
  dateSigned?: string;
}

// Prestation
export interface Prestation {
  id: string;
  date: string;
  type: PrestationType;
  zone: string;
  description?: string;
  documents: string[];
  photos: string[];
}

// Client principal
export interface Client {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  email?: string;
  pieceIdentiteType?: 'CNI' | 'Passeport' | 'Permis' | 'Autre';
  pieceIdentiteNumero?: string;
  estMineur: boolean;
  prestations: Prestation[];
  documentsAssocies: DocumentType[];
  documents: ClientDocument[];
  photos: { id: string; uri: string; date: string; label?: string }[];
  dateCreation: string;
  dateConsentement?: string;
  dateSuppressionPrevue: string;
  rgpdStatus: RGPDStatus;
  rgpdDroitsExerces: RGPDRight[];
  estArchive: boolean;
  dateArchivage?: string;
  dateModification?: string;
}

// Informations du salon
export interface SalonInfo {
  nom: string;
  raisonSociale?: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  email: string;
  siret: string;
  nomPierceur: string;
  nomTatoueur?: string;
  nomDermographe?: string;
}

// Statistiques du tableau de bord
export interface DashboardStats {
  totalClients: number;
  clientsActifs: number;
  clientsMineurs: number;
  clientsArchives: number;
  alertesRGPD: number;
  alertesUrgentes: number;
}

// Rendez-vous
export type RDVStatut = 'confirme' | 'en_attente' | 'annule' | 'termine';
export type RDVType = 'piercing' | 'tatouage' | 'dermographie' | 'consultation' | 'retouche' | 'autre';

export interface RendezVous {
  id: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  clientId?: string;
  clientNom?: string;
  clientTelephone?: string;
  type: RDVType;
  zone?: string;
  notes?: string;
  statut: RDVStatut;
  dateCreation: string;
}

export const RDV_TYPE_LABELS: Record<RDVType, string> = {
  piercing: 'Piercing',
  tatouage: 'Tatouage',
  dermographie: 'Dermographie',
  consultation: 'Consultation',
  retouche: 'Retouche',
  autre: 'Autre',
};

export const RDV_STATUT_LABELS: Record<RDVStatut, string> = {
  confirme: 'Confirmé',
  en_attente: 'En attente',
  annule: 'Annulé',
  termine: 'Terminé',
};

export const RDV_STATUT_COLORS: Record<RDVStatut, string> = {
  confirme: '#4CAF50',
  en_attente: '#FF9800',
  annule: '#F44336',
  termine: '#9C27B0',
};

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  questionnaire_mineur: '01 — Questionnaire Médical Mineur',
  autorisation_parentale: '02 — Autorisation Parentale',
  questionnaire_majeur: '03 — Questionnaire Médical Majeur',
  fiche_seance_piercing: '04 — Fiche de Traçabilité Matériel Stérile',
  soins_oreilles: 'A — Fiche de Soins Oreilles',
  soins_nez: 'B — Fiche de Soins Nez',
  soins_bouche_levres: 'C — Fiche de Soins Bouche & Lèvres',
  soins_nombril: 'D — Fiche de Soins Nombril',
  soins_mamelons: 'E — Fiche de Soins Mamelons',
  soins_arcade_sourcil: 'F — Fiche de Soins Arcade/Sourcil',
  soins_surface_dermal: 'G — Fiche de Soins Surface/Dermal',
  questionnaire_tatouage_majeur: '05 — Questionnaire Médical Tatouage Majeur',
  questionnaire_dermographe: '06 — Questionnaire Médical Dermographe',
  consentement_soins_tatouage: '07 — Consentement & Soins Post-Tatouage',
  soins_dermographe: '08 — Soins Post-Dermographie (Maquillage Permanent)',
  engagement_confidentialite: '09 — Engagement de Confidentialité (RGPD Art. 29)',
  affichage_salon: '10 — Information Client — Protection des Données (RGPD)',
  fiche_seance_tatouage: '11 — Fiche de Séance Tatouage',
};

export function calculateRGPDStatus(dateSuppressionPrevue: string): RGPDStatus {
  const now = new Date();
  const suppDate = new Date(dateSuppressionPrevue);
  const diffDays = Math.floor((suppDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'urgent';
  if (diffDays <= 90) return 'warning';
  return 'ok';
}

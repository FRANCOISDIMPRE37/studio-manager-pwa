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
  | 'fiche_seance_dermographe'
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
  numeroClient?: string;
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
  notes?: string;
  prestationsSouhaitees?: string[];
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
  logo?: string; // base64 data URL
  mentionsLegales?: string; // ligne libre affichée dans le pied de page imprimable
  siteWeb?: string; // URL du site web du salon
}

// Statistiques du tableau de bord
export interface DashboardStats {
  totalClients: number;
  clientsActifs: number;
  clientsMajeurs: number;
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
  // Piercing — Mineurs
  questionnaire_mineur: '01 — Questionnaire Médical Mineur (Piercing)',
  autorisation_parentale: '02 — Autorisation Parentale',
  // Piercing — Majeurs
  questionnaire_majeur: '03 — Questionnaire Médical Majeur (Piercing)',
  fiche_seance_piercing: '04 — Fiche de Traçabilité Matériel Stérile (Piercing)',
  // Soins Piercing
  soins_oreilles: 'A — Soins Post-Piercing Oreilles',
  soins_nez: 'B — Soins Post-Piercing Nez',
  soins_nombril: 'D — Soins Post-Piercing Nombril',
  soins_mamelons: 'E — Soins Post-Piercing Mamelons',
  soins_arcade_sourcil: 'F — Soins Post-Piercing Arcade / Sourcil',
  soins_surface_dermal: 'G — Soins Post-Piercing Surface / Dermal',
  // Tatouage
  questionnaire_tatouage_majeur: '05 — Questionnaire Médical Tatouage Majeur',
  consentement_soins_tatouage: '06 — Consentement & Soins Post-Tatouage',
  fiche_seance_tatouage: '07 — Fiche de Séance Tatouage',
  // Dermographie
  questionnaire_dermographe: '08 — Questionnaire Médical Dermographe',
  soins_dermographe: '09 — Soins Post-Dermographie (Maquillage Permanent)',
  fiche_seance_dermographe: '10 — Fiche de Séance Dermographe',
  // RGPD
  engagement_confidentialite: '11 — Engagement de Confidentialité (RGPD Art. 29)',
  affichage_salon: '12 — Information Client — Protection des Données (RGPD)',
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

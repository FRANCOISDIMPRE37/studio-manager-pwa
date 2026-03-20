/**
 * Utilitaires d'export/import des fiches clients en CSV et Excel
 * Colonnes : Nom, Prénom, Date naissance, Téléphone, Email, Adresse, CP, Ville,
 *            Mineur, Archivé, Date création, Date consentement, Date suppression prévue,
 *            Nb prestations, Nb documents
 */
import * as XLSX from 'xlsx';
import { Client } from './types';

// ─── Colonnes exportées ───────────────────────────────────────────────────────

const COLUMNS = [
  { key: 'nom',                   label: 'Nom' },
  { key: 'prenom',                label: 'Prénom' },
  { key: 'dateNaissance',         label: 'Date de naissance' },
  { key: 'telephone',             label: 'Téléphone' },
  { key: 'email',                 label: 'Email' },
  { key: 'adresse',               label: 'Adresse' },
  { key: 'codePostal',            label: 'Code postal' },
  { key: 'ville',                 label: 'Ville' },
  { key: 'pieceIdentiteType',     label: 'Pièce identité' },
  { key: 'pieceIdentiteNumero',   label: 'N° pièce identité' },
  { key: 'estMineur',             label: 'Mineur' },
  { key: 'estArchive',            label: 'Archivé' },
  { key: 'dateCreation',          label: 'Date création' },
  { key: 'dateConsentement',      label: 'Date consentement' },
  { key: 'dateSuppressionPrevue', label: 'Date suppression prévue' },
  { key: 'rgpdStatus',            label: 'Statut RGPD' },
  { key: 'nbPrestations',         label: 'Nb prestations' },
  { key: 'nbDocuments',           label: 'Nb documents' },
] as const;

function clientToRow(c: Client): Record<string, string | number | boolean> {
  return {
    Nom:                      c.nom || '',
    Prénom:                   c.prenom || '',
    'Date de naissance':      c.dateNaissance || '',
    Téléphone:                c.telephone || '',
    Email:                    c.email || '',
    Adresse:                  c.adresse || '',
    'Code postal':            c.codePostal || '',
    Ville:                    c.ville || '',
    'Pièce identité':         c.pieceIdentiteType || '',
    'N° pièce identité':      c.pieceIdentiteNumero || '',
    Mineur:                   c.estMineur ? 'Oui' : 'Non',
    Archivé:                  c.estArchive ? 'Oui' : 'Non',
    'Date création':          c.dateCreation || '',
    'Date consentement':      c.dateConsentement || '',
    'Date suppression prévue': c.dateSuppressionPrevue || '',
    'Statut RGPD':            c.rgpdStatus || '',
    'Nb prestations':         c.prestations?.length ?? 0,
    'Nb documents':           c.documents?.length ?? 0,
  };
}

// ─── Export CSV ───────────────────────────────────────────────────────────────

export function exportClientsCSV(clients: Client[]): void {
  const rows = clients.map(clientToRow);
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws, { FS: ';' }); // séparateur point-virgule (FR)
  const bom = '\uFEFF'; // BOM UTF-8 pour Excel FR
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `clients-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Export Excel ─────────────────────────────────────────────────────────────

export function exportClientsExcel(clients: Client[]): void {
  const rows = clients.map(clientToRow);
  const ws = XLSX.utils.json_to_sheet(rows);

  // Largeurs de colonnes
  ws['!cols'] = [
    { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 28 },
    { wch: 28 }, { wch: 10 }, { wch: 16 }, { wch: 12 }, { wch: 18 },
    { wch: 8  }, { wch: 8  }, { wch: 14 }, { wch: 16 }, { wch: 20 },
    { wch: 12 }, { wch: 14 }, { wch: 13 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clients');
  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `clients-${date}.xlsx`);
}

// ─── Import CSV / Excel ───────────────────────────────────────────────────────

export interface ImportResult {
  imported: Partial<Client>[];
  errors: string[];
}

function rowToPartialClient(row: Record<string, string>): Partial<Client> {
  return {
    nom:                    (row['Nom'] || row['nom'] || '').toUpperCase().trim(),
    prenom:                 (row['Prénom'] || row['prenom'] || row['Prenom'] || '').trim(),
    dateNaissance:          row['Date de naissance'] || row['dateNaissance'] || '',
    telephone:              row['Téléphone'] || row['telephone'] || row['Telephone'] || '',
    email:                  row['Email'] || row['email'] || '',
    adresse:                row['Adresse'] || row['adresse'] || '',
    codePostal:             row['Code postal'] || row['codePostal'] || '',
    ville:                  row['Ville'] || row['ville'] || '',
    pieceIdentiteType:      (row['Pièce identité'] || row['pieceIdentiteType'] || '') as Client['pieceIdentiteType'],
    pieceIdentiteNumero:    row['N° pièce identité'] || row['pieceIdentiteNumero'] || '',
    estMineur:              (row['Mineur'] || '').toLowerCase() === 'oui',
    estArchive:             (row['Archivé'] || row['Archive'] || '').toLowerCase() === 'oui',
    dateConsentement:       row['Date consentement'] || row['dateConsentement'] || '',
    dateSuppressionPrevue:  row['Date suppression prévue'] || row['dateSuppressionPrevue'] || '',
  };
}

export function importClientsFromFile(
  file: File,
  onSuccess: (result: ImportResult) => void,
  onError: (msg: string) => void
): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });

      if (!rows.length) {
        onError('Le fichier est vide ou ne contient aucune ligne de données.');
        return;
      }

      const errors: string[] = [];
      const imported: Partial<Client>[] = [];

      rows.forEach((row, idx) => {
        const client = rowToPartialClient(row);
        if (!client.nom && !client.prenom) {
          errors.push(`Ligne ${idx + 2} ignorée : Nom et Prénom manquants`);
          return;
        }
        imported.push(client);
      });

      onSuccess({ imported, errors });
    } catch (err) {
      onError('Impossible de lire le fichier. Vérifiez qu\'il s\'agit d\'un fichier CSV ou Excel valide.');
    }
  };
  reader.readAsArrayBuffer(file);
}

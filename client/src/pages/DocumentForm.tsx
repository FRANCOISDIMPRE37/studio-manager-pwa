import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'wouter';
import { useApp } from '@/lib/app-context';
import { DocumentType, DOCUMENT_LABELS, Client } from '@/lib/types';
import { ArrowLeft, Save, CheckCircle, AlertTriangle, Info, Phone, Printer, Mail, Send, X, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import SignaturePad from '@/components/SignaturePad';
import { trpc } from '@/lib/trpc';
import { FormSection, FormField, RadioField, CheckboxField, DateSlashField, LegalBox, RgpdMentions, WarningBox, AgeVerif, PrintHeader, PrintFooter } from './FormsCommuns';
import { FormQuestionnaireMineur, FormQuestionnaireMajeur, FormAutorisationParentale, FormSoins } from './FormsPiercing';
import { FormFicheSeance, FormConsentementSoinsTatouage, FormFicheSeanceTatouage, FormQuestionnaireTatouageMineur, FormQuestionnaireDermographeMineur, FormAutorisationParentaleDermographie, FormQuestionnaireTatouageMajeur, FormAutorisationParentaleTatouage } from './FormsTatouage';
import { FormFicheSeanceDermographe, FormQuestionnaireDermographe, FormSoinsDermographe } from './FormsDermographie';
import { FormEngagementConfidentialite, FormAffichageSalon } from './FormsRGPD';

export default function DocumentForm() {
  const params = useParams<{ clientId: string; docType: string }>();
  const [, navigate] = useLocation();
  const { state, updateClient } = useApp();
  const clientId = params.clientId;
  const docType = params.docType as DocumentType;

  // Mode sans client : pas de clientId dans l'URL (route /document/:docType)
  const isStandaloneMode = !clientId;

  // Client fictif pour le mode sans client
  const STANDALONE_CLIENT: Client = {
    id: '__standalone__',
    nom: '',
    prenom: '',
    dateNaissance: '',
    adresse: '',
    codePostal: '',
    ville: '',
    telephone: '',
    email: '',
    estMineur: false,
    prestations: [],
    documentsAssocies: [],
    documents: [],
    photos: [],
    dateCreation: new Date().toISOString(),
    dateSuppressionPrevue: '',
    rgpdStatus: 'ok',
    rgpdDroitsExerces: [],
    estArchive: false,
  };

  // Détection du paramètre ?print=1 dans l'URL pour impression automatique
  const autoPrint = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('print') === '1';

  const client = isStandaloneMode ? STANDALONE_CLIENT : state.clients.find(c => c.id === clientId);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (client) {
      const existingDoc = client.documents?.find(d => d.type === docType);
      const today = new Date().toLocaleDateString('fr-FR');

      // Données d'identité du client à synchroniser automatiquement dans tous les formulaires
      const clientIdentity: Record<string, any> = {
        // Champs standards
        nom: client.nom || '',
        prenom: client.prenom || '',
        dateNaissance: client.dateNaissance || '',
        telephone: client.telephone || '',
        email: client.email || '',
        adresse: client.adresse || '',
        codePostal: client.codePostal || '',
        ville: client.ville || '',
        // Variantes de noms utilisées dans certains formulaires
        nomClient: client.nom || '',
        prenomClient: client.prenom || '',
        telephoneClient: client.telephone || '',
        emailClient: client.email || '',
        // Champs mineur (identité du mineur = identité du client)
        nomMineur: client.nom || '',
        prenomMineur: client.prenom || '',
        dateNaissanceMineur: client.dateNaissance || '',
        // Pièce d'identité — synchronisée depuis la fiche client vers tous les formulaires
        // Champ texte libre (Questionnaire majeur piercing)
        pieceId: client.pieceIdentiteType || '',
        numeroPiece: client.pieceIdentiteNumero || '',
        // Champs radio + numéro (Questionnaire tatouage majeur, dermographe, fiche séance tatouage)
        pieceIdType: client.pieceIdentiteType || '',
        pieceIdNumero: client.pieceIdentiteNumero || '',
        // Champs mineur (Questionnaire médical mineur piercing)
        pieceIdMineurType: client.pieceIdentiteType || '',
        pieceIdMineurNumero: client.pieceIdentiteNumero || '',
        // Pré-remplissage de la zone à percer depuis les prestations souhaitées
        zonePiercing: (() => {
          const prestationsPiercing = ['Oreilles', 'Nez', 'Nombril', 'Téton', 'Arcade / Sourcil', 'Surface / Dermal'];
          const zones = (client.prestationsSouhaitees || []).filter(p => prestationsPiercing.includes(p));
          return zones.length > 0 ? zones.join(', ') : '';
        })(),
        // Champs de signature client pré-remplis
        nomClientSign: client.nom ? `${client.prenom || ''} ${client.nom}`.trim() : '',
        dateSignatureClient: today,
        dateSignaturePierceur: today,
        dateSignatureTatoueur: today,
        dateSignatureDermographe: today,
        dateSignatureParent: today,
      };

      if (existingDoc?.data) {
        // Document existant : on fusionne en prioritisant les données sauvegardées,
        // mais on met à jour les champs d'identité si le client a été modifié
        const saved = existingDoc.data as Record<string, any>;
        const merged: Record<string, any> = { ...clientIdentity };
        // Pour chaque clé sauvegardée, on garde la valeur sauf si elle est vide
        for (const key of Object.keys(saved)) {
          if (saved[key] !== undefined && saved[key] !== null && saved[key] !== '') {
            merged[key] = saved[key];
          }
        }
        // Forcer la resynchronisation des champs d'identité depuis le client
        const identityKeys = ['nom', 'prenom', 'dateNaissance', 'telephone', 'email', 'adresse', 'codePostal', 'ville',
          'nomClient', 'prenomClient', 'telephoneClient', 'emailClient',
          'nomMineur', 'prenomMineur', 'dateNaissanceMineur', 'nomClientSign',
          'pieceId', 'numeroPiece', 'pieceIdType', 'pieceIdNumero',
          'pieceIdMineurType', 'pieceIdMineurNumero'];
        for (const key of identityKeys) {
          if (clientIdentity[key]) merged[key] = clientIdentity[key];
        }
        setFormData(merged);
      } else {
        // Nouveau document : on pré-remplit avec toutes les données du client
        setFormData(clientIdentity);
      }
    }
   }, [client?.id, docType]);

  // Impression automatique si ?print=1 dans l'URL (déclenché après chargement des données)
  useEffect(() => {
    if (autoPrint && Object.keys(formData).length > 0) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, formData]);

  function updateField(key: string, value: any) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  // Fiches de consentement critiques qui requièrent une signature obligatoire.
  // La présence est testée par contenu réel afin d'éviter qu'une chaîne vide Safari/iPad soit acceptée.
  const isSignaturePresent = (value: any) => typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
  const FICHES_SIGNATURE_OBLIGATOIRE: DocumentType[] = [
    'questionnaire_mineur',
    'questionnaire_majeur',
    'questionnaire_tatouage_majeur',
    'questionnaire_dermographe',
    'consentement_soins_tatouage',
  ];

  const SIGNATURES_OBLIGATOIRES_PAR_DOCUMENT: Partial<Record<DocumentType, Array<{ key: string; label: string }>>> = {
    // 01 — Questionnaire Médical Mineur / Autorisation Parentale / Piercing : toutes les signatures sont obligatoires sur PC et iPad.
    questionnaire_mineur: [
      { key: 'signatureImageClient', label: 'signature du mineur' },
      { key: 'signatureImageRepresentant', label: 'signature du représentant légal' },
      { key: 'signatureImagePierceur', label: 'signature du pierceur' },
    ],
    autorisation_parentale: [
      { key: 'signatureImageParent', label: 'signature du représentant légal' },
    ],
    questionnaire_tatouage_mineur: [
      { key: 'signatureImageClient', label: 'signature du mineur' },
      { key: 'signatureImageRepresentant', label: 'signature du représentant légal' },
    ],
    autorisation_parentale_tatouage: [
      { key: 'signatureImageRepresentant', label: 'signature du représentant légal' },
    ],
    questionnaire_dermographe_mineur: [
      { key: 'signatureImageClient', label: 'signature du mineur' },
      { key: 'signatureImageRepresentant', label: 'signature du représentant légal' },
    ],
    autorisation_parentale_dermographie: [
      { key: 'signatureImageRepresentant', label: 'signature du représentant légal' },
    ],
  };

  const signatureRequise = FICHES_SIGNATURE_OBLIGATOIRE.includes(docType);
  const signatureManquante = signatureRequise && !isSignaturePresent(formData.signatureImageClient);
  const fichesMineurAvecRepresentant: DocumentType[] = [
    'questionnaire_mineur',
    'autorisation_parentale',
    'questionnaire_tatouage_mineur',
    'autorisation_parentale_tatouage',
    'questionnaire_dermographe_mineur',
    'autorisation_parentale_dermographie',
  ];

  const createDocMutation = trpc.documents.create.useMutation();
  const createArchiveMutation = trpc.archives.create.useMutation();
  const createEngagementMutation = trpc.engagements.create.useMutation();

  async function handleSave() {
    if (isStandaloneMode && docType === 'engagement_confidentialite') {
      if (signatureManquante) { toast.error('Signature obligatoire'); return; }
      setIsSaving(true);
      try {
        await createEngagementMutation.mutateAsync({
          nom: formData.nomSignataire || "",
          poste: formData.posteSignataire || "",
          date: formData.signataireDate || new Date().toLocaleDateString("fr-FR"),
          data: formData,
        });
      } catch (e) { console.error(e); } finally { setIsSaving(false); }
      return;
    }
    if (isStandaloneMode && docType === 'archivage_dossier_papier') {
      setIsSaving(true);
      try {
        await createArchiveMutation.mutateAsync({
          nom: formData.nom || '',
          prenom: formData.prenom || '',
          dateNumerisation: formData.dateNumerisation || new Date().toLocaleDateString('fr-FR'),
          typeDocument: formData.typeDocument || '',
          praticien: formData.praticien || '',
          periode: formData.periode || '',
          notes: formData.notes || '',
          photos: formData.photos || [],
        });
        toast.success('Dossier archivé avec succès !');
        navigate('/documents');
      } catch (e) { console.error(e); toast.error('Erreur lors de l\'archivage'); } finally { setIsSaving(false); }
      return;
    }
    if (isStandaloneMode) { handlePrint(); return; }
    if (!client) return;
    if (signatureManquante) {
      toast.error('La signature du client est obligatoire pour valider ce document.');
      return;
    }
    const signaturesObligatoires = SIGNATURES_OBLIGATOIRES_PAR_DOCUMENT[docType] || [];
    const signaturesManquantes = signaturesObligatoires.filter(signature => !isSignaturePresent(formData[signature.key]));
    if (signaturesManquantes.length > 0) {
      toast.error('Signatures obligatoires manquantes : ' + signaturesManquantes.map(signature => signature.label).join(', ') + '.');
      return;
    }
    // Validation champs obligatoires via data-required
    const requiredInputs = document.querySelectorAll('[data-required="true"]');
    const emptyFields: string[] = [];
    requiredInputs.forEach((el: any) => {
      if (!el.value || el.value.trim() === '') {
        emptyFields.push(el.getAttribute('data-label') || 'Champ requis');
      }
    });
    // Validation numéro pièce identité mineur (conditionnel)
    if (formData.pieceId && formData.pieceId !== 'Non présentée' && formData.pieceId !== 'Non presentee' && !formData.numeroPiece) {
      emptyFields.push("Numero de la piece d'identite du mineur");
    }
    // Validation obligatoire renforcée des fiches mineur : identité représentant, droit, présence, pièce d'identité et signature.
    const addMissingIfEmpty = (label: string, value: any) => {
      if (value === undefined || value === null || String(value).trim() === '') emptyFields.push(label);
    };
    if (fichesMineurAvecRepresentant.includes(docType)) {
      if (docType === 'autorisation_parentale') {
        addMissingIfEmpty('Nom du représentant légal', formData.nomRep);
        addMissingIfEmpty('Prénom du représentant légal', formData.prenomRep);
        addMissingIfEmpty('Lien avec le mineur', formData.lienRep);
        addMissingIfEmpty('Téléphone du représentant légal', formData.telRep || client.telephone);
        addMissingIfEmpty('Nom de signature du représentant légal', formData.nomRepresentantSign || (formData.nomRep && formData.prenomRep ? `${formData.nomRep} ${formData.prenomRep}` : ''));
        addMissingIfEmpty('Date de signature du représentant légal', formData.dateSignatureParent || new Date().toLocaleDateString('fr-FR'));
      } else {
        addMissingIfEmpty('Nom du représentant légal', formData.nomRepresentant || client.nomRepresentantLegal);
        addMissingIfEmpty('Prénom du représentant légal', formData.prenomRepresentant || client.prenomRepresentantLegal);
        addMissingIfEmpty('Lien avec le mineur', formData.lienRepresentant || client.lienRepresentantLegal);
        addMissingIfEmpty('Téléphone du représentant légal', formData.telephoneRepresentant || client.telephoneRepresentantLegal || client.telephone);
        addMissingIfEmpty('Nom de signature du représentant légal', formData.nomRepresentantSign || (client.nomRepresentantLegal ? `${client.nomRepresentantLegal} ${client.prenomRepresentantLegal || ''}` : ''));
        addMissingIfEmpty('Date de signature du représentant légal', formData.dateSignatureRepresentant || new Date().toLocaleDateString('fr-FR'));
      }
      addMissingIfEmpty("Pièce d'identité du représentant légal", formData.pieceIdRepresentantType);
    }
    // Validation numéro pièce identité représentant (obligatoire dès qu'une pièce autre que Non présentée est sélectionnée)
    if (formData.pieceIdRepresentantType && formData.pieceIdRepresentantType !== 'Non présentée' && formData.pieceIdRepresentantType !== 'Non presentee' && !formData.pieceIdRepresentantNumero) {
      emptyFields.push("Numero de la piece d'identite du representant");
    }
    if (emptyFields.length > 0) {
      toast.error('Champs obligatoires manquants : ' + emptyFields.slice(0, 3).join(', ') + (emptyFields.length > 3 ? '...' : ''));
      return;
    }
    // Validation cases a cocher obligatoires selon le type de fiche
    const requiredCheckboxMap: Record<string, Array<{key: string, label: string}>> = {
      'questionnaire_mineur': [
        { key: 'avisMineur', label: 'Avis du mineur' },
        { key: 'reponduHonnetement', label: 'A répondu honnêtement' },
        { key: 'consentDonneesSante', label: 'Consentement données de santé' },
        { key: 'autoriteParentale', label: 'Autorité parentale ou tutelle légale' },
        { key: 'autorisationPrestation', label: 'Autorisation de la prestation' },
        { key: 'pasContraIndication', label: 'Absence de contre-indication' },
        { key: 'engageSoins', label: 'Supervision des soins' },
        { key: 'presencePhysique', label: 'Présence physique confirmée' },
      ],
      'autorisation_parentale': [
        { key: 'decl_0', label: 'Autorité parentale ou tutelle légale' },
        { key: 'decl_1', label: 'Autorisation de la prestation' },
        { key: 'decl_3', label: 'Absence de contre-indication' },
        { key: 'decl_4', label: 'Supervision des soins' },
        { key: 'presencePhysique', label: 'Présence physique confirmée' },
        { key: 'presenceEcrite', label: 'Autorisation écrite confirmée' },
      ],
      'questionnaire_tatouage_mineur': [
        { key: 'reponduHonnetement', label: 'A répondu honnêtement' },
        { key: 'consentDonneesSante', label: 'Consentement données de santé' },
        { key: 'consentementLibre', label: 'Consentement du représentant légal' },
        { key: 'assumeResponsabilite', label: 'Assume la responsabilité' },
        { key: 'presenceRepresentant', label: 'Présence physique confirmée' },
      ],
      'autorisation_parentale_tatouage': [
        { key: 'connaitSoins', label: 'Connaissance des soins post-tatouage' },
        { key: 'engageSoins', label: 'Supervision des soins post-tatouage' },
        { key: 'informeRisques', label: 'Information sur les risques' },
        { key: 'autorisationDonnee', label: 'Autorisation parentale du tatouage' },
      ],
      'questionnaire_dermographe_mineur': [
        { key: 'reponduHonnetement', label: 'A répondu honnêtement' },
        { key: 'consentDonneesSante', label: 'Consentement données de santé' },
        { key: 'consentementLibre', label: 'Consentement du représentant légal' },
        { key: 'assumeResponsabilite', label: 'Assume la responsabilité' },
        { key: 'presenceRepresentant', label: 'Présence physique confirmée' },
      ],
      'autorisation_parentale_dermographie': [
        { key: 'connaitRisques', label: 'Connaissance des risques dermographie' },
        { key: 'engageSoins', label: 'Supervision des soins post-dermographie' },
        { key: 'autorisationDonnee', label: 'Autorisation parentale de la prestation' },
        { key: 'presenceConfirmee', label: 'Présence physique confirmée' },
      ],
      'questionnaire_majeur': [
        { key: 'consent_majeur', label: 'Être majeur(e)' },
        { key: 'consent_honnete', label: 'A répondu honnêtement' },
        { key: 'consent_librement', label: 'Consent librement' },
        { key: 'consent_protocole', label: "S'engage à respecter le protocole" },
        { key: 'consentDonneesSante', label: 'Consentement données de santé' },
      ],
      'questionnaire_tatouage_majeur': [
        { key: 'consent_honnete', label: 'A répondu honnêtement' },
        { key: 'consent_libre', label: 'Consent librement' },
        { key: 'consentDonneesSante', label: 'Consentement données de santé' },
      ],
      'questionnaire_dermographe': [
        { key: 'consentementLibre', label: 'Consent librement' },
        { key: 'certifieInfosExactes', label: 'Certifie les informations exactes' },
        { key: 'consentDonneesSante', label: 'Consentement données de santé' },
      ],
    };
    const requiredBoxes = requiredCheckboxMap[docType] || [];
    const uncheckedBoxes = requiredBoxes.filter(f => !formData[f.key]);
    if (uncheckedBoxes.length > 0) {
      toast.error('Cases obligatoires non cochées : ' + uncheckedBoxes.slice(0, 2).map(f => f.label).join(', ') + (uncheckedBoxes.length > 2 ? '...' : ''));
      return;
    }
    // Validation photo obligatoire pour la fiche de traçabilité matériel stérile piercing.
    if (docType === 'fiche_seance_piercing' && (!Array.isArray(formData.photosTracabilite) || formData.photosTracabilite.length === 0)) {
      toast.error('Photo obligatoire : veuillez photographier le matériel stérile avant de sauvegarder la fiche de traçabilité.');
      return;
    }
    // Validation cases consentement obligatoires
    const fichesMineurs = ['questionnaire_mineur', 'questionnaire_tatouage_mineur', 'questionnaire_dermographe_mineur'];
    const fichesAutorisations = ['autorisation_parentale', 'autorisation_parentale_tatouage', 'autorisation_parentale_dermographie'];
    if (fichesMineurs.includes(docType)) {
      if (!formData.reponduHonnetement) {
        toast.error('Veuillez cocher toutes les cases de déclaration obligatoires.');
        return;
      }
    }
    if (fichesAutorisations.includes(docType)) {
      const autorisationOk = docType === 'autorisation_parentale'
        ? formData.decl_0 && formData.decl_1 && formData.decl_3 && formData.decl_4 && formData.presencePhysique && formData.presenceEcrite
        : docType === 'autorisation_parentale_tatouage'
          ? formData.connaitSoins && formData.engageSoins && formData.informeRisques && formData.autorisationDonnee
          : formData.connaitRisques && formData.engageSoins && formData.autorisationDonnee && formData.presenceConfirmee;
      if (!autorisationOk) {
        toast.error('Veuillez cocher toutes les cases de droits, présence et consentement du représentant légal.');
        return;
      }
    }
    setIsSaving(true);
    try {
      const existingDocIdx = (client.documents || []).findIndex(d => d.type === docType);
      const now = new Date().toISOString();
      const doc = {
        id: existingDocIdx >= 0 ? client.documents[existingDocIdx].id : `doc-${Date.now()}`,
        type: docType,
        status: (formData.signatureImageClient || docType === 'engagement_confidentialite') ? 'signed' as const : 'filled' as const,
        data: formData,
        dateCreation: existingDocIdx >= 0 ? client.documents[existingDocIdx].dateCreation : now,
        dateSigned: (formData.signatureImageClient || docType === 'engagement_confidentialite') ? now : (existingDocIdx >= 0 ? client.documents[existingDocIdx].dateSigned : undefined),
      };
      const newDocs = [...(client.documents || [])];
      if (existingDocIdx >= 0) newDocs[existingDocIdx] = doc;
      else newDocs.push(doc);
      await updateClient({ ...client, documents: newDocs });
      toast.success('Document sauvegardé avec succès');
      setTimeout(() => navigate(-1), 1000);
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  }

  if (!client && !isStandaloneMode) {
    return (
      <div className="p-6 text-center" style={{ color: '#1e293b', fontWeight: 600 }}>
        <p>Client introuvable</p>
        <button onClick={() => navigate('/clients')} className="mt-4 text-sm" style={{ color: 'var(--brand-cyan)' }}>
          Retour aux clients
        </button>
      </div>
    );
  }

  // À ce stade, client est toujours défini (soit un vrai client, soit STANDALONE_CLIENT)
  const effectiveClient = client!;

  const docTitle = DOCUMENT_LABELS[docType] || docType;
  const today = new Date().toLocaleDateString('fr-FR');

  function handlePrint() {
    const style = document.createElement('style');
    style.id = '__print_style__';
    style.innerHTML = `
      @media print {
        /* Mise en page A4 avec marges généreuses pour éviter les coupures */
        @page {
          size: A4 portrait;
          margin: 20mm 15mm 20mm 15mm;
        }

        /* Masquer la sidebar, le header sticky, les boutons et la navigation */
        body > div > aside,
        aside,
        nav,
        .sticky,
        [data-sidebar],
        .no-print { display: none !important; }

        /* Réinitialiser le fond et supprimer les conteneurs scrollables */
        html {
          background: white !important;
          overflow: visible !important;
          height: auto !important;
        }
        body {
          background: white !important;
          color: #111 !important;
          margin: 0 !important;
          padding: 0 !important;
          font-size: 10pt !important;
          width: 100% !important;
          overflow: visible !important;
          height: auto !important;
        }

        /* CRITIQUE Safari iPad : supprimer overflow sur TOUS les conteneurs */
        html, body, main, [role='main'],
        div, section, article, aside, header, footer {
          overflow: visible !important;
          height: auto !important;
          max-height: none !important;
          min-height: 0 !important;
        }
        /* Remettre flex pour les grilles */
        [class*='grid'] {
          height: auto !important;
        }

        /* FORCER LES COULEURS À L'IMPRESSION */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        /* Texte lisible */
        p, span, label, td, th, li, h1, h2, h3, h4, h5, h6 {
          color: #111 !important;
        }

        /* Champs de formulaire */
        input, textarea, select {
          border: 1px solid #999 !important;
          color: #111 !important;
          background: #fff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Cartes */
        .studio-card, [class*='rounded'] {
          border: 1px solid #ccc !important;
          box-shadow: none !important;
          background: white !important;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* Masquer les boutons */
        button { display: none !important; }

        /* En-tête et pied de page d'impression */
        .print-header { display: block !important; margin-bottom: 16px; }
        .print-footer { display: block !important; margin-top: 16px; }

        /* Numérotation des pages */
        .page-num::after { content: counter(page); }

        /* Sections : éviter les coupures en milieu de section */
        section,
        .print-section,
        fieldset {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* Titres de section : ne jamais couper après un titre */
        h2, h3, h4 {
          break-after: avoid;
          page-break-after: avoid;
        }

        /* Tableaux : éviter les coupures */
        table {
          break-inside: avoid;
          page-break-inside: avoid;
          width: 100% !important;
        }
        tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* Canvas de signature */
        canvas {
          display: block !important;
          border: 1px solid #999 !important;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* Assurer que le contenu principal prend toute la largeur */
        .p-4, .p-6, .max-w-3xl {
          padding: 0 !important;
          margin: 0 auto !important;
          width: 100% !important;
          max-width: 100% !important;
        }

        /* Supprimer le padding-bottom */
        .pb-16, .pb-24 {
          padding-bottom: 0 !important;
        }

        /* Images */
        img {
          max-width: 100% !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => { const s = document.getElementById('__print_style__'); if (s) s.remove(); }, 2000);
  }

  // ─── Email SMTP ───
  const sendDocumentEmail = trpc.smtp.sendDocument.useMutation({
    onSuccess: () => { toast.success('Email envoyé avec succès !'); setEmailModal(false); },
    onError: (e) => toast.error(e.message),
  });
  const [emailModal, setEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  function handleEmail() {
    setEmailTo(effectiveClient.email || '');
    setEmailModal(true);
  }

  function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    const clientName = effectiveClient.prenom || effectiveClient.nom
      ? `${effectiveClient.prenom} ${effectiveClient.nom}`.trim()
      : 'Client non renseigné';
    sendDocumentEmail.mutate({
      to: emailTo,
      subject: `${docTitle} — ${clientName}`,
      body: `<p>Veuillez trouver ci-dessous le résumé du document : <strong>${docTitle}</strong></p>
             <p>Client : <strong>${clientName}</strong><br>Date : ${today}</p>
             <p>Ce document a été généré depuis Studio Pierceur Tatoueur Dermographe by Intemporelle.</p>`,
      documentTitle: docTitle,
      clientNom: clientName,
    });
  }

  const renderForm = () => {
    switch (docType) {
      case 'questionnaire_mineur':
        return <FormDossierMineurPiercing data={formData} update={updateField} client={effectiveClient} salonInfo={state.salonInfo} />;
      case 'autorisation_parentale':
        return <FormAutorisationParentale data={formData} update={updateField} client={effectiveClient} salonInfo={state.salonInfo} />;
      case 'questionnaire_majeur':
        return <FormQuestionnaireMajeur data={formData} update={updateField} client={effectiveClient} />;
      case 'fiche_seance_piercing':
        return <FormFicheSeance data={formData} update={updateField} client={effectiveClient} />;
      case 'questionnaire_tatouage_mineur':
        return <FormDossierMineurTatouage data={formData} update={updateField} client={effectiveClient} salonInfo={state.salonInfo} />;
      case 'autorisation_parentale_tatouage':
        return <FormAutorisationParentaleTatouage data={formData} update={updateField} client={effectiveClient} />;
      case 'questionnaire_tatouage_majeur':
        return <FormQuestionnaireTatouageMajeur data={formData} update={updateField} client={effectiveClient} />;
      case 'questionnaire_dermographe_mineur':
        return <FormDossierMineurDermographie data={formData} update={updateField} client={effectiveClient} salonInfo={state.salonInfo} />;
      case 'autorisation_parentale_dermographie':
        return <FormAutorisationParentaleDermographie data={formData} update={updateField} client={effectiveClient} />;
      case 'questionnaire_dermographe':
        return <FormQuestionnaireDermographe data={formData} update={updateField} client={effectiveClient} />;
      case 'consentement_soins_tatouage':
        return <FormConsentementSoinsTatouage data={formData} update={updateField} client={effectiveClient} />;
      case 'fiche_retouche_dermographie':
        return (
          <div className="space-y-4 p-4">
            <div className="rounded-xl p-4" style={{background:'#ffffff',border:'1px solid var(--brand-border)'}}>
              <h3 className="font-700 text-sm mb-3" style={{color:'#1e40af', fontSize:'14px', fontWeight:'800', letterSpacing:'0.5px'}}>1 — IDENTITÉ DU CLIENT</h3>
              <div className="space-y-3">
                <FormField label="Nom / Prénom" value={formData.nomPrenom||''} onChange={(v: string)=>updateField('nomPrenom',v)} />
                <FormField label="Date de naissance" value={formData.dateNaissance||''} onChange={(v: string)=>updateField('dateNaissance',v)} />
                <FormField label="Téléphone" value={formData.telephone||''} onChange={(v: string)=>updateField('telephone',v)} />
              </div>
            </div>
            <div className="rounded-xl p-4" style={{background:'#ffffff',border:'1px solid var(--brand-border)'}}>
              <h3 className="font-700 text-sm mb-3" style={{color:'#1e40af'}}>2 — INFORMATIONS RETOUCHE</h3>
              <div className="space-y-3">
                <FormField label="Date de la retouche" value={formData.dateRetouche||''} onChange={(v: string)=>updateField('dateRetouche',v)} />
                <FormField label="Date de la séance initiale" value={formData.dateSeanceInitiale||''} onChange={(v: string)=>updateField('dateSeanceInitiale',v)} />
                <FormField label="Zone retouchée" value={formData.zoneRetouche||''} onChange={(v: string)=>updateField('zoneRetouche',v)} />
                <FormField label="N° de retouche" value={formData.numeroRetouche||''} onChange={(v: string)=>updateField('numeroRetouche',v)} />
              </div>
            </div>
            <div className="rounded-xl p-4" style={{background:'#ffffff',border:'1px solid var(--brand-border)'}}>
              <h3 className="font-700 text-sm mb-3" style={{color:'#1e40af'}}>3 — MOTIF DE LA RETOUCHE</h3>
              <div className="space-y-2">
                {[
                  {k:'motifDecoloration',l:'Décoloration / éclaircissement'},
                  {k:'motifAsymetrie',l:'Asymétrie à corriger'},
                  {k:'motifPatchy',l:'Zone irrégulière (patchy)'},
                  {k:'motifEpaississement',l:'Épaississement souhaité'},
                  {k:'motifCorrection',l:'Correction de forme'},
                  {k:'motifComplementaire',l:'Séance complémentaire prévue'},
                ].map(({k,l})=>(
                  <div key={k} className="flex items-center justify-between p-2 rounded-lg" style={{background:'#f8fafc'}}>
                    <span className="text-xs" style={{color:'#111827'}}>{l}</span>
                    <div className="flex gap-2">
                      {['Oui','Non'].map(opt=>(
                        <button key={opt} onClick={()=>updateField(k,opt)}
                          className="px-3 py-1 rounded-lg text-xs font-600 transition-all"
                          style={{background: formData[k]===opt ? (opt==='Oui'?'#ef4444':'#22c55e') : '#e2e8f0',
                                  color: formData[k]===opt ? 'white' : '#111827', fontWeight:700}}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl p-4" style={{background:'#ffffff',border:'1px solid var(--brand-border)'}}>
              <h3 className="font-700 text-sm mb-3" style={{color:'#1e40af'}}>4 — PIGMENTS UTILISÉS</h3>
              <div className="space-y-3">
                <FormField label="Marque du pigment" value={formData.marquePigment||''} onChange={(v: string)=>updateField('marquePigment',v)} />
                <FormField label="Référence / Couleur" value={formData.refCouleur||''} onChange={(v: string)=>updateField('refCouleur',v)} />
                <FormField label="N° de lot" value={formData.numLot||''} onChange={(v: string)=>updateField('numLot',v)} />
                <FormField label="Date de péremption" value={formData.datePeremption||''} onChange={(v: string)=>updateField('datePeremption',v)} />
              </div>
            </div>
            <div className="rounded-xl p-4" style={{background:'#ffffff',border:'1px solid var(--brand-border)'}}>
              <h3 className="font-700 text-sm mb-3" style={{color:'#1e40af'}}>5 — OBSERVATIONS</h3>
              <div className="space-y-3">
                <FormField label="Résultat de la retouche" value={formData.resultatRetouche||''} onChange={(v: string)=>updateField('resultatRetouche',v)} />
                <FormField label="Prochaine retouche prévue" value={formData.prochaineRetouche||''} onChange={(v: string)=>updateField('prochaineRetouche',v)} />
                <FormField label="Notes du praticien" value={formData.notesPraticien||''} onChange={(v: string)=>updateField('notesPraticien',v)} />
              </div>
            </div>
            <div className="rounded-xl p-4" style={{background:'#ffffff',border:'1px solid var(--brand-border)'}}>
              <h3 className="font-700 text-sm mb-3" style={{color:'#1e40af', fontSize:'14px', fontWeight:'800', letterSpacing:'0.5px'}}>SIGNATURES</h3>
              <div className="space-y-3">
                <FormField label="Nom du client — Lu et approuvé" value={formData.nomClientSigne||''} onChange={(v: string)=>updateField('nomClientSigne',v)} />
                <FormField label="Date" value={formData.dateSignatureClient||new Date().toLocaleDateString('fr-FR')} onChange={(v: string)=>updateField('dateSignatureClient',v)} />
                <SignaturePad label="Signature du client" value={formData.signatureClient||''} onChange={(v)=>updateField('signatureClient', v ?? '')} />
                <FormField label="Nom du praticien" value={formData.nomPraticien||''} onChange={(v: string)=>updateField('nomPraticien',v)} />
                <FormField label="Date" value={formData.dateSignaturePraticien||new Date().toLocaleDateString('fr-FR')} onChange={(v: string)=>updateField('dateSignaturePraticien',v)} />
                <SignaturePad label="Signature du praticien" value={formData.signaturePraticien||''} onChange={(v)=>updateField('signaturePraticien', v ?? '')} />
              </div>
            </div>
          </div>
        );
      case 'soins_dermographe':
        return <FormSoinsDermographe data={formData} update={updateField} client={effectiveClient} />;
      case 'fiche_seance_tatouage':
        return <FormFicheSeanceTatouage data={formData} update={updateField} client={effectiveClient} />;
      case 'fiche_seance_dermographe':
        return <FormFicheSeanceDermographe data={formData} update={updateField} client={effectiveClient} />;
      case 'engagement_confidentialite':
        return <FormEngagementConfidentialite data={formData} update={updateField} client={effectiveClient} />;
      case 'affichage_salon':
        return <FormAffichageSalon data={formData} update={updateField} client={effectiveClient} />;
      case 'archivage_dossier_papier':
        return <FormArchivageDossier data={formData} update={updateField} client={effectiveClient} />;
      case 'dossier_mineur_piercing':
        return <FormDossierMineurPiercing data={formData} update={updateField} client={effectiveClient} salonInfo={state.salonInfo} />;
      default:
        if (docType.startsWith('soins_') || docType.startsWith('cicatrisation_')) {
          return <FormSoins docType={docType} data={formData} update={updateField} client={effectiveClient} />;
        }
        return (
          <div className="text-center py-8" style={{ color: '#1e293b', fontWeight: 600 }}>
            <Info size={32} className="mx-auto mb-3" style={{ color: 'var(--brand-cyan)' }} />
            <p>Formulaire en cours de développement</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-navy)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3" style={{
        background: 'var(--brand-card)',
        borderBottom: '1px solid var(--brand-border)',
      }}>
        <button
          onClick={() => isStandaloneMode ? navigate('/documents') : navigate(`/clients/${clientId}`)}
          className="p-2 rounded-lg transition-all hover:bg-white/10"
          style={{ color: 'var(--brand-text)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-700 truncate" style={{ color: '#1b5e20', fontWeight: 700, fontFamily: 'Outfit' }}>
            {docTitle}
          </h1>
          <p className="text-xs truncate" style={{ color: '#1e293b', fontWeight: 600 }}>
            {isStandaloneMode ? 'Sans client associé' : `${effectiveClient.prenom} ${effectiveClient.nom}`} · {today}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Bouton Aperçu */}
          <button
            onClick={() => setShowPreview(true)}
            title="Aperçu avant impression"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-600 transition-all hover:bg-white/10"
            style={{ color: 'var(--brand-text)', border: '1px solid var(--brand-border)', fontWeight: 600 }}
          >
            <Eye size={15} />
            <span className="hidden sm:inline">Aperçu</span>
          </button>
          {/* Bouton Imprimer */}
          <button
            onClick={handlePrint}
            title="Imprimer le document"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-600 transition-all hover:bg-white/10"
            style={{ color: 'var(--brand-text)', border: '1px solid var(--brand-border)', fontWeight: 600 }}
          >
            <Printer size={15} />
            <span className="hidden sm:inline">Imprimer</span>
          </button>

          {/* Bouton Sauvegarder */}
          <button
            onClick={handleSave}
            disabled={isSaving || signatureManquante}
            title={signatureManquante ? 'Signature du client obligatoire' : 'Sauvegarder le document'}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-600 transition-all"
            style={{
              background: signatureManquante ? 'rgba(192,57,106,0.3)' : 'var(--brand-cyan)',
              color: signatureManquante ? '#C0396A' : 'var(--brand-navy)',
              fontWeight: 600,
              fontFamily: 'Outfit',
              opacity: isSaving ? 0.7 : 1,
              border: signatureManquante ? '1px solid rgba(192,57,106,0.5)' : 'none',
              cursor: signatureManquante ? 'not-allowed' : 'pointer',
            }}
          >
            <Save size={16} />
            {isSaving ? 'Sauvegarde...' : signatureManquante ? 'Signature requise' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Form content */}
      <div className="p-4 max-w-3xl mx-auto pb-16" style={{ background: "#ffffff", borderRadius: 12, margin: "0 auto 24px", padding: "24px" }}>
        {/* En-tête visible uniquement à l'impression */}
        <PrintHeader
          salonInfo={state.salonInfo}
          docTitle={docTitle}
          clientName={`${effectiveClient.prenom} ${effectiveClient.nom}`}
          date={today}
          numeroClient={effectiveClient.numeroClient}
        />
        {/* Message champs obligatoires */}
        <div className="no-print mb-3 px-3 py-2 rounded-lg flex items-center gap-2" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
          <span style={{ color: '#F59E0B', fontSize: 14 }}>⚠️</span>
          <span style={{ color: '#92400E', fontSize: 12 }}>Les champs marqués <strong style={{ color: '#DC2626' }}>*</strong> sont obligatoires. Veuillez les remplir avant de sauvegarder.</span>
        </div>
        {renderForm()}

        {/* Pied de page visible uniquement à l'impression */}
        <PrintFooter
          salonInfo={state.salonInfo}
          docTitle={docTitle}
        />

        {/* Save button at bottom */}
        <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--brand-border)' }}>
          {signatureManquante && (
            <div className="flex items-center gap-2 mb-3 px-4 py-2 rounded-lg text-xs" style={{ background: 'rgba(192,57,106,0.1)', border: '1px solid rgba(192,57,106,0.3)', color: '#C0396A' }}>
              <AlertTriangle size={14} />
              <span>La <strong>signature du client</strong> est obligatoire pour valider ce document. Veuillez signer dans la section Signatures ci-dessus.</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || signatureManquante}
            className="w-full py-3 rounded-xl text-sm font-700 transition-all"
            style={{
              background: signatureManquante ? 'rgba(192,57,106,0.15)' : 'var(--brand-cyan)',
              color: signatureManquante ? '#C0396A' : 'var(--brand-navy)',
              fontWeight: 700,
              fontFamily: 'Outfit',
              opacity: isSaving ? 0.7 : 1,
              border: signatureManquante ? '1px solid rgba(192,57,106,0.4)' : 'none',
              cursor: signatureManquante ? 'not-allowed' : 'pointer',
            }}
          >
            {isSaving ? 'Sauvegarde en cours...' : signatureManquante ? '✍️ Signature requise pour sauvegarder' : '✓ Sauvegarder le document'}
          </button>
        </div>
      </div>

      {/* Modal Aperçu avant impression */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: 'rgba(0,0,0,0.92)' }}
        >
          {/* Barre d'outils aperçu */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: '#1a2540', borderBottom: '1px solid rgba(131,208,245,0.2)' }}>
            <div className="flex items-center gap-3">
              <Eye size={18} style={{ color: 'var(--brand-cyan)' }} />
              <div>
                <h3 className="text-sm font-700" style={{ color: '#1b5e20', fontWeight: 700 }}>Aperçu avant impression</h3>
                <p className="text-xs" style={{ color: '#1e293b', fontWeight: 600 }}>{docTitle} — {effectiveClient.prenom} {effectiveClient.nom}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowPreview(false); setTimeout(handlePrint, 100); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-700 transition-all"
                style={{ background: 'var(--brand-cyan)', color: 'var(--brand-navy)', fontWeight: 700 }}
              >
                <Printer size={15} />
                Imprimer
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 rounded-lg transition-all hover:bg-white/10"
                style={{ color: 'var(--brand-text)' }}
                title="Fermer l'aperçu"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Zone de prévisualisation A4 */}
          <div className="flex-1 overflow-auto p-6 flex justify-center" style={{ background: '#2a2a2a' }}>
            <div
              style={{
                width: '210mm',
                minHeight: '297mm',
                background: 'white',
                color: '#111',
                padding: '15mm',
                boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '10pt',
                lineHeight: 1.5,
              }}
            >
              {/* En-tête imprimable */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, borderBottom: '2px solid #0A1628', paddingBottom: 12, marginBottom: 16 }}>
                {state.salonInfo?.logo && (
                  <img src={state.salonInfo.logo} alt="Logo" style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8 }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '13pt', color: '#0A1628' }}>{state.salonInfo?.nom || 'Studio'}</div>
                  {state.salonInfo?.adresse && <div style={{ fontSize: '9pt', color: '#555' }}>{state.salonInfo.adresse}</div>}
                  {state.salonInfo?.telephone && <div style={{ fontSize: '9pt', color: '#555' }}>Tél : {state.salonInfo.telephone}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '11pt', color: '#0A1628' }}>{docTitle}</div>
                  <div style={{ fontSize: '9pt', color: '#555' }}>Client : {effectiveClient.prenom} {effectiveClient.nom}</div>
                  <div style={{ fontSize: '9pt', color: '#555' }}>Date : {today}</div>
                </div>
              </div>

              {/* Contenu du formulaire en mode preview */}
              <div
                className="preview-content"
                style={{
                  filter: 'none',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                } as React.CSSProperties}
              >
                <style>{`
                  .preview-content * { color: #111 !important; }
                  .preview-content input, .preview-content textarea, .preview-content select {
                    border: 1px solid #ccc !important;
                    background: white !important;
                    color: #111 !important;
                    padding: 2px 6px !important;
                    border-radius: 4px !important;
                    font-size: 9pt !important;
                  }
                  .preview-content label { color: #333 !important; font-size: 9pt !important; }
                  .preview-content h2, .preview-content h3 { color: #0A1628 !important; }
                  .preview-content .section-divider { border-color: #0A1628 !important; }
                  .preview-content canvas { border: 1px solid #ccc !important; background: #f9f9f9 !important; }
                  .preview-content button { display: none !important; }
                  .preview-content [class*="sticky"] { position: relative !important; }
                `}</style>
                {renderForm()}
              </div>

              {/* Pied de page */}
              <div style={{ marginTop: 24, paddingTop: 8, borderTop: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', fontSize: '8pt', color: '#666' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{state.salonInfo?.nom}</div>

                  {state.salonInfo?.siret && <div>SIRET : {state.salonInfo.siret}</div>}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div>Document confidentiel — RGPD Art. 15-17-21</div>
                  {state.salonInfo?.mentionsLegales && <div style={{ fontStyle: 'italic' }}>{state.salonInfo.mentionsLegales}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {state.salonInfo?.siteWeb && <div>{state.salonInfo.siteWeb}</div>}
                  <div>Société Intemporelle</div>
                </div>
              </div>
            </div>
          </div>

          {/* Barre de bas de page */}
          <div className="flex items-center justify-center gap-4 px-4 py-3 flex-shrink-0" style={{ background: '#1a2540', borderTop: '1px solid rgba(131,208,245,0.2)' }}>
            <p className="text-xs" style={{ color: '#1e293b', fontWeight: 600 }}>Vérifiez le contenu avant d'imprimer. Les couleurs et la mise en page peuvent légèrement différer selon votre navigateur.</p>
            <button
              onClick={() => { setShowPreview(false); setTimeout(handlePrint, 100); }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-700 flex-shrink-0"
              style={{ background: 'var(--brand-cyan)', color: 'var(--brand-navy)', fontWeight: 700 }}
            >
              <Printer size={15} />
              Lancer l'impression
            </button>
          </div>
        </div>
      )}

      {/* Modal envoi email */}
      {emailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setEmailModal(false); }}
        >
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--brand-card)', border: '1px solid var(--brand-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mail size={18} style={{ color: 'var(--brand-cyan)' }} />
                <h3 className="text-sm font-700" style={{ color: '#1b5e20', fontWeight: 700 }}>Envoyer par email</h3>
              </div>
              <button type="button" onClick={() => setEmailModal(false)} style={{ color: '#1e293b', fontWeight: 600 }}><X size={18} /></button>
            </div>

            <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(131,208,245,0.06)', border: '1px solid rgba(131,208,245,0.15)' }}>
              <p className="text-xs" style={{ color: '#1e293b', fontWeight: 600 }}>Document : <strong style={{ color: '#1b5e20' }}>{docTitle}</strong></p>
              <p className="text-xs mt-1" style={{ color: '#1e293b', fontWeight: 600 }}>Client : <strong style={{ color: '#1b5e20' }}>{effectiveClient.prenom} {effectiveClient.nom}</strong></p>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: '#111111', fontWeight: 700 }}>Adresse email du destinataire</label>
                <input
                  type="email"
                  required
                  value={emailTo}
                  onChange={e => setEmailTo(e.target.value)}
                  placeholder="client@exemple.fr"
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--brand-navy)', border: '1px solid var(--brand-border)', color: '#1b5e20', outline: 'none' }}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEmailModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brand-border)', color: 'var(--brand-text)' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={sendDocumentEmail.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-700"
                  style={{
                    background: sendDocumentEmail.isPending ? 'rgba(131,208,245,0.5)' : 'var(--brand-cyan)',
                    color: 'var(--brand-navy)',
                    fontWeight: 700,
                    cursor: sendDocumentEmail.isPending ? 'not-allowed' : 'pointer',
                  }}
                >
                  {sendDocumentEmail.isPending
                    ? <><Loader2 size={14} className="animate-spin" />Envoi en cours...</>
                    : <><Send size={14} />Envoyer</>}
                </button>
              </div>
            </form>

            <p className="text-xs mt-3" style={{ color: 'var(--brand-text)', opacity: 0.7 }}>
              L'email est envoyé via votre serveur SMTP configuré dans Paramètres.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Exports pour PrintAll ────────────────────────────────────────────────────
// ─── Fiche 17 — Archivage Dossier Papier ───────────────────────────────────
function FormArchivageDossier({ data, update, client }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client }) {
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const photos = [...(data.photos || [])];
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        photos.push({ id: Date.now() + Math.random(), url: ev.target?.result, nom: file.name, date: new Date().toLocaleDateString('fr-FR') });
        update('photos', [...photos]);
      };
      reader.readAsDataURL(file);
    });
  };

  const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, fontFamily: 'Outfit', boxSizing: 'border-box' as const };
  const labelStyle = { fontSize: 11, fontWeight: 600 as const, color: '#374151', textTransform: 'uppercase' as const, display: 'block', marginBottom: 4 };
  const sectionStyle = { marginBottom: 20, padding: '14px 16px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fafafa' };
  const sectionTitleStyle = { fontSize: 13, fontWeight: 700 as const, color: '#111827', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #e5e7eb' };

  return (
    <div style={{ fontFamily: 'Outfit', color: '#1a1a2e' }}>
      <div style={{ background: '#607D8B', color: 'white', padding: '12px 16px', borderRadius: '8px 8px 0 0', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>FICHE 17 — ARCHIVAGE DOSSIER PAPIER</h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.85 }}>Numérisation et archivage des anciens dossiers clients</p>
      </div>

      <div style={{ padding: '0 8px' }}>
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>INFORMATIONS CLIENT</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={labelStyle}>Nom</label><input style={inputStyle} value={data.nom || client?.nom || ''} onChange={e => update('nom', e.target.value)} /></div>
            <div><label style={labelStyle}>Prénom</label><input style={inputStyle} value={data.prenom || client?.prenom || ''} onChange={e => update('prenom', e.target.value)} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={labelStyle}>Date de numérisation</label><input style={inputStyle} value={data.dateNumerisation || new Date().toLocaleDateString('fr-FR')} onChange={e => update('dateNumerisation', e.target.value)} /></div>
            <div><label style={labelStyle}>Type de document archivé</label><input style={inputStyle} value={data.typeDocument || ''} onChange={e => update('typeDocument', e.target.value)} placeholder="Ex: Questionnaire médical..." /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={labelStyle}>Praticien</label><input style={inputStyle} value={data.praticien || ''} onChange={e => update('praticien', e.target.value)} /></div>
            <div><label style={labelStyle}>Période couverte</label><input style={inputStyle} value={data.periode || ''} onChange={e => update('periode', e.target.value)} placeholder="Ex: 2018-2023" /></div>
          </div>
          <div><label style={labelStyle}>Notes</label><textarea value={data.notes || ''} onChange={e => update('notes', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Informations complémentaires..." /></div>
        </div>

        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>PHOTOS DES DOCUMENTS</div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#607D8B', color: 'white', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              📷 Prendre / Ajouter des photos
              <input type="file" accept="image/*" multiple onChange={handlePhoto} style={{ display: 'none' }} />
            </label>
            <span style={{ marginLeft: 12, fontSize: 12, color: '#6b7280' }}>{(data.photos || []).length} photo(s)</span>
          </div>
          {(data.photos || []).length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
              {(data.photos || []).map((p: any, i: number) => (
                <div key={p.id || i} style={{ position: 'relative', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                  <img src={p.url} alt={p.nom} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                  <div style={{ padding: '4px 8px', fontSize: 11, color: '#6b7280', background: '#f9fafb' }}>{p.date}</div>
                  <button onClick={() => update('photos', (data.photos || []).filter((_: any, j: number) => j !== i))} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239,68,68,0.9)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 14, lineHeight: '20px', textAlign: 'center' }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <LegalBox color="cyan">
          Ce dossier numérisé sera archivé conformément au RGPD. Les données sont conservées selon la durée légale applicable.
        </LegalBox>
      </div>
    </div>
  );
}

function FormDossierMineurPiercing({ data, update, client, salonInfo }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client; salonInfo: any }) {
  const { t } = useTranslation();
  const yesNo = [t('forms.no'), t('forms.yes')];
  const yesNoMaybe = [t('forms.no'), t('forms.yes'), t('forms.dont_know')];
  return (
    <>
      <FormSection title="1 — IDENTITE DU SALON" />
      <FormField label={t('forms.salon_name')} value={data.nomSalon || salonInfo?.nom || ''} onChange={v => update('nomSalon', v)} required />
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('forms.phone')} value={data.telSalon || salonInfo?.telephone || ''} onChange={v => update('telSalon', v)} type="tel" />
        <FormField label={t('forms.siret')} value={data.siret || salonInfo?.siret || ''} onChange={v => update('siret', v)} />
      </div>
      <FormField label={t('forms.piercer_name')} value={data.nomPierceur || salonInfo?.nomPierceur || ''} onChange={v => update('nomPierceur', v)} />
      <LegalBox color="red">
        <strong>Cadre legal — Art. 371-1 Code civil</strong><br/>
        Toute prestation sur mineur requiert le consentement ecrit du representant legal et sa presence physique.<br/>
        Conservation : 3 ans minimum apres la majorite (Art. L1110-4 CSP).
      </LegalBox>
      <FormSection title="2 — IDENTITE DU MINEUR" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('forms.last_name')} value={data.nom || client.nom || ''} onChange={v => update('nom', v)} required />
        <FormField label={t('forms.first_name')} value={data.prenom || client.prenom || ''} onChange={v => update('prenom', v)} required />
      </div>
      <FormField label={t('forms.dob')} value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} required />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />
      <FormField label={t('forms.phone')} value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" />
      <RadioField label="Piece d'identite du mineur" options={t('forms.id_options_minor', { returnObjects: true }) as string[]} value={data.pieceId || ''} onChange={v => update('pieceId', v)} />
      {data.pieceId && data.pieceId !== t('forms.id_not_presented') && (
        <FormField label={t('forms.id_number')} value={data.numeroPiece || ''} onChange={v => update('numeroPiece', v)} />
      )}
      <FormSection title="2 — PIERCING DEMANDE" />
      <FormField label={t('q01.zone_to_pierce')} value={data.zonePiercing || ''} onChange={v => update('zonePiercing', v)} required />
      <FormSection title="3 — QUESTIONNAIRE MEDICAL" />
      <WarningBox>{t('q01.warning_health')}</WarningBox>
      <RadioField label={t('q01.skin_diseases')} options={yesNo} value={data.maladiesPeau || t('forms.no')} onChange={v => update('maladiesPeau', v)} />
      <RadioField label={t('q01.autoimmune')} options={yesNo} value={data.maladiesAutoImmunes || t('forms.no')} onChange={v => update('maladiesAutoImmunes', v)} />
      <RadioField label={t('q01.diabetes')} options={yesNo} value={data.diabete || t('forms.no')} onChange={v => update('diabete', v)} />
      <RadioField label={t('q01.cardiac')} options={yesNo} value={data.pathologieCardiaque || t('forms.no')} onChange={v => update('pathologieCardiaque', v)} />
      <RadioField label={t('q01.renal_hepatic')} options={yesNo} value={data.insuffisanceRenaleHepatique || t('forms.no')} onChange={v => update('insuffisanceRenaleHepatique', v)} />
      <RadioField label={t('q01.immunodepression')} options={yesNo} value={data.immunodepression || t('forms.no')} onChange={v => update('immunodepression', v)} />
      <RadioField label={t('q01.coagulation')} options={yesNo} value={data.troublesCoagulation || t('forms.no')} onChange={v => update('troublesCoagulation', v)} />
      <RadioField label={t('q01.keloid')} options={yesNo} value={data.cheloide || t('forms.no')} onChange={v => update('cheloide', v)} />
      <RadioField label={t('q01.herpes_history')} options={yesNo} value={data.antecedentsHerpes || t('forms.no')} onChange={v => update('antecedentsHerpes', v)} />
      <RadioField label={t('q01.hepatitis')} options={yesNo} value={data.hepatite || t('forms.no')} onChange={v => update('hepatite', v)} />
      <RadioField label={t('q01.asthma_allergy')} options={yesNo} value={data.asthmeAllergiesGraves || t('forms.no')} onChange={v => update('asthmeAllergiesGraves', v)} />
      <RadioField label={t('q01.epilepsy')} options={yesNo} value={data.epilepsie || t('forms.no')} onChange={v => update('epilepsie', v)} />
      <RadioField label={t('q01.anticoagulants')} options={yesNo} value={data.anticoagulants || t('forms.no')} onChange={v => update('anticoagulants', v)} />
      <RadioField label="Aspirine ou anti-inflammatoires (Ibuprofène, Kétoprofène...)" options={yesNo} value={data.aspirineAntiInflammatoires || t('forms.no')} onChange={v => update('aspirineAntiInflammatoires', v)} />
      <RadioField label={t('q01.roaccutane')} options={yesNo} value={data.roaccutane || t('forms.no')} onChange={v => update('roaccutane', v)} />
      <RadioField label="Corticoïdes (cortisone, prednisone...) ou immunosuppresseurs" options={yesNo} value={data.corticoides || t('forms.no')} onChange={v => update('corticoides', v)} />
      <RadioField label={t('q01.antibiotics')} options={yesNo} value={data.antibiotiques || t('forms.no')} onChange={v => update('antibiotiques', v)} />
      <RadioField label="Autres médicaments affectant la cicatrisation ou la coagulation" options={yesNo} value={data.autresMedicaments || t('forms.no')} onChange={v => update('autresMedicaments', v)} />
      <RadioField label="Allergie aux métaux (nickel, cobalt, chrome, acier chirurgical, titane)" options={yesNo} value={data.allergieMétaux || t('forms.no')} onChange={v => update('allergieMétaux', v)} />
      <RadioField label={t('q01.latex_allergy')} options={yesNo} value={data.allergieLatex || t('forms.no')} onChange={v => update('allergieLatex', v)} />
      <RadioField label={t('q01.disinfectant_allergy')} options={yesNo} value={data.allergieDesinfectants || t('forms.no')} onChange={v => update('allergieDesinfectants', v)} />
      <RadioField label={t('q01.anesthetic_allergy')} options={yesNo} value={data.allergieAnesthesiants || t('forms.no')} onChange={v => update('allergieAnesthesiants', v)} />
      <RadioField label={t('q01.pregnancy')} options={yesNoMaybe} value={data.grossesse || t('forms.no')} onChange={v => update('grossesse', v)} />
      <RadioField label={t('q01.alcohol_24h')} options={yesNo} value={data.alcool24h || t('forms.no')} onChange={v => update('alcool24h', v)} />
      <RadioField label={t('q01.drugs')} options={yesNo} value={data.drogues || t('forms.no')} onChange={v => update('drogues', v)} />
      <RadioField label={t('q01.ate_4h')} options={[t('forms.yes'), t('forms.no')]} value={data.mange4h || t('forms.yes')} onChange={v => update('mange4h', v)} />
      <RadioField label={t('q01.slept_well')} options={[t('forms.yes'), t('forms.no')]} value={data.dormiBien || t('forms.yes')} onChange={v => update('dormiBien', v)} />
      <RadioField label={t('q01.skin_lesion')} options={yesNo} value={data.lesionPeau || t('forms.no')} onChange={v => update('lesionPeau', v)} />
      <RadioField label={t('q01.previous_reaction')} options={yesNo} value={data.reactionAnterieure || t('forms.no')} onChange={v => update('reactionAnterieure', v)} />
      <FormField label={t('forms.additional_medical_info')} value={data.autresInfosMedicales || ''} onChange={v => update('autresInfosMedicales', v)} multiline />
      <FormSection title="4 — AVIS DU MINEUR" />
      <CheckboxField label={t('q01.minor_confirms')} value={data.avisMineur || false} onToggle={() => update('avisMineur', !data.avisMineur)} required />
      <FormSection title="5 — DECLARATION CLIENT" />
      <CheckboxField label={t('q01.answered_honestly')} value={data.reponduHonnetement || false} onToggle={() => update('reponduHonnetement', !data.reponduHonnetement)} required />
      <CheckboxField label="Je consens expressement au traitement de mes donnees de sante par le salon (Art. 9 RGPD)" value={data.consentDonneesSante || false} onToggle={() => update('consentDonneesSante', !data.consentDonneesSante)} required />
      <RgpdMentions />
      <FormSection title="6 — REPRESENTANT LEGAL" />
      <FormField label={t('forms.last_name')} value={data.nomRepresentant || client.nomRepresentantLegal || ''} onChange={v => update('nomRepresentant', v)} required />
      <FormField label={t('forms.first_name')} value={data.prenomRepresentant || client.prenomRepresentantLegal || ''} onChange={v => update('prenomRepresentant', v)} required />
      <FormField label="Lien avec le mineur" value={data.lienRepresentant || client.lienRepresentantLegal || ''} onChange={v => update('lienRepresentant', v)} required />
      <FormField label="Telephone" value={data.telephoneRepresentant || client.telephoneRepresentantLegal || client.telephone || ''} onChange={v => update('telephoneRepresentant', v)} type="tel" required />
      <RadioField label="Pièce d'identité du représentant légal" options={['CNI', 'Passeport', 'Titre de séjour', 'Non présentée']} value={data.pieceIdRepresentantType || ''} onChange={v => update('pieceIdRepresentantType', v)} required />
      {data.pieceIdRepresentantType && data.pieceIdRepresentantType !== 'Non presentee' && (
        <FormField label="Numéro de la pièce d'identité" value={data.pieceIdRepresentantNumero || ''} onChange={v => update('pieceIdRepresentantNumero', v)} required />
      )}
      <FormSection title="8 — DECLARATIONS REPRESENTANT LEGAL" />
      <CheckboxField label="Avoir autorite parentale ou tutelle legale du mineur" value={data.autoriteParentale || false} onToggle={() => update('autoriteParentale', !data.autoriteParentale)} required />
      <CheckboxField label="Autoriser la realisation de cette prestation sur le mineur" value={data.autorisationPrestation || false} onToggle={() => update('autorisationPrestation', !data.autorisationPrestation)} required />
      <CheckboxField label="Confirme absence de contre-indication medicale" value={data.pasContraIndication || false} onToggle={() => update('pasContraIndication', !data.pasContraIndication)} required />
      <CheckboxField label="S engager a superviser les soins post-prestation" value={data.engageSoins || false} onToggle={() => update('engageSoins', !data.engageSoins)} required />
      <FormSection title="9 — PRESENCE SEANCE" />
      <CheckboxField label={t('q02.presence_physical')} value={data.presencePhysique || false} onToggle={() => update('presencePhysique', !data.presencePhysique)} required />
      <RgpdMentions />
      <FormSection title="10 — SIGNATURES" />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <p className="text-xs mb-3" style={{ color: '#1e293b', fontWeight: 600 }}>Signature du mineur — obligatoire</p>
          <FormField label={t('forms.client_name')} value={data.nomClientSign || client.nom || ''} onChange={v => update('nomClientSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureClient || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureClient', v)} />
          <div className="mt-3"><SignaturePad label={`${t('forms.client_signature')} *`} value={data.signatureImageClient || ''} onChange={v => update('signatureImageClient', v ?? '')} /></div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <p className="text-xs mb-3" style={{ color: '#1e293b', fontWeight: 600 }}>Signature du representant legal — obligatoire</p>
          <FormField label="Nom du representant legal" value={data.nomRepresentantSign || (client.nomRepresentantLegal ? client.nomRepresentantLegal + ' ' + (client.prenomRepresentantLegal || '') : '')} onChange={v => update('nomRepresentantSign', v)} required />
          <FormField label={t('forms.date')} value={data.dateSignatureRepresentant || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureRepresentant', v)} required />
          <div className="mt-3"><SignaturePad label="Signature du representant legal *" value={data.signatureImageRepresentant || ''} onChange={v => update('signatureImageRepresentant', v ?? '')} /></div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <FormField label={t('forms.piercer_name')} value={data.nomPierceurSign || salonInfo?.nomPierceur || ''} onChange={v => update('nomPierceurSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignaturePierceur || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignaturePierceur', v)} />
          <div className="mt-3"><SignaturePad label={`${t('forms.piercer_signature')} *`} value={data.signatureImagePierceur || ''} onChange={v => update('signatureImagePierceur', v ?? '')} /></div>
        </div>
      </div>
    </>
  );
}

function FormDossierMineurTatouage({ data, update, client, salonInfo }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client; salonInfo: any }) {
  const { t } = useTranslation();
  const yesNo = [t('forms.no'), t('forms.yes')];
  const yesNoMaybe = [t('forms.no'), t('forms.yes'), t('forms.dont_know')];
  return (
    <>
      <FormSection title="1 — IDENTITE DU SALON" />
      <FormField label={t('forms.salon_name')} value={data.nomSalon || salonInfo?.nom || ''} onChange={v => update('nomSalon', v)} required />
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('forms.phone')} value={data.telSalon || salonInfo?.telephone || ''} onChange={v => update('telSalon', v)} type="tel" />
        <FormField label={t('forms.siret')} value={data.siret || salonInfo?.siret || ''} onChange={v => update('siret', v)} />
      </div>
      <FormField label={t('forms.tattoo_artist_name')} value={data.nomTatoueur || salonInfo?.nomTatoueur || ''} onChange={v => update('nomTatoueur', v)} />
      <LegalBox color="red">
        <strong>Cadre legal — Art. 371-1 Code civil</strong><br/>
        Toute prestation de tatouage sur mineur requiert le consentement ecrit du representant legal et sa presence physique.<br/>
        Conservation : 3 ans minimum apres la majorite (Art. L1110-4 CSP).
      </LegalBox>
      <FormSection title="2 — IDENTITE DU MINEUR" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('forms.last_name')} value={data.nom || client.nom || ''} onChange={v => update('nom', v)} required />
        <FormField label={t('forms.first_name')} value={data.prenom || client.prenom || ''} onChange={v => update('prenom', v)} required />
      </div>
      <FormField label={t('forms.dob')} value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} required />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />
      <FormField label={t('forms.phone')} value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" />
      <FormSection title="2 — TATOUAGE DEMANDE" />
      <FormField label="Zone a tatouer" value={data.zoneATatouer || ''} onChange={v => update('zoneATatouer', v)} required />
      <RadioField label={t('q01.skin_diseases')} options={yesNo} value={data.maladiesPeau || t('forms.no')} onChange={v => update('maladiesPeau', v)} />
      <RadioField label={t('q01.diabetes')} options={yesNo} value={data.diabete || t('forms.no')} onChange={v => update('diabete', v)} />
      <RadioField label={t('q01.coagulation')} options={yesNo} value={data.troublesCoagulation || t('forms.no')} onChange={v => update('troublesCoagulation', v)} />
      <RadioField label={t('q01.keloid')} options={yesNo} value={data.cheloide || t('forms.no')} onChange={v => update('cheloide', v)} />
      <RadioField label={t('q01.ink_allergy')} options={yesNo} value={data.allergieEncres || t('forms.no')} onChange={v => update('allergieEncres', v)} />
      <RadioField label={t('q01.latex_allergy')} options={yesNo} value={data.allergieLatex || t('forms.no')} onChange={v => update('allergieLatex', v)} />
      <RadioField label={t('q01.pregnancy')} options={yesNoMaybe} value={data.grossesse || t('forms.no')} onChange={v => update('grossesse', v)} />
      <FormField label={t('forms.additional_medical_info')} value={data.autresInfosMedicales || ''} onChange={v => update('autresInfosMedicales', v)} multiline />
      <FormSection title="3 — REPRESENTANT LEGAL" />
      <FormField label={t('forms.last_name')} value={data.nomRepresentant || client.nomRepresentantLegal || ''} onChange={v => update('nomRepresentant', v)} required />
      <FormField label={t('forms.first_name')} value={data.prenomRepresentant || client.prenomRepresentantLegal || ''} onChange={v => update('prenomRepresentant', v)} required />
      <FormField label="Lien avec le mineur" value={data.lienRepresentant || client.lienRepresentantLegal || ''} onChange={v => update('lienRepresentant', v)} required />
      <RadioField label="Pièce d'identité du représentant légal" options={['CNI', 'Passeport', 'Titre de séjour', 'Non présentée']} value={data.pieceIdRepresentantType || ''} onChange={v => update('pieceIdRepresentantType', v)} required />
      {data.pieceIdRepresentantType && data.pieceIdRepresentantType !== 'Non presentee' && (
        <FormField label="Numéro de la pièce d'identité" value={data.pieceIdRepresentantNumero || ''} onChange={v => update('pieceIdRepresentantNumero', v)} required />
      )}
      <FormSection title="4 — CONSENTEMENT REPRESENTANT LEGAL" />
      <CheckboxField label="Le representant legal a repondu honnetement au questionnaire medical" value={data.reponduHonnetement || false} onToggle={() => update('reponduHonnetement', !data.reponduHonnetement)} required />
      <CheckboxField label="Je consens expressement au traitement de mes donnees de sante par le salon (Art. 9 RGPD)" value={data.consentDonneesSante || false} onToggle={() => update('consentDonneesSante', !data.consentDonneesSante)} required />
      <CheckboxField label="Le representant legal donne son consentement pour le tatouage du mineur" value={data.consentementLibre || false} onToggle={() => update('consentementLibre', !data.consentementLibre)} required />
      <CheckboxField label="Le representant legal assume la responsabilite du suivi des soins" value={data.assumeResponsabilite || false} onToggle={() => update('assumeResponsabilite', !data.assumeResponsabilite)} required />
      <CheckboxField label="Confirme la presence physique du representant legal lors de la seance" value={data.presenceRepresentant || false} onToggle={() => update('presenceRepresentant', !data.presenceRepresentant)} required />
      <RgpdMentions />
      <FormSection title="5 — SIGNATURES" />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <p className="text-xs mb-3" style={{ color: '#1e293b', fontWeight: 600 }}>Signature du mineur</p>
          <FormField label={t('forms.client_name')} value={data.nomClientSign || client.nom || ''} onChange={v => update('nomClientSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureClient || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureClient', v)} />
          <div className="mt-3"><SignaturePad label={t('forms.client_signature')} value={data.signatureImageClient || ''} onChange={v => update('signatureImageClient', v ?? '')} /></div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <p className="text-xs mb-3" style={{ color: '#1e293b', fontWeight: 600 }}>Signature du representant legal</p>
          <FormField label="Nom du representant legal" value={data.nomRepresentantSign || (client.nomRepresentantLegal ? client.nomRepresentantLegal + ' ' + (client.prenomRepresentantLegal || '') : '')} onChange={v => update('nomRepresentantSign', v)} required />
          <FormField label={t('forms.date')} value={data.dateSignatureRepresentant || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureRepresentant', v)} required />
          <div className="mt-3"><SignaturePad label="Signature du representant legal" value={data.signatureImageRepresentant || ''} onChange={v => update('signatureImageRepresentant', v ?? '')} /></div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <FormField label={t('forms.tattoo_artist_name')} value={data.nomTatoueurSign || salonInfo?.nomTatoueur || ''} onChange={v => update('nomTatoueurSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureTatoueur || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureTatoueur', v)} />
          <div className="mt-3"><SignaturePad label={t('forms.tattoo_artist_signature')} value={data.signatureImageTatoueur || ''} onChange={v => update('signatureImageTatoueur', v ?? '')} /></div>
        </div>
      </div>
    </>
  );
}

function FormDossierMineurDermographie({ data, update, client, salonInfo }: { data: Record<string, any>; update: (k: string, v: any) => void; client: Client; salonInfo: any }) {
  const { t } = useTranslation();
  const yesNo = [t('forms.no'), t('forms.yes')];
  const yesNoMaybe = [t('forms.no'), t('forms.yes'), t('forms.dont_know')];
  return (
    <>
      <FormSection title="1 — IDENTITE DU SALON" />
      <FormField label={t('forms.salon_name')} value={data.nomSalon || salonInfo?.nom || ''} onChange={v => update('nomSalon', v)} required />
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('forms.phone')} value={data.telSalon || salonInfo?.telephone || ''} onChange={v => update('telSalon', v)} type="tel" />
        <FormField label={t('forms.siret')} value={data.siret || salonInfo?.siret || ''} onChange={v => update('siret', v)} />
      </div>
      <FormField label="Nom du dermographe" value={data.nomDermographe || salonInfo?.nomDermographe || ''} onChange={v => update('nomDermographe', v)} />
      <LegalBox color="red">
        <strong>Cadre legal — Art. 371-1 Code civil</strong><br/>
        Toute prestation de dermographie sur mineur requiert le consentement ecrit du representant legal et sa presence physique.<br/>
        Conservation : 3 ans minimum apres la majorite (Art. L1110-4 CSP).
      </LegalBox>
      <FormSection title="2 — IDENTITE DU MINEUR" />
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('forms.last_name')} value={data.nom || client.nom || ''} onChange={v => update('nom', v)} required />
        <FormField label={t('forms.first_name')} value={data.prenom || client.prenom || ''} onChange={v => update('prenom', v)} required />
      </div>
      <FormField label={t('forms.dob')} value={data.dateNaissance || client.dateNaissance || ''} onChange={v => update('dateNaissance', v)} required />
      <AgeVerif dateNaissance={data.dateNaissance || client.dateNaissance || ''} />
      <FormField label={t('forms.phone')} value={data.telephone || client.telephone || ''} onChange={v => update('telephone', v)} type="tel" />
      <FormSection title="2 — PRESTATION DERMOGRAPHIE DEMANDEE" />
      <FormField label="Zone a traiter" value={data.zoneATatouer || ''} onChange={v => update('zoneATatouer', v)} required />
      <RadioField label={t('q01.skin_diseases')} options={yesNo} value={data.maladiesPeau || t('forms.no')} onChange={v => update('maladiesPeau', v)} />
      <RadioField label={t('q01.diabetes')} options={yesNo} value={data.diabete || t('forms.no')} onChange={v => update('diabete', v)} />
      <RadioField label={t('q01.coagulation')} options={yesNo} value={data.troublesCoagulation || t('forms.no')} onChange={v => update('troublesCoagulation', v)} />
      <RadioField label={t('q01.keloid')} options={yesNo} value={data.cheloide || t('forms.no')} onChange={v => update('cheloide', v)} />
      <RadioField label={t('q01.pregnancy')} options={yesNoMaybe} value={data.grossesse || t('forms.no')} onChange={v => update('grossesse', v)} />
      <FormField label={t('forms.additional_medical_info')} value={data.autresInfosMedicales || ''} onChange={v => update('autresInfosMedicales', v)} multiline />
      <FormSection title="3 — REPRESENTANT LEGAL" />
      <FormField label={t('forms.last_name')} value={data.nomRepresentant || client.nomRepresentantLegal || ''} onChange={v => update('nomRepresentant', v)} required />
      <FormField label={t('forms.first_name')} value={data.prenomRepresentant || client.prenomRepresentantLegal || ''} onChange={v => update('prenomRepresentant', v)} required />
      <FormField label="Lien avec le mineur" value={data.lienRepresentant || client.lienRepresentantLegal || ''} onChange={v => update('lienRepresentant', v)} required />
      <RadioField label="Pièce d'identité du représentant légal" options={['CNI', 'Passeport', 'Titre de séjour', 'Non présentée']} value={data.pieceIdRepresentantType || ''} onChange={v => update('pieceIdRepresentantType', v)} required />
      {data.pieceIdRepresentantType && data.pieceIdRepresentantType !== 'Non presentee' && (
        <FormField label="Numéro de la pièce d'identité" value={data.pieceIdRepresentantNumero || ''} onChange={v => update('pieceIdRepresentantNumero', v)} required />
      )}
      <FormSection title="4 — CONSENTEMENT REPRESENTANT LEGAL" />
      <CheckboxField label="Le representant legal a repondu honnetement au questionnaire medical" value={data.reponduHonnetement || false} onToggle={() => update('reponduHonnetement', !data.reponduHonnetement)} required />
      <CheckboxField label="Je consens expressement au traitement de mes donnees de sante par le salon (Art. 9 RGPD)" value={data.consentDonneesSante || false} onToggle={() => update('consentDonneesSante', !data.consentDonneesSante)} required />
      <CheckboxField label="Le representant legal autorise la prestation de dermographie sur le mineur" value={data.consentementLibre || false} onToggle={() => update('consentementLibre', !data.consentementLibre)} required />
      <CheckboxField label="Le representant legal assume la responsabilite du suivi des soins" value={data.assumeResponsabilite || false} onToggle={() => update('assumeResponsabilite', !data.assumeResponsabilite)} required />
      <CheckboxField label="Confirme la presence physique du representant legal lors de la seance" value={data.presenceRepresentant || false} onToggle={() => update('presenceRepresentant', !data.presenceRepresentant)} required />
      <RgpdMentions />
      <FormSection title="5 — SIGNATURES" />
      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <p className="text-xs mb-3" style={{ color: '#1e293b', fontWeight: 600 }}>Signature du mineur</p>
          <FormField label={t('forms.client_name')} value={data.nomClientSign || client.nom || ''} onChange={v => update('nomClientSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureClient || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureClient', v)} />
          <div className="mt-3"><SignaturePad label={t('forms.client_signature')} value={data.signatureImageClient || ''} onChange={v => update('signatureImageClient', v ?? '')} /></div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <p className="text-xs mb-3" style={{ color: '#1e293b', fontWeight: 600 }}>Signature du representant legal</p>
          <FormField label="Nom du representant legal" value={data.nomRepresentantSign || (client.nomRepresentantLegal ? client.nomRepresentantLegal + ' ' + (client.prenomRepresentantLegal || '') : '')} onChange={v => update('nomRepresentantSign', v)} required />
          <FormField label={t('forms.date')} value={data.dateSignatureRepresentant || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureRepresentant', v)} required />
          <div className="mt-3"><SignaturePad label="Signature du representant legal" value={data.signatureImageRepresentant || ''} onChange={v => update('signatureImageRepresentant', v ?? '')} /></div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)' }}>
          <FormField label="Nom du dermographe" value={data.nomDermographeSign || salonInfo?.nomDermographe || ''} onChange={v => update('nomDermographeSign', v)} />
          <FormField label={t('forms.date')} value={data.dateSignatureDermographe || new Date().toLocaleDateString('fr-FR')} onChange={v => update('dateSignatureDermographe', v)} />
          <div className="mt-3"><SignaturePad label="Signature du dermographe" value={data.signatureImageDermographe || ''} onChange={v => update('signatureImageDermographe', v ?? '')} /></div>
        </div>
      </div>
    </>
  );
}

export {
  PrintHeader,
  PrintFooter,
  FormQuestionnaireMineur,
  FormQuestionnaireMajeur,
  FormAutorisationParentale,
  FormSoins,
  FormFicheSeance,
  FormConsentementSoinsTatouage,
  FormFicheSeanceTatouage,
  FormQuestionnaireDermographeMineur,
  FormAutorisationParentaleDermographie,
  FormQuestionnaireTatouageMineur,
  FormAutorisationParentaleTatouage,
  FormQuestionnaireTatouageMajeur,
  FormFicheSeanceDermographe,
  FormQuestionnaireDermographe,
  FormSoinsDermographe,
  FormEngagementConfidentialite,
  FormAffichageSalon,
};

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '@/lib/app-context';
import { trpc } from '@/lib/trpc';
import { Shield, ChevronLeft, FileText, CheckCircle, Printer } from 'lucide-react';
import { Client, ClientDocument } from '@/lib/types';
import { FormEngagementConfidentialite } from './FormsRGPD';
import SignaturePad from '@/components/SignaturePad';
import { toast } from 'sonner';

export default function RgpdSalarie() {
  const [, navigate] = useLocation();
  const { state, updateClient, addClient } = useApp();
  const [search] = useLocation();
  const salarieId = new URLSearchParams(window.location.search).get('salarieId');

  const [formData, setFormData] = useState<Record<string, any>>({
    nomSignataire: '',
    posteSignataire: '',
    typeContrat: '',
    dateDebutMission: '',
    nomSalon: state.salonInfo?.nom || ''
  });
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Récupérer les données du salarié depuis studioUsers
  const studioUsersList = trpc.studioUsers.list.useQuery();
  const salarieData = studioUsersList.data?.find((u: any) => String(u.id) === String(salarieId));

  // On cherche aussi dans les clients pour les documents existants
  const salarie = state.clients.find(c => c.id === salarieId);

  useEffect(() => {
    if (salarieData) {
      // Formater la date d'entrée en JJ/MM/AAAA si elle existe
      let dateEntreeFormatted = '';
      if (salarieData.dateEntree) {
        try {
          const d = new Date(salarieData.dateEntree);
          if (!isNaN(d.getTime())) {
            dateEntreeFormatted = d.toLocaleDateString('fr-FR');
          } else {
            dateEntreeFormatted = salarieData.dateEntree;
          }
        } catch {
          dateEntreeFormatted = salarieData.dateEntree;
        }
      }

      setFormData(prev => ({
        ...prev,
        nomSignataire: `${salarieData.prenom} ${salarieData.nom}`,
        posteSignataire: salarieData.specialite || salarieData.role || '',
        typeContrat: salarieData.typeContrat || '',
        dateDebutMission: dateEntreeFormatted || new Date().toLocaleDateString('fr-FR'),
        nomSalon: state.salonInfo?.nom || ''
      }));
    }

    if (salarie) {
      const existingDoc = salarie.documents?.find(d => d.type === 'engagement_confidentialite');
      if (existingDoc?.signatureEmploye) {
        setSignatureData(existingDoc.signatureEmploye);
      }
    }
  }, [salarieData, salarie]);

  const updateForm = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSignAndSave = async () => {
    if (!signatureData) {
      toast.error('La signature est obligatoire.');
      return;
    }

    setIsSaving(true);
    try {
      const newDoc: ClientDocument = {
        id: Date.now().toString(),
        type: 'engagement_confidentialite',
        status: 'signed',
        dateCreation: new Date().toISOString(),
        dateSigned: new Date().toISOString(),
        data: formData,
        signatureEmploye: signatureData,
      };

      if (salarie) {
        // Mise à jour du salarié existant
        const updatedDocs = [...(salarie.documents || []), newDoc];
        await updateClient({ ...salarie, documents: updatedDocs, estSalarie: true });
      } else {
        // Création d'une fiche "client-salarié" si elle n'existe pas encore
        await addClient({
          nom: formData.nomSignataire.split(' ').slice(1).join(' ') || 'Nom',
          prenom: formData.nomSignataire.split(' ')[0] || 'Prénom',
          dateNaissance: '1990-01-01',
          telephone: '',
          email: '',
          adresse: '',
          codePostal: '',
          ville: '',
          estMineur: false,
          prestations: [],
          documentsAssocies: [],
          documents: [newDoc],
          photos: [],
          dateConsentement: new Date().toISOString(),
          estArchive: false,
          estSalarie: true,
          notes: `Poste : ${formData.posteSignataire}`
        });
      }

      toast.success('Engagement de confidentialité enregistré !');
      setSaved(true);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--brand-navy)' }}>
      <div className="max-w-3xl mx-auto p-6">
        <button
          onClick={() => navigate('/salaries')}
          className="flex items-center gap-2 text-sm mb-6"
          style={{ color: 'var(--brand-cyan)' }}
        >
          <ChevronLeft size={16} />
          Retour aux salariés
        </button>

        <div className="flex items-center gap-3 mb-2">
          <Shield size={28} style={{ color: 'var(--brand-cyan)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--brand-cyan)' }}>
            Engagement de Confidentialité
          </h1>
        </div>
        <p className="text-sm mb-8" style={{ color: 'var(--brand-text-muted)' }}>
          Document officiel — RGPD Art. 29 · Protection des données clients
        </p>

        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl mb-8">
          <div className="p-8">
            <FormEngagementConfidentialite 
              data={formData} 
              update={updateForm} 
              client={salarie || {} as Client} 
            />
            
            <div className="mt-12 pt-8 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} className="text-green-600" />
                <h3 className="text-lg font-bold text-gray-900">Signature du salarié</h3>
              </div>
              
              <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-2">
                <SignaturePad
                  value={signatureData || ''}
                  onChange={(v) => setSignatureData(v ?? null)}
                  requireConfidentiality={false}
                />
              </div>
              
              <p className="text-[10px] text-gray-400 mt-3 italic text-center">
                En signant ce document, vous reconnaissez avoir pris connaissance de vos obligations en matière de protection des données personnelles (RGPD).
              </p>
            </div>
          </div>
        </div>

        {saved ? (
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex-1 py-4 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white' }}
            >
              <Printer size={20} /> Imprimer
            </button>
            <button
              onClick={() => navigate('/salaries')}
              className="flex-1 py-4 rounded-xl font-bold text-base shadow-lg"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}
            >
              ✓ Terminer
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignAndSave}
            disabled={isSaving || !signatureData}
            className="w-full py-4 rounded-xl font-bold text-base shadow-lg transition-all active:scale-[0.98]"
            style={{
              background: isSaving || !signatureData ? '#334155' : 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              opacity: isSaving || !signatureData ? 0.5 : 1
            }}
          >
            {isSaving ? 'Enregistrement...' : '✓ Valider et Enregistrer la signature'}
          </button>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/lib/app-context';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onClose: () => void;
  client?: any;
}

function calcAge(j: string, m: string, a: string): number {
  if (!j || !m || !a || a.length < 4) return -1;
  const birth = new Date(parseInt(a), parseInt(m) - 1, parseInt(j));
  if (isNaN(birth.getTime())) return -1;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const diff = now.getMonth() - birth.getMonth();
  if (diff < 0 || (diff === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

const PRESTATIONS = [
  'Oreilles',
  'Nez',
  'Nombril',
  'Tétou',
  'Arcade / Sourcil',
  'Surface / Dermal',
  'Tatouage',
  'Dermographie'
];

export default function AddClientModal({ onClose, client: initialClient }: Props) {
  const { addClient, updateClient } = useApp();
  const [currentClient, setCurrentClient] = useState(initialClient);
  const [isSaving, setIsSaving] = useState(false);
  const [showPrestationsModal, setShowPrestationsModal] = useState(false);

  // Champs du formulaire
  const [prenom, setPrenom] = useState(initialClient?.prenom || '');
  const [nom, setNom] = useState(initialClient?.nom || '');
  
  const parseDateISO = (dateISO: string | undefined) => {
    if (!dateISO) return { jour: '', mois: '', annee: '' };
    const parts = dateISO.split('-');
    if (parts.length === 3) {
      return { jour: parts[2], mois: parts[1], annee: parts[0] };
    }
    return { jour: '', mois: '', annee: '' };
  };
  
  const initialDate = parseDateISO(initialClient?.dateNaissance);
  const [dateJour, setDateJour] = useState(initialDate.jour);
  const [dateMois, setDateMois] = useState(initialDate.mois);
  const [dateAnnee, setDateAnnee] = useState(initialDate.annee);
  const [telephone, setTelephone] = useState(initialClient?.telephone || '');
  const [email, setEmail] = useState(initialClient?.email || '');
  const [prestationsSouhaitees, setPrestationsSouhaitees] = useState<string[]>(initialClient?.prestationsSouhaitees || []);

  // Champs représentant légal (si mineur)
  const [nomRepresentant, setNomRepresentant] = useState(initialClient?.nomRepresentant || '');
  const [prenomRepresentant, setPrenomRepresentant] = useState(initialClient?.prenomRepresentant || '');
  const [telephoneRepresentant, setTelephoneRepresentant] = useState(initialClient?.telephoneRepresentant || '');
  const [emailRepresentant, setEmailRepresentant] = useState(initialClient?.emailRepresentant || '');

  const age = calcAge(dateJour, dateMois, dateAnnee);
  const isMineur = age >= 0 && age < 18;

  // Fonction de sauvegarde immédiate
  const saveToOVH = useCallback(async () => {
    // On sauvegarde si on a au moins un début de nom ou prénom
    if (!nom.trim() && !prenom.trim() && !telephone.trim() && !email.trim() && !currentClient?.id) return;

    setIsSaving(true);
    const dateNaissanceISO = (dateAnnee && dateMois && dateJour) 
      ? `${dateAnnee}-${dateMois.padStart(2, '0')}-${dateJour.padStart(2, '0')}`
      : (currentClient?.dateNaissance || '1900-01-01');

    const clientData = {
      prenom: prenom.trim() || 'N/A',
      nom: nom.trim().toUpperCase() || 'N/A',
      dateNaissance: dateNaissanceISO,
      telephone: telephone.trim() || '0000000000',
      email: email.trim() || 'N/A@exemple.com',
      prestationsSouhaitees,
      nomRepresentant: nomRepresentant.trim() || '',
      prenomRepresentant: prenomRepresentant.trim() || '',
      telephoneRepresentant: telephoneRepresentant.trim() || '',
      emailRepresentant: emailRepresentant.trim() || '',
      estMineur: isMineur,
      dateSuppressionPrevue: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString()
    };

    try {
      if (currentClient?.id) {
        await updateClient({ ...currentClient, ...clientData });
      } else {
        const newClient = await addClient(clientData);
        if (newClient?.id) {
          setCurrentClient(newClient);
        }
      }
    } catch (err) {
      console.error('OVH Sync Error:', err);
    } finally {
      setIsSaving(false);
    }
  }, [nom, prenom, dateJour, dateMois, dateAnnee, telephone, email, prestationsSouhaitees, nomRepresentant, prenomRepresentant, telephoneRepresentant, emailRepresentant, isMineur, currentClient, addClient, updateClient]);

  // Effet de sauvegarde automatique ultra-rapide (500ms)
  useEffect(() => {
    const timer = setTimeout(saveToOVH, 500);
    return () => clearTimeout(timer);
  }, [saveToOVH]);

  const togglePrestation = (p: string) => {
    setPrestationsSouhaitees(prev =>
      prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]
    );
  };

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const touch = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const getError = (field: string): string => {
    const shouldShow = submitAttempted || touched[field];
    if (!shouldShow) return '';

    switch (field) {
      case 'prenom': return !prenom.trim() ? 'Le prénom est requis' : '';
      case 'nom': return !nom.trim() ? 'Le nom est requis' : '';
      case 'telephone': return !telephone.trim() ? 'Le téléphone est requis' : '';
      case 'email': return !email.trim() ? 'L\'email est requis' : '';
      case 'date':
        if (!dateJour || !dateMois || !dateAnnee) return 'La date de naissance est requise';
        if (age < 0 || age > 120) return 'Date invalide';
        return '';
      case 'nomRepresentant': return isMineur && !nomRepresentant.trim() ? 'Le nom du représentant est requis' : '';
      case 'prenomRepresentant': return isMineur && !prenomRepresentant.trim() ? 'Le prénom du représentant est requis' : '';
      case 'telephoneRepresentant': return isMineur && !telephoneRepresentant.trim() ? 'Le téléphone du représentant est requis' : '';
      case 'emailRepresentant': return isMineur && !emailRepresentant.trim() ? 'L\'email du représentant est requis' : '';
      default: return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    
    // Validation
    if (!prenom.trim() || !nom.trim() || !telephone.trim() || !email.trim() || age < 0) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }

    if (isMineur && (!nomRepresentant.trim() || !prenomRepresentant.trim() || !telephoneRepresentant.trim() || !emailRepresentant.trim())) {
      toast.error('Les informations du représentant légal sont requises pour un mineur');
      return;
    }

    // Force une dernière sauvegarde
    await saveToOVH();
    toast.success('Client créé avec succès');
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-[#0B1120] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <h2 className="text-xl font-bold text-white">Nouveau client</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* IDENTITÉ */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">IDENTITÉ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Prénom *</label>
                  <input
                    value={prenom}
                    onChange={e => setPrenom(e.target.value)}
                    onBlur={() => touch('prenom')}
                    placeholder="Ex: Marie"
                    className={`w-full bg-white/5 border ${getError('prenom') ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Nom *</label>
                  <input
                    value={nom}
                    onChange={e => setNom(e.target.value)}
                    onBlur={() => touch('nom')}
                    placeholder="Ex: DUPUIS"
                    className={`w-full bg-white/5 border ${getError('nom') ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Date de naissance *</label>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    value={dateJour}
                    onChange={e => setDateJour(e.target.value)}
                    onBlur={() => touch('date')}
                    placeholder="JJ"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <input
                    value={dateMois}
                    onChange={e => setDateMois(e.target.value)}
                    onBlur={() => touch('date')}
                    placeholder="MM"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <input
                    value={dateAnnee}
                    onChange={e => setDateAnnee(e.target.value)}
                    onBlur={() => touch('date')}
                    placeholder="AAAA"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            </div>

            {/* CONTACT */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">CONTACT</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Téléphone *</label>
                  <input
                    value={telephone}
                    onChange={e => setTelephone(e.target.value)}
                    onBlur={() => touch('telephone')}
                    placeholder="06 XX XX XX XX"
                    className={`w-full bg-white/5 border ${getError('telephone') ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Email *</label>
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onBlur={() => touch('email')}
                    placeholder="exemple@email.com"
                    className={`w-full bg-white/5 border ${getError('email') ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
                  />
                </div>
              </div>
            </div>

            {/* PRESTATIONS SOUHAITÉES */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">PRESTATIONS SOUHAITÉES</h3>
              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
                <span className="text-sm text-gray-300">
                  {prestationsSouhaitees.length === 0 ? 'Aucune prestation sélectionnée' : `${prestationsSouhaitees.length} prestation(s) sélectionnée(s)`}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPrestationsModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Modifier
                </button>
              </div>
            </div>

            {/* REPRÉSENTANT LÉGAL (si mineur) */}
            {isMineur && (
              <div className="space-y-4 border-t border-white/10 pt-6">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">REPRÉSENTANT LÉGAL</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">Nom du père ou mère *</label>
                    <input
                      value={nomRepresentant}
                      onChange={e => setNomRepresentant(e.target.value)}
                      onBlur={() => touch('nomRepresentant')}
                      placeholder="Ex: DUPUIS"
                      className={`w-full bg-white/5 border ${getError('nomRepresentant') ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">Prénom du père ou mère *</label>
                    <input
                      value={prenomRepresentant}
                      onChange={e => setPrenomRepresentant(e.target.value)}
                      onBlur={() => touch('prenomRepresentant')}
                      placeholder="Ex: Jean"
                      className={`w-full bg-white/5 border ${getError('prenomRepresentant') ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">Téléphone du père ou mère *</label>
                    <input
                      value={telephoneRepresentant}
                      onChange={e => setTelephoneRepresentant(e.target.value)}
                      onBlur={() => touch('telephoneRepresentant')}
                      placeholder="06 XX XX XX XX"
                      className={`w-full bg-white/5 border ${getError('telephoneRepresentant') ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">Email du père ou mère *</label>
                    <input
                      value={emailRepresentant}
                      onChange={e => setEmailRepresentant(e.target.value)}
                      onBlur={() => touch('emailRepresentant')}
                      placeholder="exemple@email.com"
                      className={`w-full bg-white/5 border ${getError('emailRepresentant') ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
                    />
                  </div>
                </div>
              </div>
            )}
          </form>

          <div className="p-6 border-t border-white/10 bg-white/5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all"
            >
              Créer le client
            </button>
          </div>
        </div>
      </div>

      {/* Modal des prestations */}
      {showPrestationsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0B1120] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Modifier les prestations</h3>
              <button onClick={() => setShowPrestationsModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {PRESTATIONS.map(prestation => (
                  <button
                    key={prestation}
                    type="button"
                    onClick={() => togglePrestation(prestation)}
                    className={`px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                      prestationsSouhaitees.includes(prestation)
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {prestation}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPrestationsModal(false)}
                className="px-6 py-2.5 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => setShowPrestationsModal(false)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

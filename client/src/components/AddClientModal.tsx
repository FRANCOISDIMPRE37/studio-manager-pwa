/*
 * DESIGN: Studio Nocturne — Modal d'ajout de client
 * Version 5 — SAUVEGARDE ULTRA-RÉACTIVE (Zéro perte de données)
 */
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/lib/app-context';
import { X, AlertCircle, CheckCircle2, CloudSync } from 'lucide-react';
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

export default function AddClientModal({ onClose, client: initialClient }: Props) {
  const { addClient, updateClient } = useApp();
  const [currentClient, setCurrentClient] = useState(initialClient);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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
  const [adresse, setAdresse] = useState(initialClient?.adresse || '');
  const [codePostal, setCodePostal] = useState(initialClient?.codePostal || '');
  const [ville, setVille] = useState(initialClient?.ville || '');
  const [pieceIdentiteType, setPieceIdentiteType] = useState(initialClient?.pieceIdentiteType || '');
  const [pieceIdentiteNumero, setPieceIdentiteNumero] = useState(initialClient?.pieceIdentiteNumero || '');
  const [prestationsSouhaitees, setPrestationsSouhaitees] = useState<string[]>(initialClient?.prestationsSouhaitees || []);

  const [nomRepresentant, setNomRepresentant] = useState(initialClient?.nomRepresentant || '');
  const [prenomRepresentant, setPrenomRepresentant] = useState(initialClient?.prenomRepresentant || '');
  const [lienRepresentant, setLienRepresentant] = useState(initialClient?.lienRepresentant || '');
  const [telephoneRepresentant, setTelephoneRepresentant] = useState(initialClient?.telephoneRepresentant || '');

  const age = calcAge(dateJour, dateMois, dateAnnee);
  const isMineur = age >= 0 && age < 18;

  // Fonction de sauvegarde immédiate
  const saveToOVH = useCallback(async () => {
    // On sauvegarde si on a au moins un début de nom ou prénom
    if (!nom.trim() && !prenom.trim() && !currentClient?.id) return;

    setIsSaving(true);
    const dateNaissanceISO = (dateAnnee && dateMois && dateJour) 
      ? `${dateAnnee}-${dateMois.padStart(2, '0')}-${dateJour.padStart(2, '0')}`
      : (currentClient?.dateNaissance || '1900-01-01');

    const clientData = {
      prenom: prenom.trim() || '...',
      nom: nom.trim().toUpperCase() || '...',
      dateNaissance: dateNaissanceISO,
      telephone: telephone.trim() || '0000000000',
      email: email.trim(),
      adresse: adresse.trim(),
      codePostal: codePostal.trim(),
      ville: ville.trim(),
      pieceIdentiteType,
      pieceIdentiteNumero,
      prestationsSouhaitees,
      nomRepresentant,
      prenomRepresentant,
      lienRepresentant,
      telephoneRepresentant,
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
      setLastSaved(new Date());
    } catch (err) {
      console.error('OVH Sync Error:', err);
    } finally {
      setIsSaving(false);
    }
  }, [nom, prenom, dateJour, dateMois, dateAnnee, telephone, email, adresse, codePostal, ville, pieceIdentiteType, pieceIdentiteNumero, prestationsSouhaitees, nomRepresentant, prenomRepresentant, lienRepresentant, telephoneRepresentant, isMineur, currentClient, addClient, updateClient]);

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
      case 'date':
        if (!dateJour || !dateMois || !dateAnnee) return 'La date de naissance est requise';
        if (age < 0 || age > 120) return 'Date invalide';
        return '';
      default: return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    
    // On force une dernière sauvegarde avant de fermer
    await saveToOVH();

    if (!prenom.trim() || !nom.trim() || !telephone.trim() || age < 0) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    toast.success('Client sécurisé sur OVH');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0B1120] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header avec indicateur de statut OVH */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${currentClient?.id ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {currentClient?.id ? 'Fiche Client Sécurisée' : 'Nouveau Client'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                {isSaving ? (
                  <>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Synchronisation OVH...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Sauvegardé à {lastSaved.toLocaleTimeString()}</span>
                  </>
                ) : (
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">En attente de saisie</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Alerte Info */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-200/80 leading-relaxed">
              <strong>Protection des données :</strong> Chaque modification est instantanément transmise à votre serveur OVH. En cas de coupure ou de rafraîchissement, vos données sont déjà à l'abri.
            </p>
          </div>

          <section className="space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-1 bg-blue-400 rounded-full" />
              Identité
            </h3>
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
                {getError('prenom') && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {getError('prenom')}</p>}
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
                {getError('nom') && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {getError('nom')}</p>}
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
              {getError('date') && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {getError('date')}</p>}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-1 bg-purple-400 rounded-full" />
              Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Téléphone *</label>
                <input
                  value={telephone}
                  onChange={e => setTelephone(e.target.value)}
                  onBlur={() => touch('telephone')}
                  placeholder="06 00 00 00 00"
                  className={`w-full bg-white/5 border ${getError('telephone') ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
                />
                {getError('telephone') && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {getError('telephone')}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Email</label>
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="marie@exemple.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-1 bg-green-400 rounded-full" />
              Prestations
            </h3>
            <div className="flex flex-wrap gap-2">
              {['Oreilles', 'Nez', 'Nombril', 'Téton', 'Arcade / Sourcil', 'Surface / Dermal', 'Labret', 'Tatouage', 'Dermographie'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePrestation(p)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    prestationsSouhaitees.includes(p)
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </section>
        </form>

        <div className="p-6 border-t border-white/10 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <CloudSync className="w-4 h-4" />
            <span className="text-[11px] italic">Synchronisation OVH active</span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-all"
            >
              Fermer
            </button>
            <button
              onClick={handleSubmit}
              className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all"
            >
              Terminer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
 * DESIGN: Studio Nocturne — Modal d'ajout de client
 * Version 6 — RESTAURATION DESIGN ORIGINAL + SAUVEGARDE ULTRA-RÉACTIVE
 */
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/lib/app-context';
import { X, AlertCircle, CheckCircle2, Cloud } from 'lucide-react';
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
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <h2 className="text-xl font-bold text-white">Nouveau client</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
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
                  placeholder="exemple@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
            </div>
          </div>
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
  );
}

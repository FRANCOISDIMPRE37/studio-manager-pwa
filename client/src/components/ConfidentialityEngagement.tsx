import { useState, useEffect } from 'react';

interface ConfidentialityEngagementProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (accepted: boolean, ipAddress: string) => void;
  documentType: string;
  salonInfo: {
    nom: string;
    adresse: string;
    email: string;
    telephone: string;
  };
}

export function ConfidentialityEngagement({
  isOpen,
  onClose,
  onAccept,
  documentType,
  salonInfo,
}: ConfidentialityEngagementProps) {
  const [ipAddress, setIpAddress] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => setIpAddress(data.ip))
        .catch(() => setIpAddress('unknown'));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAccept = () => {
    onAccept(true, ipAddress);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50" 
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-2xl max-h-[90vh] overflow-auto shadow-2xl"
        style={{ zIndex: 10000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4">🔐 Engagement de Confidentialité</h2>
        
        <div className="space-y-4 mb-6">
          <p className="text-sm">Pour {documentType}</p>
          
          <div className="bg-gray-100 p-4 rounded">
            <p className="font-semibold">{salonInfo.nom}</p>
            <p>{salonInfo.adresse}</p>
          </div>
          
          <div>
            <p className="font-semibold">Vous vous engagez à :</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Ne pas divulguer les informations confidentielles</li>
              <li>Respecter la confidentialité des données</li>
              <li>Ne pas photographier sans autorisation</li>
            </ul>
          </div>
          
          <div className="bg-red-50 border border-red-200 p-4 rounded">
            <p className="font-semibold text-red-800">⚠️ CLAUSE PÉNALE</p>
            <p className="text-sm">Articles 226-13 et suivants du Code pénal</p>
          </div>
          
          <p className="text-xs text-gray-500">
            IP: {ipAddress} | Date: {new Date().toLocaleString('fr-FR')}
          </p>
        </div>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Refuser
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}

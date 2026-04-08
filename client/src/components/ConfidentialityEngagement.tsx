import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.75)',
        zIndex: 9999,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px 24px',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          zIndex: 10000,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icône + Titre */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🔐</div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1f2e' }}>
            Engagement de Confidentialité
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#6b7280' }}>
            Signature du client
          </p>
        </div>

        {/* Infos salon */}
        <div style={{
          background: '#f3f4f6',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 20,
          borderLeft: '4px solid #6366f1',
        }}>
          <p style={{ margin: 0, fontWeight: 700, color: '#1a1f2e' }}>{salonInfo.nom}</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>{salonInfo.adresse}</p>
        </div>

        {/* Engagements */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontWeight: 600, color: '#1a1f2e', marginBottom: 10 }}>Vous vous engagez à :</p>
          {[
            '🔒 Ne pas divulguer les informations confidentielles',
            '📋 Respecter la confidentialité des données',
            '📷 Ne pas photographier sans autorisation',
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              marginBottom: 8,
              background: '#f9fafb',
              borderRadius: 8,
              fontSize: 14,
              color: '#374151',
            }}>
              {item}
            </div>
          ))}
        </div>

        {/* Clause pénale */}
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 20,
        }}>
          <p style={{ margin: 0, fontWeight: 700, color: '#dc2626', fontSize: 14 }}>⚠️ CLAUSE PÉNALE</p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#7f1d1d' }}>
            Articles 226-13 et suivants du Code pénal
          </p>
        </div>

        {/* IP + Date */}
        <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginBottom: 24 }}>
          IP: {ipAddress} | Date: {new Date().toLocaleString('fr-FR')}
        </p>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              background: 'white',
              color: '#6b7280',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Refuser
          </button>
          <button
            onClick={handleAccept}
            style={{
              flex: 2,
              padding: '14px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: 'white',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(34,197,94,0.4)',
            }}
          >
            ✓ Accepter
          </button>
        </div>
      </div>
    </div>);
  return createPortal(modal, document.body);
}

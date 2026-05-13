/**
 * SignaturePad – Composant de signature numérique avec engagement de confidentialité
 */
import { useRef, useEffect, useCallback, useState } from 'react';
import { RotateCcw, PenLine, CheckCircle } from 'lucide-react';
import { ConfidentialityEngagement } from './ConfidentialityEngagement';
import { trpc } from '@/lib/trpc';
import { useApp } from '@/lib/app-context';

interface SignaturePadProps {
  documentId?: string;
  requireConfidentiality?: boolean;
  value?: string;
  onChange: (base64: string | null) => void;
  label?: string;
  disabled?: boolean;
  width?: number;
  height?: number;
}

export default function SignaturePad({
  value,
  onChange,
  label = 'Signature',
  disabled = false,
  width = 480,
  height = 160,
  documentId,
  requireConfidentiality = true,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  
  // État pour l'engagement de confidentialité
  const [showConfidentiality, setShowConfidentiality] = useState(false);
  const [confidentialityAccepted, setConfidentialityAccepted] = useState(false);
  const updateDocument = trpc.documents.update.useMutation();
  const [confidentialityData, setConfidentialityData] = useState<{
    accepted: boolean;
    ip: string;
    timestamp: string;
  } | null>(null);

  // Infos du salon depuis les parametres
  const { state } = useApp();
  const salonInfo = state.salonInfo || { nom: '', adresse: '', email: '', telephone: '' };

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange(null);
  }, [onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;

    if (value && value.trim() !== '') {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setIsEmpty(false);
      };
      img.src = value;
    } else {
      clearCanvas();
    }
  }, [value]);

  const getCoordinates = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback((e: MouseEvent | TouchEvent) => {
    if (disabled) return;
    
    // Si l'engagement n'est pas accepté, l'afficher
    if (!confidentialityAccepted) {
      setShowConfidentiality(true);
      return;
    }

    e.preventDefault();
    setIsDrawing(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  }, [disabled, getCoordinates, confidentialityAccepted]);

  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawing || disabled || !confidentialityAccepted) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setIsEmpty(false);
  }, [isDrawing, disabled, getCoordinates, confidentialityAccepted]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const base64 = canvas.toDataURL('image/png');
    onChange(base64);
  }, [isDrawing, onChange]);



  const handleConfidentialityAccept = (accepted: boolean, ip: string) => {
    const data = {
      accepted,
      ip,
      timestamp: new Date().toISOString(),
    };
    setConfidentialityData(data);
    setConfidentialityAccepted(accepted);
   // Réinitialiser la taille du canvas après acceptation
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.strokeStyle = '#000000'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
    }, 50);
    if (accepted) {
      setTimeout(() => {
        const el = document.querySelector('[data-signature-pad]');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }

    // Sauvegarder en base si documentId fourni
    if (documentId && accepted) {
      updateDocument.mutate({
        id: documentId,
        confidentialityAccepted: true,
        confidentialityAcceptedAt: data.timestamp,
        confidentialityIpAddress: ip,
      });
    }
  };

  const isDrawingRef = useRef(false);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // Initialiser la taille du canvas à chaque changement d'état
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  useEffect(() => { initCanvas(); }, []);
  useEffect(() => { if (confidentialityAccepted) setTimeout(initCanvas, 100); }, [confidentialityAccepted, initCanvas]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    if (!confidentialityAccepted) { if (!showConfidentiality) setShowConfidentiality(true); return; }
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch(err) {}
    isDrawingRef.current = true;
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || disabled) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setIsEmpty(false);
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL('image/png'));
  };

  return (
    <div className="space-y-2" data-signature-pad>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2" style={{ color: "#111111" }}>
          <PenLine className="w-4 h-4" />
          {label}
          {confidentialityAccepted && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Engagement accepté
            </span>
          )}
        </label>
        <button
          type="button"
          onClick={clearCanvas}
          disabled={disabled || isEmpty}
          className="text-xs px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          Effacer
        </button>
      </div>

      <div
        className={`
          border-2 border-dashed rounded-lg overflow-hidden
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white cursor-crosshair'}
          ${!confidentialityAccepted ? 'border-orange-300' : 'border-gray-300'}
        `}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full touch-none"
          style={{ touchAction: 'none', WebkitUserSelect: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

      {requireConfidentiality && showConfidentiality && !confidentialityAccepted && (
        <div className="text-xs text-orange-600 flex items-center gap-2 bg-orange-50 p-2 rounded">
          <span>⚠️</span>
          <span>
            Vous devez accepter l'engagement de confidentialité avant de signer.
            Cliquez dans la zone de signature pour l'afficher.
          </span>
        </div>
      )}

      {confidentialityData && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <div className="font-semibold mb-1">Traçabilité :</div>
          <div>IP : {confidentialityData.ip}</div>
          <div>Date : {new Date(confidentialityData.timestamp).toLocaleString('fr-FR')}</div>
        </div>
      )}

      {showConfidentiality && !confidentialityAccepted && (
        <div style={{ background: 'white', border: '2px solid #6366f1', borderRadius: 16, padding: '24px 20px', marginTop: 8 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 36 }}>🔐</div>
            <h3 style={{ margin: '8px 0 4px', fontSize: 18, fontWeight: 700, color: '#1a1f2e' }}>Engagement de Confidentialité</h3>
          </div>
          <div style={{ background: '#f3f4f6', borderRadius: 8, padding: '10px 14px', marginBottom: 14, borderLeft: '4px solid #6366f1' }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#1a1f2e', fontSize: 14 }}>{salonInfo.nom}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>{salonInfo.adresse}</p>
          </div>
          <div style={{ marginBottom: 14 }}>
            {['🔒 Ne pas divulguer les informations confidentielles', '📋 Respecter la confidentialité des données', '📷 Ne pas photographier sans autorisation'].map((item, i) => (
              <div key={i} style={{ padding: '8px 12px', marginBottom: 6, background: '#f9fafb', borderRadius: 8, fontSize: 13, color: '#374151' }}>{item}</div>
            ))}
          </div>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#dc2626', fontSize: 13 }}>⚠️ CLAUSE PÉNALE</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#7f1d1d' }}>Articles 226-13 et suivants du Code pénal</p>
          </div>
          <p style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', marginBottom: 14 }}>Date : {new Date().toLocaleString('fr-FR')}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowConfidentiality(false)} style={{ flex: 1, padding: '12px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', color: '#6b7280', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Refuser</button>
            <button onClick={() => handleConfidentialityAccept(true, '')} style={{ flex: 2, padding: '12px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>✓ Accepter</button>
          </div>
        </div>
      )}
    </div>
  );
}

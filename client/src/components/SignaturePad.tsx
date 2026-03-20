/**
 * SignaturePad — Composant de signature numérique tactile et souris
 * Supporte touch (mobile/tablette) et mouse (desktop)
 * Sauvegarde la signature en base64 PNG via le prop onChange
 */
import { useRef, useEffect, useCallback, useState } from 'react';
import { RotateCcw, PenLine, CheckCircle } from 'lucide-react';

interface SignaturePadProps {
  value?: string;          // base64 PNG existant
  onChange: (base64: string | null) => void;
  label?: string;          // ex: "Signature du client"
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
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [isEmpty, setIsEmpty] = useState(!value);
  const [hasSaved, setHasSaved] = useState(!!value);

  // Initialiser le canvas avec la valeur existante
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fond transparent
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = value;
      setIsEmpty(false);
      setHasSaved(true);
    } else {
      setIsEmpty(true);
      setHasSaved(false);
    }
  }, [value]);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = useCallback((e: MouseEvent | TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawing.current = true;
    lastPos.current = getPos(e, canvas);
    setIsEmpty(false);
    setHasSaved(false);
  }, [disabled]);

  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawing.current || disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !lastPos.current) return;

    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#E8F4FD';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
  }, [disabled]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    lastPos.current = null;
  }, []);

  // Attacher les événements natifs (pour preventDefault sur touch)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [startDrawing, draw, stopDrawing]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    setHasSaved(false);
    onChange(null);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;
    const base64 = canvas.toDataURL('image/png');
    onChange(base64);
    setHasSaved(true);
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center gap-2">
        <PenLine size={14} style={{ color: 'var(--brand-cyan)' }} />
        <span className="text-sm font-600" style={{ color: 'var(--brand-text)', fontWeight: 600 }}>
          {label}
        </span>
        {hasSaved && (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(76,175,80,0.15)', color: '#4CAF50' }}>
            <CheckCircle size={10} />
            Enregistrée
          </span>
        )}
      </div>

      {/* Canvas */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          border: `1.5px solid ${disabled ? 'var(--brand-border)' : 'var(--brand-cyan)'}`,
          background: 'rgba(255,255,255,0.03)',
          maxWidth: '100%',
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            display: 'block',
            width: '100%',
            height: `${height}px`,
            cursor: disabled ? 'not-allowed' : 'crosshair',
            touchAction: 'none',
          }}
        />
        {/* Placeholder */}
        {isEmpty && !disabled && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ color: 'var(--brand-text-muted)' }}
          >
            <p className="text-sm opacity-50">Signez ici avec votre doigt ou la souris</p>
          </div>
        )}
        {/* Ligne de base */}
        <div
          className="absolute bottom-8 left-8 right-8 pointer-events-none"
          style={{ borderBottom: '1px dashed rgba(255,255,255,0.15)' }}
        />
      </div>

      {/* Actions */}
      {!disabled && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-80"
            style={{ background: 'rgba(244,67,54,0.1)', color: '#F44336', border: '1px solid rgba(244,67,54,0.3)' }}
          >
            <RotateCcw size={11} />
            Effacer
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isEmpty}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'rgba(76,175,80,0.15)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.3)' }}
          >
            <CheckCircle size={11} />
            Valider la signature
          </button>
        </div>
      )}

      {/* Affichage de la signature sauvegardée en mode lecture */}
      {disabled && value && (
        <img
          src={value}
          alt="Signature"
          className="rounded-lg"
          style={{ maxWidth: '100%', height: `${height}px`, objectFit: 'contain', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)' }}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Smartphone, RefreshCw, XCircle, AlertCircle } from 'lucide-react';

interface NfcReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCardDetected: (cardUid: string) => void;
  title?: string;
}

export const NfcReaderModal: React.FC<NfcReaderModalProps> = ({
  isOpen,
  onClose,
  onCardDetected,
  title = 'Acerque la Tarjeta NFC al Dispositivo',
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualUid, setManualUid] = useState('');

  useEffect(() => {
    let ndefController: AbortController | null = null;

    if (isOpen) {
      setErrorMsg(null);
      if ('NDEFReader' in window) {
        try {
          ndefController = new AbortController();
          const ndef = new (window as any).NDEFReader();
          setIsScanning(true);
          ndef.scan({ signal: ndefController.signal })
            .then(() => {
              ndef.onreading = (event: any) => {
                const serialNumber = event.serialNumber;
                const formattedUid = serialNumber.replace(/:/g, '').toUpperCase();
                onCardDetected(formattedUid);
              };
              ndef.onreadingerror = () => {
                setErrorMsg('Error de lectura física. Mantenga la tarjeta firme.');
              };
            })
            .catch((err: any) => {
              setErrorMsg(`Permiso NFC no disponible: ${err.message}`);
              setIsScanning(false);
            });
        } catch {
          setErrorMsg('No fue posible inicializar el lector NFC.');
          setIsScanning(false);
        }
      } else {
        setIsScanning(false);
      }
    }

    return () => {
      if (ndefController) ndefController.abort();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center">
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">Actividad Escolar - Cobro con Tarjeta Virtual</p>

        <div className="relative my-8 flex justify-center items-center">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center border-4 border-indigo-500/20 animate-pulse">
            <Smartphone className="w-10 h-10 text-indigo-600" />
          </div>
        </div>

        {isScanning ? (
          <p className="text-emerald-700 font-medium flex items-center justify-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" /> Sensor NFC listo. Acerque la tarjeta...
          </p>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left mb-4">
            <div className="flex gap-2 text-slate-700 text-xs mb-2">
              <AlertCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span><strong>Modo Prueba / Simulación:</strong> Escriba el UID de la tarjeta:</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej: 04A1B2C3D4E5F6"
                value={manualUid}
                onChange={(e) => setManualUid(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none font-mono uppercase"
              />
              <button
                onClick={() => {
                  if (manualUid.trim()) onCardDetected(manualUid.trim());
                }}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
              >
                Simular
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mt-2 text-red-600 text-xs flex items-center justify-center gap-1">
            <XCircle className="w-4 h-4" /> {errorMsg}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

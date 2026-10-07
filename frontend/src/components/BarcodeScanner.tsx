import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

interface Props {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader
      .decodeFromVideoDevice(null, videoRef.current!, (result, err) => {
        if (result) {
          onScan(result.getText());
        }
        if (err && err.name !== 'NotFoundException') {
          console.error('Barcode error:', err);
        }
      })
      .catch((err) => {
        console.error('Camera error:', err);
        setError('Could not access camera. Please check permissions.');
      });

    return () => {
      reader.reset();
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-amber-400">Scan Barcode</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">
            ✕
          </button>
        </div>

        {error ? (
          <div className="bg-slate-800 rounded-xl p-6 text-center">
            <p className="text-rose-400 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="relative rounded-xl overflow-hidden border-2 border-amber-400">
              <video ref={videoRef} className="w-full" />
              <div className="absolute inset-0 border-2 border-amber-400/50 m-8 rounded-lg pointer-events-none" />
            </div>
            <p className="text-center text-slate-400 mt-4 text-sm">
              Point camera at barcode
            </p>
          </>
        )}
      </div>
    </div>
  );
}

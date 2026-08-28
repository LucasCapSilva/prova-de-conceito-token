import { useCallback, useEffect, useRef, useState } from "react";

interface DetectedBarcodeLike {
  readonly rawValue: string;
}

interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcodeLike[]>;
}

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

function getDetectorCtor(): BarcodeDetectorCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { BarcodeDetector?: BarcodeDetectorCtor };
  return w.BarcodeDetector ?? null;
}

export function barcodeSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof navigator === "undefined" || !navigator.mediaDevices) return false;
  return getDetectorCtor() !== null;
}

export function useBarcodeScan(onDetected: (code: string) => void) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const sessionRef = useRef(0);
  const cbRef = useRef(onDetected);
  cbRef.current = onDetected;

  const stop = useCallback(() => {
    sessionRef.current++;
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const stream = streamRef.current;
    streamRef.current = null;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
  }, []);

  const start = useCallback(async () => {
    const session = ++sessionRef.current;
    setError(null);
    const Ctor = getDetectorCtor();
    if (!Ctor || typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Seu navegador não suporta leitura por câmera. Digite o código manualmente.");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
    } catch {
      setError("Não foi possível acessar a câmera. Digite o código manualmente.");
      return;
    }
    if (sessionRef.current !== session) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      return;
    }
    video.srcObject = stream;
    try {
      await video.play();
    } catch {
      /* autoplay pode exigir interação; segue com a captura */
    }
    const detector = new Ctor({ formats: ["ean_13", "ean_8", "upc_a", "code_128"] });
    const seen = new Set<string>();
    setScanning(true);
    timerRef.current = window.setInterval(() => {
      const v = videoRef.current;
      if (!v) return;
      detector
        .detect(v)
        .then((bars) => {
          for (const b of bars) {
            const clean = b.rawValue.replace(/[^0-9]/g, "");
            if (clean.length >= 8 && clean.length <= 13 && !seen.has(clean)) {
              seen.add(clean);
              stop();
              cbRef.current(clean);
              return;
            }
          }
        })
        .catch(() => {
          /* frame sem código detectável */
        });
    }, 250);
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { scanning, error, videoRef, start, stop };
}

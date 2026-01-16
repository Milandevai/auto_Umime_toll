
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { analyzeScreen } from './geminiService';
import { AnalysisResult } from './types';
import FloatingPanel from './components/FloatingPanel';

const App: React.FC = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<{ message: string; isQuota: boolean } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCapture = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  useEffect(() => {
    if (isCapturing && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(err => console.error("Video play failed:", err));
    }
  }, [isCapturing]);

  const handleSelectKey = async () => {
    try {
      await (window as any).aistudio.openSelectKey();
      setError(null);
    } catch (err) {
      console.error("Key selection failed:", err);
    }
  };

  const startCapture = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          cursor: "always",
          width: { ideal: 960 }, // Optimalizované rozlišení pro Lite model
          frameRate: { ideal: 10 }
        } as any,
        audio: false
      });
      
      streamRef.current = stream;
      setIsCapturing(true);

      stream.getVideoTracks()[0].onended = () => {
        stopCapture();
      };
    } catch (err: any) {
      setError({ message: "Nepodařilo se spustit sdílení.", isQuota: false });
    }
  };

  const captureAndAnalyze = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !isCapturing) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      if (video.paused) await video.play().catch(() => {});

      let attempts = 0;
      while (video.readyState < 2 && attempts < 15) {
        await new Promise(resolve => setTimeout(resolve, 30));
        attempts++;
      }

      const MAX_DIMENSION = 720;
      let width = video.videoWidth || 960;
      let height = video.videoHeight || 540;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });
      
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        // Nižší kvalita JPEG pro bleskové nahrávání a obejití limitů objemu dat
        const base64Image = canvas.toDataURL('image/jpeg', 0.4).split(',')[1];
        const result = await analyzeScreen(base64Image);
        setLastResult(result);
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      const isQuotaError = err.message === "QUOTA_EXHAUSTED";
      setError({ 
        message: isQuotaError ? "API je přetížené. Zkuste to za chvíli." : "Zkuste to znovu.", 
        isQuota: isQuotaError 
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    return () => stopCapture();
  }, [stopCapture]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
      </div>

      <header className="mb-8 text-center max-w-2xl relative">
        <div className="absolute -top-4 -right-24">
          <button 
            onClick={handleSelectKey}
            title="Nastavení klíče"
            className="p-2 text-slate-300 hover:text-indigo-400 transition-colors"
          >
            <i className="fas fa-cog"></i>
          </button>
        </div>
        <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl shadow-lg mb-4">
          <i className="fas fa-bolt text-2xl text-white"></i>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">
          LITE <span className="text-indigo-600">Umíme To</span>
        </h1>
        <p className="text-slate-500 text-sm">Model Flash Lite s nejvyšší kvótou požadavků.</p>
      </header>

      <main className="w-full max-w-4xl flex flex-col items-center gap-6">
        {!isCapturing ? (
          <button
            onClick={startCapture}
            className="flex items-center gap-3 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-lg shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <i className="fas fa-desktop"></i>
            Sdílet obrazovku
          </button>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="relative w-full max-w-2xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border-2 border-white">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-contain"
              />
              <button
                onClick={stopCapture}
                className="absolute top-3 right-3 p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full backdrop-blur-sm"
              >
                <i className="fas fa-times"></i>
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <button
                  onClick={captureAndAnalyze}
                  disabled={isAnalyzing}
                  className={`px-8 py-3 ${isAnalyzing ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-full font-bold text-base shadow-2xl transition-all active:scale-95`}
                >
                  {isAnalyzing ? "Hledám řešení..." : "VYŘEŠIT ÚKOL"}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className={`w-full max-w-xl p-4 rounded-xl border flex flex-col gap-3 shadow-lg transform transition-all ${error.isQuota ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-red-50 border-red-300 text-red-900'}`}>
            <div className="flex items-center gap-3 font-bold">
              <i className={`fas ${error.isQuota ? 'fa-clock text-amber-600' : 'fa-exclamation-circle text-red-600'}`}></i>
              {error.message}
            </div>
            {error.isQuota && (
              <p className="text-xs">Model má momentálně moc práce. Zkuste kliknout na tlačítko znovu za pár sekund.</p>
            )}
          </div>
        )}
      </main>

      <canvas ref={canvasRef} className="hidden" />

      {isCapturing && (
        <FloatingPanel 
          result={lastResult} 
          isAnalyzing={isAnalyzing} 
          onReanalyze={captureAndAnalyze} 
        />
      )}
    </div>
  );
};

export default App;

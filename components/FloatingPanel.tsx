
import React, { useState, useEffect } from 'react';
import { AnalysisResult } from '../types';

interface FloatingPanelProps {
  result: AnalysisResult | null;
  isAnalyzing: boolean;
  onReanalyze: () => void;
}

const FloatingPanel: React.FC<FloatingPanelProps> = ({ result, isAnalyzing, onReanalyze }) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (result) setIsVisible(true);
  }, [result]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(10, Math.min(window.innerWidth - 410, e.clientX - dragOffset.x)),
          y: Math.max(10, Math.min(window.innerHeight - 300, e.clientY - dragOffset.y))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
      >
        <i className="fas fa-lightbulb text-xl"></i>
      </button>
    );
  }

  return (
    <div 
      className={`fixed z-50 w-[380px] rounded-3xl overflow-hidden glass shadow-2xl transition-opacity duration-300 ${isDragging ? 'opacity-80 scale-95' : 'opacity-100 scale-100'}`}
      style={{ left: position.x, top: position.y }}
    >
      {/* Header / Drag Bar */}
      <div 
        onMouseDown={handleMouseDown}
        className="bg-indigo-600 p-4 cursor-move flex items-center justify-between"
      >
        <div className="flex items-center gap-2 text-white font-bold">
          <i className="fas fa-brain"></i>
          <span>Řešení & Vysvětlení</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onReanalyze}
            disabled={isAnalyzing}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <i className={`fas fa-sync-alt ${isAnalyzing ? 'animate-spin' : ''}`}></i>
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
        {!result ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <i className="fas fa-camera text-2xl"></i>
            </div>
            <p className="text-slate-500 font-medium">Zatím žádná data. Klikněte na tlačítko "Vyřešit" v hlavním okně.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Otázka</h3>
              <p className="text-slate-900 font-medium leading-relaxed">{result.question}</p>
            </section>

            <section className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Správná Odpověď</h3>
              <p className="text-emerald-900 font-bold text-xl">{result.answer}</p>
            </section>

            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Proč?</h3>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{result.explanation}</p>
            </section>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 italic">
              <span>Analyzováno pomocí Gemini 3</span>
              <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Status Indicator */}
      {isAnalyzing && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
          </div>
          <span className="text-indigo-600 font-bold text-sm tracking-widest uppercase">Přemýšlím...</span>
        </div>
      )}
    </div>
  );
};

export default FloatingPanel;

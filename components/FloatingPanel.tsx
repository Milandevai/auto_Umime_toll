
import React, { useState, useEffect } from 'react';
import { AnalysisResult } from '../types';

interface FloatingPanelProps {
  result: AnalysisResult | null;
  isAnalyzing: boolean;
  onReanalyze: () => void;
}

const FloatingPanel: React.FC<FloatingPanelProps> = ({ result, isAnalyzing, onReanalyze }) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 400, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  useEffect(() => {
    if (result) {
      setIsVisible(true);
      setCopyStatus('idle');
    }
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
          x: Math.max(0, Math.min(window.innerWidth - 380, e.clientX - dragOffset.x)),
          y: Math.max(0, Math.min(window.innerHeight - 300, e.clientY - dragOffset.y))
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

  const copyAutoClickScript = () => {
    if (!result) return;
    
    const cleanAnswer = result.answer.replace(/"/g, '\\"');
    // Vylepšený skript pro Umíme To
    const script = `
(function() {
  const ans = "${cleanAnswer}".toLowerCase().trim();
  console.log('%c[Turbo] Hledám odpověď: ' + ans, 'color: #6366f1; font-weight: bold');

  // 1. Zkusíme najít tlačítka nebo volby podle textu
  const selectors = [
    'button', '.choice', '.option', '.answer-button', 
    '.tile', 'span', 'div[role="button"]', 'a'
  ];
  
  let found = false;
  for (const selector of selectors) {
    const elements = [...document.querySelectorAll(selector)];
    const target = elements.find(el => {
      const txt = el.innerText.toLowerCase().trim();
      return txt === ans || (txt.length > 0 && ans === txt) || (ans.includes(txt) && txt.length > 3);
    });

    if (target) {
      target.click();
      console.log('%c[Turbo] KLIKNUTO!', 'color: #10b981; font-weight: bold');
      found = true;
      break;
    }
  }

  // 2. Pokud jsme nenašli klikací prvek, zkusíme doplňovací pole
  if (!found) {
    const input = document.querySelector('input[type="text"], textarea, .inputField, .answer-input');
    if (input) {
      input.value = "${cleanAnswer}";
      input.innerText = "${cleanAnswer}";
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }));
      console.log('%c[Turbo] VYPSÁNO!', 'color: #10b981; font-weight: bold');
      found = true;
    }
  }

  if (!found) {
    alert('Prvek pro "' + ans + '" nebyl nalezen. Zkuste kliknout ručně.');
  }
})();
    `.trim();

    navigator.clipboard.writeText(script).then(() => {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 4000);
    });
  };

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-[9999]"
      >
        <i className="fas fa-bolt text-2xl"></i>
      </button>
    );
  }

  return (
    <div 
      className={`fixed z-[9999] w-[360px] rounded-3xl overflow-hidden glass shadow-2xl transition-all duration-300 ${isDragging ? 'opacity-80 scale-95 ring-2 ring-indigo-400' : 'opacity-100 scale-100'}`}
      style={{ left: position.x, top: position.y }}
    >
      {/* Header */}
      <div 
        onMouseDown={handleMouseDown}
        className="bg-indigo-600 p-4 cursor-move flex items-center justify-between"
      >
        <div className="flex items-center gap-2 text-white font-bold tracking-tight">
          <i className="fas fa-magic text-indigo-200"></i>
          <span>Umíme To Auto-Helper</span>
        </div>
        <div className="flex gap-1.5">
          <button 
            onClick={onReanalyze}
            disabled={isAnalyzing}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <i className={`fas fa-sync-alt text-xs ${isAnalyzing ? 'animate-spin' : ''}`}></i>
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <i className="fas fa-minus text-xs"></i>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 max-h-[400px] overflow-y-auto custom-scrollbar bg-white/50">
        {!result ? (
          <div className="text-center py-10 space-y-3">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-400 rotate-3">
              <i className="fas fa-wand-magic-sparkles text-2xl"></i>
            </div>
            <p className="text-slate-400 text-sm font-medium">Spusťte analýzu úkolu</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Správná Odpověď</span>
                <button 
                  onClick={copyAutoClickScript}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all transform active:scale-95 shadow-sm ${
                    copyStatus === 'copied' 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                  }`}
                >
                  <i className={`fas ${copyStatus === 'copied' ? 'fa-check-double' : 'fa-bolt'}`}></i>
                  {copyStatus === 'copied' ? 'SKRIPT ZKOPÍROVÁN' : 'AUTO-CLICK'}
                </button>
              </div>
              <p className="text-slate-900 font-extrabold text-2xl leading-tight">{result.answer}</p>
              
              {copyStatus === 'copied' && (
                <div className="mt-3 py-2 px-3 bg-slate-900 rounded-xl animate-in fade-in slide-in-from-top-2">
                  <p className="text-[9px] text-slate-100 leading-tight">
                    <i className="fas fa-info-circle mr-1 text-indigo-400"></i>
                    Běž na <b>Umíme To</b>, stiskni <b>F12</b>, vlož do <b>Console</b> a <b>Enter</b>.
                  </p>
                </div>
              )}
            </div>

            <div className="px-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Rychlé vysvětlení</span>
              <p className="text-slate-600 text-sm leading-relaxed italic">
                {result.explanation}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[9px] font-mono text-slate-300">LITE MODE v2.1</span>
              <span className="text-[9px] font-mono text-slate-300">{new Date(result.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isAnalyzing && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <span className="text-indigo-600 font-black text-[10px] tracking-[0.3em] uppercase animate-pulse">Magie pracuje...</span>
        </div>
      )}
    </div>
  );
};

export default FloatingPanel;

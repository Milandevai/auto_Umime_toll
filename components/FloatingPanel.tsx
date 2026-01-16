
import React, { useState, useEffect, useRef } from 'react';
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
  const [autoMode, setAutoMode] = useState(true);
  const [bridgeStatus, setBridgeStatus] = useState<'idle' | 'copied'>('idle');
  const [bridgeId, setBridgeId] = useState<string>('');

  useEffect(() => {
    let id = localStorage.getItem('umauto_bridge_id');
    if (!id) {
      id = Math.random().toString(36).substring(2, 8).toUpperCase();
      localStorage.setItem('umauto_bridge_id', id);
    }
    setBridgeId(id);
  }, []);

  useEffect(() => {
    if (result && autoMode && bridgeId) {
      fetch(`https://ntfy.sh/umauto_${bridgeId}`, {
        method: 'POST',
        body: JSON.stringify({
          answer: result.answer,
          timestamp: Date.now()
        }),
        headers: {
          'Title': 'UMAUTO_ANSWER',
          'Tags': 'brain'
        }
      }).catch(err => console.error("Chyba mostu:", err));
    }
  }, [result, autoMode, bridgeId]);

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
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const copyCloudBridgeScript = () => {
    const script = `
(function() {
  const BRIDGE_ID = "${bridgeId}";
  console.log('%c[umauto.ai] ULTRA MOST 3.0 AKTIVOVÁN (ID: ' + BRIDGE_ID + ')', 'background: #6366f1; color: white; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 1.1em;');
  
  const eventSource = new EventSource('https://ntfy.sh/umauto_' + BRIDGE_ID + '/sse');
  
  // Čištění textu pro srovnání
  const clean = (str) => str.toLowerCase().replace(/[^a-z0-9áéíóúýčďěňřšťůž]/gi, '').trim();

  // Výpočet podobnosti (Levenshteinova vzdálenost)
  const getSimilarity = (s1, s2) => {
    const c1 = clean(s1);
    const c2 = clean(s2);
    if (c1 === c2) return 100;
    if (c1.includes(c2) || c2.includes(c1)) return 80;
    
    let longer = c1;
    let shorter = c2;
    if (c1.length < c2.length) {
      longer = c2;
      shorter = c1;
    }
    let longerLength = longer.length;
    if (longerLength === 0) return 100.0;
    
    // Zjednodušená verze pro skript (editační vzdálenost)
    const editDistance = (s1, s2) => {
      let costs = new Array();
      for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
          if (i == 0) costs[j] = j;
          else {
            if (j > 0) {
              let newValue = costs[j - 1];
              if (s1.charAt(i - 1) != s2.charAt(j - 1))
                newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
              costs[j - 1] = lastValue;
              lastValue = newValue;
            }
          }
        }
        if (i > 0) costs[s2.length] = lastValue;
      }
      return costs[s2.length];
    };

    return ((longerLength - editDistance(longer, shorter)) / parseFloat(longerLength)) * 100;
  };

  const simulateClick = (el) => {
    const opts = { bubbles: true, cancelable: true, view: window };
    el.dispatchEvent(new MouseEvent('mousedown', opts));
    el.dispatchEvent(new MouseEvent('mouseup', opts));
    el.click();
    el.dispatchEvent(new Event('change', opts));
  };

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const payload = JSON.parse(data.message);
      const originalAns = payload.answer.trim();
      
      console.log('%c[umauto.ai] Přijata odpověď: ' + originalAns, 'color: #6366f1; font-weight: bold');

      // Rozšířené selektory pro různé typy úkolů
      const selectors = ['button', '.choice', '.option', '.answer-button', '.tile', '.item', '[role="button"]', '.word', '.draggable', 'span', 'div'];
      let bestCandidate = null;
      let highestScore = -1;

      for (const selector of selectors) {
        document.querySelectorAll(selector).forEach(el => {
          const txt = el.innerText || '';
          if (txt.length === 0 || el.offsetParent === null) return; // Ignorovat neviditelné
          
          const score = getSimilarity(txt, originalAns);
          
          if (score > highestScore) {
            highestScore = score;
            bestCandidate = el;
          }
        });
      }

      // Kliknout pouze pokud je shoda rozumná (nad 40%)
      if (bestCandidate && highestScore > 40) {
        console.log('%c[umauto.ai] Klikám (' + Math.round(highestScore) + '% shoda): ' + bestCandidate.innerText, 'color: #10b981; font-weight: bold');
        simulateClick(bestCandidate);
      } else {
        const input = document.querySelector('input[type="text"], textarea, .inputField, [contenteditable="true"]');
        if (input) {
          input.value = originalAns;
          if(input.innerText !== undefined) input.innerText = originalAns;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', code: 'Enter' }));
          console.log('%c[umauto.ai] Vyplněno do textového pole.', 'color: #10b981; font-weight: bold');
        } else {
          console.warn('[umauto.ai] Žádná dostatečná shoda nenalezena (Max shoda: ' + Math.round(highestScore) + '%).');
        }
      }
    } catch (e) {
      console.error('[umauto.ai] Chyba:', e);
    }
  };

  eventSource.onerror = () => console.error('[umauto.ai] Most odpojen.');
})();
    `.trim();

    navigator.clipboard.writeText(script).then(() => {
      setBridgeStatus('copied');
      setTimeout(() => setBridgeStatus('idle'), 5000);
    });
  };

  if (!isVisible) {
    return (
      <button onClick={() => setIsVisible(true)} className="fixed bottom-6 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-[9999]">
        <i className="fas fa-brain text-2xl"></i>
      </button>
    );
  }

  return (
    <div className={`fixed z-[9999] w-[360px] rounded-3xl overflow-hidden glass shadow-2xl transition-all duration-300 ${isDragging ? 'opacity-80 scale-95 ring-2 ring-indigo-400' : 'opacity-100 scale-100'}`} style={{ left: position.x, top: position.y }}>
      <div onMouseDown={handleMouseDown} className="bg-indigo-600 p-4 cursor-move flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-black tracking-tight uppercase text-sm">
          <i className="fas fa-bolt text-indigo-200"></i>
          <span>umauto.ai ULTRA v3</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onReanalyze} disabled={isAnalyzing} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/20 text-white transition-colors">
            <i className={`fas fa-redo-alt text-xs ${isAnalyzing ? 'animate-spin' : ''}`}></i>
          </button>
          <button onClick={() => setIsVisible(false)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/20 text-white transition-colors">
            <i className="fas fa-times text-xs"></i>
          </button>
        </div>
      </div>

      <div className="p-5 max-h-[480px] overflow-y-auto custom-scrollbar bg-white/50">
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-2xl border border-indigo-100">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Auto-klikání</span>
              <span className="text-[9px] text-indigo-400">ID Mostu: {bridgeId}</span>
            </div>
            <button onClick={() => setAutoMode(!autoMode)} className={`w-12 h-6 rounded-full transition-colors relative ${autoMode ? 'bg-indigo-600' : 'bg-slate-300'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${autoMode ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>
        </div>

        {!result ? (
          <div className="space-y-4 py-2 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Použij nový skript pro ULTRA přesnost!</p>
            <button onClick={copyCloudBridgeScript} className={`w-full py-3 rounded-xl font-black text-xs transition-all transform active:scale-95 flex items-center justify-center gap-2 ${bridgeStatus === 'copied' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-black'}`}>
              <i className={`fas ${bridgeStatus === 'copied' ? 'fa-check' : 'fa-copy'}`}></i>
              {bridgeStatus === 'copied' ? 'ZKOPÍROVÁNO!' : 'KOPÍROVAT ULTRA SKRIPT'}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Správná Odpověď</span>
              <p className="text-slate-900 font-black text-2xl leading-tight mb-2">{result.answer}</p>
              {autoMode && <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 bg-emerald-50 py-1 px-3 rounded-full w-fit"><i className="fas fa-bolt"></i>AUTOMATICKY ODESLÁNO</div>}
            </div>
            <div className="px-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Vysvětlení</span>
              <p className="text-slate-600 text-sm leading-relaxed font-medium bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200 italic">{result.explanation}</p>
            </div>
          </div>
        )}
      </div>
      {isAnalyzing && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center animate-pulse shadow-lg">
            <i className="fas fa-magic text-white text-2xl"></i>
          </div>
          <span className="text-indigo-600 font-black text-[11px] tracking-[0.4em] uppercase">Hledám řešení...</span>
        </div>
      )}
    </div>
  );
};

export default FloatingPanel;

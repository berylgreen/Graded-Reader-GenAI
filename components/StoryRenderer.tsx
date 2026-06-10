import React, { useState, useEffect, useRef } from 'react';
import { VocabItem } from '../types';
import { generateSpeech } from '../services/aiService';

interface StoryRendererProps {
  title?: string;
  level?: string;
  content: string;
  knownWords: Set<string>;
  targetWords: VocabItem[];
  outOfScopeWords: VocabItem[];
}

const StoryRenderer: React.FC<StoryRendererProps> = ({ title, level, content, knownWords, targetWords, outOfScopeWords }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [useAITTS, setUseAITTS] = useState(false);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const updateVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;

      return () => {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  const handleTTS = async () => {
    // STOP Logic
    if (isPlaying || isLoadingTTS) {
      if (useAITTS && audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } else if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      setIsLoadingTTS(false);
      return;
    }

    // PLAY Logic
    if (useAITTS) {
      setIsLoadingTTS(true);
      try {
        const blob = await generateSpeech(content);
        const url = URL.createObjectURL(blob);
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play();
          setIsPlaying(true);
        }
      } catch (e) {
        console.error("Failed to generate AI speech", e);
        alert("Failed to connect to AI Voice API. Please check your API key.");
      } finally {
        setIsLoadingTTS(false);
      }
    } else {
      // Native Browser TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(content);
        utterance.rate = 0.9;
        utterance.onend = () => setIsPlaying(false);
        
        if (voices.length > 0) {
          const bestVoice = 
            voices.find(v => v.name.includes('Microsoft') && v.name.includes('Online') && v.lang.startsWith('en')) ||
            voices.find(v => v.name.includes('Google US English')) ||
            voices.find(v => v.name.includes('Google UK English')) ||
            voices.find(v => v.name.includes('Siri') && v.lang.startsWith('en')) ||
            voices.find(v => v.name.includes('Samantha') && v.lang.startsWith('en')) ||
            voices.find(v => v.lang === 'en-US') ||
            voices.find(v => v.lang.startsWith('en'));

          if (bestVoice) {
            utterance.voice = bestVoice;
            console.log("Using TTS Voice:", bestVoice.name);
          }
        }

        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    }
  };

  // Collect all words to highlight
  const highlightTargets = new Map<string, 'target' | 'outofscope'>();
  
  targetWords?.forEach(w => {
    if (!knownWords.has(w.word.toLowerCase())) {
      highlightTargets.set(w.word.toLowerCase(), 'target');
    }
  });
  
  outOfScopeWords?.forEach(w => {
    if (!knownWords.has(w.word.toLowerCase())) {
      highlightTargets.set(w.word.toLowerCase(), 'outofscope');
    }
  });

  const renderContent = () => {
    if (highlightTargets.size === 0) {
      return <div className="text-lg leading-relaxed text-slate-700 whitespace-pre-wrap font-serif mt-4">{content}</div>;
    }

    // Replace special chars for regex safety
    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordsToMatch = Array.from(highlightTargets.keys())
      .map(escapeRegExp)
      .sort((a, b) => b.length - a.length); // match longest first
    
    const pattern = new RegExp(`\\b(${wordsToMatch.join('|')})\\b`, 'gi');
    const parts = content.split(pattern);

    return (
      <div className="text-lg leading-relaxed text-slate-700 whitespace-pre-wrap font-serif mt-4">
        {parts.map((part, index) => {
          const lowerPart = part.toLowerCase();
          const type = highlightTargets.get(lowerPart);
          
          if (type === 'target') {
            return (
              <span key={index} className="text-blue-700 font-semibold mx-0.5" title="Target Level Word">
                {part}
              </span>
            );
          } else if (type === 'outofscope') {
            return (
              <span key={index} className="text-orange-700 font-bold mx-0.5 border-b-2 border-orange-200 cursor-help" title="Out of Scope Word">
                {part}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="relative">
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
      {title && level ? (
        <div className="bg-brand-50 px-8 py-6 border-b border-brand-100 flex justify-between items-center -mx-8 -mt-8 mb-8" data-html2canvas-ignore>
          <div>
            <div className="uppercase tracking-wide text-xs font-bold text-brand-600 mb-1">
              {level}
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
          </div>
          
          <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-brand-200 shadow-sm">
             <label className="flex items-center gap-1.5 cursor-pointer select-none border-r border-slate-200 pr-3 hover:opacity-80 transition-opacity">
               <span className="text-xs font-semibold text-slate-600">AI</span>
               <input 
                 type="checkbox" 
                 checked={useAITTS} 
                 onChange={(e) => {
                   setUseAITTS(e.target.checked);
                   if (isPlaying || isLoadingTTS) {
                     if (audioRef.current) {
                       audioRef.current.pause();
                       audioRef.current.currentTime = 0;
                     }
                     if ('speechSynthesis' in window) {
                       window.speechSynthesis.cancel();
                     }
                     setIsPlaying(false);
                     setIsLoadingTTS(false);
                   }
                 }}
                 className="w-3.5 h-3.5 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer"
               />
             </label>
             
             <button 
               onClick={handleTTS}
               disabled={isLoadingTTS}
               className="flex items-center gap-1 text-brand-700 hover:text-brand-800 transition-colors disabled:opacity-50"
             >
                {isLoadingTTS ? (
                   <div className="w-4 h-4 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                ) : isPlaying ? (
                  <>
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>
                    <span className="text-xs font-bold text-red-600">Stop</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                    <span className="text-xs font-bold">Read</span>
                  </>
                )}
             </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end items-center mb-4" data-html2canvas-ignore>
          <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-brand-200 shadow-sm">
             <label className="flex items-center gap-1.5 cursor-pointer select-none border-r border-slate-200 pr-3 hover:opacity-80 transition-opacity">
               <span className="text-xs font-semibold text-slate-600">AI</span>
               <input 
                 type="checkbox" 
                 checked={useAITTS} 
                 onChange={(e) => {
                   setUseAITTS(e.target.checked);
                   if (isPlaying || isLoadingTTS) {
                     if (audioRef.current) {
                       audioRef.current.pause();
                       audioRef.current.currentTime = 0;
                     }
                     if ('speechSynthesis' in window) {
                       window.speechSynthesis.cancel();
                     }
                     setIsPlaying(false);
                     setIsLoadingTTS(false);
                   }
                 }}
                 className="w-3.5 h-3.5 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer"
               />
             </label>
             
             <button 
               onClick={handleTTS}
               disabled={isLoadingTTS}
               className="flex items-center gap-1 text-brand-700 hover:text-brand-800 transition-colors disabled:opacity-50"
             >
                {isLoadingTTS ? (
                   <div className="w-4 h-4 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                ) : isPlaying ? (
                  <>
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>
                    <span className="text-xs font-bold text-red-600">Stop</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                    <span className="text-xs font-bold">Read</span>
                  </>
                )}
             </button>
          </div>
        </div>
      )}
      {renderContent()}
    </div>
  );
};

export default StoryRenderer;
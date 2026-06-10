import React, { useState, useEffect, useRef } from 'react';
import { VocabItem } from '../types';
import { generateSpeech } from '../services/aiService';

interface StoryRendererProps {
  content: string;
  knownWords: Set<string>;
  targetWords: VocabItem[];
  outOfScopeWords: VocabItem[];
}

const StoryRenderer: React.FC<StoryRendererProps> = ({ content, knownWords, targetWords, outOfScopeWords }) => {
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
      <div className="flex justify-end items-center gap-4 mb-2">
        <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 select-none">
          <input 
            type="checkbox" 
            checked={useAITTS} 
            onChange={(e) => {
              setUseAITTS(e.target.checked);
              // Stop current audio when switching modes
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
            className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer"
          />
          <span className="text-sm font-medium text-slate-700">Use AI Voice 🤖</span>
        </label>
        
        <button 
          onClick={handleTTS}
          disabled={isLoadingTTS}
          className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${
            isPlaying || isLoadingTTS
              ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-70 disabled:cursor-wait' 
              : 'bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100'
          }`}
        >
          {isLoadingTTS ? (
             <>
               <div className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
               Loading Voice...
             </>
          ) : isPlaying ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
              Stop Reading
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.657 6.343a8 8 0 010 11.314M11 5L6 9H2v6h4l5 4V5z" /></svg>
              Read Aloud
            </>
          )}
        </button>
      </div>
      {renderContent()}
    </div>
  );
};

export default StoryRenderer;
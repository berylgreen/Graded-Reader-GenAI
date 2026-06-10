import React, { useState, useEffect } from 'react';
import { VocabItem } from '../types';

interface StoryRendererProps {
  content: string;
  knownWords: Set<string>;
  targetWords: VocabItem[];
  outOfScopeWords: VocabItem[];
}

const StoryRenderer: React.FC<StoryRendererProps> = ({ content, knownWords, targetWords, outOfScopeWords }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleTTS = () => {
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(content);
        utterance.rate = 0.9;
        utterance.onend = () => setIsPlaying(false);
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
      <div className="flex justify-end mb-2">
        <button 
          onClick={handleTTS}
          className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${
            isPlaying 
              ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
              : 'bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100'
          }`}
        >
          {isPlaying ? (
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
import React from 'react';

interface StoryRendererProps {
  content: string;
  knownWords: Set<string>;
}

const StoryRenderer: React.FC<StoryRendererProps> = ({ content, knownWords }) => {
  // Regex to split content by markers: [word] or {word}
  // Capturing groups will be included in the split array
  const parts = content.split(/(\[[^\]]+\]|\{[^\}]+\})/g);

  return (
    <div className="text-lg leading-relaxed text-slate-700 whitespace-pre-wrap font-serif">
      {parts.map((part, index) => {
        if (part.startsWith('[') && part.endsWith(']')) {
          const word = part.slice(1, -1);
          // If the word is known, render as normal text, otherwise highlight as target
          if (knownWords.has(word.toLowerCase())) {
            return <span key={index}>{word}</span>;
          }
          return (
            <span key={index} className="text-blue-700 font-semibold mx-0.5" title="Target Level Word">
              {word}
            </span>
          );
        } else if (part.startsWith('{') && part.endsWith('}')) {
          const word = part.slice(1, -1);
          // If the word is known, render as normal text, otherwise highlight as out-of-scope
          if (knownWords.has(word.toLowerCase())) {
             return <span key={index}>{word}</span>;
          }
          return (
            <span key={index} className="text-orange-700 font-bold mx-0.5 border-b-2 border-orange-200 cursor-help" title="Out of Scope Word">
              {word}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
};

export default StoryRenderer;
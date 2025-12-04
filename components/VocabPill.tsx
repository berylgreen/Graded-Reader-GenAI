import React from 'react';

interface VocabPillProps {
  word: string;
  type: 'target' | 'out-of-scope';
}

const VocabPill: React.FC<VocabPillProps> = ({ word, type }) => {
  const styles = type === 'target' 
    ? 'bg-blue-100 text-blue-800 border-blue-200'
    : 'bg-orange-100 text-orange-800 border-orange-200';

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${styles} mr-2 mb-2`}>
      {word}
    </span>
  );
};

export default VocabPill;

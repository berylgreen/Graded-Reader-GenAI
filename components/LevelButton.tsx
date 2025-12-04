import React from 'react';

interface LevelButtonProps {
  level: number;
  wordCount: string;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
}

const LevelButton: React.FC<LevelButtonProps> = ({ level, wordCount, isSelected, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`SCHOOL_GROUPS
        relative overflow-hidden group flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border-2
        ${isSelected 
          ? 'border-brand-500 bg-brand-50 shadow-md scale-[1.02]' 
          : 'border-slate-200 bg-white hover:border-brand-300 hover:shadow-sm'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`}>
        Level
      </span>
      <span className={`text-3xl font-black ${isSelected ? 'text-brand-700' : 'text-slate-700'}`}>
        {level}
      </span>
      <span className={`text-xs mt-2 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`}>
        {wordCount}
      </span>
    </button>
  );
};

export default LevelButton;

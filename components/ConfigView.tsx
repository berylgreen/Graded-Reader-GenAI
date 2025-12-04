import React, { useState, useEffect } from 'react';
import { WordGroup } from '../types';
import { WORD_GROUPS as DEFAULT_GROUPS } from '../constants';

interface ConfigViewProps {
  groups: WordGroup[];
  wordStats: Record<string, number>;
  onUpdateGroups: (newGroups: WordGroup[]) => void;
  onResetStats: () => void;
  onBack: () => void;
}

const ConfigView: React.FC<ConfigViewProps> = ({ groups, wordStats, onUpdateGroups, onResetStats, onBack }) => {
  const [selectedLevel, setSelectedLevel] = useState<number>(groups[0]?.level || 1);
  const [editLabel, setEditLabel] = useState('');
  const [editWords, setEditWords] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  // When selection changes, load data into form
  useEffect(() => {
    const group = groups.find(g => g.level === selectedLevel);
    if (group) {
      setEditLabel(group.label);
      
      // Special formatting for Review Level to show counts
      if (group.level === 999) {
        const wordsWithCounts = group.words.map(w => {
          const count = wordStats[w.toLowerCase()] || 0;
          return `${w} (${count})`;
        }).join(', ');
        setEditWords(wordsWithCounts);
      } else {
        setEditWords(group.words.join(', '));
      }
      
      setIsDirty(false);
    } else {
        // If selected level doesn't exist (e.g. after reset), switch to first available
        if (groups.length > 0) {
            setSelectedLevel(groups[0].level);
        }
    }
  }, [selectedLevel, groups, wordStats]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = () => {
    if (selectedLevel === 999) return; // Cannot save review level manually

    const updatedGroups = groups.map(g => {
      if (g.level === selectedLevel) {
        // Clean up words: split by comma, trim, remove empty
        const cleanedWords = editWords
          .split(/[,，\n]/) // Split by comma (eng/cn) or newline
          .map(w => w.trim())
          .filter(w => w.length > 0);
        
        // Remove duplicates within the list
        const uniqueWords = Array.from(new Set(cleanedWords));

        return { ...g, label: editLabel, words: uniqueWords };
      }
      return g;
    });

    onUpdateGroups(updatedGroups);
    setIsDirty(false);
    showNotification('Level saved successfully!');
  };

  const handleResetLevel = () => {
    const defaultGroup = DEFAULT_GROUPS.find(g => g.level === selectedLevel);
    if (defaultGroup) {
      setEditLabel(defaultGroup.label);
      setEditWords(defaultGroup.words.join(', '));
      setIsDirty(true);
      showNotification('Loaded default values for this level. Click Save to apply.', 'info');
    } else if (selectedLevel === 999) {
       showNotification("Review level cannot be reset to defaults.", 'error');
    }
  };

  const handleResetAll = () => {
    // Preserve the Review Level (999) if it exists, as it depends on global stats, not static defaults
    const reviewGroup = groups.find(g => g.level === 999);
    const newGroups = reviewGroup 
      ? [...DEFAULT_GROUPS, reviewGroup] 
      : [...DEFAULT_GROUPS];

    onUpdateGroups(newGroups);
    setSelectedLevel(1);
    showNotification('All levels reset to defaults.');
  };

  const handleResetStats = () => {
    onResetStats();
    showNotification('Global stats reset.');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-20">
      
      {/* Header for Config */}
      <div className="flex items-center justify-between mb-8 relative">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">Configuration</h2>
          <p className="text-slate-500 mt-1">Customize vocabulary lists and manage global statistics.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 shadow-sm transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Generator
          </button>
        </div>

        {/* Notification Toast */}
        {notification && (
            <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mt-[-10px] px-4 py-2 rounded-lg shadow-lg text-sm font-semibold animate-bounce
                ${notification.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' : 
                  notification.type === 'info' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                  'bg-green-100 text-green-800 border border-green-200'}`}>
                {notification.message}
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
        
        {/* Sidebar: Level Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-700">Select Level</h3>
          </div>
          <div className="p-2 space-y-1 flex-grow">
            {groups.map(group => {
              const isReview = group.level === 999;
              return (
                <button
                  key={group.level}
                  onClick={() => setSelectedLevel(group.level)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    selectedLevel === group.level
                      ? isReview 
                        ? 'bg-orange-50 text-orange-800 border-orange-200 border shadow-sm' 
                        : 'bg-brand-50 text-brand-700 border-brand-200 border shadow-sm'
                      : isReview
                        ? 'text-orange-700 hover:bg-orange-50 border border-transparent'
                        : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{isReview ? '★ Review Level' : `Level ${group.level}`}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isReview ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                      {group.words.length} words
                    </span>
                  </div>
                  <div className={`text-xs mt-1 truncate ${isReview ? 'text-orange-500' : 'text-slate-400'}`}>
                    {group.label}
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Global Actions in Sidebar Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2">
             <button
                onClick={handleResetStats}
                className="w-full px-3 py-2 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded border border-orange-200 transition-colors flex items-center justify-center"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Reset Global Stats
              </button>
              <button
                onClick={handleResetAll}
                className="w-full px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
              >
                Reset Levels to Defaults
              </button>
          </div>
        </div>

        {/* Main: Edit Area */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {selectedLevel === 999 ? 'Review Level (Auto-generated)' : `Editing Level ${selectedLevel}`}
              </h3>
            </div>
            <div className="flex gap-3">
               {selectedLevel !== 999 ? (
                 <>
                  <button
                    onClick={handleResetLevel}
                    className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Reset this level to default"
                  >
                    Restore Default
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!isDirty}
                    className={`px-6 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition-all ${
                      isDirty 
                        ? 'bg-brand-600 hover:bg-brand-700 hover:shadow-md' 
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    Save Changes
                  </button>
                 </>
               ) : (
                 <span className="px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 rounded-md border border-orange-100">
                   Read Only: Based on Global Stats
                 </span>
               )}
            </div>
          </div>

          <div className="p-6 flex-grow flex flex-col space-y-6 overflow-y-auto">
            
            {/* Label Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Level Label / Description
              </label>
              <input
                type="text"
                value={editLabel}
                onChange={(e) => { setEditLabel(e.target.value); setIsDirty(true); }}
                disabled={selectedLevel === 999}
                className={`w-full rounded-lg border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2.5 border ${selectedLevel === 999 ? 'bg-slate-100 text-slate-500' : ''}`}
              />
            </div>

            {/* Word List Input */}
            <div className="flex-grow flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Vocabulary List
                </label>
                <span className="text-xs text-slate-500">
                  {selectedLevel === 999 ? 'Format: word (usage count)' : 'Separate words with commas'}
                </span>
              </div>
              <textarea
                value={editWords}
                onChange={(e) => { setEditWords(e.target.value); setIsDirty(true); }}
                readOnly={selectedLevel === 999}
                className={`flex-grow w-full rounded-lg border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-4 border font-mono leading-relaxed ${selectedLevel === 999 ? 'bg-slate-50 text-slate-600' : ''}`}
                placeholder="apple, banana, cat..."
              />
              {selectedLevel === 999 && (
                <p className="text-xs text-orange-500 mt-2">
                  * This level is automatically populated with words that have appeared in previous stories more than once. The count shows total global usage.
                </p>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default ConfigView;
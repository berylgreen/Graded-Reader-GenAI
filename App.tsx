import React, { useState, useRef, useMemo, useEffect } from 'react';
import { WORD_GROUPS as DEFAULT_WORD_GROUPS, SCHOOL_GROUPS } from './constants';
import { AppState, GeneratedStory, WordGroup, VocabItem } from './types';
import { generateStory } from './services/geminiService';
import StoryRenderer from './components/StoryRenderer';
import VocabList from './components/VocabList';
import ConfigView from './components/ConfigView';

// Declare globals for external scripts
declare global {
  interface Window {
    XLSX: any;
    html2pdf: any;
    JSZip: any;
  }
}

type ViewState = 'home' | 'config';

const REVIEW_LEVEL_ID = 999;

const App: React.FC = () => {
  // --- Global State ---
  const [view, setView] = useState<ViewState>('home');
  
  // Initialize vocab groups from localStorage or defaults
  const [vocabGroups, setVocabGroups] = useState<WordGroup[]>(() => {
    const saved = localStorage.getItem('gradedReader_vocabGroups');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved vocab groups", e);
        return DEFAULT_WORD_GROUPS;
      }
    }
    return DEFAULT_WORD_GROUPS;
  });

  // Word Usage Statistics State
  const [wordStats, setWordStats] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('gradedReader_wordStats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse usage stats", e);
        return {};
      }
    }
    return {};
  });

  // Known Words State (Moved up for dependency access)
  const [showSettings, setShowSettings] = useState(false);
  const [manualKnownWords, setManualKnownWords] = useState<string>('');
  
  const resultsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Combine manual and excel words into a Set for efficient lookup (Moved up)
  const knownWordsSet = useMemo(() => {
    const set = new Set<string>();
    
    // Process manual input (which now includes Excel imports)
    manualKnownWords.split(/[,，\n]/).forEach(word => {
      const clean = word.trim().toLowerCase();
      if (clean) set.add(clean);
    });

    return set;
  }, [manualKnownWords]);

  // Persist vocab groups when changed
  useEffect(() => {
    localStorage.setItem('gradedReader_vocabGroups', JSON.stringify(vocabGroups));
  }, [vocabGroups]);

  // Persist stats when changed
  useEffect(() => {
    localStorage.setItem('gradedReader_wordStats', JSON.stringify(wordStats));
  }, [wordStats]);

  // --- Dynamic Review Level Logic ---
  // Whenever stats or known words change, check if we need to update the "Review Level" (999)
  useEffect(() => {
    const reviewWords = Object.entries(wordStats)
      .filter(([word, count]) => {
        // Words used once or more AND NOT in the known words list
        const isUsedEnough = (count as number) >= 1;
        const isKnown = knownWordsSet.has(word.toLowerCase());
        return isUsedEnough && !isKnown;
      })
      .map(([word]) => word)
      .sort();

    setVocabGroups(currentGroups => {
      // Always ensure Review Level exists in the groups, even if empty.
      // This allows it to be seen in ConfigView.
      const existingReviewGroupIndex = currentGroups.findIndex(g => g.level === REVIEW_LEVEL_ID);
      
      const newReviewGroup = {
        level: REVIEW_LEVEL_ID,
        label: 'Words to Review (High Frequency)',
        words: reviewWords
      };

      if (existingReviewGroupIndex !== -1) {
        const existingGroup = currentGroups[existingReviewGroupIndex];
        // Check if content changed to avoid infinite loop / re-renders
        const currentSet = new Set(existingGroup.words);
        const newSet = new Set(reviewWords);
        const areSetsEqual = currentSet.size === newSet.size && [...currentSet].every(x => newSet.has(x as string));
        
        if (areSetsEqual) return currentGroups; // No change needed

        // Update existing
        const newGroups = [...currentGroups];
        newGroups[existingReviewGroupIndex] = newReviewGroup;
        return newGroups;
      } else {
        // Create new Review Level
        return [...currentGroups, newReviewGroup];
      }
    });
  }, [wordStats, knownWordsSet]); // Run when stats or known words update

  // --- Generator State ---
  const [currentLevel, setCurrentLevel] = useState<number | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [story, setStory] = useState<GeneratedStory | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState('');

  const updateStatsForGeneratedStory = (storyData: GeneratedStory) => {
    setWordStats(prev => {
      const newStats = { ...prev };
      // Combine all used words (target and out-of-scope)
      const allUsedWords = [
        ...storyData.targetWordsUsed, 
        ...storyData.outOfScopeWords
      ];

      allUsedWords.forEach(item => {
        const w = item.word.toLowerCase();
        newStats[w] = (newStats[w] || 0) + 1;
      });
      return newStats;
    });
  };

  const handleResetStats = () => {
    setWordStats({}); // Clear state
    // localStorage will be cleared by the useEffect [wordStats] logic
    // The Review Level will be updated to empty list by the useEffect logic
  };

  const handleImportSchoolWords = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = Number(e.target.value);
    if (!selectedId) return;

    // Get all groups up to and including the selected semester
    const wordsToAdd: string[] = [];
    SCHOOL_GROUPS.forEach(group => {
      if (group.level <= selectedId) {
        wordsToAdd.push(...group.words);
      }
    });

    // Remove duplicates
    const uniqueWords = Array.from(new Set(wordsToAdd));

    setManualKnownWords(prev => {
      const cleanPrev = prev.trim();
      if (cleanPrev.length === 0) return uniqueWords.join(', ');
      
      const prevSet = new Set(cleanPrev.split(/[,，\n]/).map(w => w.trim().toLowerCase()));
      const newWords = uniqueWords.filter(w => !prevSet.has(w.toLowerCase()));
      
      if (newWords.length === 0) return prev;

      const separator = /[,,，\n]$/.test(cleanPrev) ? '' : ', ';
      return cleanPrev + separator + newWords.join(', ');
    });
    
    // Reset dropdown
    e.target.value = "";
  };

  // Refactored to accept stats as argument for consistent batch processing
  const executeGeneration = async (statsToUse: Record<string, number>) => {
    if (!currentLevel) throw new Error("No level selected");

    // 1. Get Allowed Words (All words from Level 1 to Current Level)
    const allowedWords = vocabGroups
      .filter(g => g.level !== REVIEW_LEVEL_ID && g.level <= (currentLevel === REVIEW_LEVEL_ID ? 100 : currentLevel))
      .flatMap(g => g.words);

    // 2. Get Target Words (Words ONLY from Current Level)
    const targetGroup = vocabGroups.find(g => g.level === currentLevel);
    let targetWordsRaw = targetGroup ? targetGroup.words : [];

    // 3. FILTERING: Remove words that are already in Known Words set
    let targetWordsFiltered = targetWordsRaw.filter(
      word => !knownWordsSet.has(word.toLowerCase())
    );

    if (targetWordsFiltered.length < 5 && targetWordsRaw.length > 0) {
        targetWordsFiltered = targetWordsRaw; 
    }

    // 4. PRIORITIZATION: Sort target words by usage count (Ascending) using the PASSED stats
    // This ensures batch generation respects the incrementing counts locally
    const targetWordsSorted = [...targetWordsFiltered].sort((a, b) => {
      const countA = statsToUse[a.toLowerCase()] || 0;
      const countB = statsToUse[b.toLowerCase()] || 0;
      return countA - countB;
    });

    const targetWords = targetWordsSorted.slice(0, 20);

    // 5. Call API
    const result = await generateStory(currentLevel, allowedWords, targetWords);
    
    return result;
  };

  const handleGenerate = async () => {
    if (!currentLevel) return;

    setAppState(AppState.GENERATING);
    setStory(null);
    setErrorMsg('');

    try {
      // Use current Global Stats
      const result = await executeGeneration(wordStats);
      
      // Update global stats immediately
      updateStatsForGeneratedStory(result);

      // Create enriched result for display with updated counts
      const tempNewStats = { ...wordStats };
      [...result.targetWordsUsed, ...result.outOfScopeWords].forEach(item => {
          const w = item.word.toLowerCase();
          tempNewStats[w] = (tempNewStats[w] || 0) + 1;
      });

      const enrichedResult: GeneratedStory = {
        ...result,
        targetWordsUsed: result.targetWordsUsed.map(w => ({
          ...w,
          count: tempNewStats[w.word.toLowerCase()] || 0
        }))
      };
      
      setStory(enrichedResult);
      setAppState(AppState.SUCCESS);
      
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err: any) {
      setAppState(AppState.ERROR);
      setErrorMsg(err.message || "Something went wrong generating the story.");
    }
  };

  // Helper to generate PDF Blob
  const getPdfBlob = async (element: HTMLElement, filename: string): Promise<Blob> => {
    if (!window.html2pdf) throw new Error("html2pdf not loaded");
    
    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    return await window.html2pdf().set(opt).from(element).output('blob');
  };

  const handleBatchGenerate = async () => {
    if (!currentLevel || !window.JSZip || !window.html2pdf) return;

    setIsBatchGenerating(true);
    setAppState(AppState.GENERATING);
    setStory(null);
    setErrorMsg('');
    const zip = new window.JSZip();
    const batchCount = 5;

    // Use a local copy of stats to track usage accumulation during the batch
    let runningStats = { ...wordStats };

    try {
      for (let i = 1; i <= batchCount; i++) {
        setBatchProgress(`Generating story ${i} of ${batchCount}...`);
        
        // 1. Generate Story using RUNNING stats to prioritize correctly
        const result = await executeGeneration(runningStats);
        
        // 2. Update RUNNING stats locally
        const newStats = { ...runningStats };
        [...result.targetWordsUsed, ...result.outOfScopeWords].forEach(item => {
          const w = item.word.toLowerCase();
          newStats[w] = (newStats[w] || 0) + 1;
        });
        runningStats = newStats;

        // 3. Update Global State (so persistence happens incrementally and UI updates if needed)
        setWordStats(newStats); 
        
        // 4. Update UI State to Render Story
        const enrichedResult: GeneratedStory = {
          ...result,
          targetWordsUsed: result.targetWordsUsed.map(w => ({
            ...w,
            count: newStats[w.word.toLowerCase()] || 0
          }))
        };
        setStory(enrichedResult);
        setAppState(AppState.SUCCESS);

        // 5. Wait for Render
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 6. Capture PDF
        if (resultsRef.current) {
           const pdfName = `${result.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${i}.pdf`;
           const blob = await getPdfBlob(resultsRef.current, pdfName);
           zip.file(pdfName, blob);
        }

        // 7. Rate Limit Wait (except last one)
        if (i < batchCount) {
           setBatchProgress(`Waiting for API rate limit (${i}/${batchCount})...`);
           await new Promise(resolve => setTimeout(resolve, 6000));
        }
      }

      setBatchProgress("Compressing files...");
      const content = await zip.generateAsync({ type: "blob" });
      
      // Save Zip
      const url = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `graded_stories_level_${currentLevel}_batch.zip`;
      a.click();
      window.URL.revokeObjectURL(url);

    } catch (err: any) {
      setErrorMsg(`Batch generation failed: ${err.message}`);
      setAppState(AppState.ERROR);
    } finally {
      setIsBatchGenerating(false);
      setBatchProgress('');
    }
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const level = Number(e.target.value);
    if (level && !isNaN(level)) {
      setCurrentLevel(level);
      setAppState(AppState.IDLE);
      setStory(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = window.XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        // Parse sheet to JSON array of arrays (rows)
        const data = window.XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        const words: string[] = [];
        // Extract words ONLY from the first column (index 0)
        data.forEach(row => {
          if (row && row.length > 0) {
            const cell = row[0];
            if (cell !== undefined && cell !== null) {
               words.push(String(cell).trim());
            }
          }
        });

        if (words.length > 0) {
          setManualKnownWords(prev => {
            const cleanPrev = prev.trim();
            if (cleanPrev.length === 0) return words.join(', ');
            // Append with a comma if the previous text doesn't end with one
            const separator = /[,,，\n]$/.test(cleanPrev) ? '' : ', ';
            return cleanPrev + separator + words.join(', ');
          });
        }
        
        // Clear input to allow re-uploading same file if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        console.error("Error parsing Excel", err);
        alert("Failed to parse Excel file. Please ensure it is a valid format.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadPDF = () => {
    const element = resultsRef.current;
    if (!element || !story || !window.html2pdf) return;

    const opt = {
      margin:       [10, 10, 10, 10], // top, left, bottom, right in mm
      filename:     `${story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'graded_reader_story'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Use html2pdf to generate and save
    window.html2pdf().set(opt).from(element).save();
  };

  const filteredTargetWords = story?.targetWordsUsed.filter(
    item => !knownWordsSet.has(item.word.toLowerCase())
  ) || [];

  const filteredOutOfScopeWords = story?.outOfScopeWords.filter(
    item => !knownWordsSet.has(item.word.toLowerCase())
  ) || [];

  if (view === 'config') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
              <div className="bg-brand-600 rounded-lg p-1.5 shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Graded Reader GenAI</h1>
            </div>
          </div>
        </header>
        <ConfigView 
          groups={vocabGroups} 
          wordStats={wordStats}
          onUpdateGroups={setVocabGroups} 
          onResetStats={handleResetStats}
          onBack={() => setView('home')} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-brand-600 rounded-lg p-1.5 shadow-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Graded Reader GenAI</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('config')}
              className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
              title="Configure Levels"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* Intro */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-4">
            Custom English Stories
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Select a vocabulary level below, then click Generate. The AI will write a story prioritizing that level's words.
          </p>
        </div>

        {/* Configuration Section */}
        <div className="max-w-2xl mx-auto mb-12 space-y-4">
          
          {/* Settings Toggle */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Known Words (Exclude from list)</span>
                {knownWordsSet.size > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {knownWordsSet.size} active
                  </span>
                )}
              </div>
              <svg 
                className={`w-5 h-5 text-slate-400 transition-transform ${showSettings ? 'rotate-180' : ''}`} 
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showSettings && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 space-y-4 animate-fadeIn">
                <p className="text-sm text-slate-600 mb-2">
                  Words added here will be excluded from the "Target Words" and "Out of Scope" lists.
                </p>
                
                {/* Import Buttons Row */}
                <div className="flex flex-wrap gap-4 items-center mb-2">
                   
                   {/* School Grade Import */}
                   <div className="relative">
                      <select 
                        onChange={handleImportSchoolWords}
                        className="appearance-none bg-white border border-slate-300 text-slate-700 py-1.5 px-3 pr-8 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer hover:border-brand-300"
                        defaultValue=""
                      >
                        <option value="" disabled>Import from School Grade...</option>
                        {SCHOOL_GROUPS.map(group => (
                          <option key={group.level} value={group.level}>
                            Completed {group.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                   </div>

                   {/* Excel Import */}
                   <label className="cursor-pointer text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 bg-white border border-brand-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-brand-50 transition-colors">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Import from Excel (Col 1)
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept=".xlsx, .xls" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                    </label>
                </div>

                {/* Manual Input */}
                <div>
                  <textarea 
                    value={manualKnownWords}
                    onChange={(e) => setManualKnownWords(e.target.value)}
                    placeholder="e.g. apple, banana, cat, house"
                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-3 border"
                    rows={6}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Tip: Selecting a grade above adds all words from that grade AND previous grades to this list.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Controls Box */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100">
              <label htmlFor="level-select" className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                Select Level
              </label>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                  <select
                    id="level-select"
                    className="block w-full pl-4 pr-10 py-3 text-base border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-lg rounded-xl shadow-sm border appearance-none bg-white cursor-pointer transition-colors hover:border-brand-300"
                    value={currentLevel || ''}
                    onChange={handleDropdownChange}
                    disabled={appState === AppState.GENERATING || isBatchGenerating}
                  >
                    <option value="" disabled>Choose a Vocabulary Level...</option>
                    {vocabGroups.map((group) => {
                      if (group.level === REVIEW_LEVEL_ID && group.words.length === 0) return null;
                      
                      return (
                        <option key={group.level} value={group.level} className={group.level === REVIEW_LEVEL_ID ? 'font-bold text-orange-600' : ''}>
                          {group.level === REVIEW_LEVEL_ID ? '★ ' : ''}
                          Level {group.level === REVIEW_LEVEL_ID ? 'Review' : group.level} 
                          {group.label ? ` - ${group.label}` : ''}
                        </option>
                      );
                    })}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={!currentLevel || appState === AppState.GENERATING || isBatchGenerating}
                    className={`
                      px-6 py-3 rounded-xl font-bold text-white shadow-md transition-all duration-200
                      flex items-center justify-center min-w-[120px] flex-grow
                      ${!currentLevel || appState === AppState.GENERATING || isBatchGenerating
                        ? 'bg-slate-300 cursor-not-allowed transform-none' 
                        : 'bg-brand-600 hover:bg-brand-700 hover:shadow-lg active:scale-95 active:shadow-sm'
                      }
                    `}
                  >
                    {appState === AppState.GENERATING && !isBatchGenerating ? (
                      <div className="flex items-center">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        <span>Writing...</span>
                      </div>
                    ) : (
                      <>
                        <span>Generate</span>
                        <svg className="w-5 h-5 ml-2 -mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleBatchGenerate}
                    disabled={!currentLevel || appState === AppState.GENERATING || isBatchGenerating}
                    className={`
                      px-4 py-3 rounded-xl font-bold shadow-sm transition-all duration-200
                      flex items-center justify-center border-2 border-brand-200
                      ${!currentLevel || appState === AppState.GENERATING || isBatchGenerating
                        ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed' 
                        : 'bg-white text-brand-600 hover:bg-brand-50 hover:border-brand-300 hover:shadow-md active:scale-95'
                      }
                    `}
                    title="Batch Generate 5 stories & Download ZIP"
                  >
                    {isBatchGenerating ? (
                      <div className="flex items-center text-xs">
                        <div className="w-3 h-3 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mr-1" />
                        Zip...
                      </div>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              {!currentLevel && (
                <p className="mt-2 text-sm text-slate-400">Please select a level to start.</p>
              )}
              {isBatchGenerating && (
                 <p className="mt-2 text-xs font-semibold text-brand-600 animate-pulse">{batchProgress}</p>
              )}
          </div>
        </div>

        {/* Error State */}
        {appState === AppState.ERROR && (
          <div className="max-w-2xl mx-auto bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg mb-8 shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm leading-5 font-medium text-red-800">Generation Failed</h3>
                <div className="mt-2 text-sm leading-5 text-red-700">
                  {errorMsg}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {appState === AppState.SUCCESS && story && (
          <div ref={resultsRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 fade-in-up mb-20">
            
            {/* Main Story Column */}
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                <div className="bg-brand-50 px-8 py-6 border-b border-brand-100 flex justify-between items-center">
                  <div>
                    <div className="uppercase tracking-wide text-xs font-bold text-brand-600 mb-1">
                      {currentLevel === REVIEW_LEVEL_ID ? 'Review Level' : `Level ${currentLevel}`}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">{story.title}</h3>
                  </div>
                  
                  {/* Download PDF Button */}
                  <button
                    onClick={handleDownloadPDF}
                    data-html2canvas-ignore
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-brand-200 text-brand-700 rounded-lg text-sm font-semibold hover:bg-brand-50 hover:border-brand-300 transition-all shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </button>
                </div>
                
                <div className="px-8 py-8">
                   <StoryRenderer content={story.content} knownWords={knownWordsSet} />
                </div>
                
                {/* Translation Accordion */}
                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100">
                  <details className="group">
                    <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-slate-600 hover:text-brand-600 transition-colors">
                      <span className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
                        Chinese Translation
                      </span>
                      <span className="transition-transform group-open:rotate-180">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </span>
                    </summary>
                    <div className="text-slate-600 mt-4 leading-relaxed whitespace-pre-wrap pl-7">
                      {story.translation}
                    </div>
                  </details>
                </div>
              </div>
            </div>

            {/* Sidebar Vocabulary Column */}
            <div className="lg:col-span-4 space-y-6">
              <VocabList 
                items={filteredTargetWords} 
                type="target" 
                title={currentLevel === REVIEW_LEVEL_ID ? "Review Words in Story" : `Level ${currentLevel} Words`} 
              />
              
              <VocabList 
                items={filteredOutOfScopeWords} 
                type="out-of-scope" 
                title="Out of Scope / New Words" 
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
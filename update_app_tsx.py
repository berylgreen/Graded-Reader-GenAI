import re

with open('App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import { WORD_GROUPS as DEFAULT_WORD_GROUPS, SCHOOL_GROUPS } from './constants';",
    "import { FRY_WORD_GROUPS, SCHOOL_GROUPS } from './constants';\nimport { NGSL_WORD_GROUPS, NGSL_FAMILIES } from './ngsl_data';"
)

# 2. State definition for vocabSystem
if "const [vocabSystem, setVocabSystem]" not in content:
    state_anchor = "const [manualKnownWords, setManualKnownWords] = useState<string>("
    new_state = """  const [vocabSystem, setVocabSystem] = useState<'fry' | 'ngsl'>(() => {
    return (localStorage.getItem('gradedReader_vocabSystem') as 'fry' | 'ngsl') || 'fry';
  });

  const [manualKnownWords, setManualKnownWords] = useState<string>("""
    content = content.replace(state_anchor, new_state)

# 3. Modify vocabGroups initialization
content = content.replace(
    "return DEFAULT_WORD_GROUPS;",
    "return vocabSystem === 'ngsl' ? NGSL_WORD_GROUPS : FRY_WORD_GROUPS;"
)
content = content.replace(
    "return JSON.parse(saved);",
    "return JSON.parse(saved);"
)

# 4. Modify knownWordsSet memo
old_known_memo = """  const knownWordsSet = useMemo(() => {
    const set = new Set<string>();
    
    // Process manual input (which now includes Excel imports)
    manualKnownWords.split(/[,，\\n]/).forEach(word => {
      const clean = word.trim().toLowerCase();
      if (clean) set.add(clean);
    });

    return set;
  }, [manualKnownWords]);"""
new_known_memo = """  const knownWordsSet = useMemo(() => {
    const set = new Set<string>();
    
    // Process manual input (which now includes Excel imports)
    manualKnownWords.split(/[,，\\n]/).forEach(word => {
      let clean = word.trim().toLowerCase();
      if (clean) {
        if (vocabSystem === 'ngsl') {
          clean = NGSL_FAMILIES[clean] || clean;
        }
        set.add(clean);
      }
    });

    return set;
  }, [manualKnownWords, vocabSystem]);"""
content = content.replace(old_known_memo, new_known_memo)

# 5. Add handleToggleVocabSystem
if "const handleToggleVocabSystem" not in content:
    reset_anchor = "  const handleResetStats = () => {"
    toggle_func = """  const handleToggleVocabSystem = (system: 'fry' | 'ngsl') => {
    if (system === vocabSystem) return;
    setVocabSystem(system);
    localStorage.setItem('gradedReader_vocabSystem', system);
    setCurrentLevel(null);
    const newBase = system === 'fry' ? FRY_WORD_GROUPS : NGSL_WORD_GROUPS;
    setVocabGroups(newBase);
  };

  const handleResetStats = () => {"""
    content = content.replace(reset_anchor, toggle_func)

# 6. Lemmatization for filteredTargetWords and filteredOutOfScopeWords
old_filtered_target = """  const filteredTargetWords = story?.targetWordsUsed.filter(
    item => !knownWordsSet.has(item.word.toLowerCase())
  ) || [];"""
new_filtered_target = """  const filteredTargetWords = story?.targetWordsUsed.map(item => {
    const w = item.word.toLowerCase();
    const lemma = vocabSystem === 'ngsl' ? (NGSL_FAMILIES[w] || w) : w;
    return { ...item, rootWord: lemma !== w ? lemma : undefined };
  }).filter(
    item => !knownWordsSet.has((item.rootWord || item.word).toLowerCase())
  ) || [];"""
content = content.replace(old_filtered_target, new_filtered_target)

old_filtered_out = """  const filteredOutOfScopeWords = story?.outOfScopeWords.filter(
    item => !knownWordsSet.has(item.word.toLowerCase())
  ) || [];"""
new_filtered_out = """  const filteredOutOfScopeWords = story?.outOfScopeWords.map(item => {
    const w = item.word.toLowerCase();
    const lemma = vocabSystem === 'ngsl' ? (NGSL_FAMILIES[w] || w) : w;
    return { ...item, rootWord: lemma !== w ? lemma : undefined };
  }).filter(
    item => !knownWordsSet.has((item.rootWord || item.word).toLowerCase())
  ) || [];"""
content = content.replace(old_filtered_out, new_filtered_out)

# 7. Add UI Toggle in Settings Box
toggle_ui = """
              {/* Vocab System Toggle */}
              <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <span className="text-sm font-semibold text-slate-700">词汇体系:</span>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => handleToggleVocabSystem('fry')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                      vocabSystem === 'fry' 
                        ? 'bg-white text-brand-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Fry 视觉词 (1000)
                  </button>
                  <button
                    onClick={() => handleToggleVocabSystem('ngsl')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                      vocabSystem === 'ngsl' 
                        ? 'bg-white text-brand-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    NGSL 高频词 (2800)
                  </button>
                </div>
              </div>
"""

# Insert above the Settings Toggle
if "Vocab System Toggle" not in content:
    content = content.replace(
        "{/* Settings Toggle */}",
        toggle_ui + "\n          {/* Settings Toggle */}"
    )

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)


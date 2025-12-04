export interface WordGroup {
  level: number;
  label: string;
  words: string[];
}

export interface VocabItem {
  word: string;
  meaning: string;
  pronunciation: string;
  count?: number; // Usage frequency
}

export interface GeneratedStory {
  title: string;
  content: string; // Contains special markers for highlighting
  translation: string;
  targetWordsUsed: VocabItem[]; // Words from the current level found in the story
  outOfScopeWords: VocabItem[]; // Words not in current or previous levels
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}
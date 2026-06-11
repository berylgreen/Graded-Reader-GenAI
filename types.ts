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
  rootWord?: string; // Optional root word for lemmatization
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

export interface GeneratedStory {
  title: string;
  content: string;
  translation: string;
  targetWordsUsed: VocabItem[]; // Words from the current level found in the story
  outOfScopeWords: VocabItem[]; // Words not in current or previous levels
  quiz: QuizQuestion[];
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}
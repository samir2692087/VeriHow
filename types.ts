
export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface AnalysisResult {
  verdict: 'CREDIBLE' | 'QUESTIONABLE' | 'MISLEADING' | 'FALSE' | 'SATIRE' | 'UNVERIFIED';
  score: number; // 0 to 100
  explanation: string; // Markdown text
  groundingChunks: GroundingChunk[];
}

export interface AIDetectionResult {
  score: number; // 0-100 (Probability of AI)
  verdict: 'LIKELY AI' | 'POSSIBLE AI' | 'LIKELY HUMAN' | 'UNCLEAR';
  analysis: string; // Technical breakdown
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  mode: 'FACT_CHECK' | 'AI_DETECTOR';
  inputText?: string;
  imageData?: string;
  // Fact Check Fields
  factCheckResult?: AnalysisResult;
  // AI Detection Fields
  aiResult?: AIDetectionResult;
  
  // Legacy/Fallback fields for backward compatibility
  verdict?: AnalysisResult['verdict'];
  score?: number;
  explanation?: string;
  groundingChunks?: GroundingChunk[];
}

export enum AnalysisState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export type AppMode = 'FACT_CHECK' | 'AI_DETECTOR';

export const DISCLAIMER_TEXT = "Disclaimer: VeriHow uses AI to analyze information. Results are probabilistic and may vary. This report should be used as a reference tool, not absolute legal or factual proof. Always cross-reference with primary sources.";

export const SAMPLE_TEXTS = [
  {
    label: "Suspicious Health (English)",
    text: "Doctors are hiding this one weird trick! Drinking 5 gallons of lemon water daily cures all known diseases instantly and reverses aging by 20 years. Big Pharma hates this!"
  },
  {
    label: "Fake News (Hindi)",
    text: "ब्रेकिंग न्यूज़: सरकार ने कल से सभी 500 रुपये के नोटों को बंद करने का ऐलान किया है। अब सिर्फ 2000 के नोट चलेंगे। आरबीआई ने अभी-अभी पुष्टि की है।"
  },
  {
    label: "Historical Fact",
    text: "The Apollo 11 mission successfully landed humans on the Moon on July 20, 1969. Neil Armstrong and Buzz Aldrin were the first two humans to walk on the lunar surface."
  }
];

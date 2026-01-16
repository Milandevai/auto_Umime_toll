
export interface AnalysisResult {
  question: string;
  answer: string;
  explanation: string;
  options?: string[];
  timestamp: number;
}

export interface FloatingWindowState {
  x: number;
  y: number;
  isOpen: boolean;
}

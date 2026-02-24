export interface FileNode {
  name: string;
  language: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
}

export interface GeneratedApp {
  previewHtml: string;
  files: FileNode[];
  explanation: string;
}

export enum ViewMode {
  PREVIEW = 'PREVIEW',
  CODE = 'CODE'
}

export interface GenerationStatus {
  isGenerating: boolean;
  step: 'idle' | 'thinking' | 'coding' | 'previewing';
}
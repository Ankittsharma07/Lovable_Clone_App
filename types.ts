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

export interface WorkspaceSnapshot {
  title: string;
  messages: ChatMessage[];
  files: FileNode[];
  previewHtml: string;
  requestCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceSummary {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  requestCount: number;
  messageCount: number;
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

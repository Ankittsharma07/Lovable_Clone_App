import React, { useState, useEffect } from 'react';
import { FileNode, ViewMode } from '../types';
import { EyeIcon, CodeIcon, FileIcon, RefreshCwIcon } from './Icons';

interface PreviewAreaProps {
  files: FileNode[];
  previewHtml: string;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const PreviewArea: React.FC<PreviewAreaProps> = ({ files, previewHtml, viewMode, setViewMode }) => {
  const [activeFile, setActiveFile] = useState<FileNode | null>(null);
  const [key, setKey] = useState(0); // Used to force reload iframe

  // Select first file by default when files change
  useEffect(() => {
    if (files.length > 0 && !activeFile) {
      setActiveFile(files[0]);
    }
    setKey(k => k + 1); // Refresh preview when html changes
  }, [files, previewHtml]);

  const handleRefresh = () => {
    setKey(k => k + 1);
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e]">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border">
          <button
            onClick={() => setViewMode(ViewMode.PREVIEW)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === ViewMode.PREVIEW 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-muted hover:text-white'
            }`}
          >
            <EyeIcon className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => setViewMode(ViewMode.CODE)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === ViewMode.CODE 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-muted hover:text-white'
            }`}
          >
            <CodeIcon className="w-4 h-4" />
            Code
          </button>
        </div>

        {viewMode === ViewMode.PREVIEW && (
             <button 
                onClick={handleRefresh}
                className="p-2 text-muted hover:text-white hover:bg-surface rounded-md transition-colors"
                title="Refresh Preview"
             >
                 <RefreshCwIcon className="w-4 h-4" />
             </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {files.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted">
            <div className="text-center">
              <div className="w-16 h-16 bg-surface rounded-2xl border border-border flex items-center justify-center mx-auto mb-4">
                <EyeIcon className="w-8 h-8 opacity-50" />
              </div>
              <p>Generated app will appear here</p>
            </div>
          </div>
        ) : (
          <>
            {/* Preview Mode */}
            <div className={`w-full h-full ${viewMode === ViewMode.PREVIEW ? 'block' : 'hidden'}`}>
              <iframe
                key={key}
                title="Live Preview"
                srcDoc={previewHtml}
                className="w-full h-full bg-white border-none"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>

            {/* Code Mode */}
            <div className={`w-full h-full flex ${viewMode === ViewMode.CODE ? 'flex' : 'hidden'}`}>
              {/* File Sidebar */}
              <div className="w-60 border-r border-border bg-background overflow-y-auto">
                <div className="p-3 text-xs font-semibold text-muted uppercase tracking-wider">Explorer</div>
                <div className="space-y-1 px-2">
                  {files.map((file) => (
                    <button
                      key={file.name}
                      onClick={() => setActiveFile(file)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                        activeFile?.name === file.name 
                          ? 'bg-primary/10 text-primary border border-primary/20' 
                          : 'text-gray-400 hover:text-white hover:bg-surface'
                      }`}
                    >
                      <FileIcon className="w-4 h-4" />
                      <span className="truncate">{file.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Code Editor */}
              <div className="flex-1 bg-[#1e1e1e] overflow-auto">
                {activeFile ? (
                   <div className="min-h-full">
                       <div className="sticky top-0 z-10 bg-[#1e1e1e] border-b border-[#333] px-4 py-2 text-xs text-muted font-mono flex items-center justify-between">
                           <span>{activeFile.name}</span>
                           <span>{activeFile.language}</span>
                       </div>
                       <pre className="p-4 text-sm font-mono text-gray-300 leading-relaxed">
                        <code>{activeFile.content}</code>
                       </pre>
                   </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-muted text-sm">Select a file to view source</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
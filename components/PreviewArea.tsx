import React, { useState, useEffect } from 'react';
import { FileNode, ViewMode } from '../types';
import { EyeIcon, CodeIcon, FileIcon, RefreshCwIcon, DownloadIcon } from './Icons';
import JSZip from 'jszip';

interface PreviewAreaProps {
  files: FileNode[];
  previewHtml: string;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const PreviewArea: React.FC<PreviewAreaProps> = ({ files, previewHtml, viewMode, setViewMode }) => {
  const [activeFile, setActiveFile] = useState<FileNode | null>(null);
  const [key, setKey] = useState(0); // Used to force reload iframe
  const [isPreparingZip, setIsPreparingZip] = useState(false);

  // Select first file by default when files change
  useEffect(() => {
    setActiveFile((previous) => {
      if (files.length === 0) return null;
      if (!previous) return files[0];
      return files.find(file => file.name === previous.name) ?? files[0];
    });
    setKey(k => k + 1); // Refresh preview when html changes
  }, [files, previewHtml]);

  const handleRefresh = () => {
    setKey(k => k + 1);
  };

  const handleDownloadActiveFile = () => {
    if (!activeFile) return;

    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fileName = activeFile.name.split('/').pop() || 'generated-file.txt';
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    if (files.length === 0) return;

    setIsPreparingZip(true);
    try {
      const zip = new JSZip();
      const normalizedFiles = files.map((file) => ({
        ...file,
        name: file.name.replaceAll('\\', '/').replace(/^\/+/, ''),
      }));

      normalizedFiles.forEach((file) => {
        zip.file(file.name, file.content);
      });

      if (previewHtml.trim()) {
        zip.file('preview.html', previewHtml);
      }

      zip.file('manifest.json', JSON.stringify({
        exportedAt: new Date().toISOString(),
        fileCount: normalizedFiles.length,
        files: normalizedFiles.map((f) => ({ name: f.name, language: f.language })),
      }, null, 2));

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lovable-project-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[Export] Failed to build ZIP.', error);
    } finally {
      setIsPreparingZip(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-transparent">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 backdrop-blur-sm">
        <div className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 p-1">
          <button
            onClick={() => setViewMode(ViewMode.PREVIEW)}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
              viewMode === ViewMode.PREVIEW 
                ? 'bg-cyan-500 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <EyeIcon className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => setViewMode(ViewMode.CODE)}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
              viewMode === ViewMode.CODE 
                ? 'bg-cyan-500 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CodeIcon className="w-4 h-4" />
            Code
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-zinc-300 md:inline-flex">
            {files.length} files
          </span>
          {files.length > 0 && (
            <button
              onClick={handleDownloadZip}
              disabled={isPreparingZip}
              className="rounded-md p-2 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              title={isPreparingZip ? 'Preparing zip...' : 'Download generated project as ZIP'}
            >
              <DownloadIcon className="h-4 w-4" />
            </button>
          )}
          {files.length > 0 && viewMode === ViewMode.CODE && activeFile && (
            <button
              onClick={handleDownloadActiveFile}
              className="rounded-md p-2 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
              title="Download active file"
            >
              <DownloadIcon className="h-4 w-4" />
            </button>
          )}
          {viewMode === ViewMode.PREVIEW && (
            <button 
              onClick={handleRefresh}
              className="rounded-md p-2 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
              title="Refresh Preview"
            >
              <RefreshCwIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {files.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/5">
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
              <div className="w-60 overflow-y-auto border-r border-white/10 bg-black/25">
                <div className="p-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Explorer</div>
                <div className="space-y-1 px-2">
                  {files.map((file) => (
                    <button
                      key={file.name}
                      onClick={() => setActiveFile(file)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                        activeFile?.name === file.name 
                          ? 'border border-cyan-300/25 bg-cyan-300/10 text-cyan-100' 
                          : 'text-zinc-400 hover:bg-white/10 hover:text-white'
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
                       <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#333] bg-[#1e1e1e] px-4 py-2 font-mono text-xs text-zinc-400">
                           <span>{activeFile.name}</span>
                           <span>{activeFile.language}</span>
                       </div>
                       <pre className="p-4 text-sm font-mono text-gray-300 leading-relaxed">
                        <code>{activeFile.content}</code>
                       </pre>
                   </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-sm text-zinc-400">Select a file to view source</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

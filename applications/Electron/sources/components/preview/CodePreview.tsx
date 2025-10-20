/**
 * Code Preview Component
 * Displays code and text files with syntax highlighting
 * Uses Monaco Editor (VS Code editor)
 */

import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { FileCode, Copy, Check } from 'lucide-react';
import { getFileExtension } from '../../tools/formatters';

interface CodePreviewProps {
  /** File source URL or content */
  src: string;
  /** File name for language detection */
  fileName: string;
  /** File content (if already loaded) */
  content?: string;
}

// Map file extensions to Monaco language IDs
const LANGUAGE_MAP: Record<string, string> = {
  // JavaScript/TypeScript
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  mjs: 'javascript',
  cjs: 'javascript',

  // Python
  py: 'python',
  pyw: 'python',

  // Web
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  less: 'less',

  // Config/Data
  json: 'json',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  ini: 'ini',
  conf: 'ini',

  // Shell
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  fish: 'shell',

  // Other languages
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  h: 'c',
  hpp: 'cpp',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  php: 'php',
  rb: 'ruby',
  swift: 'swift',
  kt: 'kotlin',
  scala: 'scala',
  sql: 'sql',
  graphql: 'graphql',
  proto: 'protobuf',

  // Markup
  md: 'markdown',
  markdown: 'markdown',

  // Data
  csv: 'csv',
  tsv: 'tsv',

  // Logs
  log: 'plaintext',
  txt: 'plaintext',
};

export function CodePreview({ src, fileName, content: initialContent }: CodePreviewProps) {
  const [content, setContent] = useState<string>(initialContent || '');
  const [isLoading, setIsLoading] = useState<boolean>(!initialContent);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Detect language from file extension
  const extension = getFileExtension(fileName);
  const language = LANGUAGE_MAP[extension] || 'plaintext';

  // Load file content if not provided
  useEffect(() => {
    if (initialContent) return;

    const loadContent = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        setContent(text);
        setError(null);
      } catch (err) {
        console.error('Error loading file:', err);
        setError(err instanceof Error ? err.message : 'Failed to load file');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [src, initialContent]);

  // Listen for theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkTheme(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading file...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <FileCode className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <p className="text-gray-900 dark:text-gray-100 font-medium mb-1">
          Failed to load file
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <FileCode className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {fileName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {language.charAt(0).toUpperCase() + language.slice(1)}
              {' • '}
              {content.split('\n').length} lines
              {' • '}
              {new Blob([content]).size} bytes
            </span>
          </div>
        </div>

        <button
          onClick={handleCopyToClipboard}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-green-600 dark:text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={language}
          value={content}
          theme={isDarkTheme ? 'vs-dark' : 'vs'}
          options={{
            readOnly: true,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontSize: 14,
            fontFamily: '"Fira Code", "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
            fontLigatures: true,
            lineNumbers: 'on',
            rulers: [],
            wordWrap: 'off',
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              useShadows: false,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            renderLineHighlight: 'line',
            selectionHighlight: true,
            automaticLayout: true,
          }}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
            </div>
          }
        />
      </div>
    </div>
  );
}

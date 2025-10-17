'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const TOOLBAR_ACTIONS = [
  { command: 'bold', label: 'Bold', icon: 'B', aria: 'Bold' },
  { command: 'italic', label: 'Italic', icon: 'I', aria: 'Italic' },
  { command: 'underline', label: 'Underline', icon: 'U', aria: 'Underline' },
];

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  onImageInserted?: (dataUrl: string) => void;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  label,
  onImageInserted,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerHTML !== value) {
      editor.innerHTML = value || '';
    }
  }, [value]);

  const emitChange = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? '';
    onChange(html);
  }, [onChange]);

  const handleCommand = useCallback(
    (command: string) => {
      editorRef.current?.focus();
      document.execCommand(command);
      emitChange();
    },
    [emitChange],
  );

  const insertImage = useCallback(
    (dataUrl: string) => {
      editorRef.current?.focus();
      document.execCommand('insertHTML', false, `<img src="${dataUrl}" alt="" class="inline-block max-w-full rounded-md mt-2" />`);
      emitChange();
      onImageInserted?.(dataUrl);
    },
    [emitChange, onImageInserted],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      Array.from(files)
        .filter((file) => file.type.startsWith('image/'))
        .forEach((file) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result;
            if (typeof result === 'string') {
              insertImage(result);
            }
          };
          reader.readAsDataURL(file);
        });
    },
    [insertImage],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      handleFiles(event.dataTransfer.files);
    },
    [handleFiles],
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      const files = event.clipboardData.files;
      if (files?.length) {
        event.preventDefault();
        handleFiles(files);
      }
    },
    [handleFiles],
  );

  const handleImageButton = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <span className="text-sm font-medium text-slate-700" id={`rte-${label}`}>
          {label}
        </span>
      ) : null}
      <div className="flex items-center gap-1">
        {TOOLBAR_ACTIONS.map((action) => (
          <button
            key={action.command}
            type="button"
            className="rounded-md border border-slate-300 px-2 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-500"
            onClick={() => handleCommand(action.command)}
            aria-label={action.aria}
          >
            {action.icon}
          </button>
        ))}
        <button
          type="button"
          className="rounded-md border border-slate-300 px-2 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-500"
          onClick={handleImageButton}
          aria-label="Insert image"
        >
          Img
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          aria-label={label}
          role="textbox"
          className={`min-h-[150px] w-full rounded-lg border border-slate-300 bg-white p-3 text-base leading-relaxed shadow-sm transition focus:outline-none ${isFocused ? 'ring-2 ring-sky-500 ring-offset-1' : ''}`}
          onInput={emitChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onDrop={handleDrop}
          onPaste={handlePaste}
          suppressContentEditableWarning
        />
        {!value && placeholder ? (
          <span className="pointer-events-none absolute left-3 top-3 text-slate-400" aria-hidden>
            {placeholder}
          </span>
        ) : null}
      </div>
    </div>
  );
}

import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { File as FileIcon, UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  maxSizeMb?: number;
  uploadProgress?: number;
  error?: string;
  selectedFile?: File | null;
  onClear?: () => void;
}

export function FileDropzone({
  onFileSelected,
  accept,
  maxSizeMb = 5,
  uploadProgress,
  error,
  selectedFile,
  onClear,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function validateAndSelect(file: File) {
    if (file.size > maxSizeMb * 1024 * 1024) {
      setLocalError(`File must be under ${maxSizeMb}MB.`);
      return;
    }
    setLocalError(null);
    onFileSelected(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSelect(file);
  }

  const displayError = error ?? localError;

  if (selectedFile) {
    return (
      <div className="rounded-md border border-border-strong bg-paper-raised p-3">
        <div className="flex items-center gap-3">
          <FileIcon className="size-5 shrink-0 text-board" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ink">{selectedFile.name}</p>
            <p className="text-xs text-ink-muted">{(selectedFile.size / 1024).toFixed(0)} KB</p>
          </div>
          {onClear && (
            <button onClick={onClear} aria-label="Remove file" className="text-ink-faint hover:text-flag">
              <X className="size-4" />
            </button>
          )}
        </div>
        {uploadProgress !== undefined && uploadProgress < 100 && (
          <ProgressBar value={uploadProgress} className="mt-3" />
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-6 py-8 text-center transition-colors',
          isDragging ? 'border-board bg-board-soft' : 'border-border-strong hover:bg-paper-sunken'
        )}
      >
        <UploadCloud className="size-6 text-ink-faint" aria-hidden />
        <p className="text-sm text-ink">
          <span className="font-medium text-board">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-ink-muted">Max {maxSizeMb}MB</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) validateAndSelect(file);
          }}
        />
      </div>
      {displayError && (
        <p role="alert" className="mt-1.5 text-xs text-flag">
          {displayError}
        </p>
      )}
    </div>
  );
}

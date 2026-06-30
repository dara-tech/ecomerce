import { AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { LoadingSpinner } from './Loading';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isDeleting = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="flex w-full max-w-sm flex-col overflow-hidden bg-card text-foreground rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-border relative animate-in zoom-in-95 duration-200">
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-foreground">
              {title}
            </h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        <div className="flex bg-muted/30 border-t border-border/60">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-3 text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-50 border-r border-border/60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 text-[13px] font-bold text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting && (
              <LoadingSpinner size="xs" className="border-destructive/30 border-t-destructive" />
            )}
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

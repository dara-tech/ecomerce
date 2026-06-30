'use client';

import { useEffect, useState } from 'react';
import { X, Tag } from 'lucide-react';
import { getApiUrl } from '@/lib/api';

type Popup = {
  _id: string;
  title: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
  image?: string;
};

export default function MarketingPopup() {
  const [popup, setPopup] = useState<Popup | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('popup_dismissed');
    if (dismissed) return;

    const apiUrl = getApiUrl();
    fetch(`${apiUrl}/marketing/popups/active`)
      .then((r) => (r.ok ? r.json() : []))
      .then((items: Popup[]) => {
        if (items?.length) {
          setPopup(items[0]);
          setOpen(true);
        }
      })
      .catch(() => {});
  }, []);

  if (!open || !popup) return null;

  const dismiss = () => {
    sessionStorage.setItem('popup_dismissed', '1');
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-muted"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
        {popup.image && (
          <img src={popup.image} alt="" className="mb-4 h-32 w-full rounded-lg object-cover" />
        )}
        <div className="flex items-center gap-2 text-primary mb-2">
          <Tag className="size-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Special offer</span>
        </div>
        <h3 className="text-lg font-bold">{popup.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{popup.message}</p>
        {popup.ctaUrl && (
          <a
            href={popup.ctaUrl}
            onClick={dismiss}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
          >
            {popup.ctaText || 'Shop now'}
          </a>
        )}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Globe, Image as ImageIcon, Loader2, Search, Upload } from 'lucide-react';
import api from '../../lib/axios';
import { cn } from '../../lib/utils';

interface ImageResult {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
}

interface InternetImagePickerProps {
  value: string;
  onChange: (url: string) => void;
  searchHint?: string;
  label?: string;
}

export default function InternetImagePicker({
  value,
  onChange,
  searchHint = '',
  label = 'Icon / Image',
}: InternetImagePickerProps) {
  const [showBrowser, setShowBrowser] = useState(false);
  const [query, setQuery] = useState(searchHint || 'category');
  const [results, setResults] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);

  const runSearch = useCallback(async (searchQuery: string, pageNum = 1) => {
    const q = searchQuery.trim() || 'category';
    setLoading(true);
    setSearchError('');
    try {
      const { data } = await api.get('/upload/images/search', {
        params: { q, page: pageNum, pageSize: 12 },
      });
      setResults(data.results || []);
      setPage(data.page || pageNum);
      setPageCount(data.pageCount || 1);
    } catch {
      setSearchError('Could not load images. Try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showBrowser) {
      setQuery(searchHint.trim() || 'category');
      runSearch(searchHint.trim() || 'category', 1);
    }
  }, [showBrowser, searchHint, runSearch]);

  const handleSelect = async (url: string) => {
    setSearchError('');
    try {
      setImporting(true);
      const { data } = await api.post('/upload/import-url', { url });
      onChange(data.url);
      setShowBrowser(false);
    } catch {
      setSearchError('Could not save image to Cloudinary. Try upload instead.');
    } finally {
      setImporting(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      setUploading(true);
      const { data } = await api.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(data.url);
    } catch {
      setSearchError('Upload failed. Check Cloudinary settings.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-semibold text-muted-foreground">{label}</label>

      <div className="flex gap-2">
        <div className="size-11 rounded-none bg-muted/50 border border-border/50 flex items-center justify-center shrink-0 overflow-hidden">
          {value ? (
            <img
              src={value}
              alt="Preview"
              className="size-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <ImageIcon className="size-5 text-muted-foreground/50" />
          )}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-11 bg-input border border-border/60 rounded-none px-4 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          placeholder="https://... or browse below"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowBrowser((open) => !open)}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 px-3 text-[12px] font-semibold border border-border/60 rounded-none transition-colors',
            showBrowser
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-muted/40 text-foreground hover:bg-muted/70'
          )}
        >
          <Globe className="size-3.5" />
          {showBrowser ? 'Hide online images' : 'Browse online'}
        </button>

        <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 px-3 text-[12px] font-semibold border border-border/60 rounded-none bg-muted/40 hover:bg-muted/70 transition-colors">
          <Upload className="size-3.5" />
          {uploading ? 'Uploading…' : 'Upload file'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading}
            onChange={handleUpload}
          />
        </label>
      </div>

      {showBrowser && (
        <div className="border border-border/60 rounded-none bg-muted/20 p-3 flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  runSearch(query, 1);
                }
              }}
              className="flex-1 h-9 bg-input border border-border/60 rounded-none px-3 text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Search images (e.g. clothing, electronics)"
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => runSearch(query, 1)}
              className="inline-flex h-9 items-center gap-1.5 px-3 text-[12px] font-semibold bg-primary text-primary-foreground rounded-none hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
              Search
            </button>
          </div>

          {searchError && (
            <p className="text-[11px] text-destructive">{searchError}</p>
          )}

          {importing && (
            <p className="text-[11px] text-primary flex items-center gap-1.5">
              <Loader2 className="size-3 animate-spin" />
              Saving image to your store…
            </p>
          )}

          <div className="grid grid-cols-4 gap-1.5 max-h-44 overflow-y-auto">
            {loading && results.length === 0 ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted/60 animate-pulse rounded-none" />
              ))
            ) : results.length === 0 ? (
              <p className="col-span-4 text-[11px] text-muted-foreground py-4 text-center">
                No images found. Try another search term.
              </p>
            ) : (
              results.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  title={img.title}
                  disabled={importing}
                  onClick={() => handleSelect(img.url)}
                  className={cn(
                    'aspect-square overflow-hidden border rounded-none transition-all hover:ring-2 hover:ring-primary/50 focus:outline-none focus:ring-2 focus:ring-primary',
                    value === img.url ? 'ring-2 ring-primary border-primary' : 'border-border/50'
                  )}
                >
                  <img
                    src={img.thumbnail}
                    alt={img.title}
                    className="size-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))
            )}
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => runSearch(query, page - 1)}
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-[11px] text-muted-foreground">
                Page {page} of {pageCount}
              </span>
              <button
                type="button"
                disabled={page >= pageCount || loading}
                onClick={() => runSearch(query, page + 1)}
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground leading-snug">
            Images are saved to Cloudinary when selected so they load on your storefront.
          </p>
        </div>
      )}
    </div>
  );
}

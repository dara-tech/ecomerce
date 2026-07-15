import { useState, useEffect } from 'react';
import { Store, Save, Image as ImageIcon } from 'lucide-react';
import api from '../lib/axios';
import {
  PAGE_ROOT_CLASS,
  PAGE_BODY_CLASS,
  PAGE_PRIMARY_BTN_CLASS,
} from '../lib/pageToolbar';
import { PageStickyHeader } from '../components/layout/PageSubTabs';
import Loading from '../components/ui/Loading';
import { toast } from 'sonner';

export default function MyStore() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState({
    name: '',
    description: '',
    logo: '',
  });

  useEffect(() => {
    fetchMyStore();
  }, []);

  const fetchMyStore = async () => {
    try {
      const { data } = await api.get('/vendor/my-store');
      setStore({
        name: data.name || '',
        description: data.description || '',
        logo: data.logo || '',
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load store profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/vendor/my-store', store);
      toast.success('Store profile updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save store profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={PAGE_ROOT_CLASS}>
        <Loading variant="page" label="Loading store profile…" />
      </div>
    );
  }

  return (
    <div className={PAGE_ROOT_CLASS}>
      <PageStickyHeader
        toolbar={
          <>
            <h1 className="text-xs font-semibold text-foreground flex items-center gap-2">
              <Store className="size-4" /> My Store Profile
            </h1>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={PAGE_PRIMARY_BTN_CLASS}
            >
              <Save className="size-3.5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      />

      <div className={PAGE_BODY_CLASS}>
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
          <div className="bg-card rounded-xl border border-border/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border/80 bg-muted/30">
              <h2 className="text-xs font-semibold text-foreground">Basic Details</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Store Logo URL
                </label>
                <div className="flex gap-4 items-start">
                  <div className="w-16 h-16 shrink-0 bg-muted rounded-full border border-border/80 overflow-hidden flex items-center justify-center">
                    {store.logo ? (
                      <img src={store.logo} alt="Store logo preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="size-6 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="url"
                      value={store.logo}
                      onChange={(e) => setStore({ ...store, logo: e.target.value })}
                      className="w-full h-9 px-3 text-sm bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="https://example.com/logo.png"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Must be a valid image URL (e.g. imgur, cloudinary). Recommended size: 256x256.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Store Name
                </label>
                <input
                  type="text"
                  value={store.name}
                  onChange={(e) => setStore({ ...store, name: e.target.value })}
                  className="w-full h-9 px-3 text-sm bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. Tech Haven"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Store Description
                </label>
                <textarea
                  rows={5}
                  value={store.description}
                  onChange={(e) => setStore({ ...store, description: e.target.value })}
                  className="w-full p-3 text-sm bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                  placeholder="Tell customers about your store..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

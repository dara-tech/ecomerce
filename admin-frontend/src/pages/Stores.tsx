import { useState, useEffect } from 'react';
import { Check, X, Percent, Store as StoreIcon, Edit } from 'lucide-react';
import api from '../lib/axios';
import { opsTableClass, opsThClass, opsTdClass } from '../lib/opsUi';
import { PageStickyHeader } from '../components/layout/PageSubTabs';
import {
  PAGE_TOOLBAR_ROW_CLASS,
  PAGE_TAB_GROUP_CLASS,
  pageTabButtonClass,
  PAGE_ROOT_CLASS,
  PAGE_LIST_BODY_CLASS,
} from '../lib/pageToolbar';
import {
  DesktopTablePanel,
  MobileEmptyState,
  MobileListShell,
  MobileRecordCard,
} from '../components/layout/mobileAdmin';
import { toast } from 'sonner';

export default function Stores() {
  const [stores, setStores] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all');
  const [editingStore, setEditingStore] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({ name: '', logo: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get('/vendor/admin/stores')
      .then((r) => setStores(r.data))
      .catch(() => setStores([]));
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/vendor/admin/stores/${id}/status`, { status });
      toast.success(`Store status updated to ${status}`);
      load();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const updateCommission = async (id: string, currentRate: number) => {
    const rateStr = prompt('Enter new commission rate (0-100%):', currentRate.toString());
    if (rateStr === null) return;
    const rate = parseFloat(rateStr);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Please enter a valid percentage between 0 and 100');
      return;
    }
    try {
      await api.put(`/vendor/admin/stores/${id}/commission`, { commissionRate: rate });
      toast.success(`Commission rate updated to ${rate}%`);
      load();
    } catch (err) {
      toast.error('Failed to update commission rate');
    }
  };

  const handleEditOpen = (store: any) => {
    setEditingStore(store);
    setEditFormData({
      name: store.name || '',
      logo: store.logo || '',
      description: store.description || '',
    });
  };

  const handleEditSave = async () => {
    if (!editingStore) return;
    setSaving(true);
    try {
      await api.put(`/vendor/admin/stores/${editingStore._id}`, editFormData);
      toast.success('Store profile updated');
      setEditingStore(null);
      load();
    } catch (err) {
      toast.error('Failed to update store profile');
    } finally {
      setSaving(false);
    }
  };

  const filtered = filter === 'all' ? stores : stores.filter((s) => s.status === filter);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'active', label: 'Active' },
    { id: 'suspended', label: 'Suspended' },
  ] as const;

  const storeActions = (s: any) => (
    <div className="flex items-center gap-1">
      {s.status !== 'active' && (
        <button
          type="button"
          aria-label="Approve"
          className="rounded-none p-1.5 hover:bg-emerald-500/10"
          title="Approve / Activate"
          onClick={() => updateStatus(s._id, 'active')}
        >
          <Check className="size-3.5 text-emerald-600" />
        </button>
      )}
      {s.status === 'active' && (
        <button
          type="button"
          aria-label="Suspend"
          className="rounded-none p-1.5 hover:bg-destructive/10"
          title="Suspend"
          onClick={() => updateStatus(s._id, 'suspended')}
        >
          <X className="size-3.5 text-destructive" />
        </button>
      )}
      <button
        type="button"
        aria-label="Edit Profile"
        className="rounded-none p-1.5 hover:bg-blue-500/10"
        title="Edit Store Profile"
        onClick={() => handleEditOpen(s)}
      >
        <Edit className="size-3.5 text-blue-600" />
      </button>
      <button
        type="button"
        aria-label="Set Commission"
        className="rounded-none p-1.5 hover:bg-primary/10"
        title="Set Commission"
        onClick={() => updateCommission(s._id, s.commissionRate)}
      >
        <Percent className="size-3.5 text-primary" />
      </button>
    </div>
  );

  return (
    <div className={PAGE_ROOT_CLASS}>
      <PageStickyHeader
        toolbar={
          <div className={PAGE_TOOLBAR_ROW_CLASS}>
            <h1 className="text-sm font-semibold flex items-center gap-2">
              <StoreIcon className="size-4 text-primary" /> Vendor Stores
            </h1>
            <span className="text-xs text-muted-foreground">{stores.length} total</span>
          </div>
        }
        subTabs={
          <div className={PAGE_TAB_GROUP_CLASS}>
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={pageTabButtonClass(filter === t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />

      <div className={PAGE_LIST_BODY_CLASS}>
        <DesktopTablePanel className="overflow-x-auto no-scrollbar">
          <table className={opsTableClass}>
            <thead className="bg-muted/30">
              <tr>
                {['Store Name', 'Vendor Name', 'Vendor Email', 'Commission Rate', 'Status', 'Actions'].map(
                  (h) => (
                    <th key={h} className={opsThClass}>
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s._id}>
                  <td className={`${opsTdClass} font-semibold`}>{s.name}</td>
                  <td className={opsTdClass}>{s.vendor?.name || 'Unknown'}</td>
                  <td className={opsTdClass}>{s.vendor?.email || '—'}</td>
                  <td className={opsTdClass}>{s.commissionRate}%</td>
                  <td className={opsTdClass}>
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                      s.status === 'active' 
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        : s.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        : 'bg-destructive/10 text-destructive border-destructive/20'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className={opsTdClass}>
                    {storeActions(s)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <p className="p-8 text-center text-sm text-muted-foreground">No vendor stores found.</p>
          )}
        </DesktopTablePanel>

        <MobileListShell>
          {!filtered.length ? (
            <MobileEmptyState message="No stores found." />
          ) : (
            filtered.map((s) => (
              <MobileRecordCard
                key={s._id}
                title={s.name}
                subtitle={`Commission: ${s.commissionRate}% · Status: ${s.status}`}
                meta={`${s.vendor?.name || 'Unknown'} (${s.vendor?.email || '—'})`}
                actions={storeActions(s)}
              />
            ))
          )}
        </MobileListShell>
      </div>

      {editingStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background border border-border/80 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-border/80 bg-muted/30 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Edit Store: {editingStore.name}</h2>
              <button onClick={() => setEditingStore(null)} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Store Name</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full h-8 px-2.5 text-sm bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Logo URL</label>
                <input
                  type="url"
                  value={editFormData.logo}
                  onChange={e => setEditFormData({ ...editFormData, logo: e.target.value })}
                  className="w-full h-8 px-2.5 text-sm bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  rows={4}
                  value={editFormData.description}
                  onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full p-2.5 text-sm bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                />
              </div>
            </div>
            <div className="p-4 border-t border-border/80 bg-muted/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingStore(null)}
                className="px-4 py-1.5 text-xs font-medium border border-border/80 rounded-md hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                disabled={saving}
                className="px-4 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

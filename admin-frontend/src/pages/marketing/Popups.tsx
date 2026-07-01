import { useState, useEffect } from 'react';
import { PAGE_ROOT_CLASS, PAGE_LIST_BODY_CLASS } from '../../lib/pageToolbar';
import { DesktopTablePanel, MobileEmptyState, MobileListShell, MobileRecordCard } from '../../components/layout/mobileAdmin';
import { createPortal } from 'react-dom';
import { Edit2, Trash2, MessageSquare } from 'lucide-react';
import api from '../../lib/axios';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Loading from '../../components/ui/Loading';
import MarketingToolbar, { StatusBadge, inputClass, labelClass } from '../../components/marketing/MarketingToolbar';

interface Popup {
  _id: string;
  name: string;
  title: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
  trigger: string;
  displayFrequency: string;
  isActive: boolean;
}

const emptyForm = {
  name: '',
  title: '',
  content: '',
  image: '',
  ctaText: '',
  ctaUrl: '',
  trigger: 'on_load',
  delaySeconds: 3,
  displayFrequency: 'once',
  isActive: true,
  sortOrder: 0,
};

export default function Popups() {
  const [items, setItems] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Popup | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchItems = async () => {
    try {
      const { data } = await api.get('/marketing/popups');
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.title.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editing) await api.put(`/marketing/popups/${editing._id}`, formData);
      else await api.post('/marketing/popups', formData);
      setIsModalOpen(false);
      fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={PAGE_ROOT_CLASS}>
      <MarketingToolbar title="Popups" searchPlaceholder="Search popups..." searchValue={search} onSearchChange={setSearch} actionLabel="New Popup" onAction={() => { setEditing(null); setFormData(emptyForm); setIsModalOpen(true); }} />

      <div className={PAGE_LIST_BODY_CLASS}>
      <DesktopTablePanel className="overflow-x-auto no-scrollbar">
        <table className="w-full border-collapse text-left">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-4 py-3 border-b text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Name</th>
              <th className="px-4 py-3 border-b text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Title</th>
              <th className="px-4 py-3 border-b text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Trigger</th>
              <th className="px-4 py-3 border-b text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Status</th>
              <th className="px-4 py-3 border-b text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[12px]">
            {loading ? (
              <Loading variant="table-row" colSpan={5} label="Loading popups…" />
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No popups yet.</td></tr>
            ) : (
              filtered.map((item) => (
                <tr key={item._id} className="border-b border-border/40 hover:bg-muted/30 last:border-0">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3">{item.title}</td>
                  <td className="px-4 py-3 capitalize">{item.trigger.replace('_', ' ')}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.isActive ? 'active' : 'inactive'} /></td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => { setEditing(item); setFormData({ name: item.name, title: item.title, content: item.content, image: '', ctaText: item.ctaText || '', ctaUrl: item.ctaUrl || '', trigger: item.trigger, delaySeconds: 3, displayFrequency: item.displayFrequency, isActive: item.isActive, sortOrder: 0 }); setIsModalOpen(true); }} className="p-1.5 text-muted-foreground hover:text-primary rounded-none mr-1"><Edit2 className="size-3.5" /></button>
                    <button type="button" onClick={() => setDeleteId(item._id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-none"><Trash2 className="size-3.5" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </DesktopTablePanel>

      <MobileListShell>
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading popups…</div>
        ) : filtered.length === 0 ? (
          <MobileEmptyState message="No popups yet." />
        ) : (
          filtered.map((item) => (
            <MobileRecordCard
              key={item._id}
              title={item.name}
              subtitle={item.title}
              meta={`${item.trigger.replace('_', ' ')} · ${item.isActive ? 'active' : 'inactive'}`}
              badges={<StatusBadge status={item.isActive ? 'active' : 'inactive'} />}
              actions={
                <>
                  <button type="button" onClick={() => { setEditing(item); setFormData({ name: item.name, title: item.title, content: item.content, image: '', ctaText: item.ctaText || '', ctaUrl: item.ctaUrl || '', trigger: item.trigger, delaySeconds: 3, displayFrequency: item.displayFrequency, isActive: item.isActive, sortOrder: 0 }); setIsModalOpen(true); }} className="p-1.5 text-muted-foreground hover:text-primary"><Edit2 className="size-3.5" /></button>
                  <button type="button" onClick={() => setDeleteId(item._id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>
                </>
              }
            />
          ))
        )}
      </MobileListShell>
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-none shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b flex items-center gap-2 shrink-0"><MessageSquare className="size-4 text-primary" /><h2 className="text-sm font-bold">{editing ? 'Edit' : 'New'} Popup</h2></div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              <div><label className={labelClass}>Internal Name</label><input required className={inputClass} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
              <div><label className={labelClass}>Popup Title</label><input required className={inputClass} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
              <div><label className={labelClass}>Content</label><textarea required rows={3} className={`${inputClass} h-auto py-2 resize-none`} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>CTA Text</label><input className={inputClass} value={formData.ctaText} onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })} /></div>
                <div><label className={labelClass}>CTA URL</label><input className={inputClass} value={formData.ctaUrl} onChange={(e) => setFormData({ ...formData, ctaUrl: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>Trigger</label><select className={inputClass} value={formData.trigger} onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}><option value="on_load">On page load</option><option value="exit_intent">Exit intent</option><option value="delay">After delay</option></select></div>
                <div><label className={labelClass}>Frequency</label><select className={inputClass} value={formData.displayFrequency} onChange={(e) => setFormData({ ...formData, displayFrequency: e.target.value })}><option value="once">Once</option><option value="session">Per session</option><option value="always">Always</option></select></div>
              </div>
              <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} /> Active</label>
            </form>
            <div className="p-4 border-t flex justify-end gap-2 bg-muted/20 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="h-8 px-4 rounded-none text-[12px]">Cancel</button>
              <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="h-8 px-4 rounded-none bg-primary text-primary-foreground text-[12px] disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ConfirmModal isOpen={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={async () => { if (!deleteId) return; setIsDeleting(true); await api.delete(`/marketing/popups/${deleteId}`); setDeleteId(null); fetchItems(); setIsDeleting(false); }} isDeleting={isDeleting} title="Delete popup?" message="This cannot be undone." />
    </div>
  );
}

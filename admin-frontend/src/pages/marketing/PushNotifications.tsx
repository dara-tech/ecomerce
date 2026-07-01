import { useState, useEffect } from 'react';
import { PAGE_ROOT_CLASS, PAGE_LIST_BODY_CLASS } from '../../lib/pageToolbar';
import { DesktopTablePanel, MobileEmptyState, MobileListShell, MobileRecordCard } from '../../components/layout/mobileAdmin';
import { createPortal } from 'react-dom';
import { Edit2, Trash2, Bell, Send } from 'lucide-react';
import api from '../../lib/axios';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Loading from '../../components/ui/Loading';
import MarketingToolbar, { StatusBadge, inputClass, labelClass } from '../../components/marketing/MarketingToolbar';

interface PushNotification {
  _id: string;
  title: string;
  message: string;
  linkUrl?: string;
  audience: string;
  status: string;
  isActive: boolean;
}

const emptyForm = {
  title: '',
  message: '',
  linkUrl: '',
  audience: 'all',
  status: 'draft',
  isActive: true,
};

export default function PushNotifications() {
  const [items, setItems] = useState<PushNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<PushNotification | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchItems = async () => {
    try {
      const { data } = await api.get('/marketing/push-notifications');
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

  const filtered = items.filter(
    (i) =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.message.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editing) {
        await api.put(`/marketing/push-notifications/${editing._id}`, formData);
      } else {
        await api.post('/marketing/push-notifications', formData);
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSend = async (id: string) => {
    try {
      await api.post(`/marketing/push-notifications/${id}/send`);
      fetchItems();
    } catch {
      alert('Failed to send notification');
    }
  };

  return (
    <div className={PAGE_ROOT_CLASS}>
      <MarketingToolbar
        title="Push Notifications"
        searchPlaceholder="Search notifications..."
        searchValue={search}
        onSearchChange={setSearch}
        actionLabel="New Notification"
        onAction={() => { setEditing(null); setFormData(emptyForm); setIsModalOpen(true); }}
      />

      <div className={PAGE_LIST_BODY_CLASS}>
      <DesktopTablePanel className="overflow-x-auto no-scrollbar">
        <table className="w-full border-collapse text-left">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-4 py-3 border-b text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Title</th>
              <th className="px-4 py-3 border-b text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Message</th>
              <th className="px-4 py-3 border-b text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Status</th>
              <th className="px-4 py-3 border-b text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[12px]">
            {loading ? (
              <Loading variant="table-row" colSpan={4} label="Loading notifications…" />
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">No notifications yet.</td></tr>
            ) : (
              filtered.map((item) => (
                <tr key={item._id} className="border-b border-border/40 hover:bg-muted/30 last:border-0">
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="px-4 py-3 text-muted-foreground line-clamp-1 max-w-xs">{item.message}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {item.status !== 'sent' && (
                        <button type="button" onClick={() => handleSend(item._id)} className="p-1.5 text-primary hover:bg-primary/10 rounded-none"><Send className="size-3.5" /></button>
                      )}
                      <button type="button" onClick={() => { setEditing(item); setFormData({ title: item.title, message: item.message, linkUrl: item.linkUrl || '', audience: item.audience, status: item.status, isActive: item.isActive }); setIsModalOpen(true); }} className="p-1.5 text-muted-foreground hover:text-primary rounded-none"><Edit2 className="size-3.5" /></button>
                      <button type="button" onClick={() => setDeleteId(item._id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-none"><Trash2 className="size-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </DesktopTablePanel>

      <MobileListShell>
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading notifications…</div>
        ) : filtered.length === 0 ? (
          <MobileEmptyState message="No notifications yet." />
        ) : (
          filtered.map((item) => (
            <MobileRecordCard
              key={item._id}
              title={item.title}
              subtitle={item.message}
              meta={item.status}
              badges={<StatusBadge status={item.status} />}
              actions={
                <>
                  {item.status !== 'sent' && (
                    <button type="button" onClick={() => handleSend(item._id)} className="p-1.5 text-primary"><Send className="size-3.5" /></button>
                  )}
                  <button type="button" onClick={() => { setEditing(item); setFormData({ title: item.title, message: item.message, linkUrl: item.linkUrl || '', audience: item.audience, status: item.status, isActive: item.isActive }); setIsModalOpen(true); }} className="p-1.5 text-muted-foreground hover:text-primary"><Edit2 className="size-3.5" /></button>
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
          <div className="w-full max-w-lg bg-card border border-border rounded-none shadow-xl overflow-hidden">
            <div className="p-5 border-b flex items-center gap-2"><Bell className="size-4 text-primary" /><h2 className="text-sm font-bold">{editing ? 'Edit' : 'New'} Push Notification</h2></div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div><label className={labelClass}>Title</label><input required className={inputClass} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
              <div><label className={labelClass}>Message</label><textarea required rows={3} className={`${inputClass} h-auto py-2 resize-none`} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} /></div>
              <div><label className={labelClass}>Link URL</label><input className={inputClass} value={formData.linkUrl} onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })} placeholder="/products" /></div>
              <div><label className={labelClass}>Audience</label><select className={inputClass} value={formData.audience} onChange={(e) => setFormData({ ...formData, audience: e.target.value })}><option value="all">All users</option><option value="subscribers">Subscribers</option><option value="customers">Customers</option></select></div>
            </form>
            <div className="p-4 border-t flex justify-end gap-2 bg-muted/20">
              <button type="button" onClick={() => setIsModalOpen(false)} className="h-8 px-4 rounded-none text-[12px]">Cancel</button>
              <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="h-8 px-4 rounded-none bg-primary text-primary-foreground text-[12px] disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ConfirmModal isOpen={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={async () => { if (!deleteId) return; setIsDeleting(true); await api.delete(`/marketing/push-notifications/${deleteId}`); setDeleteId(null); fetchItems(); setIsDeleting(false); }} isDeleting={isDeleting} title="Delete notification?" message="This cannot be undone." />
    </div>
  );
}

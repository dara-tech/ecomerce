import { useState, useEffect } from 'react';
import { PAGE_ROOT_CLASS, PAGE_BODY_CLASS } from '../../lib/pageToolbar';
import { createPortal } from 'react-dom';
import { Edit2, Trash2, Mail, Send } from 'lucide-react';
import api from '../../lib/axios';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Loading from '../../components/ui/Loading';
import MarketingToolbar, { StatusBadge, inputClass, labelClass } from '../../components/marketing/MarketingToolbar';

interface EmailCampaign {
  _id: string;
  name: string;
  subject: string;
  body: string;
  audience: string;
  status: string;
  scheduledAt?: string;
  sentAt?: string;
}

const emptyForm = {
  name: '',
  subject: '',
  body: '',
  audience: 'all',
  status: 'draft',
  scheduledAt: '',
};

export default function EmailCampaigns() {
  const [items, setItems] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<EmailCampaign | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchItems = async () => {
    try {
      const { data } = await api.get('/marketing/email-campaigns');
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
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.subject.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (item: EmailCampaign) => {
    setEditing(item);
    setFormData({
      name: item.name,
      subject: item.subject,
      body: item.body,
      audience: item.audience,
      status: item.status,
      scheduledAt: item.scheduledAt ? item.scheduledAt.slice(0, 16) : '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt) : undefined,
      };
      if (editing) {
        await api.put(`/marketing/email-campaigns/${editing._id}`, payload);
      } else {
        await api.post('/marketing/email-campaigns', payload);
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
      await api.post(`/marketing/email-campaigns/${id}/send`);
      fetchItems();
    } catch {
      alert('Failed to send campaign');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/marketing/email-campaigns/${deleteId}`);
      setDeleteId(null);
      fetchItems();
    } finally {
      setIsDeleting(false);
    }
  };

  const modal = isModalOpen
    ? createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-none shadow-xl overflow-hidden">
            <div className="p-5 border-b border-border/80 flex items-center gap-2">
              <Mail className="size-4 text-primary" />
              <h2 className="text-sm font-bold">{editing ? 'Edit Campaign' : 'New Email Campaign'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className={labelClass}>Campaign Name</label>
                <input required className={inputClass} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Subject</label>
                <input required className={inputClass} value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Audience</label>
                <select className={inputClass} value={formData.audience} onChange={(e) => setFormData({ ...formData, audience: e.target.value })}>
                  <option value="all">All users</option>
                  <option value="subscribers">Subscribers</option>
                  <option value="customers">Customers</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Email Body</label>
                <textarea required rows={5} className={`${inputClass} h-auto py-2 resize-none`} value={formData.body} onChange={(e) => setFormData({ ...formData, body: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Schedule (optional)</label>
                <input type="datetime-local" className={inputClass} value={formData.scheduledAt} onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value, status: e.target.value ? 'scheduled' : 'draft' })} />
              </div>
            </form>
            <div className="p-4 border-t border-border/80 flex justify-end gap-2 bg-muted/20">
              <button type="button" onClick={() => setIsModalOpen(false)} className="h-8 px-4 rounded-none text-[12px] font-medium hover:bg-muted">Cancel</button>
              <button type="submit" form="email-form" onClick={handleSubmit} disabled={isSubmitting} className="h-8 px-4 rounded-none bg-primary text-primary-foreground text-[12px] font-medium disabled:opacity-50">
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className={PAGE_ROOT_CLASS}>
      <MarketingToolbar
        title="Email Campaigns"
        searchPlaceholder="Search campaigns..."
        searchValue={search}
        onSearchChange={setSearch}
        actionLabel="New Campaign"
        onAction={openAdd}
      />

      <div className={PAGE_BODY_CLASS}>
      <div className="border border-border/80 rounded-none overflow-hidden bg-card shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-4 py-3 border-b border-border/80 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Name</th>
              <th className="px-4 py-3 border-b border-border/80 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Subject</th>
              <th className="px-4 py-3 border-b border-border/80 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Audience</th>
              <th className="px-4 py-3 border-b border-border/80 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Status</th>
              <th className="px-4 py-3 border-b border-border/80 text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[12px]">
            {loading ? (
              <Loading variant="table-row" colSpan={5} label="Loading campaigns…" />
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No campaigns yet.</td></tr>
            ) : (
              filtered.map((item) => (
                <tr key={item._id} className="border-b border-border/40 hover:bg-muted/30 last:border-0 group">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.subject}</td>
                  <td className="px-4 py-3 capitalize">{item.audience}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {item.status !== 'sent' && (
                        <button type="button" onClick={() => handleSend(item._id)} className="p-1.5 text-primary hover:bg-primary/10 rounded-none" title="Send now">
                          <Send className="size-3.5" />
                        </button>
                      )}
                      <button type="button" onClick={() => openEdit(item)} className="p-1.5 text-muted-foreground hover:text-primary rounded-none"><Edit2 className="size-3.5" /></button>
                      <button type="button" onClick={() => setDeleteId(item._id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-none"><Trash2 className="size-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {modal}
      <ConfirmModal isOpen={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={handleDelete} isDeleting={isDeleting} title="Delete campaign?" message="This cannot be undone." />
    </div>
  );
}

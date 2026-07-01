import { useState, useEffect } from 'react';
import { PAGE_ROOT_CLASS, PAGE_LIST_BODY_CLASS } from '../../lib/pageToolbar';
import { DesktopTablePanel, MobileEmptyState, MobileListShell, MobileRecordCard } from '../../components/layout/mobileAdmin';
import { createPortal } from 'react-dom';
import { Edit2, Trash2, Zap } from 'lucide-react';
import api from '../../lib/axios';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Loading from '../../components/ui/Loading';
import MarketingToolbar, { StatusBadge, inputClass, labelClass } from '../../components/marketing/MarketingToolbar';

interface Product {
  _id: string;
  name: string;
}

interface FlashSale {
  _id: string;
  name: string;
  description?: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  products: Product[] | string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  badgeText: string;
}

const emptyForm = {
  name: '',
  description: '',
  discountType: 'percent' as 'percent' | 'fixed',
  discountValue: 10,
  products: [] as string[],
  startDate: '',
  endDate: '',
  isActive: true,
  badgeText: 'Flash Sale',
};

export default function FlashSales() {
  const [items, setItems] = useState<FlashSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<FlashSale | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchItems = async () => {
    try {
      const [salesRes, productsRes] = await Promise.all([
        api.get('/marketing/flash-sales'),
        api.get('/products', { params: { pageNumber: 1 } }),
      ]);
      setItems(salesRes.data);
      setProducts(productsRes.data.products || productsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      };
      if (editing) await api.put(`/marketing/flash-sales/${editing._id}`, payload);
      else await api.post('/marketing/flash-sales', payload);
      setIsModalOpen(false);
      fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleProduct = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.includes(id) ? prev.products.filter((p) => p !== id) : [...prev.products, id],
    }));
  };

  const formatDiscount = (sale: FlashSale) =>
    sale.discountType === 'percent' ? `${sale.discountValue}% off` : `$${sale.discountValue} off`;

  return (
    <div className={PAGE_ROOT_CLASS}>
      <MarketingToolbar title="Flash Sales" searchPlaceholder="Search flash sales..." searchValue={search} onSearchChange={setSearch} actionLabel="New Flash Sale" onAction={() => { setEditing(null); setFormData(emptyForm); setIsModalOpen(true); }} />

      <div className={PAGE_LIST_BODY_CLASS}>
      <DesktopTablePanel className="overflow-x-auto no-scrollbar">
        <table className="w-full border-collapse text-left">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-4 py-3 border-b text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Name</th>
              <th className="px-4 py-3 border-b text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Discount</th>
              <th className="px-4 py-3 border-b text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Period</th>
              <th className="px-4 py-3 border-b text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Products</th>
              <th className="px-4 py-3 border-b text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Status</th>
              <th className="px-4 py-3 border-b text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[12px]">
            {loading ? (
              <Loading variant="table-row" colSpan={6} label="Loading flash sales…" />
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No flash sales yet.</td></tr>
            ) : (
              filtered.map((item) => (
                <tr key={item._id} className="border-b border-border/40 hover:bg-muted/30 last:border-0">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3">{formatDiscount(item)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-[11px]">{new Date(item.startDate).toLocaleDateString()} – {new Date(item.endDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{Array.isArray(item.products) ? item.products.length : 0}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.isActive ? 'active' : 'inactive'} /></td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => { setEditing(item); setFormData({ name: item.name, description: item.description || '', discountType: item.discountType, discountValue: item.discountValue, products: (item.products as Product[]).map((p) => typeof p === 'string' ? p : p._id), startDate: item.startDate.slice(0, 16), endDate: item.endDate.slice(0, 16), isActive: item.isActive, badgeText: item.badgeText }); setIsModalOpen(true); }} className="p-1.5 text-muted-foreground hover:text-primary rounded-none mr-1"><Edit2 className="size-3.5" /></button>
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
          <div className="py-8 text-center text-sm text-muted-foreground">Loading flash sales…</div>
        ) : filtered.length === 0 ? (
          <MobileEmptyState message="No flash sales yet." />
        ) : (
          filtered.map((item) => (
            <MobileRecordCard
              key={item._id}
              title={item.name}
              subtitle={formatDiscount(item)}
              meta={`${new Date(item.startDate).toLocaleDateString()} – ${new Date(item.endDate).toLocaleDateString()} · ${Array.isArray(item.products) ? item.products.length : 0} products`}
              badges={<StatusBadge status={item.isActive ? 'active' : 'inactive'} />}
              actions={
                <>
                  <button type="button" onClick={() => { setEditing(item); setFormData({ name: item.name, description: item.description || '', discountType: item.discountType, discountValue: item.discountValue, products: (item.products as Product[]).map((p) => typeof p === 'string' ? p : p._id), startDate: item.startDate.slice(0, 16), endDate: item.endDate.slice(0, 16), isActive: item.isActive, badgeText: item.badgeText }); setIsModalOpen(true); }} className="p-1.5 text-muted-foreground hover:text-primary"><Edit2 className="size-3.5" /></button>
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
            <div className="p-5 border-b flex items-center gap-2 shrink-0"><Zap className="size-4 text-primary" /><h2 className="text-sm font-bold">{editing ? 'Edit' : 'New'} Flash Sale</h2></div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              <div><label className={labelClass}>Sale Name</label><input required className={inputClass} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
              <div><label className={labelClass}>Badge Text</label><input className={inputClass} value={formData.badgeText} onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>Discount Type</label><select className={inputClass} value={formData.discountType} onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percent' | 'fixed' })}><option value="percent">Percent</option><option value="fixed">Fixed amount</option></select></div>
                <div><label className={labelClass}>Discount Value</label><input type="number" min={0} required className={inputClass} value={formData.discountValue} onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>Start</label><input type="datetime-local" required className={inputClass} value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} /></div>
                <div><label className={labelClass}>End</label><input type="datetime-local" required className={inputClass} value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} /></div>
              </div>
              <div>
                <label className={labelClass}>Products</label>
                <div className="max-h-32 overflow-y-auto border border-border/80 rounded-none p-2 space-y-1">
                  {products.map((p) => (
                    <label key={p._id} className="flex items-center gap-2 text-[12px] cursor-pointer hover:bg-muted/30 p-1 rounded">
                      <input type="checkbox" checked={formData.products.includes(p._id)} onChange={() => toggleProduct(p._id)} />
                      {p.name}
                    </label>
                  ))}
                </div>
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

      <ConfirmModal isOpen={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={async () => { if (!deleteId) return; setIsDeleting(true); await api.delete(`/marketing/flash-sales/${deleteId}`); setDeleteId(null); fetchItems(); setIsDeleting(false); }} isDeleting={isDeleting} title="Delete flash sale?" message="This cannot be undone." />
    </div>
  );
}

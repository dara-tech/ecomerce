import { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { useOpsList } from '../lib/useOpsList';
import { opsInputClass, opsLabelClass, opsTableClass, opsThClass, opsTdClass } from '../lib/opsUi';
import { PAGE_TOOLBAR_ROW_CLASS, PAGE_PRIMARY_BTN_CLASS, PAGE_ROOT_CLASS, PAGE_BODY_CLASS } from '../lib/pageToolbar';
import { PageStickyHeader } from '../components/layout/PageSubTabs';
import ConfirmModal from '../components/ui/ConfirmModal';

const empty = {
  code: '',
  name: '',
  type: 'percent' as 'percent' | 'fixed' | 'free_shipping',
  value: 10,
  minOrderAmount: 0,
  usageLimit: 100,
  perCustomerLimit: 1,
  expiresAt: '',
  isActive: true,
};

export default function Coupons() {
  const { items, create, update, remove } = useOpsList<any>('coupons');
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(empty);
    setShowForm(true);
  };

  const openEdit = (c: any) => {
    setEditingId(c._id);
    setForm({
      code: c.code,
      name: c.name,
      type: c.type,
      value: c.value,
      minOrderAmount: c.minOrderAmount ?? 0,
      usageLimit: c.usageLimit ?? 0,
      perCustomerLimit: c.perCustomerLimit ?? 1,
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 10) : '',
      isActive: c.isActive ?? true,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, code: form.code.toUpperCase(), expiresAt: form.expiresAt || undefined };
    if (editingId) {
      await update(editingId, payload);
    } else {
      await create(payload);
    }
    setForm(empty);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className={PAGE_ROOT_CLASS}>
      <PageStickyHeader
        toolbar={
          <div className={PAGE_TOOLBAR_ROW_CLASS}>
            <h1 className="text-sm font-semibold">Coupons</h1>
            <button type="button" className={PAGE_PRIMARY_BTN_CLASS} onClick={openCreate}><Plus className="size-3.5" /> New Coupon</button>
          </div>
        }
        subTabs={<span className="text-xs text-muted-foreground">Manage discount codes</span>}
      />

      <div className={PAGE_BODY_CLASS}>
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border/80 rounded-none p-5 grid md:grid-cols-2 gap-4">
            <div><label className={opsLabelClass}>Code</label><input required className={opsInputClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div><label className={opsLabelClass}>Name</label><input required className={opsInputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className={opsLabelClass}>Type</label>
              <select className={opsInputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}>
                <option value="percent">Percentage discount</option>
                <option value="fixed">Fixed discount</option>
                <option value="free_shipping">Free shipping</option>
              </select>
            </div>
            {form.type !== 'free_shipping' && (
              <div><label className={opsLabelClass}>Value {form.type === 'percent' ? '(%)' : '($)'}</label><input type="number" className={opsInputClass} value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} /></div>
            )}
            <div><label className={opsLabelClass}>Min order ($)</label><input type="number" className={opsInputClass} value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })} /></div>
            <div><label className={opsLabelClass}>Usage limit (0 = unlimited)</label><input type="number" className={opsInputClass} value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })} /></div>
            <div><label className={opsLabelClass}>Per customer limit</label><input type="number" className={opsInputClass} value={form.perCustomerLimit} onChange={(e) => setForm({ ...form, perCustomerLimit: Number(e.target.value) })} /></div>
            <div><label className={opsLabelClass}>Expiration</label><input type="date" className={opsInputClass} value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className={PAGE_PRIMARY_BTN_CLASS}>{editingId ? 'Update Coupon' : 'Save Coupon'}</button>
              <button type="button" className="h-8 px-4 text-[12px] border rounded-none" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
            </div>
          </form>
        )}

        <div className="border border-border/80 rounded-none overflow-hidden bg-card overflow-x-auto no-scrollbar">
          <table className={opsTableClass}>
            <thead className="bg-muted/30"><tr>{['Code', 'Type', 'Value', 'Used', 'Limit', 'Expires', 'Customer', 'Active', ''].map((h) => <th key={h} className={opsThClass}>{h}</th>)}</tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c._id}>
                  <td className={opsTdClass}><code className="font-mono text-xs">{c.code}</code></td>
                  <td className={opsTdClass}>{c.type}</td>
                  <td className={opsTdClass}>{c.type === 'free_shipping' ? '—' : c.type === 'percent' ? `${c.value}%` : `$${c.value}`}</td>
                  <td className={opsTdClass}>{c.usedCount}/{c.usageLimit || '∞'}</td>
                  <td className={opsTdClass}>{c.usageLimit || '∞'}</td>
                  <td className={opsTdClass}>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}</td>
                  <td className={opsTdClass}>{c.customer?.name || 'All customers'}</td>
                  <td className={opsTdClass}>
                    <button type="button" className="text-xs" onClick={() => update(c._id, { isActive: !c.isActive })}>{c.isActive ? 'Active' : 'Off'}</button>
                  </td>
                  <td className={opsTdClass}>
                    <div className="flex items-center gap-2">
                      <button type="button" aria-label="Edit coupon" onClick={() => openEdit(c)}><Pencil className="size-3.5 text-primary" /></button>
                      <button type="button" aria-label="Delete coupon" onClick={() => setDeleteId(c._id)}><Trash2 className="size-3.5 text-destructive" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal isOpen={!!deleteId} title="Delete coupon?" message="This cannot be undone." onConfirm={async () => { if (deleteId) { await remove(deleteId); setDeleteId(null); } }} onCancel={() => setDeleteId(null)} />
    </div>
  );
}

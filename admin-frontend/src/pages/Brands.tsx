import { useState, useEffect } from 'react';
import api from '../lib/axios';
import ConfirmModal from '../components/ui/ConfirmModal';
import Loading from '../components/ui/Loading';
import { PAGE_ROOT_CLASS, PAGE_TOOLBAR_CLASS, PAGE_TOOLBAR_ROW_CLASS, PAGE_LIST_BODY_CLASS, PAGE_PRIMARY_BTN_CLASS } from '../lib/pageToolbar';
import DataTableShell from '../components/layout/DataTableShell';
import { MobileFab, MobileListShell, MobileRecordCard, MobileEmptyState } from '../components/layout/mobileAdmin';

interface Brand {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
}

const Brands = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/brands');
      setBrands(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const requestDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await api.delete(`/brands/${deleteId}`);
      fetchBrands();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete brand');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const openEdit = (brand: Brand) => {
    setEditingId(brand._id);
    setFormData({ name: brand.name, description: brand.description || '' });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (editingId) {
        await api.put(`/brands/${editingId}`, formData);
      } else {
        await api.post('/brands', formData);
      }
      setFormData({ name: '', description: '' });
      setEditingId(null);
      setIsModalOpen(false);
      fetchBrands();
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${editingId ? 'update' : 'create'} brand`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={PAGE_ROOT_CLASS}>
      <div className={PAGE_TOOLBAR_CLASS}>
        <div className={PAGE_TOOLBAR_ROW_CLASS}>
          <h1 className="text-sm font-semibold">Brands</h1>
          <span className="text-xs text-muted-foreground">{brands.length} total</span>
        </div>
        <button type="button" onClick={openCreate} className={`${PAGE_PRIMARY_BTN_CLASS} hidden md:inline-flex`}>
          Add Brand
        </button>
      </div>
      <MobileFab onClick={openCreate} label="Add Brand" />

      <div className={PAGE_LIST_BODY_CLASS}>
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-[11px] font-medium text-center">
          {error}
        </div>
      )}

      {/* Desktop Table */}
      <DataTableShell>
        <table className="w-full border-collapse text-left">
          <thead className="bg-muted/25">
            <tr>
              <th className="border-b border-border/80 px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Brand Name</th>
              <th className="border-b border-border/80 px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Description</th>
              <th className="border-b border-border/80 px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Created At</th>
              <th className="w-24 border-b border-border/80 px-4 py-3 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-card text-[11px] text-foreground">
            {loading ? (
              <Loading variant="table-row" colSpan={4} label="Loading brands…" />
            ) : brands.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No brands found.</td>
              </tr>
            ) : (
              brands.map((brand) => (
                <tr key={brand._id} className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-semibold">{brand.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{brand.description || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(brand.createdAt).toLocaleDateString()}</td>
                  <td className="space-x-2 px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(brand)}
                      className="cursor-pointer px-2 py-1 font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => requestDelete(brand._id)}
                      className="cursor-pointer px-2 py-1 font-medium text-destructive transition-colors hover:text-destructive/80"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </DataTableShell>

      {/* Mobile cards */}
      <MobileListShell>
        {loading ? (
          <Loading variant="panel" label="Loading brands…" />
        ) : brands.length === 0 ? (
          <MobileEmptyState message="No brands found." />
        ) : (
          brands.map((brand) => (
            <MobileRecordCard
              key={brand._id}
              title={brand.name}
              subtitle={brand.description || 'No description'}
              meta={new Date(brand.createdAt).toLocaleDateString()}
              onClick={() => openEdit(brand)}
              actions={
                <>
                  <button
                    type="button"
                    className="px-2 py-1 text-[11px] font-medium text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(brand);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="px-2 py-1 text-[11px] font-medium text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      requestDelete(brand._id);
                    }}
                  >
                    Delete
                  </button>
                </>
              }
            />
          ))
        )}
      </MobileListShell>
      </div>

      {/* Simple Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="flex w-full max-w-sm flex-col overflow-hidden bg-card text-foreground rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-border relative animate-in zoom-in-95 duration-200">
            
            <div className="flex shrink-0 items-center justify-between gap-3 bg-muted border-b border-border px-5 py-3.5">
              <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                {editingId ? 'Edit Brand' : 'Add New Brand'}
              </h3>
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); setEditingId(null); }}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-none cursor-pointer text-muted-foreground hover:text-foreground hover:bg-black/5 transition-colors outline-none focus:outline-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col min-h-0">
              <div className="p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground">Brand Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-input border border-border rounded-none px-3 py-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-input border border-border rounded-none px-3 py-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-muted/20">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-none text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-none text-[11px] font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity outline-none focus:outline-none"
                >
                  {isSaving ? 'Saving...' : editingId ? 'Update Brand' : 'Save Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Brand"
        message="Are you sure you want to delete this brand? This action cannot be undone."
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default Brands;

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, Trash2, Edit2, X, FolderTree, Package, Image as ImageIcon } from 'lucide-react';
import api from '../lib/axios';
import {PAGE_TOOLBAR_CLASS, PAGE_TOOLBAR_ROW_CLASS, PAGE_ROOT_CLASS, PAGE_LIST_BODY_CLASS, PAGE_TABLE_HEAD_CLASS} from '../lib/pageToolbar';
import DataTableShell from '../components/layout/DataTableShell';
import Loading, { LoadingSpinner } from '../components/ui/Loading';
import ConfirmModal from '../components/ui/ConfirmModal';
import { cn } from '../lib/utils';

interface Category {
  _id: string;
  name: string;
  description: string;
  icon?: string;
  isActive: boolean;
  productCount?: number;
  createdAt: string;
}

const defaultFormData = { name: '', description: '', icon: '', isActive: true };

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  
  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Single Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filtered categories
  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Selection
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCategories.length && filteredCategories.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCategories.map(c => c._id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  // Status Toggle
  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/categories/${id}`, { isActive: !currentStatus });
      setCategories(prev => prev.map(c => c._id === id ? { ...c, isActive: !currentStatus } : c));
    } catch (error) {
      alert('Failed to update status');
    }
  };

  // Delete
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await api.delete(`/categories/${deleteId}`);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(deleteId);
        return next;
      });
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setIsBulkDeleting(true);
      await Promise.all(Array.from(selectedIds).map(id => api.delete(`/categories/${id}`)));
      setSelectedIds(new Set());
      fetchCategories();
    } catch (error) {
      alert('Failed to delete some categories');
    } finally {
      setIsBulkDeleting(false);
      setShowBulkConfirm(false);
    }
  };

  // Add/Edit Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (editingId) {
        await api.put(`/categories/${editingId}`, formData);
      } else {
        await api.post('/categories', formData);
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingId(category._id);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      isActive: category.isActive !== undefined ? category.isActive : true
    });
    setIsModalOpen(true);
  };

  return (
    <div className={PAGE_ROOT_CLASS}>
      <div className={PAGE_TOOLBAR_CLASS}>
        <div className={PAGE_TOOLBAR_ROW_CLASS}>
          {/* Search */}
          <div className="flex w-full gap-2 md:max-w-xs items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 h-8 text-[13px] font-medium bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
          </div>
        </div>
        
        {selectedIds.size > 0 ? (
          <div className="flex items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0">
            <button
              onClick={() => setShowBulkConfirm(true)}
              className="h-8 px-3 rounded-md border border-destructive/20 bg-destructive/5 text-destructive text-[12px] font-semibold flex items-center gap-2 hover:bg-destructive/10 transition-colors w-full lg:w-auto"
            >
              <Trash2 className="size-4" />
              Delete ({selectedIds.size})
            </button>
            <button
              onClick={openAddModal}
              className="hidden md:block shrink-0 h-8 px-4 rounded-md bg-primary text-primary-foreground text-[12px] font-semibold shadow-sm hover:opacity-95 transition-all w-full lg:w-auto"
            >
              Add Category
            </button>
          </div>
        ) : (
          <button
            onClick={openAddModal}
            className="hidden md:block shrink-0 h-8 px-4 rounded-md bg-primary text-primary-foreground text-[12px] font-semibold shadow-sm hover:opacity-95 transition-all w-full lg:w-auto mt-2 lg:mt-0"
          >
            Add Category
          </button>
        )}
      </div>

      <div className={PAGE_LIST_BODY_CLASS}>
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-[11px] font-medium text-center rounded-lg">
          {error}
        </div>
      )}

      {/* Desktop Table View */}
      <DataTableShell>
          <table className="w-full text-left border-collapse">
            <thead className={PAGE_TABLE_HEAD_CLASS}>
              <tr>
                <th className="px-4 py-3 border-b border-border/80 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredCategories.length && filteredCategories.length > 0}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary bg-card cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">Category Name</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground w-32">Products</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground w-32">Status</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-foreground">
              {loading ? (
                <Loading variant="table-row" colSpan={5} label="Loading categories…" />
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                        <FolderTree className="size-6 text-muted-foreground/50" />
                      </div>
                      <p className="text-[14px] font-medium text-foreground">No categories found</p>
                      <p className="text-[13px]">Try adjusting your search or add a new category.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr 
                    key={category._id} 
                    className={cn(
                      "border-b border-border/40 hover:bg-muted/30 transition-colors last:border-0 group",
                      selectedIds.has(category._id) && "bg-primary/5 hover:bg-primary/5"
                    )}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(category._id)}
                        onChange={() => toggleSelect(category._id)}
                        className="w-4 h-4 rounded border-border/80 text-primary focus:ring-primary focus:ring-offset-background bg-card cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center shrink-0">
                          {category.icon ? (
                            <img src={category.icon} alt={category.name} className="w-6 h-6 object-contain" />
                          ) : (
                            <FolderTree className="size-5 text-muted-foreground/60" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-[14px]">{category.name}</p>
                          {category.description && (
                            <p className="text-muted-foreground text-[12px] mt-0.5 line-clamp-1">{category.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/40 border border-border/50">
                        <Package className="size-3.5 text-muted-foreground" />
                        <span className="font-medium text-[12px]">{category.productCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleStatus(category._id, category.isActive)}
                        className={cn(
                          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                          category.isActive ? "bg-primary" : "bg-muted"
                        )}
                      >
                        <span className="sr-only">Toggle status</span>
                        <span
                          className={cn(
                            "pointer-events-none absolute left-0.5 inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            category.isActive ? "translate-x-4" : "translate-x-0"
                          )}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(category)}
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit Category"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(category._id)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </DataTableShell>

      {/* Mobile Card View */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto md:hidden">
        {loading ? (
          <Loading variant="panel" label="Loading categories…" />
        ) : filteredCategories.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground bg-card rounded-lg border border-border/80">
            No categories found matching your criteria.
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div 
              key={category._id} 
              onClick={() => openEditModal(category)}
              className="bg-card border border-border/80 rounded-xl p-3 shadow-sm flex flex-col gap-3 cursor-pointer hover:border-primary/50 transition-colors relative group"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="shrink-0">
                  <div className="size-12 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center">
                    {category.icon ? (
                      <img src={category.icon} alt={category.name} className="w-6 h-6 object-contain" />
                    ) : (
                      <FolderTree className="size-5 text-muted-foreground/60" />
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="font-semibold text-[14px] text-foreground truncate pr-8">{category.name}</div>
                  {category.description && (
                    <div className="text-[12px] text-muted-foreground mt-0.5 line-clamp-1 pr-4">{category.description}</div>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/40 border border-border/50">
                      <Package className="size-3 text-muted-foreground" />
                      <span className="font-medium text-[11px]">{category.productCount || 0} products</span>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      category.isActive ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                    )}>
                      {category.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkbox (Bottom Row) */}
              <div 
                className="flex items-center justify-between pt-3 border-t border-border/50"
                onClick={e => e.stopPropagation()}
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(category._id)}
                    onChange={() => toggleSelect(category._id)}
                    className="w-4 h-4 rounded border-border/80 text-primary focus:ring-primary focus:ring-offset-background bg-card cursor-pointer"
                  />
                  <span className="text-[12px] font-medium text-muted-foreground">Select</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStatus(category._id, category.isActive)}
                    className="px-2 py-1 text-[11px] font-semibold rounded-md border border-border/80 hover:bg-muted text-foreground transition-colors"
                  >
                    Toggle Status
                  </button>
                  <button 
                    onClick={() => setDeleteId(category._id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="flex w-full max-w-md flex-col overflow-hidden bg-card text-foreground rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-border relative animate-in zoom-in-95 duration-200">
            
            <div className="flex shrink-0 items-center justify-between gap-3 bg-muted/30 border-b border-border/60 px-5 py-4">
              <h3 className="text-[15px] font-semibold flex items-center gap-2">
                {editingId ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col min-h-0">
              <div className="p-5 flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-muted-foreground">Category Name <span className="text-destructive">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-11 bg-input border border-border/60 rounded-xl px-4 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="e.g. Electronics"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-muted-foreground">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-input border border-border/60 rounded-xl px-4 py-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    placeholder="Brief description of this category..."
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-muted-foreground">Icon / Image URL</label>
                  <div className="flex gap-2">
                    <div className="size-11 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center shrink-0">
                      {formData.icon ? (
                        <img src={formData.icon} alt="Icon preview" className="w-6 h-6 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      ) : (
                        <ImageIcon className="size-5 text-muted-foreground/50" />
                      )}
                    </div>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="flex-1 h-11 bg-input border border-border/60 rounded-xl px-4 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-border/40 mt-2">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-foreground">Active Status</span>
                    <span className="text-[12px] text-muted-foreground">Show this category to customers</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                      formData.isActive ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none absolute left-0.5 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        formData.isActive ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>

              <div className="flex bg-muted/30 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="flex-1 py-3.5 text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-50 border-r border-border/60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3.5 text-[13px] font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving && <LoadingSpinner size="xs" className="border-primary-foreground/30 border-t-primary-foreground" />}
                  {isSaving ? 'Saving...' : (editingId ? 'Save Changes' : 'Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmModal
        isOpen={showBulkConfirm}
        title="Delete Categories"
        message={`Are you sure you want to delete ${selectedIds.size} categories? This action cannot be undone.`}
        isDeleting={isBulkDeleting}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkConfirm(false)}
      />

      {/* Mobile Floating Action Button */}
      <button
        onClick={openAddModal}
        className="md:hidden fixed bottom-6 right-6 z-40 size-14 bg-primary text-primary-foreground rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex items-center justify-center hover:scale-105 hover:-translate-y-1 active:scale-95 transition-all duration-200"
      >
        <Plus className="size-6" strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default Categories;

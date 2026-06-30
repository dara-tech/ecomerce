import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Plus, Image as ImageIcon, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../lib/axios';
import {PAGE_TOOLBAR_CLASS, PAGE_TOOLBAR_ROW_CLASS, PAGE_ROOT_CLASS, PAGE_LIST_BODY_CLASS, PAGE_TABLE_HEAD_CLASS} from '../../lib/pageToolbar';
import DataTableShell from '../../components/layout/DataTableShell';
import Loading from '../../components/ui/Loading';
import ConfirmModal from '../../components/ui/ConfirmModal';

interface Banner {
  _id: string;
  title: string;
  subtitle: string;
  image: string;
  linkUrl: string;
  isActive: boolean;
  sortOrder: number;
}

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image: '',
    linkUrl: '',
    isActive: true,
    sortOrder: 0
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data } = await api.get('/cms/banners');
      setBanners(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingBanner(null);
    setFormData({ title: '', subtitle: '', image: '', linkUrl: '', isActive: true, sortOrder: 0 });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({ 
      title: banner.title, 
      subtitle: banner.subtitle || '', 
      image: banner.image, 
      linkUrl: banner.linkUrl || '', 
      isActive: banner.isActive, 
      sortOrder: banner.sortOrder 
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      if (editingBanner) {
        await api.put(`/cms/banners/${editingBanner._id}`, formData);
      } else {
        await api.post('/cms/banners', formData);
      }
      setIsModalOpen(false);
      fetchBanners();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/cms/banners/${deleteId}`);
      fetchBanners();
      setDeleteId(null);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete banner');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderModal = () => {
    if (!isModalOpen) return null;
    return createPortal(
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
        <div className="flex w-full max-w-md flex-col overflow-hidden bg-card text-foreground rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-border relative animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <ImageIcon className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  {editingBanner ? 'Edit Banner' : 'Add Banner'}
                </h2>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md cursor-pointer text-muted-foreground hover:text-foreground hover:bg-black/5 transition-colors outline-none focus:outline-none"
            >
              <X className="size-4" />
            </button>
          </div>
          
          {/* Modal Body */}
          <div className="p-5 overflow-y-auto max-h-[calc(100vh-200px)]">
            {error && <div className="mb-4 p-2 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>}
            <form id="banner-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Title *</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Summer Sale" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Image URL *</label>
                <input required type="url" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Target Link</label>
                <input type="text" value={formData.linkUrl} onChange={e => setFormData({...formData, linkUrl: e.target.value})} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="/products?category=summer" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Sort Order</label>
                  <input type="number" value={formData.sortOrder} onChange={e => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="flex-1 flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="rounded border-border text-primary focus:ring-primary bg-background" />
                    <span className="text-[13px] font-medium">Active</span>
                  </label>
                </div>
              </div>
            </form>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-border/80 flex justify-end gap-2 bg-muted/20">
            <button type="button" onClick={() => setIsModalOpen(false)} className="h-8 px-4 rounded-md text-[12px] font-medium hover:bg-muted transition-colors">Cancel</button>
            <button form="banner-form" type="submit" disabled={isSubmitting} className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-[12px] font-medium shadow-sm hover:opacity-95 transition-all disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save Banner'}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };


  return (
    <div className={PAGE_ROOT_CLASS}>
      <div className={PAGE_TOOLBAR_CLASS}>
        <div className={PAGE_TOOLBAR_ROW_CLASS}>
          <div className="flex w-full gap-2 md:max-w-xs items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Search banners..."
                className="w-full pl-8 pr-3 h-8 text-[13px] font-medium bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
          </div>
        </div>
        <button onClick={openAddModal} className="hidden md:block shrink-0 h-8 px-4 rounded-md bg-primary text-primary-foreground text-[12px] font-semibold shadow-sm hover:opacity-95 transition-all w-full lg:w-auto mt-2 lg:mt-0">
          Add Banner
        </button>
      </div>


      <div className={PAGE_LIST_BODY_CLASS}>
      {/* Desktop Table View */}
      <DataTableShell>
          <table className="w-full text-left border-collapse">
            <thead className={PAGE_TABLE_HEAD_CLASS}>
              <tr>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground w-20 text-center">Image</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">Title</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground w-24">Status</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground w-20 text-right">Order</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-foreground">
              {loading ? (
                <Loading variant="table-row" colSpan={5} label="Loading banners…" />
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No banners found. Click "Add Banner" to create one.
                  </td>
                </tr>
              ) : (
                banners.map(banner => (
                <tr key={banner._id} className="border-b border-border/40 hover:bg-muted/30 transition-colors last:border-0 group">
                  <td className="px-4 py-3 text-center">
                    <img src={banner.image} alt={banner.title} className="w-16 h-8 object-cover rounded-md mx-auto border border-border/50 group-hover:border-primary/30 transition-colors" />
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{banner.title}</td>
                  <td className="px-4 py-3 text-center">
                    {banner.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-semibold uppercase tracking-wider">
                        <CheckCircle2 className="size-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-600 border border-slate-500/20 text-[9px] font-semibold uppercase tracking-wider">
                        <XCircle className="size-3" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-foreground text-[12px]">{banner.sortOrder}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(banner)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-muted/50" title="Edit banner">
                        <Edit2 className="size-3.5" />
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setDeleteId(banner._id); }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10" title="Delete banner">
                        <Trash2 className="size-3.5" />
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
          <Loading variant="panel" label="Loading banners…" />
        ) : banners.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground bg-card rounded-lg border border-border/80">
            No banners found. Click "Add Banner" to create one.
          </div>
        ) : (
          banners.map((banner) => (
            <div 
              key={banner._id} 
              className="bg-card border border-border/80 rounded-xl p-3 shadow-sm flex items-start gap-3 relative group"
            >
              <div 
                className="absolute inset-0 z-0 cursor-pointer" 
                onClick={() => openEditModal(banner)}
              ></div>
              
              {/* Image */}
              <div className="shrink-0 relative z-10">
                <img 
                  src={banner.image} 
                  alt={banner.title} 
                  className="w-16 h-10 object-cover rounded-lg border border-border/50"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://placehold.co/100x50/1d1b1c/ffffff?text=No+Img';
                  }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 py-0.5 relative z-10 pointer-events-none">
                <div className="font-semibold text-[13px] text-foreground truncate pr-6">{banner.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">Order: {banner.sortOrder}</div>
                
                <div className="flex items-center justify-between mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    banner.isActive 
                      ? 'bg-green-500/10 text-green-500' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Delete Button */}
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setDeleteId(banner._id); }}
                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10 z-10"
              >
                <X className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Mobile Floating Action Button */}
      <button
        onClick={openAddModal}
        className="md:hidden fixed bottom-6 right-6 z-40 size-14 bg-primary text-primary-foreground rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex items-center justify-center hover:scale-105 hover:-translate-y-1 active:scale-95 transition-all duration-200"
      >
        <Plus className="size-6" strokeWidth={2.5} />
      </button>

      {renderModal()}
      
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Banner"
        message="Are you sure you want to delete this banner? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
}


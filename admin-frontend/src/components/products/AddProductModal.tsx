import { useState, useEffect } from 'react';
import { X, Package, DollarSign, Image } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import api from '../../lib/axios';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: any;
}

const defaultFormData = {
  name: '',
  category: '',
  brand: '',
  image: '',
  description: '',
  price: 0,
  countInStock: 0,
};

const AddProductModal = ({ isOpen, onClose, onSave, initialData }: AddProductModalProps) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'inventory'>('basic');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<{name: string}[]>([]);
  const [brands, setBrands] = useState<{name: string}[]>([]);
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (isOpen) {
      api.get('/categories').then(res => setCategories(res.data)).catch(() => {});
      api.get('/brands').then(res => setBrands(res.data)).catch(() => {});
      
      if (initialData) {
        setFormData({ ...defaultFormData, ...initialData });
      } else {
        setFormData(defaultFormData);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'countInStock' ? Number(value) : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      setUploading(true);
      const { data } = await api.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData((prev) => ({ ...prev, image: data.image }));
    } catch (error) {
      console.error('Upload failed', error);
      alert('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData);
    setLoading(false);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="flex w-full max-w-md flex-col overflow-hidden bg-card text-foreground rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-border relative animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Package className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {initialData ? 'Edit Product' : 'Add New Product'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md cursor-pointer text-muted-foreground hover:text-foreground hover:bg-black/5 transition-colors outline-none focus:outline-none"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pt-2 bg-muted border-b border-border gap-1 items-end">
          <button
            onClick={() => setActiveTab('basic')}
            className={cn(
              "inline-flex shrink-0 items-center justify-center h-8 px-4 text-[11px] font-medium transition-all relative rounded-t-[10px] select-none border-t border-l border-r outline-none focus:outline-none focus:ring-0",
              activeTab === 'basic' 
                ? "bg-card text-foreground border-border z-10 -mb-[1px]" 
                : "bg-transparent text-muted-foreground border-transparent hover:bg-foreground/5 hover:text-foreground border-b-transparent"
            )}
          >
            Basic Info
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={cn(
              "inline-flex shrink-0 items-center justify-center h-8 px-4 text-[11px] font-medium transition-all relative rounded-t-[10px] select-none border-t border-l border-r outline-none focus:outline-none focus:ring-0",
              activeTab === 'inventory' 
                ? "bg-card text-foreground border-border z-10 -mb-[1px]" 
                : "bg-transparent text-muted-foreground border-transparent hover:bg-foreground/5 hover:text-foreground border-b-transparent"
            )}
          >
            Inventory & Pricing
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            
            {activeTab === 'basic' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground">Product Image</label>
                  <div className="flex items-center gap-3">
                    {formData.image ? (
                      <div className="relative size-16 rounded-md overflow-hidden border border-border">
                        <img 
                          src={formData.image} 
                          alt="Product" 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.currentTarget.onerror = null; 
                            e.currentTarget.src = 'https://placehold.co/100x100/1d1b1c/ffffff?text=No+Img';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="size-16 rounded-md border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center text-muted-foreground">
                        <Image className="size-5 mb-1 opacity-50" />
                        <span className="text-[8px] font-medium">No Image</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="block w-full text-[11px] text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                      />
                      {uploading && <p className="text-[10px] text-primary mt-1">Uploading...</p>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Wireless Headphones"
                    className="bg-input border border-border rounded-lg px-3 py-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground">Brand</label>
                    <select
                      name="brand"
                      required
                      value={formData.brand}
                      onChange={handleChange}
                      className="bg-input border border-border rounded-lg px-3 py-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
                    >
                      <option value="" disabled>Select a brand</option>
                      {brands.map((b, i) => (
                        <option key={i} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground">Category</label>
                    <select
                      name="category"
                      required
                      value={formData.category}
                      onChange={handleChange}
                      className="bg-input border border-border rounded-lg px-3 py-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
                    >
                      <option value="" disabled>Select a category</option>
                      {categories.map((c, i) => (
                        <option key={i} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the product..."
                    className="bg-input border border-border rounded-lg px-3 py-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full resize-none"
                  />
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground">Price ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <input
                      type="number"
                      name="price"
                      min="0"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={handleChange}
                      className="bg-input border border-border rounded-lg pl-8 pr-3 py-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground">Stock Quantity</label>
                  <input
                    type="number"
                    name="countInStock"
                    min="0"
                    required
                    value={formData.countInStock}
                    onChange={handleChange}
                    className="bg-input border border-border rounded-lg px-3 py-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
                  />
                </div>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-muted/20">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-1.5 rounded-lg text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-lg text-[11px] font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2 outline-none focus:outline-none"
            >
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
};

export default AddProductModal;

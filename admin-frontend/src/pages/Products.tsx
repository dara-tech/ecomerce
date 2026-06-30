import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Filter, X, Plus } from 'lucide-react';
import { createPortal } from 'react-dom';
import api from '../lib/axios';
import AddProductModal from '../components/products/AddProductModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { PAGE_TOOLBAR_CLASS, PAGE_TOOLBAR_ROW_CLASS, PAGE_ROOT_CLASS, PAGE_LIST_BODY_CLASS, PAGE_TABLE_HEAD_CLASS } from '../lib/pageToolbar';
import DataTableShell from '../components/layout/DataTableShell';
import Loading from '../components/ui/Loading';

interface Product {
  _id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  countInStock: number;
  image: string;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination & Filtering State
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [brand, setBrand] = useState('All Brands');
  const [sort, setSort] = useState('Newest First');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [categoriesList, setCategoriesList] = useState<{name: string}[]>([]);
  const [brandsList, setBrandsList] = useState<{name: string}[]>([]);

  useEffect(() => {
    // Fetch filter options once
    api.get('/categories').then(res => setCategoriesList(res.data)).catch(() => {});
    api.get('/brands').then(res => setBrandsList(res.data)).catch(() => {});
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/products', {
        params: {
          pageNumber: page,
          keyword,
          category: category === 'All Categories' ? 'all' : category,
          brand: brand === 'All Brands' ? 'all' : brand,
          sort: sort === 'Newest First' ? 'newest' : sort === 'Oldest First' ? 'oldest' : sort === 'Price: Low to High' ? 'price-asc' : sort === 'Price: High to Low' ? 'price-desc' : sort
        }
      });
      setProducts(data.products || data);
      setPage(data.page || 1);
      setPages(data.pages || 1);
      setTotal(data.total || data.products?.length || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, keyword, category, brand, sort]); // Re-fetch when dependencies change

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (value: string | null) => {
    setter(value || 'all');
    setPage(1);
  };

  const handleSaveProduct = async (productData: any) => {
    try {
      if (editProduct) {
        await api.put(`/products/${editProduct._id}`, productData);
      } else {
        await api.post('/products', productData);
      }
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${editProduct ? 'update' : 'create'} product`);
      throw err; // Re-throw so modal knows saving failed
    }
  };

  const openAddModal = () => {
    setEditProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditProduct(product);
    setIsModalOpen(true);
  };

  const requestDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await api.delete(`/products/${deleteId}`);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const filtersContent = (
    <>
      <Select value={category} onValueChange={handleFilterChange(setCategory)}>
        <SelectTrigger className="h-8 text-[13px] font-medium bg-input border-border w-full md:w-auto md:min-w-[140px]">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All Categories">All Categories</SelectItem>
          {categoriesList.map(c => (
            <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={brand} onValueChange={handleFilterChange(setBrand)}>
        <SelectTrigger className="h-8 text-[13px] font-medium bg-input border-border w-full md:w-auto md:min-w-[140px]">
          <SelectValue placeholder="All Brands" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All Brands">All Brands</SelectItem>
          {brandsList.map(b => (
            <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={(val: string | null) => { setSort(val || 'Newest First'); setPage(1); }}>
        <SelectTrigger className="h-8 text-[13px] font-medium bg-input border-border w-full md:w-auto md:min-w-[150px]">
          <SelectValue placeholder="Sort: Newest" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Newest First">Newest First</SelectItem>
          <SelectItem value="Oldest First">Oldest First</SelectItem>
          <SelectItem value="Price: Low to High">Price: Low to High</SelectItem>
          <SelectItem value="Price: High to Low">Price: High to Low</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div className={PAGE_ROOT_CLASS}>
      {/* Toolbar */}
      <div className={PAGE_TOOLBAR_CLASS}>
        <div className={PAGE_TOOLBAR_ROW_CLASS}>
          {/* Search and Mobile Filter Button */}
          <div className="flex w-full gap-2 md:max-w-xs items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={keyword}
                onChange={handleSearch}
                className="w-full pl-8 pr-3 h-8 text-[13px] font-medium bg-input border border-border rounded-none focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
            {/* Filter Button */}
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="md:hidden h-8 px-3 rounded-none border border-border/80 bg-input flex items-center justify-center gap-2 text-muted-foreground hover:bg-muted transition-colors relative shrink-0"
            >
              <Filter className="size-4" />
              {(category !== 'All Categories' || brand !== 'All Brands' || sort !== 'Newest First') && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-none" />
              )}
            </button>
          </div>

          {/* Desktop inline filters */}
          <div className="hidden md:flex flex-wrap items-center gap-2">
            {filtersContent}
            {(category !== 'All Categories' || brand !== 'All Brands' || sort !== 'Newest First') && (
              <button
                onClick={() => {
                  setCategory('All Categories');
                  setBrand('All Brands');
                  setSort('Newest First');
                  setPage(1);
                }}
                className="h-8 px-3 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="hidden md:block shrink-0 h-8 px-4 rounded-none bg-primary text-primary-foreground text-[12px] font-semibold shadow-sm hover:opacity-95 transition-all w-full sm:w-auto mt-2 sm:mt-0"
        >
          Add Product
        </button>
      </div>

      <div className={PAGE_LIST_BODY_CLASS}>
      {error && (
        <div className="shrink-0 p-3 bg-destructive/10 text-destructive text-[11px] font-medium text-center rounded-none">
          {error}
        </div>
      )}

      {/* Desktop Table View */}
      <DataTableShell
        footer={
          !loading && pages > 1 ? (
            <div className="flex shrink-0 items-center justify-between border-t border-border/80 bg-muted/20 px-4 py-3">
              <span className="text-[11px] text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{(page - 1) * 10 + 1}</span> to <span className="font-semibold text-foreground">{Math.min(page * 10, total)}</span> of <span className="font-semibold text-foreground">{total}</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 rounded-none text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <div className="flex items-center gap-1 px-2">
                  {[...Array(pages).keys()].map(x => (
                    <button
                      key={x + 1}
                      onClick={() => setPage(x + 1)}
                      className={`flex h-6 w-6 items-center justify-center rounded-none text-[11px] font-medium transition-colors ${
                        page === x + 1
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {x + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="p-1 rounded-none text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          ) : undefined
        }
      >
          <table className="w-full border-collapse text-left">
            <thead className={PAGE_TABLE_HEAD_CLASS}>
              <tr>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground w-12 text-center">Image</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">Product Details</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground text-right w-28">Price</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground text-right w-24">Stock</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-foreground">
              {loading ? (
                <Loading variant="table-row" colSpan={5} label="Loading products…" />
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No products found matching your criteria.</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr 
                    key={product._id} 
                    onClick={() => openEditModal(product)}
                    className="border-b border-border/40 hover:bg-muted/30 transition-colors last:border-0 cursor-pointer group"
                  >
                    <td className="px-4 py-3 text-center">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-9 h-9 object-cover rounded-none mx-auto border border-border/50 group-hover:border-primary/30 transition-colors"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://placehold.co/100x100/1d1b1c/ffffff?text=No+Img';
                          }}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-none bg-muted/50 border border-border/50 mx-auto flex items-center justify-center text-[8px] text-muted-foreground uppercase">
                          No Img
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[13px]">{product.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{product.brand} &bull; {product.category}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-primary text-[12px]">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-none text-[9px] font-semibold uppercase tracking-wider ${
                        product.countInStock > 0 
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                          : 'bg-destructive/10 text-destructive border border-destructive/20'
                      }`}>
                        {product.countInStock > 0 ? product.countInStock : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDelete(product._id);
                        }}
                        className="text-destructive hover:text-destructive/80 font-medium px-2 py-1 transition-colors cursor-pointer bg-destructive/5 hover:bg-destructive/10 rounded-none"
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

      {/* Mobile Card View */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto md:hidden">
        {loading ? (
          <Loading variant="panel" label="Loading products…" />
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground bg-card rounded-none border border-border/80">
            No products found matching your criteria.
          </div>
        ) : (
          products.map((product) => (
            <div 
              key={product._id} 
              onClick={() => openEditModal(product)}
              className="bg-card border border-border/80 rounded-none p-3 shadow-sm flex items-start gap-3 cursor-pointer hover:border-primary/50 transition-colors relative group"
            >
              {/* Image */}
              <div className="shrink-0">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-16 h-16 object-cover rounded-none border border-border/50"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://placehold.co/100x100/1d1b1c/ffffff?text=No+Img';
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-none bg-muted/50 border border-border/50 flex items-center justify-center text-[10px] text-muted-foreground uppercase">
                    No Img
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 py-0.5">
                <div className="font-semibold text-[13px] text-foreground truncate pr-6">{product.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{product.brand} &bull; {product.category}</div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="font-bold text-primary text-[13px]">${product.price.toFixed(2)}</div>
                  <span className={`px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-wider ${
                    product.countInStock > 0 
                      ? 'bg-green-500/10 text-green-500' 
                      : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    {product.countInStock > 0 ? `${product.countInStock} Left` : 'Out of Stock'}
                  </span>
                </div>
              </div>

              {/* Delete Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  requestDelete(product._id);
                }}
                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-none hover:bg-destructive/10"
              >
                <X className="size-4" />
              </button>
            </div>
          ))
        )}

        {/* Mobile Pagination */}
        {!loading && pages > 1 && (
          <div className="flex items-center justify-between bg-card border border-border/80 rounded-none px-4 py-3">
            <span className="text-[11px] text-muted-foreground">{total} products</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-7 w-7 flex items-center justify-center rounded-none border border-border/80 text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <span className="px-2 text-[12px] font-medium">{page}/{pages}</span>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="h-7 w-7 flex items-center justify-center rounded-none border border-border/80 text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AddProductModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditProduct(null);
        }}
        onSave={handleSaveProduct}
        initialData={editProduct}
      />

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />

      {/* Filter Modal */}
      {isFilterModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center">
          <div className="w-full sm:max-w-[320px] bg-card border-t sm:border border-border/60 sm:rounded-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
              <h3 className="font-semibold text-[15px] tracking-tight">Filters & Sort</h3>
              <button onClick={() => setIsFilterModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1.5 rounded-none hover:bg-muted transition-colors">
                <X className="size-4" strokeWidth={2.5} />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-5 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-4">
                {filtersContent}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Mobile Floating Action Button */}
      </div>

      <button
        onClick={openAddModal}
        className="md:hidden fixed bottom-6 right-6 z-40 size-14 bg-primary text-primary-foreground rounded-none shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex items-center justify-center hover:scale-105 hover:-translate-y-1 active:scale-95 transition-all duration-200"
      >
        <Plus className="size-6" strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default Products;

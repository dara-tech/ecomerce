import { useState, useEffect } from 'react';
import {
  Search, ChevronLeft, ChevronRight, Copy, CheckCircle2, Clock,
  PackageCheck, Truck, Trash2, Filter, RotateCcw, X
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';
import api from '../lib/axios';
import { PAGE_TOOLBAR_CLASS, PAGE_TOOLBAR_ROW_CLASS, PAGE_ROOT_CLASS, PAGE_LIST_BODY_CLASS, PAGE_TABLE_HEAD_CLASS } from '../lib/pageToolbar';
import DataTableShell from '../components/layout/DataTableShell';
import Loading, { LoadingSpinner } from '../components/ui/Loading';
import ConfirmModal from '../components/ui/ConfirmModal';
import OrderDetailsModal from '../components/layout/OrderDetailsModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

interface OrderItem {
  name: string;
  image: string;
  qty: number;
  price: number;
}

interface Order {
  _id: string;
  user: { _id: string; name: string };
  createdAt: string;
  totalPrice: number;
  taxPrice?: number;
  shippingPrice?: number;
  isPaid: boolean;
  status: string;
  orderItems: OrderItem[];
  shippingAddress?: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod?: string;
  paidAt?: string;
  timeline?: { status: string; timestamp: string; note: string }[];
  trackingNumber?: string;
  customerNotes?: string;
  adminNotes?: string;
  invoiceUrl?: string;
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Filters & Pagination
  const [filterPaid, setFilterPaid] = useState('All Payments');
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [sort, setSort] = useState('Newest First');

  // Action states
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Bulk select
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
    setPage(1);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setTogglingId(id);
    try {
      await api.put(`/orders/${id}/status`, { status: newStatus });
      await fetchOrders(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/orders/${deleteId}`);
      setDeleteId(null);
      await fetchOrders(true);
      setSelected(prev => { const s = new Set(prev); s.delete(deleteId); return s; });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete order');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await Promise.all([...selected].map(id => api.delete(`/orders/${id}`)));
      setSelected(new Set());
      setShowBulkConfirm(false);
      await fetchOrders(true);
    } catch (err: any) {
      alert('Failed to delete some orders');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Filter & sort orders client-side
  const filteredOrders = orders
    .filter(o =>
      (o._id.toLowerCase().includes(keyword.toLowerCase()) ||
        (o.user && o.user.name.toLowerCase().includes(keyword.toLowerCase())))
      && (filterPaid === 'All Payments' ? true : filterPaid === 'Paid' ? o.isPaid : !o.isPaid)
      && (filterStatus === 'All Statuses' ? true : (o.status || 'pending') === filterStatus.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'Newest First') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === 'Oldest First') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === 'Total: High to Low') return b.totalPrice - a.totalPrice;
      if (sort === 'Total: Low to High') return a.totalPrice - b.totalPrice;
      return 0;
    });

  const total = filteredOrders.length;
  const pages = Math.ceil(total / ITEMS_PER_PAGE) || 1;
  const paginatedOrders = filteredOrders.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const allPageSelected = paginatedOrders.length > 0 && paginatedOrders.every(o => selected.has(o._id));

  const toggleSelectAll = (e?: React.ChangeEvent) => {
    e?.stopPropagation();
    if (allPageSelected) {
      setSelected(prev => {
        const s = new Set(prev);
        paginatedOrders.forEach(o => s.delete(o._id));
        return s;
      });
    } else {
      setSelected(prev => {
        const s = new Set(prev);
        paginatedOrders.forEach(o => s.add(o._id));
        return s;
      });
    }
  };

  const toggleSelect = (id: string, e?: React.ChangeEvent) => {
    e?.stopPropagation();
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const ORDER_PILL_CLASS =
    'inline-flex h-auto min-h-0 w-auto items-center gap-1 rounded-none border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider';

  const StatusDropdown = ({ order }: { order: Order }) => {
    const isToggling = togglingId === order._id;
    const status = order.status || 'pending';
    return (
      <div onClick={e => e.stopPropagation()}>
        <Select 
          value={status} 
          onValueChange={(val) => handleUpdateStatus(order._id, val || 'pending')}
          disabled={!!togglingId}
        >
          <SelectTrigger
            size="sm"
            className={cn(
              ORDER_PILL_CLASS,
              "!h-auto data-[size=sm]:!h-auto !py-0.5 !pl-2 !pr-1.5 gap-0.5 bg-transparent shadow-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 [&_svg]:!size-3",
              status === 'delivered' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
              status === 'cancelled' || status === 'refunded' ? 'bg-destructive/10 text-destructive border-destructive/20' :
              status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
              'bg-blue-500/10 text-blue-600 border-blue-500/20'
            )}
          >
            {isToggling && <LoadingSpinner size="xs" className="border-current border-t-transparent" />}
            {!isToggling && status === 'delivered' && <PackageCheck className="size-3 shrink-0" />}
            {!isToggling && status !== 'delivered' && <Truck className="size-3 shrink-0" />}
            <span className="truncate">{status}</span>
          </SelectTrigger>
          <SelectContent>
            {['pending', 'paid', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'].map(s => (
              <SelectItem key={s} value={s} className="text-[11px] uppercase">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <div className={PAGE_ROOT_CLASS}>
      {/* Toolbar */}
      <div className={PAGE_TOOLBAR_CLASS}>
        <div className={PAGE_TOOLBAR_ROW_CLASS}>

          {/* Search + mobile filter button */}
          <div className="flex w-full gap-2 items-center md:max-w-xs">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search orders..."
                value={keyword}
                onChange={handleSearch}
                className="w-full pl-8 pr-3 h-8 text-[13px] font-medium bg-input border border-border rounded-none focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
            {/* Mobile filter button */}
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="md:hidden h-8 px-3 rounded-none border border-border/80 bg-input flex items-center justify-center gap-1.5 text-muted-foreground hover:bg-muted transition-colors shrink-0 relative"
            >
              <Filter className="size-4" />
              {(filterPaid !== 'All Payments' || filterStatus !== 'All Statuses' || sort !== 'Newest First') && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-none" />
              )}
            </button>
          </div>

          {/* Desktop inline filters */}
          <div className="hidden md:flex flex-wrap items-center gap-2">
            <Select value={filterPaid} onValueChange={(v) => { setFilterPaid(v || 'All Payments'); setPage(1); }}>
              <SelectTrigger className="h-8 text-[13px] font-medium bg-input border-border w-auto min-w-[140px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Payments">All Payments</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v || 'All Statuses'); setPage(1); }}>
              <SelectTrigger className="h-8 text-[13px] font-medium bg-input border-border w-auto min-w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Statuses">All Statuses</SelectItem>
                {['Pending', 'Paid', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Refunded'].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(v) => { setSort(v || 'Newest First'); setPage(1); }}>
              <SelectTrigger className="h-8 text-[13px] font-medium bg-input border-border w-auto min-w-[160px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Newest First">Newest First</SelectItem>
                <SelectItem value="Oldest First">Oldest First</SelectItem>
                <SelectItem value="Total: High to Low">Total: High to Low</SelectItem>
                <SelectItem value="Total: Low to High">Total: Low to High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <button
            onClick={() => setShowBulkConfirm(true)}
            className="shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-none bg-destructive text-destructive-foreground text-[12px] font-semibold hover:opacity-90 transition-opacity"
          >
            <Trash2 className="size-3.5" />
            Delete {selected.size} Selected
          </button>
        )}
      </div>

      <div className={PAGE_LIST_BODY_CLASS}>
      {error && (
        <div className="shrink-0 p-3 bg-destructive/10 text-destructive text-[11px] font-medium text-center rounded-none">
          {error}
        </div>
      )}

      {/* ── Desktop Table ── */}
      <DataTableShell
        footer={
          !loading && pages > 1 ? (
            <div className="flex shrink-0 items-center justify-between border-t border-border/80 bg-muted/20 px-4 py-3">
              <span className="text-[11px] text-muted-foreground">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, total)} of {total} orders
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                  className="flex h-7 w-7 items-center justify-center rounded-none border border-border/80 text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <span className="px-2 text-[12px] font-medium">{page} / {pages}</span>
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  aria-label="Next page"
                  className="flex h-7 w-7 items-center justify-center rounded-none border border-border/80 text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          ) : undefined
        }
      >
          <table className="w-full border-collapse text-left">
            <thead className={PAGE_TABLE_HEAD_CLASS}>
              <tr>
                <th className="px-4 py-3 border-b border-border/80 w-8">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all orders on this page"
                    className="rounded border-border cursor-pointer accent-primary"
                  />
                </th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground w-12 text-center">Image</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">Order Details</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground text-right">Total</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground text-center">Paid</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground text-center w-36">Status</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground text-right w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-foreground">
              {loading ? (
                <Loading variant="table-row" colSpan={7} label="Loading orders…" />
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No orders found matching your criteria.</td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr
                    key={order._id}
                    onClick={() => setSelectedOrder(order)}
                    className={`border-b border-border/40 hover:bg-muted/30 transition-colors last:border-0 group cursor-pointer ${selected.has(order._id) ? 'bg-primary/5' : ''}`}
                  >
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(order._id)}
                        onChange={(e) => toggleSelect(order._id, e)}
                        aria-label={`Select order ${order._id.slice(-8)}`}
                        className="rounded border-border cursor-pointer accent-primary"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {order.orderItems && order.orderItems[0]?.image ? (
                        <img
                          src={order.orderItems[0].image}
                          alt="Order item"
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
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-[13px]">{order.user ? order.user.name : 'Unknown User'}</div>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(order._id); }}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted/50 flex items-center justify-center"
                          title="Copy Order ID"
                        >
                          <Copy className="size-3" />
                        </button>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString()}
                        {order.orderItems?.length > 1 && ` • +${order.orderItems.length - 1} more items`}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-primary text-[12px]">
                      ${order.totalPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {order.isPaid ? (
                        <span className={cn(ORDER_PILL_CLASS, 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20')}>
                          <CheckCircle2 className="size-3 shrink-0" /> Paid
                        </span>
                      ) : (
                        <span className={cn(ORDER_PILL_CLASS, 'bg-amber-500/10 text-amber-600 border-amber-500/20')}>
                          <Clock className="size-3 shrink-0" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusDropdown order={order} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteId(order._id); }}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-none hover:bg-destructive/10"
                        title="Delete order"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </DataTableShell>

      {/* ── Mobile Card View ── */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto md:hidden">
        {/* Bulk select bar */}
        {selected.size > 0 && (
          <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-none px-4 py-2.5">
            <span className="text-[12px] font-semibold text-primary">{selected.size} selected</span>
            <button
              onClick={() => setShowBulkConfirm(true)}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-destructive"
            >
              <Trash2 className="size-3.5" /> Delete
            </button>
          </div>
        )}

        {loading ? (
          <Loading variant="panel" label="Loading orders…" className="rounded-none" />
        ) : paginatedOrders.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground bg-card rounded-none border border-border/80">
            No orders found matching your criteria.
          </div>
        ) : (
          paginatedOrders.map((order) => (
            <div
              key={order._id}
              onClick={() => setSelectedOrder(order)}
              className={`bg-card border rounded-none p-3 shadow-sm flex items-start gap-3 transition-colors relative cursor-pointer ${selected.has(order._id) ? 'border-primary/40 bg-primary/5' : 'border-border/80 hover:border-primary/30'}`}
            >
              {/* Checkbox */}
              <div className="pt-1 shrink-0" onClick={e => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selected.has(order._id)}
                  onChange={(e) => toggleSelect(order._id, e)}
                  aria-label={`Select order ${order._id.slice(-8)}`}
                  className="rounded border-border cursor-pointer accent-primary"
                />
              </div>

              {/* Image */}
              <div className="shrink-0">
                {order.orderItems?.[0]?.image ? (
                  <img
                    src={order.orderItems[0].image}
                    alt="Order"
                    className="w-14 h-14 object-cover rounded-none border border-border/50"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://placehold.co/100x100/1d1b1c/ffffff?text=No+Img';
                    }}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-none bg-muted/50 border border-border/50 flex items-center justify-center text-[9px] text-muted-foreground uppercase">No Img</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 py-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="font-semibold text-[13px] text-foreground truncate">{order.user ? order.user.name : 'Unknown User'}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(order._id); }}
                    className="p-0.5 text-muted-foreground hover:text-foreground transition-colors rounded shrink-0"
                    title="Copy Order ID"
                  >
                    <Copy className="size-3" />
                  </button>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(order.createdAt).toLocaleDateString()}
                  {order.orderItems?.length > 1 && ` • +${order.orderItems.length - 1} more`}
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="font-bold text-primary text-[13px]">${order.totalPrice.toFixed(2)}</div>
                  <div className="flex items-center gap-1.5">
                    {order.isPaid ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-none bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-semibold uppercase">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-none bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] font-semibold uppercase">
                        <Clock className="w-2.5 h-2.5" /> Pending
                      </span>
                    )}
                    <StatusDropdown order={order} />
                  </div>
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteId(order._id); }}
                aria-label="Delete order"
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
            <span className="text-[11px] text-muted-foreground">{total} orders</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page" className="h-7 w-7 flex items-center justify-center rounded-none border border-border/80 text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors">
                <ChevronLeft className="size-3.5" />
              </button>
              <span className="px-2 text-[12px] font-medium">{page}/{pages}</span>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} aria-label="Next page" className="h-7 w-7 flex items-center justify-center rounded-none border border-border/80 text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors">
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Single delete confirm */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Order"
        message="Are you sure you want to delete this order? It will be removed from the customer's order history."
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {/* Bulk delete confirm */}
      <ConfirmModal
        isOpen={showBulkConfirm}
        title={`Delete ${selected.size} Orders`}
        message={`Are you sure you want to delete ${selected.size} selected orders? This cannot be undone.`}
        isDeleting={isBulkDeleting}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkConfirm(false)}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={!!selectedOrder}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      {/* Mobile Filter Modal */}
      {isFilterModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-end justify-center" onClick={() => setIsFilterModalOpen(false)}>
          <div
            className="w-full bg-card border-t border-border/60 rounded-t-2xl shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card z-10 px-4 py-3 border-b border-border/80 flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-[15px]">Filters & Sort</h3>
              <button onClick={() => setIsFilterModalOpen(false)} aria-label="Close filters" className="p-1.5 text-muted-foreground hover:bg-muted rounded-none transition-colors">
                <X className="size-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Payment Status</label>
                <Select value={filterPaid} onValueChange={(v) => { setFilterPaid(v || 'All Payments'); setPage(1); }}>
                  <SelectTrigger className="w-full h-11 bg-input border-border/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="All Payments">All Payments</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-[13px] font-semibold text-foreground mb-3">Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['All Statuses', 'Pending', 'Paid', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Refunded'].map(status => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={cn(
                        "px-3 py-2 rounded-none border text-[12px] font-medium transition-colors",
                        filterStatus === status
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-card border-border/80 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-foreground uppercase tracking-wider">Sort Orders</label>
                <Select value={sort} onValueChange={(v) => { setSort(v || 'Newest First'); setPage(1); }}>
                  <SelectTrigger className="w-full h-11 bg-input border-border/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="Newest First">Newest First</SelectItem>
                    <SelectItem value="Oldest First">Oldest First</SelectItem>
                    <SelectItem value="Total: High to Low">Total: High to Low</SelectItem>
                    <SelectItem value="Total: Low to High">Total: Low to High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4 border-t border-border/60 bg-muted/20 flex gap-3">
              {(filterPaid !== 'All Payments' || filterStatus !== 'All Statuses' || sort !== 'Newest First') && (
                <button
                  onClick={() => {
                    setFilterPaid('All Payments');
                    setFilterStatus('All Statuses');
                    setSort('Newest First');
                    setPage(1);
                  }}
                  className="flex-1 h-11 rounded-none border border-border/80 text-foreground font-medium text-[13px] hover:bg-muted transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="size-3.5" /> Reset
                </button>
              )}
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="flex-[2] h-11 rounded-none bg-primary text-primary-foreground font-medium text-[13px] hover:opacity-90 transition-opacity"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Orders;

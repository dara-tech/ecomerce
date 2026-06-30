import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCcw, Search, Check, X, RotateCcw } from 'lucide-react';
import api from '../lib/axios';
import {
  PAGE_TOOLBAR_ROW_CLASS,
  PAGE_SEARCH_CLASS,
  PAGE_SECONDARY_BTN_CLASS,
  PAGE_ROOT_CLASS,
  PAGE_BODY_CLASS,
  PAGE_TABLE_HEAD_CLASS,
  PAGE_TAB_GROUP_CLASS,
  pageTabButtonClass,
} from '../lib/pageToolbar';
import { PageStickyHeader } from '../components/layout/PageSubTabs';
import Loading from '../components/ui/Loading';
import { cn } from '../lib/utils';

interface RefundRequest {
  _id: string;
  order: { _id: string; totalPrice: number; guestEmail?: string; isGuest?: boolean };
  user?: { _id: string; name: string; email: string };
  amount: number;
  reason: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
}

const STATUS_FILTER = ['all', 'pending', 'approved', 'rejected', 'processed'] as const;

export default function Returns() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTER)[number]>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/payments/refunds');
      setRefunds(data);
    } catch (error) {
      console.error('Failed to fetch returns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateRefund = async (id: string, status: string) => {
    try {
      const note = window.prompt(`Enter note for this return (${status}):`);
      await api.put(`/payments/refunds/${id}`, { status, adminNotes: note || '' });
      fetchData();
    } catch (error) {
      console.error('Failed to update return:', error);
      alert('Failed to update return request');
    }
  };

  const filtered = refunds.filter((r) => {
    const q = search.toLowerCase();
    const customer = r.user?.name || r.user?.email || r.order?.guestEmail || '';
    const matchSearch =
      customer.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q) ||
      r.order?._id?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = refunds.filter((r) => r.status === 'pending').length;

  return (
    <div className={PAGE_ROOT_CLASS}>
      <PageStickyHeader
        toolbar={
          <div className={PAGE_TOOLBAR_ROW_CLASS}>
            <div className="flex items-center gap-2">
              <RotateCcw className="size-4 text-primary" />
              <h1 className="text-sm font-semibold">Returns & RMA</h1>
              {pendingCount > 0 && (
                <span className="rounded-none bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                  {pendingCount} pending
                </span>
              )}
            </div>
            <button type="button" onClick={fetchData} className={PAGE_SECONDARY_BTN_CLASS}>
              <RefreshCcw className="size-3.5" />
              Refresh
            </button>
          </div>
        }
        subTabs={
          <div className={PAGE_TAB_GROUP_CLASS}>
            {STATUS_FILTER.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={pageTabButtonClass(statusFilter === s)}
              >
                {s}
              </button>
            ))}
          </div>
        }
      />

      <div className={PAGE_BODY_CLASS}>
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search by customer, order, reason…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={PAGE_SEARCH_CLASS}
          />
        </div>

        {loading ? (
          <Loading variant="page" label="Loading return requests…" />
        ) : (
          <div className="overflow-hidden rounded-none border border-border/80 bg-card shadow-sm">
            <div className="hidden md:block overflow-auto no-scrollbar max-h-[calc(100vh-16rem)]">
              <table className="w-full border-collapse text-left">
                <thead className={PAGE_TABLE_HEAD_CLASS}>
                  <tr>
                    <th className="px-4 py-2 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">Date</th>
                    <th className="px-4 py-2 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">Customer</th>
                    <th className="px-4 py-2 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">Order</th>
                    <th className="px-4 py-2 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">Reason</th>
                    <th className="px-4 py-2 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground text-right">Amount</th>
                    <th className="px-4 py-2 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground text-center">Status</th>
                    <th className="px-4 py-2 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] text-foreground">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                        No return requests found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((refund) => (
                      <tr key={refund._id} className="border-b border-border/40 hover:bg-muted/30 transition-colors last:border-0">
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(refund.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{refund.user?.name || 'Guest'}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {refund.user?.email || refund.order?.guestEmail || '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Link to="/orders" className="text-primary hover:underline font-mono text-[10px]">
                            #{String(refund.order?._id).slice(-8)}
                          </Link>
                        </td>
                        <td className="px-4 py-3 max-w-[200px] truncate" title={refund.reason}>
                          {refund.reason}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-primary">
                          ${refund.amount?.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={cn(
                              'inline-flex rounded-none border px-2 py-0.5 text-[9px] font-semibold uppercase',
                              refund.status === 'approved' || refund.status === 'processed'
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : refund.status === 'rejected'
                                  ? 'bg-destructive/10 text-destructive border-destructive/20'
                                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            )}
                          >
                            {refund.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {refund.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleUpdateRefund(refund._id, 'approved')}
                                className="p-1 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 rounded transition-colors"
                                title="Approve"
                              >
                                <Check className="size-3.5" />
                              </button>
                              <button
                                onClick={() => handleUpdateRefund(refund._id, 'rejected')}
                                className="p-1 text-destructive bg-destructive/10 hover:bg-destructive/20 rounded transition-colors"
                                title="Reject"
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>
                          ) : refund.adminNotes ? (
                            <span className="text-[10px] text-muted-foreground italic" title={refund.adminNotes}>
                              {refund.adminNotes}
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-border/40">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">No return requests found</div>
              ) : (
                filtered.map((refund) => (
                  <div key={refund._id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-sm">{refund.user?.name || 'Guest'}</div>
                        <div className="text-[11px] text-muted-foreground">{new Date(refund.createdAt).toLocaleDateString()}</div>
                      </div>
                      <span className="font-bold text-primary">${refund.amount?.toFixed(2)}</span>
                    </div>
                    <p className="text-[12px] text-muted-foreground">{refund.reason}</p>
                    {refund.status === 'pending' && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleUpdateRefund(refund._id, 'approved')}
                          className="flex-1 py-1.5 text-emerald-600 bg-emerald-500/10 rounded-none text-[11px] font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateRefund(refund._id, 'rejected')}
                          className="flex-1 py-1.5 text-destructive bg-destructive/10 rounded-none text-[11px] font-medium"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { RefreshCcw, Search, Check, X } from 'lucide-react';
import api from '../lib/axios';
import {
  PAGE_TOOLBAR_ROW_CLASS,
  PAGE_TAB_GROUP_CLASS,
  PAGE_SEARCH_CLASS,
  PAGE_SECONDARY_BTN_CLASS,
  pageTabButtonClass,
  PAGE_ROOT_CLASS,
  PAGE_BODY_CLASS,
} from '../lib/pageToolbar';
import { PageStickyHeader } from '../components/layout/PageSubTabs';
import Loading from '../components/ui/Loading';

interface PaymentLog {
  _id: string;
  order: { _id: string; totalPrice: number };
  user: { _id: string; name: string; email: string };
  gateway: string;
  status: string;
  amount: number;
  currency: string;
  transactionId: string;
  createdAt: string;
  webhookData: any;
}

interface RefundRequest {
  _id: string;
  order: { _id: string; totalPrice: number };
  user: { _id: string; name: string; email: string };
  amount: number;
  reason: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
}

export default function Payments() {
  const [activeTab, setActiveTab] = useState<'logs' | 'refunds'>('logs');
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, refundsRes] = await Promise.all([
        api.get('/payments/logs'),
        api.get('/payments/refunds')
      ]);
      setLogs(logsRes.data);
      setRefunds(refundsRes.data);
    } catch (error) {
      console.error('Failed to fetch payments data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRefund = async (id: string, status: string) => {
    try {
      const note = window.prompt(`Enter note for this refund (${status}):`);
      await api.put(`/payments/refunds/${id}`, { status, adminNotes: note || '' });
      fetchData();
    } catch (error) {
      console.error('Failed to update refund:', error);
      alert('Failed to update refund request');
    }
  };

  const filteredLogs = logs.filter(l => 
    l.transactionId?.toLowerCase().includes(search.toLowerCase()) ||
    l.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRefunds = refunds.filter(r =>
    r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.order?._id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={PAGE_ROOT_CLASS}>
      <PageStickyHeader
        toolbar={
          <>
            <div className={PAGE_TOOLBAR_ROW_CLASS}>
              <div className="flex w-full gap-2 sm:max-w-xs items-center sm:h-8">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={PAGE_SEARCH_CLASS}
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchData}
              className={PAGE_SECONDARY_BTN_CLASS}
            >
              <RefreshCcw className="size-3.5" />
              Refresh
            </button>
          </>
        }
        subTabs={
          <div className={PAGE_TAB_GROUP_CLASS}>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={pageTabButtonClass(activeTab === 'logs')}
            >
              Payment Logs
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('refunds')}
              className={pageTabButtonClass(activeTab === 'refunds')}
            >
              Refund Requests
            </button>
          </div>
        }
      />

      <div className={PAGE_BODY_CLASS}>
      {loading ? (
        <Loading variant="page" label="Loading payments…" />
      ) : activeTab === 'logs' ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-card border border-border/80 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">Date</th>
                    <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">Transaction ID</th>
                    <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">Customer</th>
                    <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">Gateway</th>
                    <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground text-right">Amount</th>
                    <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No logs found</td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => (
                      <tr key={log._id} className="border-b border-border/40 hover:bg-muted/30 transition-colors last:border-0">
                        <td className="px-4 py-3 text-[12px] text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-3 text-[12px] font-medium font-mono">{log.transactionId || 'N/A'}</td>
                        <td className="px-4 py-3 text-[12px]">{log.user?.name || 'Unknown'}</td>
                        <td className="px-4 py-3 text-[12px] font-semibold text-primary">{log.gateway}</td>
                        <td className="px-4 py-3 text-[12px] font-bold text-right">${log.amount?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${
                            log.status === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                            log.status === 'failed' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                            'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col gap-3">
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground bg-card rounded-lg border border-border/80">No logs found</div>
            ) : (
              filteredLogs.map(log => (
                <div key={log._id} className="bg-card border border-border/80 rounded-xl p-3 shadow-sm flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-[13px]">{log.user?.name || 'Unknown'}</div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{log.transactionId || 'N/A'}</div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${
                      log.status === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                      log.status === 'failed' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                      'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-end mt-1">
                    <div className="text-[11px] text-muted-foreground">{new Date(log.createdAt).toLocaleString()} &bull; <span className="font-semibold text-primary">{log.gateway}</span></div>
                    <div className="font-bold text-[13px]">${log.amount?.toFixed(2)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-card border border-border/80 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">Date</th>
                    <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">Customer</th>
                    <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">Reason</th>
                    <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground text-right">Amount</th>
                    <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground text-center">Status</th>
                    <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRefunds.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No refund requests found</td>
                    </tr>
                  ) : (
                    filteredRefunds.map(refund => (
                      <tr key={refund._id} className="border-b border-border/40 hover:bg-muted/30 transition-colors last:border-0">
                        <td className="px-4 py-3 text-[12px] text-muted-foreground">{new Date(refund.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-[12px]">{refund.user?.name || 'Unknown'}</td>
                        <td className="px-4 py-3 text-[12px] max-w-[200px] truncate" title={refund.reason}>{refund.reason}</td>
                        <td className="px-4 py-3 text-[12px] font-bold text-right text-primary">${refund.amount?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${
                            refund.status === 'approved' || refund.status === 'processed' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                            refund.status === 'rejected' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                            'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          }`}>
                            {refund.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex items-center justify-end gap-2">
                          {refund.status === 'pending' && (
                            <>
                              <button onClick={() => handleUpdateRefund(refund._id, 'approved')} className="p-1 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 rounded transition-colors" title="Approve">
                                <Check className="size-3.5" />
                              </button>
                              <button onClick={() => handleUpdateRefund(refund._id, 'rejected')} className="p-1 text-destructive bg-destructive/10 hover:bg-destructive/20 rounded transition-colors" title="Reject">
                                <X className="size-3.5" />
                              </button>
                            </>
                          )}
                          {refund.adminNotes && (
                            <span className="text-[10px] text-muted-foreground italic truncate max-w-[100px]" title={refund.adminNotes}>
                              Note: {refund.adminNotes}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col gap-3">
            {filteredRefunds.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground bg-card rounded-lg border border-border/80">No refund requests found</div>
            ) : (
              filteredRefunds.map(refund => (
                <div key={refund._id} className="bg-card border border-border/80 rounded-xl p-3 shadow-sm flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-[13px]">{refund.user?.name || 'Unknown'}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{new Date(refund.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${
                        refund.status === 'approved' || refund.status === 'processed' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        refund.status === 'rejected' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                        'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}>
                        {refund.status}
                      </span>
                      <div className="font-bold text-primary text-[13px]">${refund.amount?.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="text-[12px] mt-1 bg-muted/30 p-2 rounded-md border border-border/40">
                    <span className="font-medium text-muted-foreground text-[10px] uppercase tracking-wider mb-1 block">Reason</span>
                    {refund.reason}
                  </div>
                  {refund.status === 'pending' && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/40">
                      <button onClick={() => handleUpdateRefund(refund._id, 'approved')} className="flex-1 py-1.5 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-md transition-colors flex items-center justify-center gap-1 text-[11px] font-medium">
                        <Check className="size-3.5" /> Approve
                      </button>
                      <button onClick={() => handleUpdateRefund(refund._id, 'rejected')} className="flex-1 py-1.5 text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-md transition-colors flex items-center justify-center gap-1 text-[11px] font-medium">
                        <X className="size-3.5" /> Reject
                      </button>
                    </div>
                  )}
                  {refund.adminNotes && (
                    <div className="text-[10px] text-muted-foreground italic mt-2">
                      Note: {refund.adminNotes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { DollarSign, Search, Check, X, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import {
  PAGE_ROOT_CLASS,
  PAGE_TOOLBAR_ROW_CLASS,
  PAGE_LIST_BODY_CLASS,
  PAGE_TABLE_HEAD_CLASS
} from '../lib/pageToolbar';
import { PageStickyHeader } from '../components/layout/PageSubTabs';
import Loading from '../components/ui/Loading';
import DataTableShell from '../components/layout/DataTableShell';

interface PayoutRequest {
  _id: string;
  store: { _id: string; name: string };
  vendor: { _id: string; name: string; email: string };
  amount: number;
  status: 'pending' | 'paid' | 'rejected';
  method: string;
  paymentDetails: string;
  adminNotes: string;
  createdAt: string;
  paidAt?: string;
  transactionId?: string;
}

export default function Payouts() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('ABA Bank');
  const [paymentDetails, setPaymentDetails] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const { data } = await api.get('/payouts');
        setPayouts(data);
      } else {
        const { data } = await api.get('/payouts/my-payouts');
        setPayouts(data.payouts);
        setBalance(data.balance);
        setTotalEarned(data.totalEarned);
      }
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(amount) <= 0 || Number(amount) > balance) {
      toast.error('Invalid amount');
      return;
    }
    try {
      await api.post('/payouts', { amount: Number(amount), method, paymentDetails });
      toast.success('Payout requested successfully');
      setAmount('');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to request payout');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const note = window.prompt(`Enter note for ${status}:`);
    let transactionId = '';
    if (status === 'paid') {
      transactionId = window.prompt('Enter transaction/reference ID:') || '';
    }
    
    try {
      await api.put(`/payouts/${id}/status`, { status, adminNotes: note || '', transactionId });
      toast.success(`Payout marked as ${status}`);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update payout');
    }
  };

  const filteredPayouts = payouts.filter(p => 
    p.vendor?.name?.toLowerCase()?.includes(search.toLowerCase()) ||
    p.store?.name?.toLowerCase()?.includes(search.toLowerCase()) ||
    p._id.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPayouts.length / ITEMS_PER_PAGE) || 1;
  const paginatedPayouts = filteredPayouts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className={`${PAGE_ROOT_CLASS} relative selection:bg-primary/30 z-0`}>
      {/* Decorative Background */}
      <div className="absolute inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>
      <PageStickyHeader
        subTabs={null}
        toolbar={
          <div className={PAGE_TOOLBAR_ROW_CLASS}>
            <div className="flex w-full gap-2 sm:max-w-xs items-center sm:h-8">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search payouts..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-background pl-8 h-8 md:h-8 text-sm outline-none border border-border/80 rounded-lg focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>
        }
      />

      <div className={PAGE_LIST_BODY_CLASS}>
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {isAdmin ? 'Vendor Payouts' : 'My Earnings'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isAdmin ? 'Manage payout requests from vendors.' : 'Track your earnings and request payouts.'}
            </p>
          </div>
        </div>

        {!isAdmin && (
          <div className="shrink-0 grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div className="border border-transparent bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <h3 className="text-sm font-medium text-white/80 flex items-center gap-2 relative z-10">
                <DollarSign className="size-4" /> Available Balance
              </h3>
              <p className="text-4xl font-black text-white mt-3 tracking-tight relative z-10 drop-shadow-sm">${balance.toFixed(2)}</p>
              <p className="text-xs text-white/80 mt-2 relative z-10 font-medium">Total earned: ${totalEarned.toFixed(2)}</p>
            </div>
            
            <div className="border border-border/40 bg-card/40 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-black/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 relative z-10">
                <CreditCard className="size-4 text-primary" /> Request Payout
              </h3>
              <form onSubmit={handleRequestPayout} className="space-y-3.5 relative z-10">
                <div className="flex gap-3">
                  <input
                    type="number"
                    max={balance}
                    step="0.01"
                    placeholder="Amount"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="flex-1 h-10 rounded-lg border border-border/50 bg-background/50 text-foreground px-3 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary placeholder:text-muted-foreground"
                  />
                  <select
                    value={method}
                    onChange={e => setMethod(e.target.value)}
                    className="h-10 rounded-lg border border-border/50 bg-background/50 text-foreground px-3 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <option>ABA Bank</option>
                    <option>Acleda Bank</option>
                    <option>Bank Transfer</option>
                    <option>PayPal</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder={
                    method === 'PayPal' ? 'PayPal Email' : 
                    method === 'ABA Bank' || method === 'Acleda Bank' ? 'Account Name & Number (e.g. Sok San 123456789)' : 
                    'Payment Details (Account No, etc...)'
                  }
                  required
                  value={paymentDetails}
                  onChange={e => setPaymentDetails(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border/50 bg-background/50 text-foreground px-3 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary placeholder:text-muted-foreground"
                />
                <button 
                  type="submit" 
                  disabled={balance <= 0} 
                  className="w-full h-10 bg-primary/90 text-primary-foreground font-semibold rounded-lg text-sm hover:bg-primary hover:shadow-md hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  Submit Request
                </button>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center"><Loading /></div>
        ) : (
          <>
            {filteredPayouts.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                <h3 className="text-lg font-medium text-foreground">No payouts found</h3>
                <p className="text-sm text-muted-foreground mt-1">There are no payout requests matching your criteria.</p>
              </div>
            ) : (
              <DataTableShell
                footer={
                  totalPages > 1 && (
                    <div className="flex shrink-0 items-center justify-between border-t border-border/80 bg-muted/20 px-4 py-3">
                      <span className="text-[11px] text-muted-foreground">
                        Page <span className="font-semibold text-foreground">{page}</span> of <span className="font-semibold text-foreground">{totalPages}</span>
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
                          {[...Array(totalPages).keys()].map(x => (
                            <button
                              key={x + 1}
                              onClick={() => setPage(x + 1)}
                              className={`flex h-6 w-6 items-center justify-center rounded-none text-[11px] font-medium transition-colors ${
                                page === x + 1
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:bg-muted/50'
                              }`}
                            >
                              {x + 1}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="p-1 rounded-none text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="size-4" />
                        </button>
                      </div>
                    </div>
                  )
                }
              >
                <table className="w-full text-sm text-left border-collapse">
                <thead className={PAGE_TABLE_HEAD_CLASS}>
                  <tr>
                    <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">Request ID</th>
                    {isAdmin && <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">Vendor</th>}
                    <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">Method & Details</th>
                    <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">Date</th>
                    {isAdmin && <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 bg-card/40 backdrop-blur-md text-[11px] text-foreground">
                  {paginatedPayouts.map((p) => (
                    <tr key={p._id} className="hover:bg-muted/50 hover:shadow-sm transition-all relative group">
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{p._id.slice(-8)}</td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{p.store?.name}</div>
                          <div className="text-xs text-muted-foreground">{p.vendor?.email}</div>
                        </td>
                      )}
                      <td className="px-4 py-3 font-bold text-foreground">
                        ${p.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-foreground font-medium">{p.method}</div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">{p.paymentDetails}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${
                          p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                          p.status === 'rejected' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                          'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }`}>
                          {p.status}
                        </span>
                        {p.transactionId && <div className="text-[10px] text-muted-foreground mt-1">TX: {p.transactionId}</div>}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          {p.status === 'pending' && (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleUpdateStatus(p._id, 'paid')}
                                className="h-7 px-2.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-md border border-border/80 bg-background hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors shadow-sm"
                              >
                                <Check className="size-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(p._id, 'rejected')}
                                className="h-7 px-2.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-md border border-border/80 bg-background hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm"
                              >
                                <X className="size-3.5" /> Reject
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTableShell>
            )}
          </>
        )}
      </div>
    </div>
  );
}

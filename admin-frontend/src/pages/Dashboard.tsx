import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Activity,
  RefreshCw,
  ArrowUpRight,
  AlertTriangle,
  Clock,
  TrendingUp,
  Ticket,
  RotateCcw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../lib/axios';
import { cn } from '../lib/utils';
import Loading from '../components/ui/Loading';
import {
  PAGE_ROOT_CLASS,
  PAGE_BODY_CLASS,
  PAGE_TOOLBAR_CLASS,
  PAGE_TOOLBAR_ROW_CLASS,
  PAGE_SECONDARY_BTN_CLASS,
  PAGE_TABLE_HEAD_CLASS,
} from '../lib/pageToolbar';

interface RecentOrder {
  _id: string;
  user?: { name?: string; email?: string };
  createdAt: string;
  totalPrice: number;
  isPaid: boolean;
  status?: string;
}

interface BestSeller {
  name: string;
  qty: number;
  revenue: number;
}

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  todayOrders: number;
  pendingOrders: number;
  unpaidOrders: number;
  lowStockCount: number;
  pendingRefunds: number;
  activeCoupons: number;
  avgOrderValue: number;
  bestSellers: BestSeller[];
  statusBreakdown: Record<string, number>;
  recentOrders: RecentOrder[];
  salesData: { name: string; total: number; orders: number }[];
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  processing: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  shipped: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
  refunded: 'bg-destructive/10 text-destructive border-destructive/20',
};

function formatMoney(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function OrderStatusBadge({ status }: { status?: string }) {
  const key = status || 'pending';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-none border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider',
        STATUS_STYLES[key] || 'bg-muted text-muted-foreground border-border'
      )}
    >
      {key}
    </span>
  );
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const { data } = await api.get('/stats');
      setStats(data);
    } catch {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <div className={PAGE_ROOT_CLASS}>
        <Loading variant="page" label="Loading dashboard…" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={PAGE_ROOT_CLASS}>
        <div className={cn(PAGE_BODY_CLASS, 'no-scrollbar')}>
          <div className="flex flex-col items-center justify-center gap-3 rounded-none border border-border/80 bg-card py-16 text-center">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="text-[13px] text-muted-foreground">{error || 'Something went wrong.'}</p>
            <button type="button" onClick={() => fetchStats()} className={PAGE_SECONDARY_BTN_CLASS}>
              <RefreshCw className="size-3.5" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Revenue',
      value: formatMoney(stats.totalRevenue),
      hint: `${formatMoney(stats.todayRevenue)} today · AOV ${formatMoney(stats.avgOrderValue || 0)}`,
      Icon: DollarSign,
      accent: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      hint: `${stats.todayOrders} today · ${stats.pendingOrders} pending`,
      Icon: ShoppingCart,
      accent: 'bg-primary/10 text-primary',
    },
    {
      label: 'Products',
      value: stats.totalProducts.toLocaleString(),
      hint: stats.lowStockCount > 0 ? `${stats.lowStockCount} low stock` : 'All stocked',
      Icon: Package,
      accent: stats.lowStockCount > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary',
    },
    {
      label: 'Customers',
      value: stats.totalUsers.toLocaleString(),
      hint: `${stats.unpaidOrders} unpaid orders`,
      Icon: Users,
      accent: 'bg-blue-500/10 text-blue-600',
    },
  ];

  const statusEntries = Object.entries(stats.statusBreakdown || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className={PAGE_ROOT_CLASS}>
      <div className={PAGE_TOOLBAR_CLASS}>
        <div className={PAGE_TOOLBAR_ROW_CLASS}>
          <div>
            <h1 className="text-xs font-semibold text-foreground">Dashboard</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">{todayLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className={PAGE_SECONDARY_BTN_CLASS}
          >
            <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} />
            Refresh
          </button>
          <Link to="/orders" className={PAGE_SECONDARY_BTN_CLASS}>
            View orders
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className={cn(PAGE_BODY_CLASS, 'no-scrollbar animate-in fade-in duration-300')}>
        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="rounded-none border border-border/80 bg-card p-3 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </p>
                  <h3 className="text-xl font-bold tracking-tight text-foreground">{stat.value}</h3>
                  <p className="text-[11px] text-muted-foreground">{stat.hint}</p>
                </div>
                <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-none', stat.accent)}>
                  <stat.Icon className="size-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order status pills */}
        {statusEntries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-none border border-border/80 bg-card px-4 py-3 shadow-sm">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
              Orders by status
            </span>
            {statusEntries.map(([status, count]) => (
              <span
                key={status}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-none border px-2.5 py-1 text-[11px] font-medium',
                  STATUS_STYLES[status] || 'bg-muted text-muted-foreground border-border'
                )}
              >
                {status}
                <span className="font-bold">{count}</span>
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {/* Revenue chart */}
          <div className="col-span-1 overflow-hidden rounded-none border border-border/80 bg-card shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-primary" />
                <h3 className="text-[12px] font-semibold uppercase tracking-wider text-foreground">
                  Revenue · Last 7 days
                </h3>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <TrendingUp className="size-3.5 text-primary" />
                Paid orders only
              </div>
            </div>
            <div className="p-5">
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                        fontSize: '11px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                      formatter={(value, name) => {
                        const num = typeof value === 'number' ? value : Number(value ?? 0);
                        return name === 'total' ? [formatMoney(num), 'Revenue'] : [num, 'Orders'];
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#dashboardRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent orders */}
          <div className="col-span-1 flex min-h-[320px] flex-col overflow-hidden rounded-none border border-border/80 bg-card shadow-sm lg:max-h-[360px]">
            <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <h3 className="text-[12px] font-semibold uppercase tracking-wider text-foreground">
                  Recent Orders
                </h3>
              </div>
              <Link
                to="/orders"
                className="text-[11px] font-medium text-primary hover:underline inline-flex items-center gap-0.5"
              >
                See all
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <div className="min-h-0 flex-1 overflow-auto no-scrollbar">
              {stats.recentOrders.length === 0 ? (
                <div className="flex h-full items-center justify-center p-6 text-[11px] text-muted-foreground">
                  No orders yet
                </div>
              ) : (
                <table className="w-full border-collapse text-left">
                  <thead className={PAGE_TABLE_HEAD_CLASS}>
                    <tr>
                      <th className="px-4 py-2 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">
                        Customer
                      </th>
                      <th className="px-4 py-2 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground text-center">
                        Status
                      </th>
                      <th className="px-4 py-2 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground text-right">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] text-foreground">
                    {stats.recentOrders.map((order) => (
                      <tr
                        key={order._id}
                        className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-[12px]">{order.user?.name || 'Guest'}</div>
                          <div className="mt-0.5 text-[10px] text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-semibold text-primary">{formatMoney(order.totalPrice)}</div>
                          {!order.isPaid && (
                            <div className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-amber-600">
                              Unpaid
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex min-h-[220px] flex-col overflow-hidden rounded-none border border-border/80 bg-card shadow-sm">
            <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-primary" />
                <h3 className="text-[12px] font-semibold uppercase tracking-wider text-foreground">Best Sellers</h3>
              </div>
              <Link to="/products" className="text-[11px] font-medium text-primary hover:underline inline-flex items-center gap-0.5">
                View
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <div className="min-h-0 flex-1 overflow-auto no-scrollbar p-4">
              {(stats.bestSellers || []).length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-6">No sales data yet</p>
              ) : (
                <ul className="space-y-3">
                  {stats.bestSellers.map((item, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 text-[11px]">
                      <div className="min-w-0">
                        <span className="font-medium text-[12px] line-clamp-1 block">{item.name}</span>
                        <span className="text-muted-foreground">{item.qty} sold</span>
                      </div>
                      <span className="font-semibold text-primary shrink-0">{formatMoney(item.revenue)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <Link
            to="/returns"
            className="flex items-center gap-3 rounded-none border border-border/80 bg-card px-3 py-3 shadow-sm transition-colors hover:border-primary/40"
          >
            <div className="flex size-10 items-center justify-center rounded-none bg-amber-500/10">
              <RotateCcw className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pending returns</p>
              <p className="text-2xl font-bold">{stats.pendingRefunds ?? 0}</p>
            </div>
          </Link>

          <Link
            to="/coupons"
            className="flex items-center gap-3 rounded-none border border-border/80 bg-card px-3 py-3 shadow-sm transition-colors hover:border-primary/40"
          >
            <div className="flex size-10 items-center justify-center rounded-none bg-primary/10">
              <Ticket className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Active coupons</p>
              <p className="text-2xl font-bold">{stats.activeCoupons ?? 0}</p>
            </div>
          </Link>
        </div>

        {/* Alerts row */}
        {(stats.lowStockCount > 0 || stats.pendingOrders > 0 || stats.unpaidOrders > 0 || (stats.pendingRefunds ?? 0) > 0) && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.pendingOrders > 0 && (
              <Link
                to="/orders"
                className="flex items-center gap-3 rounded-none border border-amber-500/20 bg-amber-500/5 px-4 py-3 transition-colors hover:bg-amber-500/10"
              >
                <Clock className="size-4 shrink-0 text-amber-600" />
                <div>
                  <p className="text-[12px] font-semibold text-foreground">{stats.pendingOrders} pending orders</p>
                  <p className="text-[11px] text-muted-foreground">Review and fulfill</p>
                </div>
              </Link>
            )}
            {stats.unpaidOrders > 0 && (
              <Link
                to="/orders"
                className="flex items-center gap-3 rounded-none border border-blue-500/20 bg-blue-500/5 px-4 py-3 transition-colors hover:bg-blue-500/10"
              >
                <DollarSign className="size-4 shrink-0 text-blue-600" />
                <div>
                  <p className="text-[12px] font-semibold text-foreground">{stats.unpaidOrders} unpaid orders</p>
                  <p className="text-[11px] text-muted-foreground">Awaiting payment</p>
                </div>
              </Link>
            )}
            {stats.lowStockCount > 0 && (
              <Link
                to="/products"
                className="flex items-center gap-3 rounded-none border border-destructive/20 bg-destructive/5 px-4 py-3 transition-colors hover:bg-destructive/10"
              >
                <AlertTriangle className="size-4 shrink-0 text-destructive" />
                <div>
                  <p className="text-[12px] font-semibold text-foreground">{stats.lowStockCount} low stock items</p>
                  <p className="text-[11px] text-muted-foreground">5 or fewer in stock</p>
                </div>
              </Link>
            )}
            {(stats.pendingRefunds ?? 0) > 0 && (
              <Link
                to="/returns"
                className="flex items-center gap-3 rounded-none border border-amber-500/20 bg-amber-500/5 px-4 py-3 transition-colors hover:bg-amber-500/10"
              >
                <RotateCcw className="size-4 shrink-0 text-amber-600" />
                <div>
                  <p className="text-[12px] font-semibold text-foreground">{stats.pendingRefunds} return requests</p>
                  <p className="text-[11px] text-muted-foreground">Review RMA queue</p>
                </div>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

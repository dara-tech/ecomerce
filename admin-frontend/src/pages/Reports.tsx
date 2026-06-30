import { useState, useEffect } from 'react';
import api from '../lib/axios';
import { PageStickyHeader } from '../components/layout/PageSubTabs';
import { PAGE_TOOLBAR_ROW_CLASS, PAGE_TAB_GROUP_CLASS, pageTabButtonClass, PAGE_ROOT_CLASS, PAGE_BODY_CLASS, PAGE_SECONDARY_BTN_CLASS } from '../lib/pageToolbar';
import Loading from '../components/ui/Loading';

function defaultFromDate() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultToDate() {
  return new Date().toISOString().slice(0, 10);
}

const REPORT_TABS = [
  { id: 'sales', label: 'Sales' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'tax', label: 'Tax' },
  { id: 'products', label: 'Products' },
  { id: 'customers', label: 'Customers' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'coupons', label: 'Coupons' },
] as const;

type ReportTab = (typeof REPORT_TABS)[number]['id'];

export default function Reports() {
  const [tab, setTab] = useState<ReportTab>('sales');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(defaultFromDate);
  const [to, setTo] = useState(defaultToDate);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ type: tab });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    api.get(`/ops/reports?${params.toString()}`)
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [tab, from, to]);

  return (
    <div className={PAGE_ROOT_CLASS}>
      <PageStickyHeader
        toolbar={
          <div className={PAGE_TOOLBAR_ROW_CLASS}>
            <h1 className="text-sm font-semibold">Reports</h1>
            <div className="flex items-center gap-2 text-[11px]">
              <label className="flex items-center gap-1.5 text-muted-foreground">
                From
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-none border border-border bg-background px-2 py-1 text-foreground" />
              </label>
              <label className="flex items-center gap-1.5 text-muted-foreground">
                To
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-none border border-border bg-background px-2 py-1 text-foreground" />
              </label>
              <button type="button" className={PAGE_SECONDARY_BTN_CLASS} onClick={() => { setFrom(defaultFromDate()); setTo(defaultToDate()); }}>
                Last 30 days
              </button>
            </div>
          </div>
        }
        subTabs={<div className={PAGE_TAB_GROUP_CLASS}>{REPORT_TABS.map((t) => (<button key={t.id} type="button" className={pageTabButtonClass(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>))}</div>}
      />

      <div className={PAGE_BODY_CLASS}>
        {loading ? (
          <Loading variant="page" label="Loading report…" />
        ) : (
          <div className="bg-card border border-border/80 rounded-none p-6">
            <ReportView type={tab} data={data} />
          </div>
        )}
      </div>
    </div>
  );
}

function ReportView({ type, data }: { type: ReportTab; data: any }) {
  if (!data) return <p className="text-muted-foreground text-sm">No data available.</p>;

  if (type === 'sales' || type === 'revenue') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Orders" value={data.count ?? data.orders} />
        <Stat label="Revenue" value={`$${(data.revenue ?? 0).toFixed(2)}`} />
        <Stat label="Tax" value={`$${(data.tax ?? 0).toFixed(2)}`} />
        <Stat label="Shipping" value={`$${(data.shipping ?? 0).toFixed(2)}`} />
      </div>
    );
  }

  if (type === 'tax') {
    return (
      <div className="grid grid-cols-2 gap-4">
        <Stat label="Total tax collected" value={`$${(data.totalTax ?? 0).toFixed(2)}`} />
        <Stat label="Paid orders" value={data.orderCount} />
      </div>
    );
  }

  if (type === 'products') {
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold mb-3">Top products by quantity sold</p>
        {data.top?.map((p: any, i: number) => (
          <div key={i} className="flex justify-between text-sm py-2 border-b border-border/40">
            <span>{p._id}</span>
            <span className="text-muted-foreground">{p.qty} sold · ${p.revenue?.toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'customers') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Total customers" value={data.customers} />
          <Stat label="New (period)" value={data.newCustomers} />
        </div>
        <p className="text-sm font-semibold">Top customers</p>
        {data.top?.map((c: any, i: number) => (
          <div key={i} className="flex justify-between text-sm py-1">
            <span>{c.user?.name || 'Unknown'}</span>
            <span>${c.total?.toFixed(2)} ({c.orders} orders)</span>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'inventory') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Products" value={data.totalProducts} />
        <Stat label="Total units" value={data.totalUnits} />
        <Stat label="Low stock" value={data.lowStock} />
        <Stat label="Out of stock" value={data.outOfStock} />
      </div>
    );
  }

  if (type === 'coupons') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Total coupons" value={data.total} />
          <Stat label="Active" value={data.active} />
          <Stat label="Total redemptions" value={data.totalUsed} />
        </div>
        {data.coupons?.map((c: any) => (
          <div key={c._id} className="flex justify-between text-sm py-1 border-b border-border/40">
            <code>{c.code}</code>
            <span>{c.usedCount} used · {c.type}</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-muted/30 rounded-none p-4">
      <p className="text-[10px] uppercase text-muted-foreground font-semibold">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

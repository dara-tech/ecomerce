import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import api from '../lib/axios';
import { useOpsList } from '../lib/useOpsList';
import { opsTableClass, opsThClass, opsTdClass } from '../lib/opsUi';
import { PageStickyHeader } from '../components/layout/PageSubTabs';
import { PAGE_TOOLBAR_ROW_CLASS, PAGE_TAB_GROUP_CLASS, pageTabButtonClass, PAGE_PRIMARY_BTN_CLASS, PAGE_ROOT_CLASS, PAGE_BODY_CLASS } from '../lib/pageToolbar';
import ConfirmModal from '../components/ui/ConfirmModal';

type Tab = 'warehouses' | 'suppliers' | 'transfers' | 'purchase-orders' | 'alerts' | 'history';

export default function Inventory() {
  const [tab, setTab] = useState<Tab>('warehouses');
  const warehouses = useOpsList<any>('inventory/warehouses');
  const suppliers = useOpsList<any>('inventory/suppliers');
  const transfers = useOpsList<any>('inventory/transfers');
  const purchaseOrders = useOpsList<any>('inventory/purchase-orders');
  const [history, setHistory] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any>({ products: [], threshold: 5 });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletePath, setDeletePath] = useState('');

  useEffect(() => {
    if (tab === 'history') api.get('/ops/inventory/stock-history').then((r) => setHistory(r.data)).catch(() => setHistory([]));
    if (tab === 'alerts') api.get('/ops/inventory/low-stock').then((r) => setAlerts(r.data)).catch(() => setAlerts({ products: [], threshold: 5 }));
  }, [tab]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'warehouses', label: 'Warehouses' },
    { id: 'suppliers', label: 'Suppliers' },
    { id: 'transfers', label: 'Stock Transfer' },
    { id: 'purchase-orders', label: 'Purchase Orders' },
    { id: 'alerts', label: 'Low Stock Alerts' },
    { id: 'history', label: 'Stock History' },
  ];

  return (
    <div className={PAGE_ROOT_CLASS}>
      <PageStickyHeader
        toolbar={<div className={PAGE_TOOLBAR_ROW_CLASS}><h1 className="text-sm font-semibold">Inventory</h1></div>}
        subTabs={<div className={PAGE_TAB_GROUP_CLASS}>{tabs.map((t) => (<button key={t.id} type="button" onClick={() => setTab(t.id)} className={pageTabButtonClass(tab === t.id)}>{t.label}</button>))}</div>}
      />

      <div className={PAGE_BODY_CLASS}>
        {tab === 'warehouses' && (
          <>
            <button type="button" className={PAGE_PRIMARY_BTN_CLASS} onClick={() => warehouses.create({ name: 'Main Warehouse', code: `WH-${Date.now()}`, city: 'Phnom Penh', isDefault: true, isActive: true })}><Plus className="size-3.5" /> Add Warehouse</button>
            <Table headers={['Name', 'Code', 'City', 'Default', '']} rows={warehouses.items.map((w) => [w.name, w.code, w.city || '—', w.isDefault ? 'Yes' : 'No', w._id])} onDelete={(id) => { setDeletePath('inventory/warehouses'); setDeleteId(id); }} />
          </>
        )}
        {tab === 'suppliers' && (
          <>
            <button type="button" className={PAGE_PRIMARY_BTN_CLASS} onClick={() => suppliers.create({ name: 'New Supplier', isActive: true })}><Plus className="size-3.5" /> Add Supplier</button>
            <Table headers={['Name', 'Email', 'Phone', '']} rows={suppliers.items.map((s) => [s.name, s.email || '—', s.phone || '—', s._id])} onDelete={(id) => { setDeletePath('inventory/suppliers'); setDeleteId(id); }} />
          </>
        )}
        {tab === 'transfers' && (
          <Table headers={['Product', 'From', 'To', 'Qty', 'Status', 'Action']} rows={transfers.items.map((t) => [
            t.product?.name || t.product,
            t.fromWarehouse?.name || '—',
            t.toWarehouse?.name || '—',
            t.quantity,
            t.status,
            t.status !== 'completed' ? t._id : '',
          ])} actionLabel="Complete" onAction={async (id) => { await api.post(`/ops/inventory/transfers/${id}/complete`); transfers.refresh(); }} />
        )}
        {tab === 'purchase-orders' && (
          <>
            <button type="button" className={PAGE_PRIMARY_BTN_CLASS} onClick={() => purchaseOrders.create({ poNumber: `PO-${Date.now()}`, supplier: suppliers.items[0]?._id, warehouse: warehouses.items[0]?._id, items: [], status: 'draft', totalCost: 0 })} disabled={!suppliers.items.length || !warehouses.items.length}><Plus className="size-3.5" /> New PO</button>
            <Table headers={['PO #', 'Supplier', 'Status', 'Total', 'Action']} rows={purchaseOrders.items.map((p) => [p.poNumber, p.supplier?.name || '—', p.status, `$${p.totalCost}`, p.status !== 'received' ? p._id : ''])} actionLabel="Receive" onAction={async (id) => { await api.post(`/ops/inventory/purchase-orders/${id}/receive`); purchaseOrders.refresh(); }} />
          </>
        )}
        {tab === 'alerts' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-600 text-sm font-medium"><AlertTriangle className="size-4" /> Threshold: {alerts.threshold} units</div>
            {alerts.products?.map((p: any) => (
              <div key={p._id} className="flex items-center justify-between bg-card border border-border/80 rounded-none px-4 py-3">
                <span className="text-sm font-medium">{p.name}</span>
                <span className="text-xs text-destructive font-bold">{p.countInStock} left</span>
              </div>
            ))}
            {!alerts.products?.length && <p className="text-muted-foreground text-sm">No low stock items.</p>}
          </div>
        )}
        {tab === 'history' && (
          <div className="border border-border/80 rounded-none overflow-hidden bg-card overflow-x-auto no-scrollbar">
            <table className={opsTableClass}>
              <thead className="bg-muted/30"><tr>{['Product', 'Change', 'Balance', 'Reason', 'Date'].map((h) => <th key={h} className={opsThClass}>{h}</th>)}</tr></thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h._id}>
                    <td className={opsTdClass}>{h.product?.name}</td>
                    <td className={opsTdClass}>{h.change > 0 ? `+${h.change}` : h.change}</td>
                    <td className={opsTdClass}>{h.balanceAfter}</td>
                    <td className={opsTdClass}>{h.reason}</td>
                    <td className={opsTdClass}>{new Date(h.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal isOpen={!!deleteId} title="Delete?" message="This cannot be undone." onConfirm={async () => { if (deleteId) { await api.delete(`/ops/${deletePath}/${deleteId}`); setDeleteId(null); warehouses.refresh(); suppliers.refresh(); } }} onCancel={() => setDeleteId(null)} />
    </div>
  );
}

function Table({ headers, rows, onDelete, onAction, actionLabel }: { headers: string[]; rows: (string | number)[][]; onDelete?: (id: string) => void; onAction?: (id: string) => void; actionLabel?: string }) {
  return (
    <div className="border border-border/80 rounded-none overflow-hidden bg-card overflow-x-auto no-scrollbar">
      <table className={opsTableClass}>
        <thead className="bg-muted/30"><tr>{headers.map((h) => <th key={h} className={opsThClass}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.slice(0, -1).map((cell, j) => <td key={j} className={opsTdClass}>{cell}</td>)}
              <td className={opsTdClass}>
                {onAction && typeof row[row.length - 1] === 'string' && String(row[row.length - 1]).length > 10 && (
                  <button type="button" className="text-xs text-primary font-medium mr-2" onClick={() => onAction(String(row[row.length - 1]))}>{actionLabel}</button>
                )}
                {onDelete && <button type="button" aria-label="Delete" onClick={() => onDelete(String(row[row.length - 1]))}><Trash2 className="size-3.5 text-destructive" /></button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

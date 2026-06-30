import { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator } from 'lucide-react';
import api from '../lib/axios';
import { useOpsList } from '../lib/useOpsList';
import { opsInputClass, opsLabelClass, opsTableClass, opsThClass, opsTdClass } from '../lib/opsUi';
import { PageStickyHeader } from '../components/layout/PageSubTabs';
import { PAGE_TOOLBAR_ROW_CLASS, PAGE_TAB_GROUP_CLASS, pageTabButtonClass, PAGE_PRIMARY_BTN_CLASS, PAGE_ROOT_CLASS, PAGE_BODY_CLASS } from '../lib/pageToolbar';
import ConfirmModal from '../components/ui/ConfirmModal';

type Tab = 'zones' | 'methods' | 'calculator' | 'estimates';

export default function Shipping() {
  const [tab, setTab] = useState<Tab>('zones');
  const zones = useOpsList<any>('shipping/zones');
  const methods = useOpsList<any>('shipping/methods');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletePath, setDeletePath] = useState('');
  const [calc, setCalc] = useState({ methodId: '', weightKg: 1, orderTotal: 0 });
  const [calcResult, setCalcResult] = useState<any>(null);
  const [estimates, setEstimates] = useState<any[]>([]);

  useEffect(() => {
    if (tab === 'estimates') {
      api.get('/ops/shipping/estimates').then((r) => setEstimates(r.data)).catch(() => setEstimates([]));
    }
  }, [tab]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await api.delete(`/ops/${deletePath}/${deleteId}`);
    setDeleteId(null);
    zones.refresh();
    methods.refresh();
  };

  const runCalculator = async () => {
    const { data } = await api.post('/ops/shipping/calculate', calc);
    setCalcResult(data);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'zones', label: 'Shipping Zones' },
    { id: 'methods', label: 'Shipping Methods' },
    { id: 'calculator', label: 'Fee Calculator' },
    { id: 'estimates', label: 'Delivery Estimates' },
  ];

  return (
    <div className={PAGE_ROOT_CLASS}>
      <PageStickyHeader
        toolbar={<div className={PAGE_TOOLBAR_ROW_CLASS}><h1 className="text-sm font-semibold">Shipping</h1></div>}
        subTabs={
          <div className={PAGE_TAB_GROUP_CLASS}>
            {tabs.map((t) => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)} className={pageTabButtonClass(tab === t.id)}>{t.label}</button>
            ))}
          </div>
        }
      />

      <div className={PAGE_BODY_CLASS}>
        {tab === 'zones' && (
          <>
            <button type="button" className={PAGE_PRIMARY_BTN_CLASS} onClick={() => zones.create({ name: 'New Zone', countries: ['KH'], isActive: true })}>
              <Plus className="size-3.5" /> Add Zone
            </button>
            <div className="border border-border/80 rounded-none overflow-hidden bg-card">
              <table className={opsTableClass}>
                <thead className="bg-muted/30"><tr><th className={opsThClass}>Name</th><th className={opsThClass}>Countries</th><th className={opsThClass}>Active</th><th className={opsThClass} /></tr></thead>
                <tbody>
                  {zones.items.map((z) => (
                    <tr key={z._id}>
                      <td className={opsTdClass}><input className={opsInputClass} value={z.name} onChange={(e) => zones.update(z._id, { name: e.target.value })} /></td>
                      <td className={opsTdClass}>{(z.countries || []).join(', ')}</td>
                      <td className={opsTdClass}>{z.isActive ? 'Yes' : 'No'}</td>
                      <td className={opsTdClass}><button type="button" aria-label="Delete zone" onClick={() => { setDeletePath('shipping/zones'); setDeleteId(z._id); }}><Trash2 className="size-3.5 text-destructive" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'methods' && (
          <>
            <button type="button" className={PAGE_PRIMARY_BTN_CLASS} onClick={() => methods.create({ name: 'Standard', type: 'flat', baseFee: 5, minDays: 2, maxDays: 5, isActive: true })}>
              <Plus className="size-3.5" /> Add Method
            </button>
            <div className="border border-border/80 rounded-none overflow-hidden bg-card overflow-x-auto no-scrollbar">
              <table className={opsTableClass}>
                <thead className="bg-muted/30"><tr><th className={opsThClass}>Name</th><th className={opsThClass}>Type</th><th className={opsThClass}>Fee</th><th className={opsThClass}>Days</th><th className={opsThClass}>Warehouse</th><th className={opsThClass} /></tr></thead>
                <tbody>
                  {methods.items.map((m) => (
                    <tr key={m._id}>
                      <td className={opsTdClass}>{m.name}</td>
                      <td className={opsTdClass}>{m.type}</td>
                      <td className={opsTdClass}>${m.baseFee}</td>
                      <td className={opsTdClass}>{m.minDays}–{m.maxDays}</td>
                      <td className={opsTdClass}>{m.warehouse?.name || '—'}</td>
                      <td className={opsTdClass}><button type="button" aria-label="Delete method" onClick={() => { setDeletePath('shipping/methods'); setDeleteId(m._id); }}><Trash2 className="size-3.5 text-destructive" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'calculator' && (
          <div className="max-w-md bg-card border border-border/80 rounded-none p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold"><Calculator className="size-4" /> Shipping Fee Calculator</div>
            <div><label className={opsLabelClass}>Method ID</label><input className={opsInputClass} value={calc.methodId} onChange={(e) => setCalc({ ...calc, methodId: e.target.value })} placeholder="Shipping method ID" /></div>
            <div><label className={opsLabelClass}>Weight (kg)</label><input type="number" className={opsInputClass} value={calc.weightKg} onChange={(e) => setCalc({ ...calc, weightKg: Number(e.target.value) })} /></div>
            <div><label className={opsLabelClass}>Order Total ($)</label><input type="number" className={opsInputClass} value={calc.orderTotal} onChange={(e) => setCalc({ ...calc, orderTotal: Number(e.target.value) })} /></div>
            <button type="button" className={PAGE_PRIMARY_BTN_CLASS} onClick={runCalculator}>Calculate</button>
            {calcResult && (
              <div className="p-3 bg-muted/40 rounded-none text-sm space-y-1">
                <p><strong>Fee:</strong> ${calcResult.fee?.toFixed(2)}</p>
                <p><strong>Method:</strong> {calcResult.method}</p>
                <p><strong>Estimate:</strong> {calcResult.estimateDays}</p>
              </div>
            )}
          </div>
        )}

        {tab === 'estimates' && (
          <div className="grid gap-3 md:grid-cols-2">
            {estimates.map((e) => (
              <div key={e._id} className="bg-card border border-border/80 rounded-none p-4">
                <p className="font-semibold text-sm">{e.name}</p>
                <p className="text-xs text-muted-foreground mt-1">Zone: {e.zone?.name || '—'} · Warehouse: {e.warehouse?.name || '—'}</p>
                <p className="text-sm mt-2">{e.minDays}–{e.maxDays} business days · from ${e.baseFee}</p>
              </div>
            ))}
            {estimates.length === 0 && <p className="text-muted-foreground text-sm">Add shipping methods to see estimates.</p>}
          </div>
        )}
      </div>

      <ConfirmModal isOpen={!!deleteId} title="Delete?" message="This cannot be undone." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '../lib/axios';
import { opsTableClass, opsThClass, opsTdClass } from '../lib/opsUi';
import { PageStickyHeader } from '../components/layout/PageSubTabs';
import { PAGE_TOOLBAR_ROW_CLASS, PAGE_TAB_GROUP_CLASS, pageTabButtonClass, PAGE_ROOT_CLASS, PAGE_BODY_CLASS } from '../lib/pageToolbar';

export default function Wishlists() {
  const [tab, setTab] = useState<'all' | 'popular'>('all');
  const [items, setItems] = useState<any[]>([]);
  const [popular, setPopular] = useState<any[]>([]);

  useEffect(() => {
    if (tab === 'all') api.get('/ops/wishlists').then((r) => setItems(r.data)).catch(() => setItems([]));
    else api.get('/ops/wishlists/popular').then((r) => setPopular(r.data)).catch(() => setPopular([]));
  }, [tab]);

  return (
    <div className={PAGE_ROOT_CLASS}>
      <PageStickyHeader
        toolbar={<div className={PAGE_TOOLBAR_ROW_CLASS}><h1 className="text-sm font-semibold">Wishlists</h1></div>}
        subTabs={
          <div className={PAGE_TAB_GROUP_CLASS}>
            <button type="button" className={pageTabButtonClass(tab === 'all')} onClick={() => setTab('all')}>Customer Wishlists</button>
            <button type="button" className={pageTabButtonClass(tab === 'popular')} onClick={() => setTab('popular')}>Popular Items</button>
          </div>
        }
      />

      <div className={PAGE_BODY_CLASS}>
        {tab === 'all' ? (
          <div className="border border-border/80 rounded-none overflow-hidden bg-card overflow-x-auto no-scrollbar">
            <table className={opsTableClass}>
              <thead className="bg-muted/30"><tr>{['Customer', 'Product', 'Price', 'Added'].map((h) => <th key={h} className={opsThClass}>{h}</th>)}</tr></thead>
              <tbody>
                {items.map((w) => (
                  <tr key={w._id}>
                    <td className={opsTdClass}>{w.user?.name} <span className="text-muted-foreground text-xs">({w.user?.email})</span></td>
                    <td className={opsTdClass}>{w.product?.name}</td>
                    <td className={opsTdClass}>${w.product?.price?.toFixed(2)}</td>
                    <td className={opsTdClass}>{new Date(w.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {popular.map((p) => (
              <div key={p.product._id} className="bg-card border border-border/80 rounded-none p-4 flex gap-3">
                {p.product.image && <img src={p.product.image} alt="" className="w-14 h-14 rounded-none object-cover" />}
                <div>
                  <p className="font-medium text-sm">{p.product.name}</p>
                  <p className="text-xs text-muted-foreground">{p.count} wishlists</p>
                  <p className="text-sm font-semibold text-primary mt-1">${p.product.price?.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

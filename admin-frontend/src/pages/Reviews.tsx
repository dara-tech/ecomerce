import { useState, useEffect } from 'react';
import { Check, X, ShieldAlert } from 'lucide-react';
import api from '../lib/axios';
import { opsTableClass, opsThClass, opsTdClass } from '../lib/opsUi';
import { PageStickyHeader } from '../components/layout/PageSubTabs';
import { PAGE_TOOLBAR_ROW_CLASS, PAGE_TAB_GROUP_CLASS, pageTabButtonClass, PAGE_ROOT_CLASS, PAGE_BODY_CLASS } from '../lib/pageToolbar';

export default function Reviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'spam'>('all');

  const load = () => api.get('/ops/reviews').then((r) => setReviews(r.data)).catch(() => setReviews([]));
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    await api.put(`/ops/reviews/${id}/status`, { status });
    load();
  };

  const filtered = filter === 'all' ? reviews : reviews.filter((r) => r.status === filter);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'spam', label: 'Spam' },
  ] as const;

  return (
    <div className={PAGE_ROOT_CLASS}>
      <PageStickyHeader
        toolbar={<div className={PAGE_TOOLBAR_ROW_CLASS}><h1 className="text-sm font-semibold">Reviews</h1></div>}
        subTabs={<div className={PAGE_TAB_GROUP_CLASS}>{tabs.map((t) => (<button key={t.id} type="button" onClick={() => setFilter(t.id)} className={pageTabButtonClass(filter === t.id)}>{t.label}</button>))}</div>}
      />

      <div className={PAGE_BODY_CLASS}>
        <div className="border border-border/80 rounded-lg overflow-hidden bg-card overflow-x-auto no-scrollbar">
          <table className={opsTableClass}>
            <thead className="bg-muted/30"><tr>{['Product', 'Customer', 'Rating', 'Comment', 'Images', 'Spam', 'Status', 'Actions'].map((h) => <th key={h} className={opsThClass}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r._id}>
                  <td className={opsTdClass}>{r.product?.name}</td>
                  <td className={opsTdClass}>{r.name || r.user?.name}</td>
                  <td className={opsTdClass}>{'★'.repeat(r.rating)}</td>
                  <td className={`${opsTdClass} max-w-xs truncate`}>{r.comment}</td>
                  <td className={opsTdClass}>{r.images?.length || 0}</td>
                  <td className={opsTdClass}>{r.spamScore > 0.5 ? <ShieldAlert className="size-4 text-amber-500" /> : '—'}</td>
                  <td className={opsTdClass}><span className="capitalize text-xs">{r.status}</span></td>
                  <td className={opsTdClass}>
                    <div className="flex gap-1">
                      <button type="button" aria-label="Approve" className="p-1 hover:bg-emerald-500/10 rounded" onClick={() => setStatus(r._id, 'approved')}><Check className="size-3.5 text-emerald-600" /></button>
                      <button type="button" aria-label="Reject" className="p-1 hover:bg-destructive/10 rounded" onClick={() => setStatus(r._id, 'rejected')}><X className="size-3.5 text-destructive" /></button>
                      <button type="button" aria-label="Mark spam" className="p-1 text-xs text-amber-600" onClick={() => setStatus(r._id, 'spam')}>Spam</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <p className="p-8 text-center text-muted-foreground text-sm">No reviews yet.</p>}
        </div>
      </div>
    </div>
  );
}

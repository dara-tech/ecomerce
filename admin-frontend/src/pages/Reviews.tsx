import { useState, useEffect } from 'react';
import { Check, X, ShieldAlert } from 'lucide-react';
import api from '../lib/axios';
import { opsTableClass, opsThClass, opsTdClass } from '../lib/opsUi';
import { PageStickyHeader } from '../components/layout/PageSubTabs';
import {
  PAGE_TOOLBAR_ROW_CLASS,
  PAGE_TAB_GROUP_CLASS,
  pageTabButtonClass,
  PAGE_ROOT_CLASS,
  PAGE_LIST_BODY_CLASS,
} from '../lib/pageToolbar';
import {
  DesktopTablePanel,
  MobileEmptyState,
  MobileListShell,
  MobileRecordCard,
} from '../components/layout/mobileAdmin';

export default function Reviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'spam'>('all');

  const load = () => api.get('/ops/reviews').then((r) => setReviews(r.data)).catch(() => setReviews([]));
  useEffect(() => {
    load();
  }, []);

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

  const reviewActions = (r: any) => (
    <>
      <button
        type="button"
        aria-label="Approve"
        className="rounded-none p-1.5 hover:bg-emerald-500/10"
        onClick={() => setStatus(r._id, 'approved')}
      >
        <Check className="size-3.5 text-emerald-600" />
      </button>
      <button
        type="button"
        aria-label="Reject"
        className="rounded-none p-1.5 hover:bg-destructive/10"
        onClick={() => setStatus(r._id, 'rejected')}
      >
        <X className="size-3.5 text-destructive" />
      </button>
      <button
        type="button"
        aria-label="Mark spam"
        className="rounded-none px-1.5 py-1 text-[10px] font-medium text-amber-600"
        onClick={() => setStatus(r._id, 'spam')}
      >
        Spam
      </button>
    </>
  );

  return (
    <div className={PAGE_ROOT_CLASS}>
      <PageStickyHeader
        toolbar={
          <div className={PAGE_TOOLBAR_ROW_CLASS}>
            <h1 className="text-sm font-semibold">Reviews</h1>
            <span className="text-xs text-muted-foreground">{reviews.length} total</span>
          </div>
        }
        subTabs={
          <div className={PAGE_TAB_GROUP_CLASS}>
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={pageTabButtonClass(filter === t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />

      <div className={PAGE_LIST_BODY_CLASS}>
        <DesktopTablePanel className="overflow-x-auto no-scrollbar">
          <table className={opsTableClass}>
            <thead className="bg-muted/30">
              <tr>
                {['Product', 'Customer', 'Rating', 'Comment', 'Images', 'Spam', 'Status', 'Actions'].map(
                  (h) => (
                    <th key={h} className={opsThClass}>
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r._id}>
                  <td className={opsTdClass}>{r.product?.name}</td>
                  <td className={opsTdClass}>{r.name || r.user?.name}</td>
                  <td className={opsTdClass}>{'★'.repeat(r.rating)}</td>
                  <td className={`${opsTdClass} max-w-xs truncate`}>{r.comment}</td>
                  <td className={opsTdClass}>{r.images?.length || 0}</td>
                  <td className={opsTdClass}>
                    {r.spamScore > 0.5 ? <ShieldAlert className="size-4 text-amber-500" /> : '—'}
                  </td>
                  <td className={opsTdClass}>
                    <span className="text-xs capitalize">{r.status}</span>
                  </td>
                  <td className={opsTdClass}>
                    <div className="flex gap-1">{reviewActions(r)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <p className="p-8 text-center text-sm text-muted-foreground">No reviews yet.</p>
          )}
        </DesktopTablePanel>

        <MobileListShell>
          {!filtered.length ? (
            <MobileEmptyState message="No reviews yet." />
          ) : (
            filtered.map((r) => (
              <MobileRecordCard
                key={r._id}
                title={r.product?.name || 'Product'}
                subtitle={r.comment || 'No comment'}
                meta={`${r.name || r.user?.name || 'Guest'} · ${'★'.repeat(r.rating)} · ${r.status}`}
                badges={
                  r.spamScore > 0.5 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600">
                      <ShieldAlert className="size-3" /> Spam risk
                    </span>
                  ) : null
                }
                actions={reviewActions(r)}
              />
            ))
          )}
        </MobileListShell>
      </div>
    </div>
  );
}

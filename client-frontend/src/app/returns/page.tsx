'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { getApiUrl } from '@/lib/api';
import { Input } from '@/components/ui/Input';

export default function ReturnsPage() {
  const { user } = useAuth();
  const apiUrl = getApiUrl();
  const [orderId, setOrderId] = useState('');
  const [reason, setReason] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.token) return;
    fetch(`${apiUrl}/store/returns/mine`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then(setReturns)
      .catch(() => {});
  }, [user, apiUrl]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user?.token) headers.Authorization = `Bearer ${user.token}`;

      const res = await fetch(`${apiUrl}/store/returns`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ orderId, reason, guestEmail: user ? undefined : guestEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      toast.success('Return request submitted');
      setOrderId('');
      setReason('');
      if (user?.token) setReturns((prev) => [data, ...prev]);
    } catch (err: any) {
      toast.error(err.message || 'Could not submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Returns & Refunds</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Request a return or refund for your order. Our team will review within 1–2 business days.
      </p>

      <form onSubmit={submit} className="space-y-4 rounded-xl border border-border p-6 mb-10">
        <div>
          <label className="text-sm font-medium">Order ID</label>
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            required
            placeholder="Paste your order ID from confirmation email"
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
        {!user && (
          <div>
            <label className="text-sm font-medium">Email used at checkout</label>
            <Input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
        )}
        <div>
          <label className="text-sm font-medium">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={4}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="Describe the issue with your order..."
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {loading ? 'Submitting…' : 'Submit return request'}
        </button>
      </form>

      {user && returns.length > 0 && (
        <div>
          <h2 className="font-semibold mb-4">Your requests</h2>
          <ul className="space-y-3">
            {returns.map((r) => (
              <li key={r._id} className="rounded-lg border border-border p-4 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Order {String(r.order?._id || r.order).slice(-8)}</span>
                  <span className="uppercase text-xs font-semibold text-muted-foreground">{r.status}</span>
                </div>
                <p className="text-muted-foreground mt-1">{r.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-8 text-sm text-muted-foreground">
        Need help? <Link href="/faq" className="underline">Visit FAQ</Link> or use live chat.
      </p>
    </div>
  );
}

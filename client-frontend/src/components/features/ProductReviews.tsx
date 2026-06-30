'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/api';
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    fetch(`${apiUrl}/store/products/${productId}/reviews`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setReviews)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [productId, apiUrl]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) {
      toast.error('Sign in to leave a review');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/store/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ productId, rating, comment, name: user.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      toast.success('Review submitted for moderation');
      setComment('');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="text-xl font-bold mb-6">Customer Reviews</h2>

      {user && (
        <form onSubmit={submit} className="mb-8 rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                <Star className={`size-5 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            rows={3}
            placeholder="Share your experience..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit review'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r._id} className="rounded-xl border border-border/60 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{r.name || r.user?.name}</span>
                <span className="flex">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="size-3 fill-amber-400 text-amber-400" />
                  ))}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{r.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

import type { Metadata } from 'next';
import { getApiUrl } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Find answers to common questions about our products, shipping, and returns.',
};

async function getFaqs() {
  try {
    const res = await fetch(`${getApiUrl()}/cms/faqs`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return [];
  }
}

export default async function FAQPage() {
  const faqs = await getFaqs();
  const activeFaqs = faqs.filter((faq: any) => faq.isActive);

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl min-h-[60vh]">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-foreground">Frequently Asked Questions</h1>
        <p className="text-muted-foreground text-lg">Have questions? We're here to help.</p>
      </div>

      {activeFaqs.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          No FAQs available at the moment.
        </div>
      ) : (
        <div className="space-y-4">
          {activeFaqs.map((faq: any) => (
            <details key={faq._id} className="group bg-card border border-border/60 rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between cursor-pointer p-5 font-semibold text-foreground hover:bg-muted/30 transition-colors">
                {faq.question}
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 pt-0 text-muted-foreground leading-relaxed bg-muted/5">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

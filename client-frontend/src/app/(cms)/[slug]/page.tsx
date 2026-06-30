import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

async function getPage(slug: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/api';
    const res = await fetch(`${apiUrl}/cms/pages/${slug}`, { next: { revalidate: 60 } });
    
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Failed to fetch page');
    }
    
    return res.json();
  } catch (error) {
    console.error("Error fetching page:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const page = await getPage(resolvedParams.slug);
  
  if (!page) {
    return { title: 'Page Not Found' };
  }

  return {
    title: page.title,
    description: page.metaDescription || `Read our ${page.title} at E-Commerce`,
  };
}

export default async function CMSPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const page = await getPage(resolvedParams.slug);

  if (!page) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl min-h-[60vh]">
      <h1 className="text-4xl font-extrabold tracking-tight mb-8 text-foreground">{page.title}</h1>
      
      <div 
        className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary hover:prose-a:text-primary/80"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}

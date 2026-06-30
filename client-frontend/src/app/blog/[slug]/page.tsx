import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ProductImage from '@/components/ui/ProductImage';
import { getApiUrl } from '@/lib/api';

async function getBlog(slug: string) {
  try {
    const res = await fetch(`${getApiUrl()}/cms/blogs/${slug}`, { next: { revalidate: 60 } });
    
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Failed to fetch blog');
    }
    
    return res.json();
  } catch (error) {
    console.error("Error fetching blog:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const blog = await getBlog(resolvedParams.slug);
  
  if (!blog) {
    return { title: 'Blog Not Found' };
  }

  return {
    title: blog.title,
    description: blog.excerpt || `Read ${blog.title} on our blog`,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const blog = await getBlog(resolvedParams.slug);

  if (!blog) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl min-h-[60vh]">
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center text-sm text-muted-foreground mb-6 space-x-2 uppercase tracking-widest font-semibold">
          <span>{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span>•</span>
          <span>By {blog.author || 'Admin'}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-8 leading-tight">
          {blog.title}
        </h1>
      </div>

      {blog.coverImage && (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-12 shadow-md">
          <ProductImage 
            src={blog.coverImage} 
            alt={blog.title} 
            fill 
            className="object-cover" 
            sizes="(max-width: 1024px) 100vw, 1024px"
          />
        </div>
      )}

      <div 
        className="prose prose-lg dark:prose-invert max-w-none mx-auto prose-headings:font-bold prose-img:rounded-xl prose-a:text-primary hover:prose-a:text-primary/80"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />
    </div>
  );
}

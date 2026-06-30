import Link from 'next/link';
import type { Metadata } from 'next';
import ProductImage from '@/components/ui/ProductImage';
import { getApiUrl } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Blog - News & Updates',
  description: 'Read the latest news, updates, and articles from our team.',
};

async function getBlogs() {
  try {
    const res = await fetch(`${getApiUrl()}/cms/blogs`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return [];
  }
}

export default async function BlogIndex() {
  const blogs = await getBlogs();

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl min-h-[60vh]">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground">Our Blog</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Discover the latest trends, tech tips, and stories from our experts.</p>
      </div>

      {blogs.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          No blog posts published yet. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog: any) => (
            <Link key={blog._id} href={`/blog/${blog.slug}`} className="group block flex flex-col bg-card rounded-2xl border border-border/60 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="relative aspect-video w-full bg-muted overflow-hidden">
                {blog.coverImage ? (
                  <ProductImage 
                    src={blog.coverImage} 
                    alt={blog.title} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted-foreground/10 text-muted-foreground">
                    No Image
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center text-xs text-muted-foreground mb-3 space-x-2">
                  <span>{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{blog.author || 'Admin'}</span>
                </div>
                <h2 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors text-foreground">{blog.title}</h2>
                <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
                  {blog.excerpt || blog.content.replace(/<[^>]+>/g, '').substring(0, 150) + '...'}
                </p>
                <div className="mt-auto text-primary text-sm font-medium flex items-center">
                  Read Article <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

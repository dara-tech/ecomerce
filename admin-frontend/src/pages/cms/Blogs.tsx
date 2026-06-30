import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Plus, BookOpen, Edit2, Trash2, CheckCircle2, Clock } from 'lucide-react';
import api from '../../lib/axios';
import { cn } from '../../lib/utils';
import {PAGE_TOOLBAR_CLASS, PAGE_TOOLBAR_ROW_CLASS, PAGE_ROOT_CLASS, PAGE_LIST_BODY_CLASS, PAGE_TABLE_HEAD_CLASS} from '../../lib/pageToolbar';
import DataTableShell from '../../components/layout/DataTableShell';
import Loading from '../../components/ui/Loading';
import ConfirmModal from '../../components/ui/ConfirmModal';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  content?: string;
  image?: string;
  author?: string;
  isPublished: boolean;
  publishedAt: string;
}

export default function Blogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'content'>('basic');
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    image: '',
    author: '',
    isPublished: true
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const { data } = await api.get('/cms/blogs');
      setBlogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingBlog(null);
    setFormData({ title: '', slug: '', content: '', image: '', author: '', isPublished: true });
    setError('');
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const openEditModal = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData({ 
      title: blog.title, 
      slug: blog.slug, 
      content: blog.content || '', 
      image: blog.image || '', 
      author: blog.author || '', 
      isPublished: blog.isPublished 
    });
    setError('');
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      if (editingBlog) {
        await api.put(`/cms/blogs/${editingBlog._id}`, formData);
      } else {
        await api.post('/cms/blogs', formData);
      }
      setIsModalOpen(false);
      fetchBlogs();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/cms/blogs/${deleteId}`);
      fetchBlogs();
      setDeleteId(null);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete blog post');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderModal = () => {
    if (!isModalOpen) return null;
    return createPortal(
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
        <div className="flex w-full max-w-2xl flex-col overflow-hidden bg-card text-foreground rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-border relative animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <BookOpen className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  {editingBlog ? 'Edit Blog Post' : 'Add Blog Post'}
                </h2>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md cursor-pointer text-muted-foreground hover:text-foreground hover:bg-black/5 transition-colors outline-none focus:outline-none"
            >
              <X className="size-4" />
            </button>
          </div>
          
          <div className="flex px-4 pt-2 bg-muted border-b border-border gap-1 items-end">
            <button
              onClick={() => setActiveTab('basic')}
              className={cn(
                "inline-flex shrink-0 items-center justify-center h-8 px-4 text-[11px] font-medium transition-all relative rounded-t-[10px] select-none border-t border-l border-r outline-none focus:outline-none focus:ring-0",
                activeTab === 'basic' 
                  ? "bg-card text-foreground border-border z-10 -mb-[1px]" 
                  : "bg-transparent text-muted-foreground border-transparent hover:bg-foreground/5 hover:text-foreground border-b-transparent"
              )}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={cn(
                "inline-flex shrink-0 items-center justify-center h-8 px-4 text-[11px] font-medium transition-all relative rounded-t-[10px] select-none border-t border-l border-r outline-none focus:outline-none focus:ring-0",
                activeTab === 'content' 
                  ? "bg-card text-foreground border-border z-10 -mb-[1px]" 
                  : "bg-transparent text-muted-foreground border-transparent hover:bg-foreground/5 hover:text-foreground border-b-transparent"
              )}
            >
              Content
            </button>
          </div>
          
          {/* Modal Body */}
          <form id="blog-form" onSubmit={handleSubmit} className="flex flex-col min-h-0">
            <div className="p-5 overflow-y-auto max-h-[calc(100vh-200px)]">
              {error && <div className="mb-4 p-2 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>}
              
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Title *</label>
                      <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="My Awesome Post" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Slug *</label>
                      <input required type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="my-awesome-post" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Author</label>
                      <input type="text" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Cover Image URL</label>
                      <input type="url" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="https://..." />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.isPublished} onChange={e => setFormData({...formData, isPublished: e.target.checked})} className="rounded border-border text-primary focus:ring-primary bg-background" />
                      <span className="text-[13px] font-medium">Published</span>
                    </label>
                  </div>
                </div>
              )}
              
              {activeTab === 'content' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Content</label>
                    <textarea rows={12} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full p-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-y" placeholder="<p>Write your blog content here...</p>" />
                  </div>
                </div>
              )}
            </div>
          </form>
          
          {/* Footer */}
          <div className="p-4 border-t border-border/80 flex justify-end gap-2 bg-muted/20">
            <button type="button" onClick={() => setIsModalOpen(false)} className="h-8 px-4 rounded-md text-[12px] font-medium hover:bg-muted transition-colors">Cancel</button>
            <button form="blog-form" type="submit" disabled={isSubmitting} className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-[12px] font-medium shadow-sm hover:opacity-95 transition-all disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save Post'}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };


  return (
    <div className={PAGE_ROOT_CLASS}>
      <div className={PAGE_TOOLBAR_CLASS}>
        <div className={PAGE_TOOLBAR_ROW_CLASS}>
          <div className="flex w-full gap-2 md:max-w-xs items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Search blog posts..."
                className="w-full pl-8 pr-3 h-8 text-[13px] font-medium bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
          </div>
        </div>
        <button onClick={openAddModal} className="hidden md:block shrink-0 h-8 px-4 rounded-md bg-primary text-primary-foreground text-[12px] font-semibold shadow-sm hover:opacity-95 transition-all w-full lg:w-auto mt-2 lg:mt-0">
          New Post
        </button>
      </div>


      <div className={PAGE_LIST_BODY_CLASS}>
      {/* Desktop Table View */}
      <DataTableShell>
          <table className="w-full text-left border-collapse">
            <thead className={PAGE_TABLE_HEAD_CLASS}>
              <tr>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">Title</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground">Slug</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground w-24 text-center">Status</th>
                <th className="px-4 py-3 border-b border-border/80 font-medium text-[10px] uppercase tracking-wider text-muted-foreground text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-foreground">
              {loading ? (
                <Loading variant="table-row" colSpan={4} label="Loading blogs…" />
              ) : blogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    No blog posts found. Click "New Post" to create one.
                  </td>
                </tr>
              ) : (
                blogs.map(blog => (
                <tr key={blog._id} className="border-b border-border/40 hover:bg-muted/30 transition-colors last:border-0 group">
                  <td className="px-4 py-3 font-medium text-foreground">{blog.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">/{blog.slug}</td>
                  <td className="px-4 py-3 text-center">
                    {blog.isPublished ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-semibold uppercase tracking-wider">
                        <CheckCircle2 className="size-3" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] font-semibold uppercase tracking-wider">
                        <Clock className="size-3" /> Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(blog)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-muted/50" title="Edit blog post">
                        <Edit2 className="size-3.5" />
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setDeleteId(blog._id); }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10" title="Delete blog post">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
      </DataTableShell>

      {/* Mobile Card View */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto md:hidden">
        {loading ? (
          <Loading variant="panel" label="Loading blogs…" />
        ) : blogs.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground bg-card rounded-lg border border-border/80">
            No blog posts found. Click "New Post" to create one.
          </div>
        ) : (
          blogs.map((blog) => (
            <div 
              key={blog._id} 
              className="bg-card border border-border/80 rounded-xl p-3 shadow-sm flex items-start gap-3 relative group"
            >
              <div 
                className="absolute inset-0 z-0 cursor-pointer" 
                onClick={() => openEditModal(blog)}
              ></div>
              
              {/* Info */}
              <div className="flex-1 min-w-0 py-0.5 relative z-10 pointer-events-none">
                <div className="font-semibold text-[13px] text-foreground truncate pr-6">{blog.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">/{blog.slug}</div>
                
                <div className="flex items-center justify-between mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    blog.isPublished 
                      ? 'bg-green-500/10 text-green-500' 
                      : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {blog.isPublished ? 'Published' : 'Draft'}
                  </span>
                  {blog.publishedAt && (
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(blog.publishedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Delete Button */}
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setDeleteId(blog._id); }}
                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10 z-10"
              >
                <X className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Mobile Floating Action Button */}
      <button
        onClick={openAddModal}
        className="md:hidden fixed bottom-6 right-6 z-40 size-14 bg-primary text-primary-foreground rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex items-center justify-center hover:scale-105 hover:-translate-y-1 active:scale-95 transition-all duration-200"
      >
        <Plus className="size-6" strokeWidth={2.5} />
      </button>

      {renderModal()}
      
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Blog Post"
        message="Are you sure you want to delete this blog post? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
}

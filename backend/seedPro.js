import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Banner, Blog } from './models/CmsModels.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/e-commerce');

const bannerImages = [
  'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1434389678278-f8fd26514749?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop'
];

const banners = [
  { title: 'The Spring Collection 2024', image: bannerImages[0], linkUrl: '/categories/spring', sortOrder: 1, isActive: true },
  { title: 'Minimalist Essentials', image: bannerImages[1], linkUrl: '/categories/essentials', sortOrder: 2, isActive: true },
  { title: 'Mid-Season Sale: Up to 50% Off', image: bannerImages[2], linkUrl: '/categories/sale', sortOrder: 3, isActive: true },
  { title: 'New Arrivals: Tech & Lifestyle', image: bannerImages[3], linkUrl: '/categories/tech', sortOrder: 4, isActive: true },
  { title: 'Winter Wardrobe Essentials', image: bannerImages[4], linkUrl: '/categories/winter', sortOrder: 5, isActive: true }
];

const blogImages = [
  'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1584308972274-14b3017fc29a?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1434389678278-f8fd26514749?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1485230895905-ef37f191b988?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=2071&auto=format&fit=crop'
];

const blogs = [];
for (let i = 1; i <= 20; i++) {
  blogs.push({
    title: `Premium Blog Post ${i}: Mastering the Lifestyle`,
    slug: `premium-blog-post-${i}`,
    content: `
      <p>This is the content for our premium blog post ${i}. In a world of fast fashion and rapidly changing trends, building a wardrobe based on the principles of essentialism is more relevant than ever.</p>
      <h3>Quality Over Quantity</h3>
      <p>When you invest in high-quality staples, you're not just buying a piece of clothing; you're buying longevity. A well-crafted trench coat or a perfectly tailored white shirt can serve as the foundation of countless outfits for years to come.</p>
    `,
    coverImage: blogImages[i % blogImages.length],
    author: 'Admin',
    isPublished: true,
    publishedAt: new Date(new Date().setDate(new Date().getDate() - i))
  });
}

const seedData = async () => {
  try {
    await Banner.deleteMany();
    await Blog.deleteMany();

    await Banner.insertMany(banners);
    await Blog.insertMany(blogs);

    console.log('Seeded 5 Banners and 20 Blogs with premium images!');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

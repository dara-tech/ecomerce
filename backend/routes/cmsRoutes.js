import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { Banner, Page, Faq, Blog } from '../models/CmsModels.js';

const router = express.Router();

// ---------------------------
// BANNER ROUTES
// ---------------------------
router.get('/banners', async (req, res) => {
  try {
    const banners = await Banner.find({}).sort({ sortOrder: 1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/banners', protect, admin, async (req, res) => {
  try {
    const banner = new Banner(req.body);
    const createdBanner = await banner.save();
    res.status(201).json(createdBanner);
  } catch (error) {
    res.status(400).json({ message: 'Invalid banner data' });
  }
});

router.put('/banners/:id', protect, admin, async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (banner) {
      res.json(banner);
    } else {
      res.status(404).json({ message: 'Banner not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Invalid data' });
  }
});

router.delete('/banners/:id', protect, admin, async (req, res) => {
  console.log(`DELETE /banners/${req.params.id} called by user ${req.user._id}`);
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (banner) {
      res.json({ message: 'Banner removed' });
    } else {
      res.status(404).json({ message: 'Banner not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// ---------------------------
// PAGE ROUTES (About, Privacy, Terms)
// ---------------------------
router.get('/pages', async (req, res) => {
  try {
    const pages = await Page.find({});
    res.json(pages);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/pages/:slug', async (req, res) => {
  try {
    const page = await Page.findOne({ slug: req.params.slug });
    if (page) {
      res.json(page);
    } else {
      res.status(404).json({ message: 'Page not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/pages', protect, admin, async (req, res) => {
  try {
    const page = new Page(req.body);
    const createdPage = await page.save();
    res.status(201).json(createdPage);
  } catch (error) {
    res.status(400).json({ message: 'Invalid page data (check for duplicate slug)' });
  }
});

router.put('/pages/:id', protect, admin, async (req, res) => {
  try {
    const page = await Page.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (page) {
      res.json(page);
    } else {
      res.status(404).json({ message: 'Page not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Invalid data' });
  }
});

router.delete('/pages/:id', protect, admin, async (req, res) => {
  try {
    const page = await Page.findByIdAndDelete(req.params.id);
    if (page) {
      res.json({ message: 'Page removed' });
    } else {
      res.status(404).json({ message: 'Page not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// ---------------------------
// FAQ ROUTES
// ---------------------------
router.get('/faqs', async (req, res) => {
  try {
    const faqs = await Faq.find({}).sort({ sortOrder: 1 });
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/faqs', protect, admin, async (req, res) => {
  try {
    const faq = new Faq(req.body);
    const createdFaq = await faq.save();
    res.status(201).json(createdFaq);
  } catch (error) {
    res.status(400).json({ message: 'Invalid faq data' });
  }
});

router.put('/faqs/:id', protect, admin, async (req, res) => {
  try {
    const faq = await Faq.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (faq) {
      res.json(faq);
    } else {
      res.status(404).json({ message: 'FAQ not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Invalid data' });
  }
});

router.delete('/faqs/:id', protect, admin, async (req, res) => {
  try {
    const faq = await Faq.findByIdAndDelete(req.params.id);
    if (faq) {
      res.json({ message: 'FAQ removed' });
    } else {
      res.status(404).json({ message: 'FAQ not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// ---------------------------
// BLOG ROUTES
// ---------------------------
router.get('/blogs', async (req, res) => {
  try {
    // If not admin, only fetch published blogs
    const filter = req.user && req.user.role === 'admin' ? {} : { isPublished: true };
    const blogs = await Blog.find(filter).sort({ publishedAt: -1, createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/blogs/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (blog) {
      // If not admin and not published, hide it
      if (!blog.isPublished && (!req.user || req.user.role !== 'admin')) {
        return res.status(404).json({ message: 'Blog not found' });
      }
      res.json(blog);
    } else {
      res.status(404).json({ message: 'Blog not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/blogs', protect, admin, async (req, res) => {
  try {
    if (req.body.isPublished && !req.body.publishedAt) {
      req.body.publishedAt = Date.now();
    }
    const blog = new Blog(req.body);
    const createdBlog = await blog.save();
    res.status(201).json(createdBlog);
  } catch (error) {
    res.status(400).json({ message: 'Invalid blog data (check for duplicate slug)' });
  }
});

router.put('/blogs/:id', protect, admin, async (req, res) => {
  try {
    const blogToUpdate = await Blog.findById(req.params.id);
    if (blogToUpdate) {
      // If turning on publish flag, set publishedAt
      if (req.body.isPublished && !blogToUpdate.isPublished && !blogToUpdate.publishedAt) {
        req.body.publishedAt = Date.now();
      }
      const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updatedBlog);
    } else {
      res.status(404).json({ message: 'Blog not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Invalid data' });
  }
});

router.delete('/blogs/:id', protect, admin, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (blog) {
      res.json({ message: 'Blog removed' });
    } else {
      res.status(404).json({ message: 'Blog not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;

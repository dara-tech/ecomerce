import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Banner, Page, Faq, Blog } from './models/CmsModels.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/e-commerce');

const banners = [
  {
    title: 'The Spring Collection 2024',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop',
    linkUrl: '/categories/spring',
    sortOrder: 1,
    isActive: true
  },
  {
    title: 'Minimalist Essentials',
    image: 'https://images.unsplash.com/photo-1434389678278-f8fd26514749?q=80&w=2070&auto=format&fit=crop',
    linkUrl: '/categories/essentials',
    sortOrder: 2,
    isActive: true
  },
  {
    title: 'Mid-Season Sale: Up to 50% Off',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop',
    linkUrl: '/categories/sale',
    sortOrder: 3,
    isActive: true
  }
];

const pages = [
  {
    title: 'About Us',
    slug: 'about',
    content: `
      <h2>The LUMINA Philosophy</h2>
      <p>Founded in 2024, LUMINA was born out of a desire to create a more mindful approach to modern consumerism. We believe that the objects we bring into our lives should serve a purpose, inspire calm, and stand the test of time.</p>
      
      <h3>Our Commitment to Quality</h3>
      <p>We work exclusively with artisans and manufacturers who share our dedication to exceptional craftsmanship. Every piece in our collection is rigorously tested for durability, functionality, and aesthetic timelessness.</p>
      
      <h3>Sustainable Practices</h3>
      <p>Sustainability isn't a buzzword for us; it's a foundational principle. From ethically sourced materials to zero-waste packaging initiatives, we are constantly striving to minimize our environmental footprint while maximizing the positive impact we have on our communities.</p>
    `,
    metaDescription: 'Learn about LUMINA\'s philosophy, commitment to quality, and sustainable practices.',
    isPublished: true
  },
  {
    title: 'Privacy Policy',
    slug: 'privacy',
    content: `
      <h2>Privacy Policy</h2>
      <p><strong>Last Updated: June 2024</strong></p>
      <p>At LUMINA, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.</p>
      
      <h3>1. Information We Collect</h3>
      <p>We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products, or when you participate in activities on the website.</p>
      
      <h3>2. How We Use Your Information</h3>
      <p>We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>
      
      <h3>3. Will Your Information Be Shared With Anyone?</h3>
      <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.</p>
    `,
    metaDescription: 'LUMINA Privacy Policy and Data Protection guidelines.',
    isPublished: true
  },
  {
    title: 'Terms of Service',
    slug: 'terms',
    content: `
      <h2>Terms of Service</h2>
      <p>Welcome to LUMINA. By accessing or using our website, you agree to be bound by these Terms of Service.</p>
      
      <h3>1. Use of the Site</h3>
      <p>You may use our site for lawful purposes only. You must not use our site in any way that causes, or may cause, damage to the site or impairment of the availability or accessibility of the site.</p>
      
      <h3>2. Products and Pricing</h3>
      <p>All products are subject to availability. We reserve the right to discontinue any product at any time. Prices for all products are subject to change.</p>
      
      <h3>3. Shipping and Delivery</h3>
      <p>We aim to deliver products within the estimated timeframes; however, delays are occasionally inevitable due to unforeseen factors.</p>
    `,
    metaDescription: 'LUMINA Terms of Service and User Agreement.',
    isPublished: true
  },
  {
    title: 'Contact Us',
    slug: 'contact',
    content: `
      <h2>Get in Touch</h2>
      <p>We're here to help! Whether you have a question about our products, need assistance with an order, or just want to say hello, we'd love to hear from you.</p>
      
      <h3>Customer Support</h3>
      <p>Email: support@luminastore.com<br>
      Phone: 1-800-555-0199<br>
      Hours: Monday - Friday, 9am - 5pm EST</p>
      
      <h3>Headquarters</h3>
      <p>123 Minimalist Way<br>
      Suite 400<br>
      New York, NY 10001</p>
    `,
    metaDescription: 'Contact LUMINA customer support.',
    isPublished: true
  }
];

const faqs = [
  {
    question: 'How long does standard shipping take?',
    answer: 'Our standard shipping typically takes 3-5 business days within the contiguous United States. For international orders, standard shipping usually takes 7-14 business days depending on customs processing in your country.',
    sortOrder: 1,
    isActive: true
  },
  {
    question: 'Do you offer expedited shipping options?',
    answer: 'Yes! At checkout, you can select Express Shipping (2-3 business days) or Next-Day Delivery (1 business day) for an additional fee. Please note that Next-Day Delivery orders must be placed before 2 PM EST to ship the same day.',
    sortOrder: 2,
    isActive: true
  },
  {
    question: 'What is your return and exchange policy?',
    answer: 'We want you to be completely satisfied with your purchase. We accept returns and exchanges within 30 days of the delivery date. Items must be unworn, unwashed, and in their original packaging with all tags attached. Return shipping is free for domestic orders.',
    sortOrder: 3,
    isActive: true
  },
  {
    question: 'How do I track my order?',
    answer: 'Once your order ships, you will receive a confirmation email containing a tracking number and a link to track your package. You can also view your order status by logging into your LUMINA account and visiting the "Order History" section.',
    sortOrder: 4,
    isActive: true
  },
  {
    question: 'Are your products sustainably made?',
    answer: 'Yes. Sustainability is core to our brand. We use organic cotton, recycled polyester, and ethically sourced materials. All our packaging is 100% recyclable or compostable, and we offset the carbon emissions of our shipping.',
    sortOrder: 5,
    isActive: true
  },
  {
    question: 'Do you restock sold-out items?',
    answer: 'We do our best to restock popular core items within 2-4 weeks. However, seasonal collections are often limited edition and may not be restocked. We recommend signing up for restock notifications on the product page.',
    sortOrder: 6,
    isActive: true
  }
];

const blogs = [
  {
    title: 'The Art of Essentialism in Modern Wardrobes',
    slug: 'art-of-essentialism',
    content: `
      <p>In a world of fast fashion and rapidly changing trends, building a wardrobe based on the principles of essentialism is more relevant than ever.</p>
      
      <p>Essentialism isn't just about owning fewer things; it's about owning the <em>right</em> things. It's the disciplined pursuit of less, but better.</p>
      
      <h3>Quality Over Quantity</h3>
      <p>When you invest in high-quality staples, you're not just buying a piece of clothing; you're buying longevity. A well-crafted trench coat or a perfectly tailored white shirt can serve as the foundation of countless outfits for years to come.</p>
      
      <h3>The Color Palette</h3>
      <p>A minimalist wardrobe thrives on a cohesive color palette. By anchoring your wardrobe in neutrals—blacks, whites, grays, and navies—you ensure that almost every piece can be mixed and matched effortlessly.</p>
      
      <p>Embracing essentialism is a journey. Start by decluttering, identifying your personal uniform, and gradually replacing fast-fashion items with enduring classics.</p>
    `,
    coverImage: 'https://images.unsplash.com/photo-1434389678278-f8fd26514749?q=80&w=2070&auto=format&fit=crop',
    author: 'Elena Rostova',
    isPublished: true,
    publishedAt: new Date(new Date().setDate(new Date().getDate() - 5))
  },
  {
    title: 'Sustainable Fabrics: What You Need to Know',
    slug: 'sustainable-fabrics-guide',
    content: `
      <p>As consumers become more environmentally conscious, the demand for sustainable fabrics is skyrocketing. But with so many terms being thrown around, it can be hard to know what's truly eco-friendly.</p>
      
      <h3>Organic Cotton</h3>
      <p>Unlike conventional cotton, organic cotton is grown without harmful synthetic pesticides and fertilizers. This not only protects the soil and water but also provides a safer environment for farmers.</p>
      
      <h3>Tencel (Lyocell)</h3>
      <p>Tencel is a sustainable fabric regenerated from wood cellulose, primarily from eucalyptus trees. It's produced in a closed-loop system where 99% of the water and solvents used are recycled.</p>
      
      <h3>Recycled Polyester</h3>
      <p>By transforming post-consumer plastic bottles into fibers, recycled polyester reduces reliance on petroleum as a raw material and keeps plastic out of landfills and oceans.</p>
      
      <p>At LUMINA, we are committed to transparency in our supply chain and proudly utilize these materials in our core collections.</p>
    `,
    coverImage: 'https://images.unsplash.com/photo-1584308972274-14b3017fc29a?q=80&w=2070&auto=format&fit=crop',
    author: 'Marcus Chen',
    isPublished: true,
    publishedAt: new Date(new Date().setDate(new Date().getDate() - 12))
  },
  {
    title: 'Curating the Perfect Minimalist Workspace',
    slug: 'minimalist-workspace-curation',
    content: `
      <p>Your environment profoundly impacts your focus and productivity. A cluttered desk often leads to a cluttered mind. Here's how to design a minimalist workspace that inspires creativity and calm.</p>
      
      <h3>The Essentials Only</h3>
      <p>Clear everything off your desk. Slowly add back only what you use daily: your computer, a notebook, a pen, and perhaps one inspiring object or plant. Everything else should be stored out of sight.</p>
      
      <h3>Cable Management</h3>
      <p>Visible cables create visual noise. Invest in cable sleeves or under-desk trays to keep wires hidden. It’s a small change that makes a massive difference in the sleekness of your setup.</p>
      
      <h3>Natural Lighting</h3>
      <p>Whenever possible, position your desk near a window. Natural light not only reduces eye strain but also boosts mood and energy levels throughout the workday.</p>
    `,
    coverImage: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=2070&auto=format&fit=crop',
    author: 'Sarah Jenkins',
    isPublished: true,
    publishedAt: new Date(new Date().setDate(new Date().getDate() - 20))
  },
  {
    title: 'A Guide to Seasonal Wardrobe Transitions',
    slug: 'seasonal-wardrobe-transitions',
    content: `
      <p>Transitioning your wardrobe between seasons doesn't require a complete overhaul. With the right foundational pieces, you can easily adapt your style for changing weather.</p>
      
      <h3>Layering is Key</h3>
      <p>The secret to transitional dressing is intelligent layering. A lightweight merino wool sweater worn over a crisp t-shirt can easily be removed when the afternoon sun hits.</p>
      
      <h3>Transitional Footwear</h3>
      <p>Swap out heavy winter boots for sleek loafers or minimalist white sneakers. These versatile options pair well with both transitional outerwear and lighter summer fabrics.</p>
      
      <p>Remember, the goal is versatility. By investing in trans-seasonal pieces, you maximize your wardrobe's potential and reduce unnecessary consumption.</p>
    `,
    coverImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop',
    author: 'Elena Rostova',
    isPublished: true,
    publishedAt: new Date(new Date().setDate(new Date().getDate() - 45))
  }
];

const seedData = async () => {
  try {
    await Banner.deleteMany();
    await Page.deleteMany();
    await Faq.deleteMany();
    await Blog.deleteMany();

    await Banner.insertMany(banners);
    await Page.insertMany(pages);
    await Faq.insertMany(faqs);
    await Blog.insertMany(blogs);

    console.log('Pro CMS Data Seeded!');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

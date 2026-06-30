import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import User from './models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/e-commerce';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB for Seeding Products'))
  .catch(err => {
    console.error('Could not connect to MongoDB', err);
    process.exit(1);
  });

const generateProducts = (adminId) => {
  const products = [];
  const categories = ['Electronics', 'Clothing', 'Home', 'Accessories', 'Beauty'];
  const brands = ['Apple', 'Sony', 'Nike', 'Adidas', 'Samsung', 'LG', 'Dyson', 'Bose'];
  
  const sampleImages = [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800', // Watch
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800', // Headphones
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800', // Shoes
    'https://images.unsplash.com/photo-1572569433602-663f707f4a21?auto=format&fit=crop&q=80&w=800', // Watch 2
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=800', // Earbuds
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800', // Camera
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&q=80&w=800', // Headphone 2
    'https://images.unsplash.com/photo-1610438235354-a6ae5528385c?auto=format&fit=crop&q=80&w=800', // Mechanical Keyboard
  ];

  for (let i = 1; i <= 40; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const image = sampleImages[Math.floor(Math.random() * sampleImages.length)];
    
    products.push({
      user: adminId,
      name: `Premium ${brand} ${category} Item ${i}`,
      image: image,
      description: `This is an amazing premium product from ${brand} in the ${category} category. It features high quality materials and exceptional design.`,
      brand: brand,
      category: category,
      price: Number((Math.random() * 500 + 20).toFixed(2)),
      countInStock: Math.floor(Math.random() * 50),
      rating: Number((Math.random() * 2 + 3).toFixed(1)),
      numReviews: Math.floor(Math.random() * 100),
    });
  }
  
  return products;
};

const seedDatabase = async () => {
  try {
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.error('No admin user found! Please run node seedUser.js first.');
      process.exit(1);
    }

    const adminId = adminUser._id;
    const existing = await Product.countDocuments();
    if (existing >= 45) {
      console.log(`Skipping extra products (${existing} already in DB)`);
      process.exit(0);
    }

    const newProducts = generateProducts(adminId);

    // We do NOT delete existing products, we just insert the 40 new ones
    await Product.insertMany(newProducts);
    
    console.log(`Successfully seeded 40 additional Products with real images!`);
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDatabase();

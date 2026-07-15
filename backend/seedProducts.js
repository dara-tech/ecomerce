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

const seedDatabase = async () => {
  try {
    // Find vendors
    const vendor1 = await User.findOne({ email: 'techhaven@demo.com' });
    const vendor2 = await User.findOne({ email: 'fashion@demo.com' });
    
    if (!vendor1 || !vendor2) {
      console.error('Vendors not found! Please run node seedUser.js first.');
      process.exit(1);
    }

    const v1Id = vendor1._id;
    const v2Id = vendor2._id;

    // Fetch Stores
    const { Store } = await import('./models/Store.js');
    const store1 = await Store.findOne({ vendor: v1Id });
    const store2 = await Store.findOne({ vendor: v2Id });

    if (!store1 || !store2) {
      console.error('Stores not found! Please run node seedUser.js first.');
      process.exit(1);
    }

    const s1Id = store1._id;
    const s2Id = store2._id;

    const products = [
      {
        user: v1Id,
        store: s1Id,
        name: 'Airpods Wireless Bluetooth Headphones',
        image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&q=80&w=800',
        description: 'Bluetooth technology lets you connect it with compatible devices wirelessly. High-quality audio offers an immersive listening experience.',
        brand: 'Apple',
        category: 'Electronics',
        price: 89.99,
        countInStock: 10,
        rating: 4.5,
        numReviews: 12,
      },
      {
        user: v1Id,
        store: s1Id,
        name: 'iPhone 13 Pro 256GB Memory',
        image: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&q=80&w=800',
        description: 'Introducing the iPhone 13 Pro. A transformative triple-camera system that adds tons of capability without complexity.',
        brand: 'Apple',
        category: 'Electronics',
        price: 1099.99,
        countInStock: 7,
        rating: 4.8,
        numReviews: 8,
      },
      {
        user: v1Id,
        store: s1Id,
        name: 'Cannon EOS 80D DSLR Camera',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
        description: 'Characterized by versatile imaging specs, the Canon EOS 80D further clarifies itself using a pair of robust focusing systems and an intuitive design.',
        brand: 'Sony',
        category: 'Electronics',
        price: 929.99,
        countInStock: 5,
        rating: 3.5,
        numReviews: 3,
      },
      {
        user: v1Id,
        store: s1Id,
        name: 'Sony Playstation 5',
        image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=800',
        description: 'The ultimate home entertainment center starts with PlayStation. Whether you are into gaming, HD movies, television, music',
        brand: 'Sony',
        category: 'Electronics',
        price: 499.99,
        countInStock: 11,
        rating: 5,
        numReviews: 24,
      },
      {
        user: v1Id,
        store: s1Id,
        name: 'Nike Air Max 270 React',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
        description: 'Get ready for maximum comfort. Nike Air Max 270 features Nike’s biggest heel Air unit yet for a super-soft ride.',
        brand: 'Nike',
        category: 'Clothing',
        price: 150.00,
        countInStock: 25,
        rating: 4.2,
        numReviews: 9,
      },
      {
        user: v1Id,
        store: s1Id,
        name: 'Adidas Ultraboost 22',
        image: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&q=80&w=800',
        description: 'Say hello to incredible energy return. These running shoes have a Linear Energy Push system for a responsive ride.',
        brand: 'Adidas',
        category: 'Clothing',
        price: 190.00,
        countInStock: 15,
        rating: 4.6,
        numReviews: 18,
      },
    ];

    await Product.deleteMany();
    await Product.insertMany(products);
    
    console.log('Successfully seeded Products with real images!');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDatabase();

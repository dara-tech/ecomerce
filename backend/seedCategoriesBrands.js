import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './models/Category.js';
import Brand from './models/Brand.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/e-commerce';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB for Seeding'))
  .catch(err => {
    console.error('Could not connect to MongoDB', err);
    process.exit(1);
  });

const categories = [
  { name: 'Electronics', description: 'Gadgets, phones, and computers' },
  { name: 'Clothing', description: 'Apparel for men and women' },
  { name: 'Home & Garden', description: 'Furniture, decor, and tools' },
  { name: 'Sports', description: 'Sporting goods and outdoor equipment' },
  { name: 'Toys', description: 'Toys, games, and entertainment' },
];

const brands = [
  { name: 'Apple', description: 'Consumer electronics and software' },
  { name: 'Samsung', description: 'Smartphones, TVs, and appliances' },
  { name: 'Nike', description: 'Athletic footwear and apparel' },
  { name: 'Adidas', description: 'Sportswear and accessories' },
  { name: 'Sony', description: 'PlayStation, TVs, and audio' },
];

const seedDatabase = async () => {
  try {
    // Clear existing data (optional, but good for a fresh seed)
    await Category.deleteMany();
    await Brand.deleteMany();
    
    // Insert new data
    await Category.insertMany(categories);
    await Brand.insertMany(brands);
    
    console.log('Successfully seeded Categories and Brands!');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDatabase();

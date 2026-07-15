import Product from '../models/Product.js';

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  const pageSize = Number(req.query.pageSize) || 10;
  const page = Number(req.query.pageNumber) || 1;
  const keyword = req.query.keyword
    ? { name: { $regex: req.query.keyword, $options: 'i' } }
    : {};
    
  const categoryFilter = req.query.category && req.query.category !== 'all'
    ? { category: req.query.category }
    : {};
    
  const brandFilter = req.query.brand && req.query.brand !== 'all'
    ? { brand: req.query.brand }
    : {};

  const storeFilter = req.query.store
    ? { store: req.query.store }
    : {};

  const isVendor = req.user && req.user.role === 'vendor';
  let vendorQuery = {};
  if (isVendor) {
    const { Store } = await import('../models/Store.js');
    const store = await Store.findOne({ vendor: req.user._id });
    vendorQuery = { store: store ? store._id : null };
  }

  const query = { ...keyword, ...categoryFilter, ...brandFilter, ...storeFilter, ...vendorQuery };
  
  let sortQuery = { createdAt: -1 }; // Default: Newest
  if (req.query.sort) {
    if (req.query.sort === 'price-asc') sortQuery = { price: 1 };
    else if (req.query.sort === 'price-desc') sortQuery = { price: -1 };
    else if (req.query.sort === 'oldest') sortQuery = { createdAt: 1 };
  }

  const count = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('store', 'name logo')
    .sort(sortQuery)
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ products, page, pages: Math.ceil(count / pageSize), total: count });
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id).populate('store', 'name logo');

  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  const { name, price, description, image, brand, category, countInStock } = req.body || {};
  
  let storeId = null;
  if (req.user.role === 'vendor') {
    const { Store } = await import('../models/Store.js');
    const store = await Store.findOne({ vendor: req.user._id });
    if (store) storeId = store._id;
  }

  const product = new Product({
    name: name || 'Sample name',
    price: price || 0,
    user: req.user._id,
    store: storeId,
    image: image || '/images/sample.jpg',
    brand: brand || 'Sample brand',
    category: category || 'Sample category',
    countInStock: countInStock || 0,
    numReviews: 0,
    description: description || 'Sample description',
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  const { name, price, description, image, brand, category, countInStock } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name || product.name;
    product.price = price || product.price;
    product.description = description || product.description;
    product.image = image || product.image;
    product.brand = brand || product.brand;
    product.category = category || product.category;
    product.countInStock = countInStock || product.countInStock;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await Product.deleteOne({ _id: product._id });
    res.json({ message: 'Product removed' });
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
};

import Brand from '../models/Brand.js';

// @desc    Get all brands
// @route   GET /api/brands
// @access  Private/Admin
export const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find({}).sort({ name: 1 });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch brands' });
  }
};

// @desc    Create a brand
// @route   POST /api/brands
// @access  Private/Admin
export const createBrand = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const brandExists = await Brand.findOne({ name });
    if (brandExists) {
      return res.status(400).json({ message: 'Brand already exists' });
    }

    const brand = await Brand.create({ name, description });
    res.status(201).json(brand);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create brand' });
  }
};

export const updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ message: 'Brand not found' });

    if (req.body.name) brand.name = req.body.name;
    if (req.body.description !== undefined) brand.description = req.body.description;
    await brand.save();
    res.json(brand);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to update brand' });
  }
};

// @desc    Delete a brand
// @route   DELETE /api/brands/:id
// @access  Private/Admin
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    
    await Brand.deleteOne({ _id: brand._id });
    res.json({ message: 'Brand removed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete brand' });
  }
};

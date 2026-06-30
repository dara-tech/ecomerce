import Category from '../models/Category.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private/Admin
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'name',
          foreignField: 'category',
          as: 'products',
        },
      },
      {
        $addFields: {
          productCount: { $size: '$products' },
        },
      },
      {
        $project: {
          products: 0,
        },
      },
      {
        $sort: { name: 1 },
      },
    ]);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create({ name, description });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create category' });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    await Category.deleteOne({ _id: category._id });
    res.json({ message: 'Category removed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete category' });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res) => {
  try {
    const { name, description, icon, isActive } = req.body;
    
    const category = await Category.findById(req.params.id);

    if (category) {
      category.name = name || category.name;
      category.description = description !== undefined ? description : category.description;
      category.icon = icon !== undefined ? icon : category.icon;
      category.isActive = isActive !== undefined ? isActive : category.isActive;

      const updatedCategory = await category.save();
      res.json(updatedCategory);
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to update category' });
  }
};

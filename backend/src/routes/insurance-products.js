const express = require('express');
const InsuranceProduct = require('../models/InsuranceProduct');

const router = express.Router();

// Get all insurance products
router.get('/', async (req, res) => {
  try {
    const products = await InsuranceProduct.getAll();
    res.json(products);
  } catch (error) {
    console.error('Error fetching insurance products:', error);
    res.status(500).json({ error: 'Failed to fetch insurance products' });
  }
});

// Get insurance types (for first dropdown)
router.get('/types', async (req, res) => {
  try {
    const types = await InsuranceProduct.getInsuranceTypes();
    res.json(types);
  } catch (error) {
    console.error('Error fetching insurance types:', error);
    res.status(500).json({ error: 'Failed to fetch insurance types' });
  }
});

// Get class of business by insurance type (for second dropdown)
router.get('/by-type/:insuranceType', async (req, res) => {
  try {
    const { insuranceType } = req.params;
    const products = await InsuranceProduct.getByInsuranceType(decodeURIComponent(insuranceType));
    res.json(products);
  } catch (error) {
    console.error('Error fetching products by type:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create new insurance product
router.post('/', async (req, res) => {
  try {
    const { insurance_type, class_of_business, description, commission_rate } = req.body;
    
    if (!insurance_type || !class_of_business) {
      return res.status(400).json({ error: 'Insurance type and class of business are required' });
    }

    const product = await InsuranceProduct.create({
      insurance_type,
      class_of_business,
      description,
      commission_rate: commission_rate || 0,
      is_active: true
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating insurance product:', error);
    res.status(500).json({ error: 'Failed to create insurance product' });
  }
});

// Update insurance product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await InsuranceProduct.update(id, req.body);
    res.json(product);
  } catch (error) {
    console.error('Error updating insurance product:', error);
    res.status(500).json({ error: 'Failed to update insurance product' });
  }
});

// Delete insurance product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await InsuranceProduct.delete(id);
    res.json({ message: 'Insurance product deleted' });
  } catch (error) {
    console.error('Error deleting insurance product:', error);
    res.status(500).json({ error: 'Failed to delete insurance product' });
  }
});

module.exports = router;

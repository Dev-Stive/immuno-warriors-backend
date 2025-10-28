const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const {
  addInventoryItem,
  getInventoryItem,
  getUserInventory,
  updateInventoryItem,
  deleteInventoryItem,
} = require('../controllers/inventoryController');

router.use(authenticate);

router.post('/', addInventoryItem);
router.get('/:itemId', getInventoryItem);
router.get('/', getUserInventory);
router.put('/:itemId', updateInventoryItem);
router.delete('/:itemId', deleteInventoryItem);

module.exports = router;

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const {
  getProfile,
  updateProfile,
  addResources,
  getResources,
  addInventoryItem,
  removeInventoryItem,
  getInventory,
  updateSettings,
  getSettings,
  deleteUser,
} = require('../controllers/userController');

router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/resources', addResources);
router.get('/resources', getResources);
router.post('/inventory', addInventoryItem);
router.delete('/inventory/:itemId', removeInventoryItem);
router.get('/inventory', getInventory);
router.put('/settings', updateSettings);
router.get('/settings', getSettings);
router.delete('/', deleteUser);

module.exports = router;
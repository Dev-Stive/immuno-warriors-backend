const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const {
  createPathogen,
  getPathogensByType,
  getPathogensByRarity,
  updatePathogenStats,
  getAllPathogens,
  deletePathogen,
} = require('../controllers/pathogenController');

router.use(authenticate);

router.post('/', createPathogen);
router.get('/type/:type', getPathogensByType);
router.get('/rarity/:rarity', getPathogensByRarity);
router.put('/:pathogenId/stats', updatePathogenStats);
router.get('/', getAllPathogens);
router.delete('/:pathogenId', deletePathogen);

module.exports = router;

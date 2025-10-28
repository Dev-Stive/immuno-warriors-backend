const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const {
  createBase,
  getBase,
  getPlayerBases,
  getAllBases,
  updateBase,
  deleteBase,
  addPathogen,
  removePathogen,
  updateDefenses,
  levelUpBase,
  validateForCombat,
} = require('../controllers/baseViraleController');

router.use(authenticate);

router.post('/', createBase);
router.get('/:baseId', getBase);
router.get('/player', getPlayerBases);
router.get('/', getAllBases);
router.put('/:baseId', updateBase);
router.delete('/:baseId', deleteBase);
router.post('/:baseId/pathogens', addPathogen);
router.delete('/:baseId/pathogens', removePathogen);
router.put('/:baseId/defenses', updateDefenses);
router.post('/:baseId/level-up', levelUpBase);
router.get('/:baseId/validate', validateForCombat);

module.exports = router;
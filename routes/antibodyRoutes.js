const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const {
  getAllAntibodies,
  createAntibody,
  getAntibody,
  getAntibodiesByType,
  updateAntibodyStats,
  deleteAntibody,
  assignSpecialAbility,
  simulateCombatEffect,
} = require('../controllers/antibodyController');

router.use(authenticate);

router.get('/', getAllAntibodies);
router.post('/', createAntibody);
router.get('/:antibodyId', getAntibody);
router.get('/type/:type', getAntibodiesByType);
router.put('/:antibodyId', updateAntibodyStats);
router.delete('/:antibodyId', deleteAntibody);
router.put('/:antibodyId/special-ability', assignSpecialAbility);
router.post('/:antibodyId/simulate', simulateCombatEffect);

module.exports = router;
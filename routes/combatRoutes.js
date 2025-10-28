const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const {
  startCombat,
  endCombat,
  getCombatReport,
  getCombatHistory,
  generateChronicle,
  getTacticalAdvice,
} = require('../controllers/combatController');

router.use(authenticate);

router.post('/', startCombat);
router.post('/:combatId/end', endCombat);
router.get('/:combatId', getCombatReport);
router.get('/history', getCombatHistory);
router.get('/:combatId/chronicle', generateChronicle);
router.get('/:combatId/advice', getTacticalAdvice);

module.exports = router;

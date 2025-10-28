const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const {
  chat,
  generateCombatChronicle,
  getTacticalAdvice,
  generateResearchDescription,
  generateBaseDescription,
  getStoredResponses,
} = require('../controllers/geminiController');

//router.use(authenticate);

router.post('/chat', chat);
router.get('/combat-chronicle/:combatId', generateCombatChronicle);
router.get('/tactical-advice/:combatId', getTacticalAdvice);
router.get('/research-description/:researchId', generateResearchDescription);
router.get('/base-description/:baseId', generateBaseDescription);
router.get('/stored-responses', getStoredResponses);

module.exports = router;

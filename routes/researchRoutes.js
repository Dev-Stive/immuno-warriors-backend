const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const {
  getResearchTree,
  getResearchProgress,
  unlockResearch,
  updateResearchProgress,
} = require('../controllers/researchController');

router.use(authenticate);

router.get('/tree', getResearchTree);
router.get('/progress', getResearchProgress);
router.post('/unlock', unlockResearch);
router.put('/node/:researchId', updateResearchProgress);

module.exports = router;


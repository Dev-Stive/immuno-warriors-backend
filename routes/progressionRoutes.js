const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const {
  getProgression,
  addXP,
  completeMission,
} = require('../controllers/progressionController');

router.use(authenticate);

router.get('/', getProgression);
router.post('/xp', addXP);
router.post('/mission/:missionId', completeMission);

module.exports = router;


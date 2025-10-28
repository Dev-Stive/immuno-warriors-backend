const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const {
  updateScore,
  getLeaderboard,
  getUserRank,
} = require('../controllers/leaderboardController');

router.use(authenticate);

router.post('/score', updateScore);
router.get('/:category', getLeaderboard);
router.get('/:category/rank', getUserRank);

module.exports = router;


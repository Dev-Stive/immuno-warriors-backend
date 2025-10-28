const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const {
  getAchievements,
  getAchievement,
  getUserAchievements,
  getAchievementsByCategory,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  unlockAchievement,
  updateAchievementProgress,
  claimReward,
  notifyAchievementUnlocked,
} = require('../controllers/achievementController');

router.use(authenticate);

router.get('/', getAchievements);
router.get('/:achievementId', getAchievement);
router.get('/user', getUserAchievements);
router.get('/category/:category', getAchievementsByCategory);
router.post('/', createAchievement);
router.put('/:achievementId', updateAchievement);
router.delete('/:achievementId', deleteAchievement);
router.post('/unlock', unlockAchievement);
router.put('/:achievementId/progress', updateAchievementProgress);
router.post('/claim', claimReward);
router.post('/:achievementId/notify', notifyAchievementUnlocked);

module.exports = router;

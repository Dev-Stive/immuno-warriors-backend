const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const {
  syncUserData,
  syncInventory,
  syncThreats,
  syncMemorySignatures,
  syncMultiplayerSessions,
  syncNotifications,
  syncPathogens,
  syncResearches,
} = require('../controllers/syncController');

router.use(authenticate);


router.post('/user-data', syncUserData);
router.post('/inventory', syncInventory);
router.post('/threats', syncThreats);
router.post('/memory-signatures', syncMemorySignatures);
router.post('/multiplayer-sessions', syncMultiplayerSessions);
router.post('/notifications', syncNotifications);
router.post('/pathogens', syncPathogens);
router.post('/researches', syncResearches);

module.exports = router;
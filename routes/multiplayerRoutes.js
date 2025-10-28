const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const {
  createSession,
  joinSession,
  getSessionStatus,
  getUserSessions,
} = require('../controllers/multiplayerController');

router.use(authenticate);

router.post('/', createSession);
router.post('/:sessionId/join', joinSession);
router.get('/:sessionId/status', getSessionStatus);
router.get('/', getUserSessions);

module.exports = router;

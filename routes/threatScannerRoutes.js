const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const {
  addThreat,
  getThreat,
  scanThreat,
} = require('../controllers/threatScannerController');

router.use(authenticate);

router.post('/', addThreat);
router.get('/:threatId', getThreat);
router.get('/scan/:targetId', scanThreat);

module.exports = router;


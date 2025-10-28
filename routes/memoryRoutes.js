const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const {
  addMemorySignature,
  getUserMemorySignatures,
  validateMemorySignature,
  clearExpiredSignatures,
} = require('../controllers/memoryController');

router.use(authenticate);

router.post('/', addMemorySignature);
router.get('/', getUserMemorySignatures);
router.get('/:signatureId/validate', validateMemorySignature);
router.delete('/expired', clearExpiredSignatures);

module.exports = router;
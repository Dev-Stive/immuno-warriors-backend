const express = require('express');
const router = express.Router();
const { signUp, signIn, signOut, verifyToken, refreshToken } = require('../controllers/authController');

router.get('/ok', (req, res) => res.json({ message: 'API ok Auth' }));
router.post('/sign-up', signUp);
router.post('/sign-in', signIn);
router.post('/refresh-token', refreshToken);
router.post('/sign-out', signOut);
router.get('/verify-token', verifyToken);

module.exports = router;

const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');
//protection
const verifyToken = require('../middleware/authMiddleware');

// POST /api/auth/sync — protected, must be logged in to sync
router.post('/sync', verifyToken, authController.syncUser);

module.exports = router;
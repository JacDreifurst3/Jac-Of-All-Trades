const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// Security protection
const verifyToken = require('../middleware/AuthMiddleware');

// Syncs a Firebase user with MongoDB after login
router.post('/sync', verifyToken, authController.syncUser);

module.exports = router;
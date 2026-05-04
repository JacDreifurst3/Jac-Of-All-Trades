const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
// Security protection
const verifyToken = require('../middleware/AuthMiddleware');

// Anyone can view a player's profile and stats
router.get('/:uid', userController.getProfile);

// Only the logged in user can update their own profile
router.patch('/:uid', verifyToken, userController.updateProfile);

// Only the logged in user can update their own stats
router.patch('/:uid/stats', verifyToken, userController.updateStats);

// Only the logged in user can delete their own account
router.delete('/:uid', verifyToken, userController.deleteAccount);

module.exports = router;
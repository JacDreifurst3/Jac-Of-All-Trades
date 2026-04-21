const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
//protection
const verifyToken = require('../middleware/authMiddleware');

// GET /api/users/leaderboard — public
router.get('/leaderboard', userController.getLeaderboard);

// GET /api/users/:uid — public, anyone can view a profile
router.get('/:uid', userController.getProfile);

// PATCH /api/users/:uid — protected, only logged in users can update
router.patch('/:uid', verifyToken, userController.updateProfile);

// PATCH /api/users/:uid/stats — protected
router.patch('/:uid/stats', verifyToken, userController.updateStats);

// DELETE /api/users/:uid — protected, delete own account
router.delete('/:uid', verifyToken, userController.deleteAccount);

module.exports = router;
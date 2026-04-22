const express = require('express');
const router = express.Router();
const gameService = require('../services/gameService');
const verifyToken = require('../middleware/authMiddleware');
const GameModel = require('../models/GameModel');

// Creates a new game instance and returns the lobby code
router.post('/create', async (req, res) => {
    const lobbyCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    await gameService.createGame(lobbyCode);
    res.status(201).json({ lobbyCode });
});

router.post('/join', async (req, res) => {
    const { lobbyCode } = req.body;
    const game = await gameService.getGame(lobbyCode);

    if (!game) {
        return res.status(404).json({ message: "Lobby not found" });
    }

    const redOccupied = !!game.players['RED'].socketId;
    const blueOccupied = !!game.players['BLUE'].socketId;

    if (redOccupied && blueOccupied) {
        return res.status(400).json({ message: "Lobby is full" });
    }

    res.json({ message: "Lobby found" });
});

// Verifies if a lobby exists
router.get('/check/:lobbyCode', async (req, res) => {
    const game = await gameService.getGame(req.params.lobbyCode);
    
    if (!game) {
        return res.status(404).json({ message: "Game not found" });
    }
    
    res.json({ status: "exists", gameOver: game.gameOver });
});

// Returns which color the current user is in a given game
router.get('/:lobbyCode/player-color', verifyToken, async (req, res) => {
    try {
        const game = await GameModel.findOne({ lobbyCode: req.params.lobbyCode });
        if (!game) return res.status(404).json({ message: "Game not found" });

        let color = null;
        if (game.players.RED.uid === req.uid) color = 'RED';
        else if (game.players.BLUE.uid === req.uid) color = 'BLUE';

        res.status(200).json({ color });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
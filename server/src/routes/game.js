const express = require('express');
const router = express.Router();
const gameService = require('../services/gameService');

// Creates a new game instance in memory and returns the ID
router.post('/create', (req, res) => {
    const lobbyCode = Math.random().toString(36).substring(2, 7).toUpperCase();

    
    // Initialize the Game class from gameService
    gameService.createGame(lobbyCode);
    
    res.status(201).json({ lobbyCode });
});

router.post('/join', (req, res) => {
    const { lobbyCode } = req.body;
    const game = gameService.getGame(lobbyCode);

    if (!game) {
        return res.status(404).json({ message: "Lobby not found" });
    }

    const redOccupied = !!game.players['RED'].socketId;
    const blueOccupied = !!game.players['BLUE'].socketId;

    if (redOccupied && blueOccupied) {
        return res.status(400).json({ message: "Lobby is full" });
    }

    res.json({ 
        message: "Lobby found", 
    });
});

// Verifies if a lobby exists
router.get('/check/:lobbyCode', (req, res) => {
    const game = gameService.getGame(req.params.lobbyCode);
    
    if (!game) {
        return res.status(404).json({ message: "Game not found" });
    }
    
    res.json({ status: "exists", gameOver: game.gameOver });
});

module.exports = router;
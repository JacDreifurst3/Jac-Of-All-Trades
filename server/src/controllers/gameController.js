const gameService = require("../services/gameService"); //this line will change when we use MONGO

exports.processMove = (req, res) => {
    const { gameId, fromX, fromY, toX, toY } = req.body;

    const gameInstance = gameService.getGame(gameId);

    if (!gameInstance) {
        return res.status(404).json({ error: "Game not found" });
    }

    try {
        const result = gameInstance.makeMove(fromX, fromY, toX, toY);

        // This returns logic back to react
        res.json({
            result: result,
            gameState: gameInstance.getGameState()
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
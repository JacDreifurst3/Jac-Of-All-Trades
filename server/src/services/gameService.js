//temp file to use as Database

const Game = require("../game/Game");

//temp database stored locally
const activeGames = new Map();

const gameService = {
    createGame: (gameId) => {
        const newGame = new Game();
        activeGames.set(gameId, newGame);
        return newGame;
    },

    getGame: (gameId) => {
        return activeGames.get(gameId);
    },

    deleteGame: (gameId) => {
        activeGames.delete(gameId);
    },

    getAllGameIds: () => {
        return Array.from(activeGames.keys());
    }
};

module.exports = gameService;
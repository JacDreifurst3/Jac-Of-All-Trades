const Game = require("../game/Game");
const GameModel = require("../models/GameModel");
const User = require("../models/UserModel");

const activeGames = new Map();

const gameService = {
    createGame: (lobbyCode) => {
        const newGame = new Game();
        activeGames.set(lobbyCode, newGame);
        return newGame;
    },

    getGame: (lobbyCode) => {
        return activeGames.get(lobbyCode);
    },

    deleteGame: (lobbyCode) => {
        activeGames.delete(lobbyCode);
    },

    getAllGameIds: () => {
        return Array.from(activeGames.keys());
    },

    // Called when a player joins — saves their UID to the game in MongoDB
    assignPlayerUID: async (lobbyCode, color, uid) => {
        if (!uid) return; // skip if no uid yet (frontend not updated yet)
        try {
            await GameModel.findOneAndUpdate(
                { lobbyCode },
                { [`players.${color}`]: uid, status: 'ACTIVE' },
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error("Error assigning player UID:", error);
        }
    },

    // Called when FLAG_CAPTURED — saves result and updates both players' stats
    finishGame: async (lobbyCode, winnerColor) => {
        try {
            const gameDoc = await GameModel.findOneAndUpdate(
                { lobbyCode },
                { winner: winnerColor, status: 'FINISHED' },
                { new: true }
            );

            if (!gameDoc) return;

            const redUID = gameDoc.players.RED;
            const blueUID = gameDoc.players.BLUE;

            // Update RED player stats
            if (redUID) {
                await User.findByIdAndUpdate(redUID, {
                    $inc: {
                        gamesPlayed: 1,
                        wins: winnerColor === 'RED' ? 1 : 0,
                        losses: winnerColor === 'RED' ? 0 : 1,
                    }
                });
            }

            // Update BLUE player stats
            if (blueUID) {
                await User.findByIdAndUpdate(blueUID, {
                    $inc: {
                        gamesPlayed: 1,
                        wins: winnerColor === 'BLUE' ? 1 : 0,
                        losses: winnerColor === 'BLUE' ? 0 : 1,
                    }
                });
            }

            // Remove from memory since game is over
            activeGames.delete(lobbyCode);

            console.log(`Game ${lobbyCode} finished. Winner: ${winnerColor}`);
        } catch (error) {
            console.error("Error finishing game:", error);
        }
    }
};

module.exports = gameService;
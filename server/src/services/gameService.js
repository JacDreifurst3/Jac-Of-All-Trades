const Game = require("../game/Game");
const GameModel = require("../models/GameModel");
const User = require("../models/UserModel");

// In-memory store for active games — fast access during gameplay
const activeGames = new Map();

const gameService = {

    // Creates a new game in memory and saves it to MongoDB
    createGame: async (lobbyCode, beginnerMode = true) => {
        const newGame = new Game(beginnerMode);
        activeGames.set(lobbyCode, newGame);

        await GameModel.findOneAndUpdate(
            { lobbyCode },
            { lobbyCode, status: 'WAITING', beginnerMode },
            { upsert: true, new: true }
        );

        return newGame;
    },

    // Returns the in-memory game, or restores it from MongoDB if not in memory
    getGame: async (lobbyCode) => {
        if (activeGames.has(lobbyCode)) {
            return activeGames.get(lobbyCode);
        }

        // Not in memory — try to restore from MongoDB
        const savedGame = await GameModel.findOne({ lobbyCode, status: { $ne: 'FINISHED' } });
        if (!savedGame) return null;

        const restoredGame = Game.loadFromDB(savedGame);
        activeGames.set(lobbyCode, restoredGame);
        console.log(`Restored game ${lobbyCode} from MongoDB`);
        return restoredGame;
    },

    // Saves current game state to MongoDB — called after every action
    saveGameState: async (lobbyCode) => {
        const game = activeGames.get(lobbyCode);
        if (!game) return;

        const stateData = game.serializeForDB();
        await GameModel.findOneAndUpdate(
            { lobbyCode },
            { ...stateData, status: 'ACTIVE' },
            { new: true }
        );
    },

    // Saves the player's Firebase UID to the game document
    assignPlayerUID: async (lobbyCode, color, uid) => {
        if (!uid) return;
        try {
            await GameModel.findOneAndUpdate(
                { lobbyCode },
                { [`players.${color}.uid`]: uid },
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error("Error assigning player UID:", error);
        }
    },

    // Called when the game ends — saves result and updates both players' stats
    finishGame: async (lobbyCode, winnerColor) => {
        try {
            const gameDoc = await GameModel.findOneAndUpdate(
                { lobbyCode },
                { winner: winnerColor, status: 'FINISHED' },
                { new: true }
            );

            if (!gameDoc) return;

            const redUID = gameDoc.players.RED.uid;
            const blueUID = gameDoc.players.BLUE.uid;

            if (redUID) {
                await User.findByIdAndUpdate(redUID, {
                    $inc: {
                        gamesPlayed: 1,
                        wins: winnerColor === 'RED' ? 1 : 0,
                        losses: winnerColor === 'RED' ? 0 : 1,
                    }
                });
            }

            if (blueUID) {
                await User.findByIdAndUpdate(blueUID, {
                    $inc: {
                        gamesPlayed: 1,
                        wins: winnerColor === 'BLUE' ? 1 : 0,
                        losses: winnerColor === 'BLUE' ? 0 : 1,
                    }
                });
            }

            activeGames.delete(lobbyCode);
            console.log(`Game ${lobbyCode} finished. Winner: ${winnerColor}`);
        } catch (error) {
            console.error("Error finishing game:", error);
        }
    },

    deleteGame: (lobbyCode) => {
        activeGames.delete(lobbyCode);
    },

    getAllGameIds: () => {
        return Array.from(activeGames.keys());
    }
};

module.exports = gameService;
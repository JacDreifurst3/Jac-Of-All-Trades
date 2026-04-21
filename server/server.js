const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./src/config/db');
const gameService = require('./src/services/gameService');
const gameRoutes = require('./src/routes/game');
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const GameModel = require('./src/models/GameModel');

const app = express();

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173", 
        methods: ["GET", "POST"],
        credentials: true
    }
});

connectDB();

app.use(cors());
app.use(express.json());
app.use('/api/games', gameRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Player joins or rejoins a lobby — creates game if it doesn't exist, restores from MongoDB if it does
    socket.on("joinGame", async ({ lobbyCode, playerColor, uid }) => {
        try {
            if (!await gameService.getGame(lobbyCode)) {
                await gameService.createGame(lobbyCode);
            }

            const game = await gameService.getGame(lobbyCode);
            if (!game) {
                socket.emit("error", "Game not found");
                return;
            }

            const existingSocketId = game.players[playerColor.toUpperCase()].socketId;
            const gameDoc = await GameModel.findOne({ lobbyCode });
            const existingUID = gameDoc?.players?.[playerColor.toUpperCase()]?.uid;

            console.log(`Join attempt: lobby=${lobbyCode} color=${playerColor} socket=${socket.id}`);
            console.log(`Existing ${playerColor} player: ${existingSocketId}`);

            // Allow rejoin if same UID, block if different player trying to take the color
            if (existingSocketId && existingSocketId !== socket.id) {
                if (existingUID && existingUID !== uid) {
                    console.log(`BLOCKED: ${socket.id} tried to join as ${playerColor}`);
                    socket.emit("error", `Color ${playerColor} is already taken in lobby ${lobbyCode}.`);
                    return;
                }
                console.log(`Reconnection detected for ${playerColor}`);
            }

            socket.join(lobbyCode);
            game.assignPlayer(playerColor, socket.id);
            await gameService.assignPlayerUID(lobbyCode, playerColor, uid);
            socket.playerColor = playerColor;
            socket.lobbyCode = lobbyCode;
          
            const redJoined = !!game.players['RED'].socketId;
            const blueJoined = !!game.players['BLUE'].socketId;

            if (redJoined && blueJoined) {
            game.gamePhase = 'SETUP';
            } else {
            game.gamePhase = 'WAITING';
            }
    
            io.to(lobbyCode).emit("gameStateUpdate", game.getGameState(playerColor));
            console.log(`User joined room: ${lobbyCode}`);
        } catch (err) {
            console.error("joinGame error:", err);
            socket.emit("error", "Failed to join game");
        }
    });
    // Returns valid moves for a selected piece
    socket.on("selectPiece", async (data) => {
        const { lobbyCode, x, y } = data;
        const game = await gameService.getGame(lobbyCode);
        if (game) {
            const availableMoves = game.getAvailableMovesForPiece(x, y);
            socket.emit("availableMovesUpdate", { x, y, availableMoves });
        }
    });

    // Player places a piece during setup phase
    socket.on("placePiece", async (data) => {
        const { lobbyCode, x, y, rank } = data;
        const game = await gameService.getGame(lobbyCode);
        if (!game) return;

        const redId = game.players['RED'].socketId;
        const blueId = game.players['BLUE'].socketId;

        try {
            game.placePiece(socket.playerColor, x, y, rank);
            await gameService.saveGameState(lobbyCode);

            if (redId) io.to(redId).emit("gameStateUpdate", game.getGameState("RED"));
            if (blueId) io.to(blueId).emit("gameStateUpdate", game.getGameState("BLUE"));
        } catch (err) {
            socket.emit("error", err.message);
        }
    });

    // Player moves a piece during setup phase
    socket.on("moveSetupPiece", async (data) => {
        const { lobbyCode, fromX, fromY, toX, toY } = data;
        const game = await gameService.getGame(lobbyCode);
        if (!game) return;

        const redId = game.players['RED'].socketId;
        const blueId = game.players['BLUE'].socketId;

        try {
            game.moveSetupPiece(socket.playerColor, fromX, fromY, toX, toY);
            await gameService.saveGameState(lobbyCode);

            if (redId) io.to(redId).emit("gameStateUpdate", game.getGameState("RED"));
            if (blueId) io.to(blueId).emit("gameStateUpdate", game.getGameState("BLUE"));
        } catch (err) {
            socket.emit("error", err.message);
        }
    });

    // Randomly fills the player's setup layout
    socket.on("randomizeLayout", async (data) => {
        const { lobbyCode } = data;
        const game = await gameService.getGame(lobbyCode);
        if (!game) return;

        const redId = game.players['RED'].socketId;
        const blueId = game.players['BLUE'].socketId;

        try {
            game.randomizePlayerLayout(socket.playerColor);
            await gameService.saveGameState(lobbyCode);

            if (redId) io.to(redId).emit("gameStateUpdate", game.getGameState("RED"));
            if (blueId) io.to(blueId).emit("gameStateUpdate", game.getGameState("BLUE"));
        } catch (err) {
            socket.emit("error", err.message);
        }
    });

    // Player confirms their setup is done — if both are ready, game transitions to PLAY phase
    socket.on("markSetupComplete", async (data) => {
        const { lobbyCode } = data;
        const game = await gameService.getGame(lobbyCode);
        if (!game) return;

        const redId = game.players['RED'].socketId;
        const blueId = game.players['BLUE'].socketId;

        try {
            game.markPlayerSetupComplete(socket.playerColor);
            await gameService.saveGameState(lobbyCode);

            if (redId) io.to(redId).emit("gameStateUpdate", game.getGameState("RED"));
            if (blueId) io.to(blueId).emit("gameStateUpdate", game.getGameState("BLUE"));
        } catch (err) {
            socket.emit("error", err.message);
        }
    });

    // Player makes a move during play phase — handles battles, win conditions, and stat updates
    socket.on("makeMove", async (data) => {
        const { lobbyCode, fromX, fromY, toX, toY } = data;
        const game = await gameService.getGame(lobbyCode);
        if (!game) return;

        const redId = game.players['RED'].socketId;
        const blueId = game.players['BLUE'].socketId;

        try {
            const attackerRank = game.board.getSpace(fromX, fromY)?.piece?.rank;
            const defenderRank = game.board.getSpace(toX, toY)?.piece?.rank;

            const result = game.makeMove(fromX, fromY, toX, toY);

            if (redId) io.to(redId).emit("gameStateUpdate", game.getGameState("RED"));
            if (blueId) io.to(blueId).emit("gameStateUpdate", game.getGameState("BLUE"));

            if (defenderRank !== undefined) {
                const battleData = { result, attackerRank, defenderRank };
                if (redId) io.to(redId).emit("moveResult", battleData);
                if (blueId) io.to(blueId).emit("moveResult", battleData);
            }

            // If game is over, save final result and update stats — otherwise just save state
            if (game.gameOver) {
                await gameService.finishGame(lobbyCode, game.winner);
            } else {
                await gameService.saveGameState(lobbyCode);
            }
        } catch (err) {
            socket.emit("error", err.message);
        }
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

app.get('/', (req, res) => {
    res.send('API is running with Sockets');
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
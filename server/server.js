const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./src/config/db');
const gameService = require('./src/services/gameService'); // This is inplace of connectDB
const gameRoutes = require('./src/routes/game')

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
app.use('/api/games', gameRoutes)

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a specific lobby/room
socket.on("joinGame", ({ lobbyCode, playerColor }) => {
    const game = gameService.getGame(lobbyCode);

    if (!game) {
        socket.emit("error", "This game lobby does not exist.");
        return;
    }

    const colorKey = playerColor.toUpperCase();
    const existingId = game.players[colorKey].socketId;

    if (existingId && existingId !== socket.id) {
        socket.emit("error", `Color ${playerColor} is already taken.`);
        return;
    }

    socket.join(lobbyCode);
    game.assignPlayer(playerColor, socket.id);
    socket.playerColor = playerColor;

    socket.emit("gameStateUpdate", game.getGameState(playerColor));
    console.log(`User ${socket.id} joined ${lobbyCode} as ${playerColor}`);
});

    socket.on("selectPiece", (data) => {
        const { lobbyCode, x, y } = data;
        const game = gameService.getGame(lobbyCode);

        if (game) {
            const availableMoves = game.getAvailableMovesForPiece(x, y);
            socket.emit("availableMovesUpdate", { x, y, availableMoves });
        }
    });

    socket.on("placePiece", (data) => {
        const { lobbyCode, x, y, rank } = data;
        const game = gameService.getGame(lobbyCode);
    
        if (!game) return;
        const redId = game.players['RED'].socketId;
        const blueId = game.players['BLUE'].socketId;
    
        try {
            game.placePiece(socket.playerColor, x, y, rank);

            if (redId) io.to(redId).emit("gameStateUpdate", game.getGameState("RED"));
            if (blueId) io.to(blueId).emit("gameStateUpdate", game.getGameState("BLUE"));
        } catch (err) {
            socket.emit("error", err.message);
        }
    });

    socket.on("moveSetupPiece", (data) => {
        const { lobbyCode, fromX, fromY, toX, toY } = data;
        const game = gameService.getGame(lobbyCode);

        if (!game) return;
        const redId = game.players['RED'].socketId;
        const blueId = game.players['BLUE'].socketId;

        try {
            game.moveSetupPiece(socket.playerColor, fromX, fromY, toX, toY);

            if (redId) io.to(redId).emit("gameStateUpdate", game.getGameState("RED"));
            if (blueId) io.to(blueId).emit("gameStateUpdate", game.getGameState("BLUE"));
        } catch (err) {
            socket.emit("error", err.message);
        }
    });

    socket.on("randomizeLayout", (data) => {
        const { lobbyCode } = data;
        const game = gameService.getGame(lobbyCode);

        if (!game) return;
        const redId = game.players['RED'].socketId;
        const blueId = game.players['BLUE'].socketId;

        try {
            game.randomizePlayerLayout(socket.playerColor);

            if (redId) io.to(redId).emit("gameStateUpdate", game.getGameState("RED"));
            if (blueId) io.to(blueId).emit("gameStateUpdate", game.getGameState("BLUE"));
        } catch (err) {
            socket.emit("error", err.message);
        }
    });

    socket.on("markSetupComplete", (data) => {
        const { lobbyCode } = data;
        const game = gameService.getGame(lobbyCode);

        if (!game) return;
        const redId = game.players['RED'].socketId;
        const blueId = game.players['BLUE'].socketId;

        try {
            game.markPlayerSetupComplete(socket.playerColor);

            if (redId) io.to(redId).emit("gameStateUpdate", game.getGameState("RED"));
            if (blueId) io.to(blueId).emit("gameStateUpdate", game.getGameState("BLUE"));
        } catch (err) {
            socket.emit("error", err.message);
        }
    });

    socket.on("makeMove", (data) => {
        const { lobbyCode, fromX, fromY, toX, toY } = data;
        const game = gameService.getGame(lobbyCode);
    
        const redId = game.players['RED'].socketId;
        const blueId = game.players['BLUE'].socketId;
    
        if (game) {
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
            } catch (err) {
                socket.emit("error", err.message);
            }
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

app.get('/', (req, res) => {
    res.send('API is running with Sockets');
});


const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
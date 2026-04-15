const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./src/config/db');
const gameService = require('./src/services/gameService'); // This is inplace of connectDB
const gameRoutes = require('./src/routes/game')
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');

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

    // Join a specific lobby/room
    socket.on("joinGame", ({ lobbyCode, playerColor, uid }) => {
        
        if (!gameService.getGame(lobbyCode)) {
            gameService.createGame(lobbyCode);
        }
        
        const game = gameService.getGame(lobbyCode);

        // Check if color is already taken by a different socket
        const existingId = game.players[playerColor.toUpperCase()].socketId;
        console.log(`Join attempt: lobby=${lobbyCode} color=${playerColor} socket=${socket.id}`);
        console.log(`Existing ${playerColor} player: ${existingId}`);
        if (existingId && existingId !== socket.id) {
            console.log(`BLOCKED: ${socket.id} tried to join as ${playerColor}`);
            socket.emit("error", `Color ${playerColor} is already taken in lobby ${lobbyCode}.`);
            return; // Block them from joining
        }
        socket.join(lobbyCode);
        game.assignPlayer(playerColor,socket.id);
        gameService.assignPlayerUID(lobbyCode, playerColor, uid);

        socket.playerColor = playerColor;
        // Send the initial state of game to who joins
        socket.emit("gameStateUpdate", game.getGameState(playerColor));
        console.log(`User joined room: ${lobbyCode}`);
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
                if (result === "FLAG_CAPTURED") {
                    gameService.finishGame(lobbyCode, game.winner);
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
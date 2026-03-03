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
    socket.on("joinGame", (lobbyCode) => {
        socket.join(lobbyCode);
        
        if (!gameService.getGame(lobbyCode)) {
            gameService.createGame(lobbyCode);
        }
        
        const game = gameService.getGame(lobbyCode);
        // Send the initial state of game to who joins
        io.to(lobbyCode).emit("gameStateUpdate", game.getGameState())
        socket.emit("gameStateUpdate", game.getGameState());
        console.log(`User joined room: ${lobbyCode}`);
    });

    socket.on("makeMove", (data) => {
        const { lobbyCode, fromX, fromY, toX, toY } = data;
        const game = gameService.getGame(lobbyCode);

        if (game) {
            try {
                game.makeMove(fromX, fromY, toX, toY);
                
                // Broadcast state to BOTH players in the room
                io.to(lobbyCode).emit("gameStateUpdate", game.getGameState());
            } catch (err) {
                // Send error to the person who made illegal move
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
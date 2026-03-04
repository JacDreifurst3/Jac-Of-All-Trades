import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io("http://localhost:5001", {
    transports:["websocket"],
    upgrade: false,
    reconnectionAttempts: 5, 
    timeout: 10000,
});

socket.on("connect_error", (err) => {
  console.log("Connection Error Details:", err.message);
});

socket.on("connect", () => {
  console.log("Successfully connected to Socket.io server!");
});

export function useGame(lobbyCode, playerColor) {
  const [board, setBoard] = useState([]);
  const [turn, setTurn] = useState('RED');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!lobbyCode) return;

    // Join the specific lobby
    socket.emit("joinGame", { lobbyCode , playerColor });

    // Listen for the board update
    socket.on("gameStateUpdate", (state) => {
      // We flatten the 2D array [10][10] into [100] for easier mapping
      setBoard(state.board.flat());
      setTurn(state.currentPlayer);
    });

    socket.on("error", (msg) => {
      setError(msg);
      setTimeout(() => setError(null), 3000);
    });

    return () => {
      socket.off("gameStateUpdate");
      socket.off("error");
    };
  }, [lobbyCode]);

  const sendMove = (fromX, fromY, toX, toY) => {
    socket.emit("makeMove", { lobbyCode, fromX, fromY, toX, toY });
  };

  return { board, turn, error, sendMove };
}
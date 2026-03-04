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
  const [availableMoves, setAvailableMoves] = useState([]);
  const [selectedPiece, setSelectedPiece] = useState(null);

  useEffect(() => {
    if (!lobbyCode) return;

    // Join the specific lobby
    socket.emit("joinGame", { lobbyCode , playerColor });

    // Listen for the board update
    socket.on("gameStateUpdate", (state) => {
      // We flatten the 2D array [10][10] into [100] for easier mapping
      setBoard(state.board.flat());
      setTurn(state.currentPlayer);
      setAvailableMoves([]);
      setSelectedPiece(null);
    });

    socket.on("availableMovesUpdate", (data) => {
      // Only show selection if the piece actually has moves available
      if (data.availableMoves.length > 0) {
        setAvailableMoves(data.availableMoves);
        setSelectedPiece({ x: data.x, y: data.y });
      }
      // If no moves available (e.g., Bomb or Flag), don't select it
    });

    socket.on("error", (msg) => {
      setError(msg);
      setTimeout(() => setError(null), 3000);
    });

    return () => {
      socket.off("gameStateUpdate");
      socket.off("availableMovesUpdate");
      socket.off("error");
    };
  }, [lobbyCode]);

  const sendMove = (fromX, fromY, toX, toY) => {
    socket.emit("makeMove", { lobbyCode, fromX, fromY, toX, toY });
  };

  const selectPiece = (x, y) => {
    socket.emit("selectPiece", { lobbyCode, x, y });
  };

  const clearSelection = () => {
    setAvailableMoves([]);
    setSelectedPiece(null);
  };

  return { board, turn, error, sendMove, selectPiece, availableMoves, selectedPiece, clearSelection };
}
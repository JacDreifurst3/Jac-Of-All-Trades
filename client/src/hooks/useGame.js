import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io("http://localhost:5001", {
    transports: ["websocket"],
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

// CHANGE: accept onJoinError callback as a third parameter
export function useGame(lobbyCode, playerColor, onJoinError) {
  const [board, setBoard] = useState([]);
  const [turn, setTurn] = useState('RED');
  const [error, setError] = useState(null);
  const [availableMoves, setAvailableMoves] = useState([]);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [lastBattle, setLastBattle] = useState(null);

  useEffect(() => {
    if (!lobbyCode) return;

    socket.emit("joinGame", { lobbyCode, playerColor });

    socket.on("gameStateUpdate", (state) => {
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

    socket.on("moveResult", (data) => {
      setLastBattle(data);
      setTimeout(() => setLastBattle(null), 4000);
    });

    socket.on("error", (msg) => {

      // CHANGE: if the error is about color being taken, kick back to lobby
      if (msg.includes("already taken") && onJoinError) {
        onJoinError();
      } else {
        setError(msg);
        setTimeout(() => setError(null), 8000);
      }
    });

    return () => {
      socket.off("gameStateUpdate");
      socket.off("availableMovesUpdate");
      socket.off("moveResult");
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

  return { board, turn, error, sendMove, selectPiece, availableMoves, selectedPiece, clearSelection, last battle };

}
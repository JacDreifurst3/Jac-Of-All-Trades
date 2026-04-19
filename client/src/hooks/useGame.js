import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from "../context/AuthContext";

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

export function useGame(lobbyCode, playerColor, onJoinError) {
  const [board, setBoard] = useState([]);
  const [turn, setTurn] = useState('RED');
  const [error, setError] = useState(null);
  const [availableMoves, setAvailableMoves] = useState([]);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [lastBattle, setLastBattle] = useState(null);
  const [gamePhase, setGamePhase] = useState('SETUP');
  const [availablePieces, setAvailablePieces] = useState({});
  const [setupComplete, setSetupComplete] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [setupLayout, setSetupLayout] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winReason, setWinReason] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!lobbyCode) return;

    socket.emit("joinGame", { lobbyCode, playerColor, uid: user?.uid });

    socket.on("gameStateUpdate", (state) => {
      setBoard(state.board.flat());
      setTurn(state.currentPlayer);
      setGamePhase(state.gamePhase);
      setAvailablePieces(state.availablePieces);
      setSetupComplete(state.setupComplete);
      setShowConfirmation(state.showConfirmation || false);
      setSetupLayout(state.setupLayout || []);
      setGameOver(state.gameOver || false);
      setWinner(state.winner);
      setWinReason(state.winReason);
      setAvailableMoves([]);
      setSelectedPiece(null);
    });

    socket.on("availableMovesUpdate", (data) => {
      if (data.availableMoves.length > 0) {
        setAvailableMoves(data.availableMoves);
        setSelectedPiece({ x: data.x, y: data.y });
      }
    });

    socket.on("moveResult", (data) => {
      setLastBattle(data);
    });

    socket.on("error", (msg) => {
      if (msg.includes("already taken") && onJoinError) {
        onJoinError();
      } else {
        setError(msg);
        setTimeout(() => setError(null), 3000);
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

  const placePiece = (x, y, rank) => {
    socket.emit("placePiece", { lobbyCode, x, y, rank });
  };

  const moveSetupPiece = (fromX, fromY, toX, toY) => {
    socket.emit("moveSetupPiece", { lobbyCode, fromX, fromY, toX, toY });
  };

  const randomizeLayout = () => {
    socket.emit("randomizeLayout", { lobbyCode });
  };

  const markSetupComplete = () => {
    socket.emit("markSetupComplete", { lobbyCode });
  };

  const selectPiece = (x, y) => {
    socket.emit("selectPiece", { lobbyCode, x, y });
  };

  const clearSelection = () => {
    setAvailableMoves([]);
    setSelectedPiece(null);
  };

  return { board, turn, error, sendMove, selectPiece, availableMoves, selectedPiece, clearSelection, lastBattle, setLastBattle, gamePhase, availablePieces, setupComplete, showConfirmation, setupLayout, placePiece, moveSetupPiece, randomizeLayout, markSetupComplete, gameOver, winner, winReason };
}
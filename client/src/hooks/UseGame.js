import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from "../context/AuthContext";

const SOCKET_URL = "http://localhost:5001";

const socketOptions = {
  transports: ["websocket"],
  upgrade: false,
  reconnectionAttempts: 5,
  timeout: 10000,
};

// Primary socket — always exists
const primarySocket = io(SOCKET_URL, socketOptions);

primarySocket.on("connect_error", (err) => {
  console.log("Connection Error Details:", err.message);
});

primarySocket.on("connect", () => {
  console.log("Successfully connected to Socket.io server!");
});

export function useGame(lobbyCode, playerColor, onJoinError, isHotseat = false) {
  const [board, setBoard] = useState([]);
  const [turn, setTurn] = useState('RED');
  const [error, setError] = useState(null);
  const [availableMoves, setAvailableMoves] = useState([]);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [lastBattle, setLastBattle] = useState(null);
  const [gamePhase, setGamePhase] = useState('WAITING');
  const [availablePieces, setAvailablePieces] = useState({});
  const [setupComplete, setSetupComplete] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [setupLayout, setSetupLayout] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winReason, setWinReason] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [beginnerMode, setBeginnerMode] = useState(true);
  const { user } = useAuth();

  const lastMoveDestRef = useRef(null);
  const playerColorRef = useRef(playerColor);
  // Second socket for hotseat BLUE player — created once and reused
  const blueSocketRef = useRef(null);

  useEffect(() => {
    playerColorRef.current = playerColor;
    // Clear board immediately so stale perspective isn't visible
    setBoard([]);
    setLastBattle(null);
  }, [playerColor]);

  // Returns whichever socket is active for the current playerColor
  const getActiveSocket = () => {
    if (isHotseat && playerColor === 'BLUE' && blueSocketRef.current) {
      return blueSocketRef.current;
    }
    return primarySocket;
  };

  useEffect(() => {
    if (!lobbyCode) return;

    // In hotseat, create a dedicated second socket for BLUE if it doesn't exist yet
    if (isHotseat && !blueSocketRef.current) {
      blueSocketRef.current = io(SOCKET_URL, socketOptions);
    }

    const activeSocket = getActiveSocket();
    console.log("isHotseat:", isHotseat, "playerColor:", playerColor, "blueSocket exists:", !!blueSocketRef.current);

    activeSocket.emit("joinGame", { lobbyCode, playerColor, uid: user?.uid, isHotseat });

    if (isHotseat && playerColor === "RED") {
      if (!blueSocketRef.current) {
        console.log("Creating blue socket");
        blueSocketRef.current = io(SOCKET_URL, socketOptions);
        blueSocketRef.current.on("connect", () => {
          console.log("Blue socket connected, joining as BLUE");
          blueSocketRef.current.emit("joinGame", {
            lobbyCode,
            playerColor: "BLUE",
            uid: user?.uid,
            isHotseat
          });
        });
      } else {
        console.log("Blue socket already exists, joining as BLUE");
        blueSocketRef.current.emit("joinGame", {
          lobbyCode,
          playerColor: "BLUE",
          uid: user?.uid,
          isHotseat
        });
      }
    }

    const handleGameState = (state) => {
      setBoard(state.board ? state.board.flat() : []);
      setTurn(state.currentPlayer);
      setGamePhase(state.gamePhase);
      setAvailablePieces(state.availablePieces);
      setSetupComplete(state.setupComplete);
      setShowConfirmation(state.showConfirmation || false);
      setSetupLayout(state.setupLayout || []);
      setGameOver(state.gameOver || false);
      setWinner(state.winner);
      setWinReason(state.winReason);
      setBattleLog(state.battleLog || []);
      setBeginnerMode(state.beginnerMode !== undefined ? state.beginnerMode : true);
      setAvailableMoves([]);
      setSelectedPiece(null);
    };

    const handleAvailableMoves = (data) => {
      if (data.availableMoves.length > 0) {
        setAvailableMoves(data.availableMoves);
        setSelectedPiece({ x: data.x, y: data.y });
      }
    };

    const handleMoveResult = (data) => {
      console.log("moveResult payload:", data);
      const toX = data.toX ?? lastMoveDestRef.current?.toX ?? null;
      const toY = data.toY ?? lastMoveDestRef.current?.toY ?? null;
      setLastBattle({ ...data, toX, toY });
    };

    const handleError = (msg) => {
      if (msg.includes("already taken") && onJoinError) {
        onJoinError();
      } else {
        setError(msg);
        setTimeout(() => setError(null), 3000);
      }
    };

    primarySocket.on("gameStateUpdate", (state) => {
      if (!isHotseat || playerColorRef.current === "RED") handleGameState(state);
    });
    activeSocket.on("availableMovesUpdate", handleAvailableMoves);
    activeSocket.on("moveResult", handleMoveResult);
    activeSocket.on("error", handleError);

    if (blueSocketRef.current) {
      blueSocketRef.current.on("gameStateUpdate", (state) => {
        if (playerColorRef.current === "BLUE") handleGameState(state);
      });
    }

    return () => {
      primarySocket.off("gameStateUpdate");
      activeSocket.off("availableMovesUpdate", handleAvailableMoves);
      activeSocket.off("moveResult", handleMoveResult);
      activeSocket.off("error", handleError);
      if (blueSocketRef.current) {
        blueSocketRef.current.off("gameStateUpdate");
      }
    };
  }, [lobbyCode, playerColor]);  // re-runs when playerColor changes (hotseat handoff)

  const sendMove = (fromX, fromY, toX, toY) => {
    lastMoveDestRef.current = { toX, toY };
    getActiveSocket().emit("makeMove", { lobbyCode, fromX, fromY, toX, toY });
  };

  const placePiece = (x, y, rank) => {
    getActiveSocket().emit("placePiece", { lobbyCode, x, y, rank });
  };

  const moveSetupPiece = (fromX, fromY, toX, toY) => {
    getActiveSocket().emit("moveSetupPiece", { lobbyCode, fromX, fromY, toX, toY });
  };

  const randomizeLayout = () => {
    getActiveSocket().emit("randomizeLayout", { lobbyCode });
  };

  const markSetupComplete = (onComplete) => {
    getActiveSocket().emit("markSetupComplete", { lobbyCode });
    if (onComplete) onComplete();
  };

  const selectPiece = (x, y) => {
    getActiveSocket().emit("selectPiece", { lobbyCode, x, y });
  };

  const clearSelection = () => {
    setAvailableMoves([]);
    setSelectedPiece(null);
  };

  return { board, turn, error, sendMove, selectPiece, availableMoves, selectedPiece, clearSelection, lastBattle, setLastBattle, gamePhase, availablePieces, setupComplete, showConfirmation, setupLayout, placePiece, moveSetupPiece, randomizeLayout, markSetupComplete, gameOver, winner, winReason, battleLog, beginnerMode };
}
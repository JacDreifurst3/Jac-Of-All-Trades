import { useState, useEffect } from "react";
import "./App.css";
import { PieceIcon, LAKES, BOARD_SIZE } from "./components/Pieces.jsx";
import { useGame } from "./hooks/useGame";

const RANK_NAMES = {
  0: "Flag", 1: "Spy (1)", 2: "Scout (2)", 3: "Miner (3)", 4: "Sergeant (4)",
  5: "Lieutenant (5)", 6: "Captain (6)", 7: "Major (7)", 8: "Colonel (8)",
  9: "General (9)", 10: "Marshal (10)", 11: "Bomb"
};

const rankName = (rank) => RANK_NAMES[rank] ?? `Rank ${rank}`;

export default function App() {
  const [lobbyInput, setLobbyInput] = useState("");
  const [activeLobby, setActiveLobby] = useState(null);
  const [playerColor, setPlayerColor] = useState("RED");
  const [lobbyError, setLobbyError] = useState(null);

  const { board, turn, error, sendMove, selectPiece, availableMoves, selectedPiece, clearSelection, lastBattle, setLastBattle } = useGame(activeLobby, playerColor, () => {
    setActiveLobby(false);
    setLobbyError(`Color ${playerColor} is already taken in this lobby.`);
  });

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (error) {
      setMessages(prev => [{ id: Date.now(), text: error }, ...prev].slice(0, 20));
    }
  }, [error]);

  useEffect(() => {
    if (!lastBattle) return;
    const { result, attackerRank, defenderRank } = lastBattle;
    const atkName = rankName(attackerRank);
    const defName = rankName(defenderRank);

    let msg;
    if (result === "ATTACKER_WINS") msg = ` ${atkName} defeated ${defName}`;
    else if (result === "DEFENDER_WINS") msg = ` ${defName} defeated ${atkName}`;
    else if (result === "BOTH_DIE") msg = ` ${atkName} and ${defName} both eliminated`;
    else if (result === "FLAG_CAPTURED") msg = ` ${atkName} captured the Flag!`;

    if (msg) setMessages([{ id: Date.now(), text: msg }]);

    setLastBattle(null);
  }, [lastBattle]);

  const displayBoard = playerColor === "BLUE" ? [...board].reverse() : board;

  if (!activeLobby) {
    return (
      <div className="lobby-screen">
        <h1>Stratego</h1>
        {lobbyError && <div className="error-toast">{lobbyError}</div>}
        <div className="setup-controls">
          <input
            value={lobbyInput}
            onChange={(e) => { setLobbyInput(e.target.value.toUpperCase()); setLobbyError(null); }}
            placeholder="Enter Lobby Code"
          />
          <div className="team-selector">
            <button
              className={`reg-btn red ${playerColor === "RED" ? "active" : ""}`}
              onClick={() => { setPlayerColor("RED"); setLobbyError(null); }}
            >Red Team</button>
            <button
              className={`reg-btn blue ${playerColor === "BLUE" ? "active" : ""}`}
              onClick={() => { setPlayerColor("BLUE"); setLobbyError(null); }}
            >Blue Team</button>
          </div>
          <button className="join-btn" onClick={() => setActiveLobby(lobbyInput)}>
            Join Game
          </button>
        </div>
      </div>
    );
  }

  const handleSquareClick = (space) => {
    if (turn !== playerColor) return;

    const hasOwnPiece = space.piece && space.piece.owner === playerColor;
    const isEmpty = !space.piece;

    if (!selectedPiece) {
      if (hasOwnPiece) selectPiece(space.x, space.y);
    } else {
      const isValidMove = availableMoves.some(move => move.x === space.x && move.y === space.y);

      if (isValidMove) {
        setMessages([]);
        sendMove(selectedPiece.x, selectedPiece.y, space.x, space.y);
        clearSelection();
      } else if (isEmpty) {
        clearSelection();
      } else if (hasOwnPiece) {
        selectPiece(space.x, space.y);
      }
    }
  };

  return (
    <div className="board-wrapper">
      {error && <div className="error-toast">{error}</div>}

      <div className="status-bar">
  <div className="status-info">
    <span style={{ textAlign: "center" }}>Lobby: <strong>{activeLobby}</strong></span>
    <span style={{ textAlign: "center" }}>Turn: <strong className={turn.toLowerCase()}>{turn}</strong></span>
  </div>
  <div className="status-messages" style={{ alignItems: "center" }}>
    {messages.length === 0
      ? <span className="status-msg-empty"></span>
      : messages.map((m, i) => (
          <span key={m.id} className={`status-msg ${i === 0 ? "status-msg-latest" : ""}`}>
            {m.text}
          </span>
        ))
    }
  </div>
</div>

      <div className="board-bg">
        {displayBoard.map((space) => {
          const isValidDestination = selectedPiece && availableMoves.some(move => move.x === space.x && move.y === space.y);
          const isSelected = selectedPiece?.x === space.x && selectedPiece?.y === space.y;

          return (
            <div
              key={`${space.x},${space.y}`}
              className={`tile ${space.terrain === "WATER" ? "lake" : "grass"} ${isSelected ? "selected" : ""} ${isValidDestination ? "valid-destination" : ""}`}
              onClick={() => handleSquareClick(space)}
            >
              {space.piece && (
                <Piece owner={space.piece.owner} rank={space.piece.rank} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Piece({ owner, rank }) {
  const label = rank === "HIDDEN" ? "" : rank.toString();
  return (
    <div className={`piece ${owner.toLowerCase()}`}>
      <div className="piece-icon-wrapper">
        <PieceIcon label={label} className="piece-icon" />
      </div>
    </div>
  );
}
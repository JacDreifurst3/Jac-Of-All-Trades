import { useState, useEffect } from "react";
import "./App.css";
import { PieceIcon } from "./components/Pieces.jsx";
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

  const { board, turn, error, sendMove, lastBattle } = useGame(activeLobby, playerColor);
  const [selectedSpace, setSelectedSpace] = useState(null);
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
    if (result === "ATTACKER_WINS") msg = `✔ You won: ${atkName} defeated ${defName}`;
    else if (result === "DEFENDER_WINS") msg = `✘ You lost: ${defName} defeated ${atkName}`;
    else if (result === "BOTH_DIE") msg = `💥 Draw: ${atkName} and ${defName} both eliminated`;
    else if (result === "FLAG_CAPTURED") msg = `🏁 ${atkName} captured the Flag!`;
  
    if (msg) {
      const id = Date.now();
      setMessages(prev => [{ id, text: msg }, ...prev].slice(0, 20));
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.id !== id));
      }, 4000);
    }
  }, [lastBattle]);

  const displayBoard = playerColor === "BLUE" ? [...board].reverse() : board;

  if (!activeLobby) {
    return (
      <div className="lobby-screen">
        <h1>Stratego</h1>
        <div className="setup-controls">
          <input
            value={lobbyInput}
            onChange={(e) => setLobbyInput(e.target.value.toUpperCase())}
            placeholder="Enter Lobby Code"
          />
          <div className="team-selector">
            <button
              className={`reg-btn red ${playerColor === "RED" ? "active" : ""}`}
              onClick={() => setPlayerColor("RED")}
            >Red Team</button>
            <button
              className={`reg-btn blue ${playerColor === "BLUE" ? "active" : ""}`}
              onClick={() => setPlayerColor("BLUE")}
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
    if (!selectedSpace) {
      if (space.piece && space.piece.owner === playerColor) {
        setSelectedSpace(space);
      }
    } else {
      if (space.piece && space.piece.owner === playerColor) {
        setSelectedSpace(space);
        return;
      }
      sendMove(selectedSpace.x, selectedSpace.y, space.x, space.y);
      setSelectedSpace(null);
    }
  };

  return (
    <div className="board-wrapper">
      {error && <div className="error-toast">{error}</div>}

      <div className="status-bar">
        <div className="status-info">
          <span>Lobby Code: <strong>{activeLobby}</strong></span>
          <span>Turn: <strong className={turn.toLowerCase()}>{turn}</strong></span>
        </div>
        <div className="status-messages">
          {messages.length === 0
            ? <span className="status-msg-empty">No messages</span>
            : messages.map((m, i) => (
                <span key={m.id} className={`status-msg ${i === 0 ? "status-msg-latest" : ""}`}>
                  {m.text}
                </span>
              ))
          }
        </div>
      </div>

      <div className="board-bg">
        {displayBoard.map((space) => (
          <div
            key={`${space.x},${space.y}`}
            className={`tile ${space.terrain === "WATER" ? "lake" : "grass"} ${
              selectedSpace?.x === space.x && selectedSpace?.y === space.y ? "selected" : ""
            }`}
            onClick={() => handleSquareClick(space)}
          >
            {space.piece && (
              <Piece owner={space.piece.owner} rank={space.piece.rank} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

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
}